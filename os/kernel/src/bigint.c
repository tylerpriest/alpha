/*
 * AlphaOS - Big Integer Arithmetic Implementation
 *
 * Simple big integer library for RSA operations.
 */

#include "bigint.h"
#include "string.h"

/* Initialize to zero */
void bigint_init(BigInt* n) {
    memset(n->words, 0, sizeof(n->words));
    n->size = 0;
    n->neg = false;
}

/* Create from u64 */
void bigint_from_u64(BigInt* n, u64 val) {
    bigint_init(n);
    if (val != 0) {
        n->words[0] = val;
        n->size = 1;
    }
}

/* Create from big-endian bytes */
void bigint_from_bytes(BigInt* n, const u8* bytes, u32 len) {
    bigint_init(n);

    /* Skip leading zeros */
    while (len > 0 && *bytes == 0) {
        bytes++;
        len--;
    }

    if (len == 0) return;

    /* Pack bytes into 64-bit words (big-endian to little-endian) */
    u32 word_idx = 0;
    u32 byte_idx = len;

    while (byte_idx > 0 && word_idx < BIGINT_MAX_WORDS) {
        u64 word = 0;
        for (int i = 0; i < 8 && byte_idx > 0; i++) {
            byte_idx--;
            word |= ((u64)bytes[byte_idx]) << (i * 8);
        }
        n->words[word_idx++] = word;
    }

    n->size = word_idx;
}

/* Export to big-endian bytes */
void bigint_to_bytes(const BigInt* n, u8* bytes, u32 len) {
    memset(bytes, 0, len);

    u32 byte_idx = len;
    for (u32 w = 0; w < n->size && byte_idx > 0; w++) {
        u64 word = n->words[w];
        for (int i = 0; i < 8 && byte_idx > 0; i++) {
            byte_idx--;
            bytes[byte_idx] = word & 0xFF;
            word >>= 8;
        }
    }
}

/* Copy */
void bigint_copy(BigInt* dst, const BigInt* src) {
    memcpy(dst, src, sizeof(BigInt));
}

/* Compare: returns -1, 0, or 1 */
int bigint_cmp(const BigInt* a, const BigInt* b) {
    if (a->size != b->size) {
        return (a->size > b->size) ? 1 : -1;
    }

    for (int i = a->size - 1; i >= 0; i--) {
        if (a->words[i] != b->words[i]) {
            return (a->words[i] > b->words[i]) ? 1 : -1;
        }
    }

    return 0;
}

/* Check if zero */
bool bigint_is_zero(const BigInt* n) {
    return n->size == 0;
}

/* Get bit length */
u32 bigint_bit_length(const BigInt* n) {
    if (n->size == 0) return 0;

    u64 top = n->words[n->size - 1];
    u32 bits = (n->size - 1) * 64;

    while (top > 0) {
        bits++;
        top >>= 1;
    }

    return bits;
}

/* Normalize: remove leading zero words */
static void bigint_normalize(BigInt* n) {
    while (n->size > 0 && n->words[n->size - 1] == 0) {
        n->size--;
    }
}

/* Add: result = a + b (assumes both positive) */
void bigint_add(BigInt* result, const BigInt* a, const BigInt* b) {
    u32 max_size = (a->size > b->size) ? a->size : b->size;
    u64 carry = 0;

    for (u32 i = 0; i < max_size || carry; i++) {
        u64 av = (i < a->size) ? a->words[i] : 0;
        u64 bv = (i < b->size) ? b->words[i] : 0;

        u64 sum = av + bv + carry;
        carry = (sum < av) || (carry && sum == av) ? 1 : 0;

        if (i < BIGINT_MAX_WORDS) {
            result->words[i] = sum;
        }
    }

    result->size = (max_size + 1 < BIGINT_MAX_WORDS) ? max_size + 1 : BIGINT_MAX_WORDS;
    result->neg = false;
    bigint_normalize(result);
}

/* Subtract: result = a - b (assumes a >= b, both positive) */
void bigint_sub(BigInt* result, const BigInt* a, const BigInt* b) {
    u64 borrow = 0;

    for (u32 i = 0; i < a->size; i++) {
        u64 av = a->words[i];
        u64 bv = (i < b->size) ? b->words[i] : 0;

        u64 diff = av - bv - borrow;
        borrow = (av < bv + borrow) ? 1 : 0;

        result->words[i] = diff;
    }

    result->size = a->size;
    result->neg = false;
    bigint_normalize(result);
}

/* Multiply: result = a * b */
void bigint_mul(BigInt* result, const BigInt* a, const BigInt* b) {
    BigInt temp;
    bigint_init(&temp);

    for (u32 i = 0; i < a->size; i++) {
        u64 carry = 0;
        for (u32 j = 0; j < b->size || carry; j++) {
            if (i + j >= BIGINT_MAX_WORDS) break;

            u64 bv = (j < b->size) ? b->words[j] : 0;

            /* 64x64 -> 128 bit multiplication */
            u64 a_lo = a->words[i] & 0xFFFFFFFF;
            u64 a_hi = a->words[i] >> 32;
            u64 b_lo = bv & 0xFFFFFFFF;
            u64 b_hi = bv >> 32;

            u64 p0 = a_lo * b_lo;
            u64 p1 = a_lo * b_hi;
            u64 p2 = a_hi * b_lo;
            u64 p3 = a_hi * b_hi;

            u64 mid = p1 + p2;
            u64 mid_carry = (mid < p1) ? ((u64)1 << 32) : 0;

            u64 lo = p0 + (mid << 32);
            u64 hi = p3 + (mid >> 32) + mid_carry + (lo < p0 ? 1 : 0);

            u64 sum = temp.words[i + j] + lo + carry;
            carry = hi + (sum < lo ? 1 : 0);
            temp.words[i + j] = sum;
        }
    }

    temp.size = a->size + b->size;
    if (temp.size > BIGINT_MAX_WORDS) temp.size = BIGINT_MAX_WORDS;
    bigint_normalize(&temp);

    bigint_copy(result, &temp);
}

/* Left shift by bits */
void bigint_shl(BigInt* n, u32 bits) {
    if (bits == 0 || n->size == 0) return;

    u32 word_shift = bits / 64;
    u32 bit_shift = bits % 64;

    /* Shift words */
    if (word_shift > 0) {
        for (int i = BIGINT_MAX_WORDS - 1; i >= (int)word_shift; i--) {
            n->words[i] = n->words[i - word_shift];
        }
        for (u32 i = 0; i < word_shift; i++) {
            n->words[i] = 0;
        }
        n->size += word_shift;
        if (n->size > BIGINT_MAX_WORDS) n->size = BIGINT_MAX_WORDS;
    }

    /* Shift bits */
    if (bit_shift > 0) {
        u64 carry = 0;
        for (u32 i = 0; i < n->size; i++) {
            u64 new_carry = n->words[i] >> (64 - bit_shift);
            n->words[i] = (n->words[i] << bit_shift) | carry;
            carry = new_carry;
        }
        if (carry && n->size < BIGINT_MAX_WORDS) {
            n->words[n->size++] = carry;
        }
    }
}

/* Right shift by bits */
void bigint_shr(BigInt* n, u32 bits) {
    if (bits == 0 || n->size == 0) return;

    u32 word_shift = bits / 64;
    u32 bit_shift = bits % 64;

    /* Shift words */
    if (word_shift >= n->size) {
        bigint_init(n);
        return;
    }

    if (word_shift > 0) {
        for (u32 i = 0; i < n->size - word_shift; i++) {
            n->words[i] = n->words[i + word_shift];
        }
        for (u32 i = n->size - word_shift; i < n->size; i++) {
            n->words[i] = 0;
        }
        n->size -= word_shift;
    }

    /* Shift bits */
    if (bit_shift > 0) {
        u64 carry = 0;
        for (int i = n->size - 1; i >= 0; i--) {
            u64 new_carry = n->words[i] << (64 - bit_shift);
            n->words[i] = (n->words[i] >> bit_shift) | carry;
            carry = new_carry;
        }
        bigint_normalize(n);
    }
}

/* Modulo: result = a mod m */
void bigint_mod(BigInt* result, const BigInt* a, const BigInt* m) {
    BigInt temp;
    bigint_copy(&temp, a);

    /* Simple shift-subtract algorithm */
    u32 a_bits = bigint_bit_length(&temp);
    u32 m_bits = bigint_bit_length(m);

    if (a_bits < m_bits || bigint_cmp(&temp, m) < 0) {
        bigint_copy(result, &temp);
        return;
    }

    BigInt shifted_m;
    bigint_copy(&shifted_m, m);
    bigint_shl(&shifted_m, a_bits - m_bits);

    for (int i = a_bits - m_bits; i >= 0; i--) {
        if (bigint_cmp(&temp, &shifted_m) >= 0) {
            bigint_sub(&temp, &temp, &shifted_m);
        }
        bigint_shr(&shifted_m, 1);
    }

    bigint_copy(result, &temp);
}

/* Division: quotient = a / b, remainder = a % b */
void bigint_div(BigInt* quotient, BigInt* remainder, const BigInt* a, const BigInt* b) {
    if (bigint_is_zero(b)) {
        bigint_init(quotient);
        bigint_init(remainder);
        return;
    }

    if (bigint_cmp(a, b) < 0) {
        bigint_init(quotient);
        bigint_copy(remainder, a);
        return;
    }

    BigInt temp_a, temp_b, q;
    bigint_copy(&temp_a, a);
    bigint_init(&q);

    u32 a_bits = bigint_bit_length(&temp_a);
    u32 b_bits = bigint_bit_length(b);
    u32 shift = a_bits - b_bits;

    bigint_copy(&temp_b, b);
    bigint_shl(&temp_b, shift);

    for (int i = shift; i >= 0; i--) {
        bigint_shl(&q, 1);
        if (bigint_cmp(&temp_a, &temp_b) >= 0) {
            bigint_sub(&temp_a, &temp_a, &temp_b);
            q.words[0] |= 1;
            if (q.size == 0) q.size = 1;
        }
        bigint_shr(&temp_b, 1);
    }

    bigint_normalize(&q);
    bigint_copy(quotient, &q);
    bigint_copy(remainder, &temp_a);
}

/* Modular exponentiation: result = base^exp mod m (square-and-multiply) */
void bigint_modexp(BigInt* result, const BigInt* base, const BigInt* exp, const BigInt* m) {
    BigInt res, b, e;

    bigint_from_u64(&res, 1);
    bigint_copy(&b, base);
    bigint_mod(&b, &b, m);
    bigint_copy(&e, exp);

    while (!bigint_is_zero(&e)) {
        /* If exp is odd, multiply result by base */
        if (e.words[0] & 1) {
            bigint_mul(&res, &res, &b);
            bigint_mod(&res, &res, m);
        }

        /* Square the base */
        bigint_mul(&b, &b, &b);
        bigint_mod(&b, &b, m);

        /* Divide exp by 2 */
        bigint_shr(&e, 1);
    }

    bigint_copy(result, &res);
}
