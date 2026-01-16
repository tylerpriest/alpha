/*
 * AlphaOS - RSA Encryption
 *
 * RSA public key encryption for TLS key exchange.
 */

#ifndef _RSA_H
#define _RSA_H

#include "types.h"
#include "bigint.h"

/* RSA public key */
typedef struct {
    BigInt n;           /* Modulus */
    BigInt e;           /* Public exponent */
    u32 key_size;       /* Key size in bytes */
} RsaPublicKey;

/* Initialize RSA key from DER-encoded bytes */
int rsa_parse_public_key(RsaPublicKey* key, const u8* der, u32 len);

/* RSA encrypt with PKCS#1 v1.5 padding */
int rsa_encrypt_pkcs1(const RsaPublicKey* key,
                      const u8* plaintext, u32 plain_len,
                      u8* ciphertext, u32* cipher_len);

/* Raw RSA encrypt (no padding) */
int rsa_encrypt_raw(const RsaPublicKey* key,
                    const u8* input, u32 input_len,
                    u8* output, u32* output_len);

#endif /* _RSA_H */
