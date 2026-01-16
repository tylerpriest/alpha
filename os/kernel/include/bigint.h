/*
 * AlphaOS - Big Integer Arithmetic
 *
 * For RSA cryptography (TLS key exchange).
 * Simple implementation - not constant-time (educational use).
 */

#ifndef _BIGINT_H
#define _BIGINT_H

#include "types.h"

/* Big integer with up to 4096 bits (512 bytes) */
#define BIGINT_MAX_WORDS    64  /* 64 * 64-bit = 4096 bits */

typedef struct {
    u64 words[BIGINT_MAX_WORDS];
    u32 size;   /* Number of significant words */
    bool neg;   /* Sign (true = negative) */
} BigInt;

/* Initialize */
void bigint_init(BigInt* n);
void bigint_from_u64(BigInt* n, u64 val);
void bigint_from_bytes(BigInt* n, const u8* bytes, u32 len);
void bigint_to_bytes(const BigInt* n, u8* bytes, u32 len);
void bigint_copy(BigInt* dst, const BigInt* src);

/* Comparison */
int bigint_cmp(const BigInt* a, const BigInt* b);
bool bigint_is_zero(const BigInt* n);

/* Arithmetic */
void bigint_add(BigInt* result, const BigInt* a, const BigInt* b);
void bigint_sub(BigInt* result, const BigInt* a, const BigInt* b);
void bigint_mul(BigInt* result, const BigInt* a, const BigInt* b);
void bigint_div(BigInt* quotient, BigInt* remainder, const BigInt* a, const BigInt* b);
void bigint_mod(BigInt* result, const BigInt* a, const BigInt* m);

/* Modular exponentiation: result = base^exp mod m */
void bigint_modexp(BigInt* result, const BigInt* base, const BigInt* exp, const BigInt* m);

/* Bit operations */
u32 bigint_bit_length(const BigInt* n);
void bigint_shl(BigInt* n, u32 bits);
void bigint_shr(BigInt* n, u32 bits);

#endif /* _BIGINT_H */
