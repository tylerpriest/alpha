/*
 * AlphaOS - Cryptographic Primitives
 *
 * Minimal crypto functions for TLS support.
 */

#ifndef _CRYPTO_H
#define _CRYPTO_H

#include "types.h"

/* SHA-256 */
#define SHA256_BLOCK_SIZE   64
#define SHA256_DIGEST_SIZE  32

typedef struct {
    u32 state[8];
    u64 count;
    u8 buffer[SHA256_BLOCK_SIZE];
} Sha256Context;

void sha256_init(Sha256Context* ctx);
void sha256_update(Sha256Context* ctx, const void* data, u32 len);
void sha256_final(Sha256Context* ctx, u8* digest);
void sha256(const void* data, u32 len, u8* digest);

/* HMAC-SHA256 */
#define HMAC_SHA256_SIZE    32

void hmac_sha256(const void* key, u32 key_len,
                 const void* data, u32 data_len,
                 u8* mac);

/* AES-128 */
#define AES_BLOCK_SIZE      16
#define AES128_KEY_SIZE     16

typedef struct {
    u32 round_key[44];  /* 11 rounds * 4 words */
} Aes128Context;

void aes128_init(Aes128Context* ctx, const u8* key);
void aes128_encrypt_block(Aes128Context* ctx, const u8* in, u8* out);
void aes128_decrypt_block(Aes128Context* ctx, const u8* in, u8* out);

/* AES-128-CBC */
void aes128_cbc_encrypt(Aes128Context* ctx, const u8* iv,
                        const void* plain, u32 len, void* cipher);
void aes128_cbc_decrypt(Aes128Context* ctx, const u8* iv,
                        const void* cipher, u32 len, void* plain);

/* Random number generation */
void crypto_random(void* buffer, u32 len);

/* XOR blocks */
static inline void xor_block(u8* dst, const u8* a, const u8* b, u32 len) {
    for (u32 i = 0; i < len; i++) {
        dst[i] = a[i] ^ b[i];
    }
}

#endif /* _CRYPTO_H */
