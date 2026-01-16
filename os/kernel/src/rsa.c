/*
 * AlphaOS - RSA Implementation
 *
 * RSA encryption using big integers.
 */

#include "rsa.h"
#include "crypto.h"
#include "string.h"

/* Parse ASN.1 length */
static int parse_asn1_length(const u8** p, const u8* end, u32* len) {
    if (*p >= end) return -1;

    u8 first = *(*p)++;
    if (first < 0x80) {
        *len = first;
    } else {
        u32 num_bytes = first & 0x7F;
        if (num_bytes > 4 || *p + num_bytes > end) return -1;

        *len = 0;
        for (u32 i = 0; i < num_bytes; i++) {
            *len = (*len << 8) | *(*p)++;
        }
    }

    return 0;
}

/* Parse ASN.1 INTEGER into BigInt */
static int parse_asn1_integer(const u8** p, const u8* end, BigInt* n) {
    if (*p >= end || **p != 0x02) return -1;  /* INTEGER tag */
    (*p)++;

    u32 len;
    if (parse_asn1_length(p, end, &len) < 0) return -1;
    if (*p + len > end) return -1;

    /* Skip leading zero if present (sign byte) */
    const u8* data = *p;
    if (len > 0 && data[0] == 0x00) {
        data++;
        len--;
    }

    bigint_from_bytes(n, data, len);
    *p += len + (data != *p ? 1 : 0);

    return 0;
}

/* Parse RSA public key from DER-encoded SubjectPublicKeyInfo or RSAPublicKey */
int rsa_parse_public_key(RsaPublicKey* key, const u8* der, u32 len) {
    const u8* p = der;
    const u8* end = der + len;

    /* Try to parse as SEQUENCE */
    if (p >= end || *p != 0x30) return -1;
    p++;

    u32 seq_len;
    if (parse_asn1_length(&p, end, &seq_len) < 0) return -1;

    /* Check if this is SubjectPublicKeyInfo (has AlgorithmIdentifier) */
    if (p < end && *p == 0x30) {
        /* Skip AlgorithmIdentifier SEQUENCE */
        p++;
        u32 alg_len;
        if (parse_asn1_length(&p, end, &alg_len) < 0) return -1;
        p += alg_len;

        /* BIT STRING containing RSAPublicKey */
        if (p >= end || *p != 0x03) return -1;
        p++;

        u32 bit_len;
        if (parse_asn1_length(&p, end, &bit_len) < 0) return -1;

        /* Skip unused bits byte */
        if (p >= end) return -1;
        p++;

        /* Now parse inner RSAPublicKey SEQUENCE */
        if (p >= end || *p != 0x30) return -1;
        p++;

        if (parse_asn1_length(&p, end, &seq_len) < 0) return -1;
    }

    /* Parse n (modulus) */
    if (parse_asn1_integer(&p, end, &key->n) < 0) return -1;

    /* Parse e (exponent) */
    if (parse_asn1_integer(&p, end, &key->e) < 0) return -1;

    /* Calculate key size */
    key->key_size = (bigint_bit_length(&key->n) + 7) / 8;

    return 0;
}

/* RSA encrypt with PKCS#1 v1.5 padding */
int rsa_encrypt_pkcs1(const RsaPublicKey* key,
                      const u8* plaintext, u32 plain_len,
                      u8* ciphertext, u32* cipher_len) {
    u32 k = key->key_size;

    /* Check message length: plain_len <= k - 11 */
    if (plain_len > k - 11) return -1;

    /* Build padded message: 0x00 || 0x02 || PS || 0x00 || M */
    u8 padded[512];
    if (k > sizeof(padded)) return -2;

    padded[0] = 0x00;
    padded[1] = 0x02;

    /* Generate random padding (non-zero bytes) */
    u32 ps_len = k - plain_len - 3;
    crypto_random(padded + 2, ps_len);

    /* Ensure no zero bytes in padding */
    for (u32 i = 0; i < ps_len; i++) {
        while (padded[2 + i] == 0) {
            crypto_random(padded + 2 + i, 1);
        }
    }

    padded[2 + ps_len] = 0x00;
    memcpy(padded + 3 + ps_len, plaintext, plain_len);

    /* Convert to big integer and encrypt */
    BigInt m, c;
    bigint_from_bytes(&m, padded, k);

    /* c = m^e mod n */
    bigint_modexp(&c, &m, &key->e, &key->n);

    /* Output ciphertext */
    bigint_to_bytes(&c, ciphertext, k);
    *cipher_len = k;

    return 0;
}

/* Raw RSA encrypt (no padding) */
int rsa_encrypt_raw(const RsaPublicKey* key,
                    const u8* input, u32 input_len,
                    u8* output, u32* output_len) {
    BigInt m, c;

    bigint_from_bytes(&m, input, input_len);

    /* c = m^e mod n */
    bigint_modexp(&c, &m, &key->e, &key->n);

    bigint_to_bytes(&c, output, key->key_size);
    *output_len = key->key_size;

    return 0;
}
