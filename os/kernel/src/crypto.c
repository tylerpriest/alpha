/*
 * AlphaOS - Cryptographic Primitives Implementation
 *
 * SHA-256, HMAC-SHA256, AES-128 for TLS support.
 */

#include "crypto.h"
#include "pit.h"
#include "string.h"

/* SHA-256 Constants */
static const u32 sha256_k[64] = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
};

/* Rotate right */
static inline u32 rotr(u32 x, u32 n) {
    return (x >> n) | (x << (32 - n));
}

/* SHA-256 compression function */
static void sha256_transform(Sha256Context* ctx, const u8* data) {
    u32 w[64];
    u32 a, b, c, d, e, f, g, h;
    u32 t1, t2;

    /* Prepare message schedule */
    for (int i = 0; i < 16; i++) {
        w[i] = ((u32)data[i * 4] << 24) |
               ((u32)data[i * 4 + 1] << 16) |
               ((u32)data[i * 4 + 2] << 8) |
               data[i * 4 + 3];
    }

    for (int i = 16; i < 64; i++) {
        u32 s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >> 3);
        u32 s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >> 10);
        w[i] = w[i - 16] + s0 + w[i - 7] + s1;
    }

    /* Initialize working variables */
    a = ctx->state[0];
    b = ctx->state[1];
    c = ctx->state[2];
    d = ctx->state[3];
    e = ctx->state[4];
    f = ctx->state[5];
    g = ctx->state[6];
    h = ctx->state[7];

    /* Compression function main loop */
    for (int i = 0; i < 64; i++) {
        u32 S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        u32 ch = (e & f) ^ (~e & g);
        t1 = h + S1 + ch + sha256_k[i] + w[i];
        u32 S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        u32 maj = (a & b) ^ (a & c) ^ (b & c);
        t2 = S0 + maj;

        h = g;
        g = f;
        f = e;
        e = d + t1;
        d = c;
        c = b;
        b = a;
        a = t1 + t2;
    }

    /* Update state */
    ctx->state[0] += a;
    ctx->state[1] += b;
    ctx->state[2] += c;
    ctx->state[3] += d;
    ctx->state[4] += e;
    ctx->state[5] += f;
    ctx->state[6] += g;
    ctx->state[7] += h;
}

void sha256_init(Sha256Context* ctx) {
    ctx->state[0] = 0x6a09e667;
    ctx->state[1] = 0xbb67ae85;
    ctx->state[2] = 0x3c6ef372;
    ctx->state[3] = 0xa54ff53a;
    ctx->state[4] = 0x510e527f;
    ctx->state[5] = 0x9b05688c;
    ctx->state[6] = 0x1f83d9ab;
    ctx->state[7] = 0x5be0cd19;
    ctx->count = 0;
}

void sha256_update(Sha256Context* ctx, const void* data, u32 len) {
    const u8* ptr = (const u8*)data;
    u32 buf_idx = ctx->count % SHA256_BLOCK_SIZE;

    ctx->count += len;

    /* Fill buffer first */
    if (buf_idx > 0) {
        u32 to_copy = SHA256_BLOCK_SIZE - buf_idx;
        if (to_copy > len) to_copy = len;
        memcpy(ctx->buffer + buf_idx, ptr, to_copy);
        ptr += to_copy;
        len -= to_copy;
        buf_idx += to_copy;

        if (buf_idx == SHA256_BLOCK_SIZE) {
            sha256_transform(ctx, ctx->buffer);
            buf_idx = 0;
        }
    }

    /* Process full blocks */
    while (len >= SHA256_BLOCK_SIZE) {
        sha256_transform(ctx, ptr);
        ptr += SHA256_BLOCK_SIZE;
        len -= SHA256_BLOCK_SIZE;
    }

    /* Save remaining */
    if (len > 0) {
        memcpy(ctx->buffer, ptr, len);
    }
}

void sha256_final(Sha256Context* ctx, u8* digest) {
    u64 bits = ctx->count * 8;
    u32 idx = ctx->count % SHA256_BLOCK_SIZE;

    /* Padding */
    ctx->buffer[idx++] = 0x80;

    if (idx > 56) {
        memset(ctx->buffer + idx, 0, SHA256_BLOCK_SIZE - idx);
        sha256_transform(ctx, ctx->buffer);
        idx = 0;
    }

    memset(ctx->buffer + idx, 0, 56 - idx);

    /* Append length (big endian) */
    ctx->buffer[56] = (bits >> 56) & 0xFF;
    ctx->buffer[57] = (bits >> 48) & 0xFF;
    ctx->buffer[58] = (bits >> 40) & 0xFF;
    ctx->buffer[59] = (bits >> 32) & 0xFF;
    ctx->buffer[60] = (bits >> 24) & 0xFF;
    ctx->buffer[61] = (bits >> 16) & 0xFF;
    ctx->buffer[62] = (bits >> 8) & 0xFF;
    ctx->buffer[63] = bits & 0xFF;

    sha256_transform(ctx, ctx->buffer);

    /* Output digest (big endian) */
    for (int i = 0; i < 8; i++) {
        digest[i * 4] = (ctx->state[i] >> 24) & 0xFF;
        digest[i * 4 + 1] = (ctx->state[i] >> 16) & 0xFF;
        digest[i * 4 + 2] = (ctx->state[i] >> 8) & 0xFF;
        digest[i * 4 + 3] = ctx->state[i] & 0xFF;
    }
}

void sha256(const void* data, u32 len, u8* digest) {
    Sha256Context ctx;
    sha256_init(&ctx);
    sha256_update(&ctx, data, len);
    sha256_final(&ctx, digest);
}

/* HMAC-SHA256 */
void hmac_sha256(const void* key, u32 key_len,
                 const void* data, u32 data_len,
                 u8* mac) {
    u8 k_pad[SHA256_BLOCK_SIZE];
    Sha256Context ctx;

    /* Prepare key */
    if (key_len > SHA256_BLOCK_SIZE) {
        sha256(key, key_len, k_pad);
        memset(k_pad + SHA256_DIGEST_SIZE, 0, SHA256_BLOCK_SIZE - SHA256_DIGEST_SIZE);
    } else {
        memcpy(k_pad, key, key_len);
        memset(k_pad + key_len, 0, SHA256_BLOCK_SIZE - key_len);
    }

    /* Inner hash: H((K ^ ipad) || data) */
    u8 i_pad[SHA256_BLOCK_SIZE];
    for (int i = 0; i < SHA256_BLOCK_SIZE; i++) {
        i_pad[i] = k_pad[i] ^ 0x36;
    }

    sha256_init(&ctx);
    sha256_update(&ctx, i_pad, SHA256_BLOCK_SIZE);
    sha256_update(&ctx, data, data_len);

    u8 inner_hash[SHA256_DIGEST_SIZE];
    sha256_final(&ctx, inner_hash);

    /* Outer hash: H((K ^ opad) || inner_hash) */
    u8 o_pad[SHA256_BLOCK_SIZE];
    for (int i = 0; i < SHA256_BLOCK_SIZE; i++) {
        o_pad[i] = k_pad[i] ^ 0x5c;
    }

    sha256_init(&ctx);
    sha256_update(&ctx, o_pad, SHA256_BLOCK_SIZE);
    sha256_update(&ctx, inner_hash, SHA256_DIGEST_SIZE);
    sha256_final(&ctx, mac);
}

/* AES-128 S-Box */
static const u8 aes_sbox[256] = {
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5,
    0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0,
    0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc,
    0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a,
    0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0,
    0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b,
    0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85,
    0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5,
    0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17,
    0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88,
    0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c,
    0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9,
    0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6,
    0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e,
    0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94,
    0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68,
    0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
};

/* Inverse S-Box */
static const u8 aes_inv_sbox[256] = {
    0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38,
    0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
    0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87,
    0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
    0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d,
    0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
    0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2,
    0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
    0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16,
    0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
    0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda,
    0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
    0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a,
    0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
    0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02,
    0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
    0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea,
    0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
    0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85,
    0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
    0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89,
    0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
    0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20,
    0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
    0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31,
    0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
    0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d,
    0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
    0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0,
    0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
    0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26,
    0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d
};

/* AES round constant */
static const u8 aes_rcon[10] = {
    0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36
};

/* GF(2^8) multiplication */
static u8 gf_mul(u8 a, u8 b) {
    u8 result = 0;
    u8 hi_bit;
    for (int i = 0; i < 8; i++) {
        if (b & 1) result ^= a;
        hi_bit = a & 0x80;
        a <<= 1;
        if (hi_bit) a ^= 0x1b;  /* x^8 + x^4 + x^3 + x + 1 */
        b >>= 1;
    }
    return result;
}

void aes128_init(Aes128Context* ctx, const u8* key) {
    /* Copy first key */
    for (int i = 0; i < 4; i++) {
        ctx->round_key[i] = ((u32)key[i * 4] << 24) |
                            ((u32)key[i * 4 + 1] << 16) |
                            ((u32)key[i * 4 + 2] << 8) |
                            key[i * 4 + 3];
    }

    /* Key expansion */
    for (int i = 4; i < 44; i++) {
        u32 temp = ctx->round_key[i - 1];

        if (i % 4 == 0) {
            /* RotWord + SubWord + Rcon */
            temp = ((u32)aes_sbox[(temp >> 16) & 0xFF] << 24) |
                   ((u32)aes_sbox[(temp >> 8) & 0xFF] << 16) |
                   ((u32)aes_sbox[temp & 0xFF] << 8) |
                   aes_sbox[(temp >> 24) & 0xFF];
            temp ^= (u32)aes_rcon[i / 4 - 1] << 24;
        }

        ctx->round_key[i] = ctx->round_key[i - 4] ^ temp;
    }
}

void aes128_encrypt_block(Aes128Context* ctx, const u8* in, u8* out) {
    u8 state[16];
    memcpy(state, in, 16);

    /* AddRoundKey (round 0) */
    for (int i = 0; i < 4; i++) {
        state[i * 4] ^= (ctx->round_key[i] >> 24) & 0xFF;
        state[i * 4 + 1] ^= (ctx->round_key[i] >> 16) & 0xFF;
        state[i * 4 + 2] ^= (ctx->round_key[i] >> 8) & 0xFF;
        state[i * 4 + 3] ^= ctx->round_key[i] & 0xFF;
    }

    /* Rounds 1-9 */
    for (int round = 1; round < 10; round++) {
        /* SubBytes */
        for (int i = 0; i < 16; i++) {
            state[i] = aes_sbox[state[i]];
        }

        /* ShiftRows */
        u8 temp = state[1];
        state[1] = state[5];
        state[5] = state[9];
        state[9] = state[13];
        state[13] = temp;

        temp = state[2];
        state[2] = state[10];
        state[10] = temp;
        temp = state[6];
        state[6] = state[14];
        state[14] = temp;

        temp = state[3];
        state[3] = state[15];
        state[15] = state[11];
        state[11] = state[7];
        state[7] = temp;

        /* MixColumns */
        for (int i = 0; i < 4; i++) {
            u8 a[4];
            for (int j = 0; j < 4; j++) {
                a[j] = state[i * 4 + j];
            }
            state[i * 4] = gf_mul(a[0], 2) ^ gf_mul(a[1], 3) ^ a[2] ^ a[3];
            state[i * 4 + 1] = a[0] ^ gf_mul(a[1], 2) ^ gf_mul(a[2], 3) ^ a[3];
            state[i * 4 + 2] = a[0] ^ a[1] ^ gf_mul(a[2], 2) ^ gf_mul(a[3], 3);
            state[i * 4 + 3] = gf_mul(a[0], 3) ^ a[1] ^ a[2] ^ gf_mul(a[3], 2);
        }

        /* AddRoundKey */
        for (int i = 0; i < 4; i++) {
            state[i * 4] ^= (ctx->round_key[round * 4 + i] >> 24) & 0xFF;
            state[i * 4 + 1] ^= (ctx->round_key[round * 4 + i] >> 16) & 0xFF;
            state[i * 4 + 2] ^= (ctx->round_key[round * 4 + i] >> 8) & 0xFF;
            state[i * 4 + 3] ^= ctx->round_key[round * 4 + i] & 0xFF;
        }
    }

    /* Final round (no MixColumns) */
    /* SubBytes */
    for (int i = 0; i < 16; i++) {
        state[i] = aes_sbox[state[i]];
    }

    /* ShiftRows */
    u8 temp = state[1];
    state[1] = state[5];
    state[5] = state[9];
    state[9] = state[13];
    state[13] = temp;

    temp = state[2];
    state[2] = state[10];
    state[10] = temp;
    temp = state[6];
    state[6] = state[14];
    state[14] = temp;

    temp = state[3];
    state[3] = state[15];
    state[15] = state[11];
    state[11] = state[7];
    state[7] = temp;

    /* AddRoundKey */
    for (int i = 0; i < 4; i++) {
        state[i * 4] ^= (ctx->round_key[40 + i] >> 24) & 0xFF;
        state[i * 4 + 1] ^= (ctx->round_key[40 + i] >> 16) & 0xFF;
        state[i * 4 + 2] ^= (ctx->round_key[40 + i] >> 8) & 0xFF;
        state[i * 4 + 3] ^= ctx->round_key[40 + i] & 0xFF;
    }

    memcpy(out, state, 16);
}

void aes128_decrypt_block(Aes128Context* ctx, const u8* in, u8* out) {
    u8 state[16];
    memcpy(state, in, 16);

    /* AddRoundKey (round 10) */
    for (int i = 0; i < 4; i++) {
        state[i * 4] ^= (ctx->round_key[40 + i] >> 24) & 0xFF;
        state[i * 4 + 1] ^= (ctx->round_key[40 + i] >> 16) & 0xFF;
        state[i * 4 + 2] ^= (ctx->round_key[40 + i] >> 8) & 0xFF;
        state[i * 4 + 3] ^= ctx->round_key[40 + i] & 0xFF;
    }

    /* Rounds 9-1 */
    for (int round = 9; round > 0; round--) {
        /* InvShiftRows */
        u8 temp = state[13];
        state[13] = state[9];
        state[9] = state[5];
        state[5] = state[1];
        state[1] = temp;

        temp = state[10];
        state[10] = state[2];
        state[2] = temp;
        temp = state[14];
        state[14] = state[6];
        state[6] = temp;

        temp = state[7];
        state[7] = state[11];
        state[11] = state[15];
        state[15] = state[3];
        state[3] = temp;

        /* InvSubBytes */
        for (int i = 0; i < 16; i++) {
            state[i] = aes_inv_sbox[state[i]];
        }

        /* AddRoundKey */
        for (int i = 0; i < 4; i++) {
            state[i * 4] ^= (ctx->round_key[round * 4 + i] >> 24) & 0xFF;
            state[i * 4 + 1] ^= (ctx->round_key[round * 4 + i] >> 16) & 0xFF;
            state[i * 4 + 2] ^= (ctx->round_key[round * 4 + i] >> 8) & 0xFF;
            state[i * 4 + 3] ^= ctx->round_key[round * 4 + i] & 0xFF;
        }

        /* InvMixColumns */
        for (int i = 0; i < 4; i++) {
            u8 a[4];
            for (int j = 0; j < 4; j++) {
                a[j] = state[i * 4 + j];
            }
            state[i * 4] = gf_mul(a[0], 0x0e) ^ gf_mul(a[1], 0x0b) ^
                           gf_mul(a[2], 0x0d) ^ gf_mul(a[3], 0x09);
            state[i * 4 + 1] = gf_mul(a[0], 0x09) ^ gf_mul(a[1], 0x0e) ^
                               gf_mul(a[2], 0x0b) ^ gf_mul(a[3], 0x0d);
            state[i * 4 + 2] = gf_mul(a[0], 0x0d) ^ gf_mul(a[1], 0x09) ^
                               gf_mul(a[2], 0x0e) ^ gf_mul(a[3], 0x0b);
            state[i * 4 + 3] = gf_mul(a[0], 0x0b) ^ gf_mul(a[1], 0x0d) ^
                               gf_mul(a[2], 0x09) ^ gf_mul(a[3], 0x0e);
        }
    }

    /* Final round (no InvMixColumns) */
    /* InvShiftRows */
    u8 temp = state[13];
    state[13] = state[9];
    state[9] = state[5];
    state[5] = state[1];
    state[1] = temp;

    temp = state[10];
    state[10] = state[2];
    state[2] = temp;
    temp = state[14];
    state[14] = state[6];
    state[6] = temp;

    temp = state[7];
    state[7] = state[11];
    state[11] = state[15];
    state[15] = state[3];
    state[3] = temp;

    /* InvSubBytes */
    for (int i = 0; i < 16; i++) {
        state[i] = aes_inv_sbox[state[i]];
    }

    /* AddRoundKey (round 0) */
    for (int i = 0; i < 4; i++) {
        state[i * 4] ^= (ctx->round_key[i] >> 24) & 0xFF;
        state[i * 4 + 1] ^= (ctx->round_key[i] >> 16) & 0xFF;
        state[i * 4 + 2] ^= (ctx->round_key[i] >> 8) & 0xFF;
        state[i * 4 + 3] ^= ctx->round_key[i] & 0xFF;
    }

    memcpy(out, state, 16);
}

/* AES-128-CBC encryption */
void aes128_cbc_encrypt(Aes128Context* ctx, const u8* iv,
                        const void* plain, u32 len, void* cipher) {
    const u8* in = (const u8*)plain;
    u8* out = (u8*)cipher;
    u8 block[AES_BLOCK_SIZE];

    memcpy(block, iv, AES_BLOCK_SIZE);

    while (len >= AES_BLOCK_SIZE) {
        xor_block(block, block, in, AES_BLOCK_SIZE);
        aes128_encrypt_block(ctx, block, out);
        memcpy(block, out, AES_BLOCK_SIZE);
        in += AES_BLOCK_SIZE;
        out += AES_BLOCK_SIZE;
        len -= AES_BLOCK_SIZE;
    }
}

/* AES-128-CBC decryption */
void aes128_cbc_decrypt(Aes128Context* ctx, const u8* iv,
                        const void* cipher, u32 len, void* plain) {
    const u8* in = (const u8*)cipher;
    u8* out = (u8*)plain;
    u8 prev_block[AES_BLOCK_SIZE];
    u8 dec_block[AES_BLOCK_SIZE];

    memcpy(prev_block, iv, AES_BLOCK_SIZE);

    while (len >= AES_BLOCK_SIZE) {
        aes128_decrypt_block(ctx, in, dec_block);
        xor_block(out, dec_block, prev_block, AES_BLOCK_SIZE);
        memcpy(prev_block, in, AES_BLOCK_SIZE);
        in += AES_BLOCK_SIZE;
        out += AES_BLOCK_SIZE;
        len -= AES_BLOCK_SIZE;
    }
}

/* Simple random number generation (for nonces, not cryptographic) */
void crypto_random(void* buffer, u32 len) {
    u8* p = (u8*)buffer;
    static u32 seed = 0;

    if (seed == 0) {
        seed = pit_get_ticks() ^ 0xDEADBEEF;
    }

    for (u32 i = 0; i < len; i++) {
        seed = seed * 1103515245 + 12345;
        p[i] = (seed >> 16) & 0xFF;
    }
}
