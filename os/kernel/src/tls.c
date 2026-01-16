/*
 * AlphaOS - TLS 1.2 Client Implementation
 *
 * Minimal TLS 1.2 client with RSA key exchange.
 * Note: This is a simplified implementation for educational purposes.
 * A production implementation would need proper certificate validation.
 */

#include "tls.h"
#include "crypto.h"
#include "tcp.h"
#include "heap.h"
#include "pit.h"
#include "console.h"
#include "string.h"

/* TLS record header */
typedef struct {
    u8 type;
    u8 version_major;
    u8 version_minor;
    u16 length;
} __attribute__((packed)) TlsRecordHeader;

/* Maximum record size */
#define TLS_MAX_RECORD_SIZE     16384
#define TLS_RX_BUFFER_SIZE      8192

/* Connection pool */
#define TLS_MAX_CONNECTIONS     4
static TlsConnection connections[TLS_MAX_CONNECTIONS];

/* Temporary buffers */
static u8 tls_tx_buffer[TLS_MAX_RECORD_SIZE] __attribute__((aligned(64)));
static u8 tls_rx_buffer[TLS_MAX_RECORD_SIZE] __attribute__((aligned(64)));
static u8 handshake_buffer[4096] __attribute__((aligned(64)));
static u32 handshake_len;

/* Initialize TLS subsystem */
void tls_init(void) {
    memset(connections, 0, sizeof(connections));
    console_printf("  TLS: Subsystem initialized\n");
}

/* Allocate TLS connection */
static TlsConnection* tls_alloc_connection(void) {
    for (int i = 0; i < TLS_MAX_CONNECTIONS; i++) {
        if (connections[i].state == TLS_STATE_INIT && !connections[i].tcp) {
            TlsConnection* conn = &connections[i];
            memset(conn, 0, sizeof(*conn));
            conn->rx_buffer = kmalloc(TLS_RX_BUFFER_SIZE);
            if (!conn->rx_buffer) return NULL;
            conn->rx_capacity = TLS_RX_BUFFER_SIZE;
            return conn;
        }
    }
    return NULL;
}

/* PRF (Pseudo-Random Function) for TLS 1.2 */
static void tls_prf(const u8* secret, u32 secret_len,
                    const char* label,
                    const u8* seed, u32 seed_len,
                    u8* output, u32 output_len) {
    /* P_SHA256 */
    u32 label_len = 0;
    while (label[label_len]) label_len++;

    /* Combined seed: label + seed */
    u8 combined[256];
    memcpy(combined, label, label_len);
    memcpy(combined + label_len, seed, seed_len);
    u32 combined_len = label_len + seed_len;

    /* A(0) = seed, A(i) = HMAC(secret, A(i-1)) */
    u8 a[32];
    hmac_sha256(secret, secret_len, combined, combined_len, a);

    u8* p = output;
    u32 remaining = output_len;

    while (remaining > 0) {
        /* P_hash = HMAC(secret, A(i) + seed) */
        u8 temp[64 + 256];
        memcpy(temp, a, 32);
        memcpy(temp + 32, combined, combined_len);

        u8 hash[32];
        hmac_sha256(secret, secret_len, temp, 32 + combined_len, hash);

        u32 to_copy = (remaining < 32) ? remaining : 32;
        memcpy(p, hash, to_copy);
        p += to_copy;
        remaining -= to_copy;

        /* A(i+1) = HMAC(secret, A(i)) */
        hmac_sha256(secret, secret_len, a, 32, a);
    }
}

/* Build ClientHello */
static int build_client_hello(TlsConnection* conn, u8* buffer) {
    u8* p = buffer;

    /* Handshake header */
    *p++ = TLS_CLIENT_HELLO;

    /* Length placeholder (3 bytes) */
    u8* len_ptr = p;
    p += 3;

    /* Client version */
    *p++ = 0x03;  /* TLS 1.2 */
    *p++ = 0x03;

    /* Client random */
    u32 time = pit_get_uptime_ms() / 1000;
    conn->client_random[0] = (time >> 24) & 0xFF;
    conn->client_random[1] = (time >> 16) & 0xFF;
    conn->client_random[2] = (time >> 8) & 0xFF;
    conn->client_random[3] = time & 0xFF;
    crypto_random(conn->client_random + 4, 28);

    memcpy(p, conn->client_random, 32);
    p += 32;

    /* Session ID (empty) */
    *p++ = 0;

    /* Cipher suites */
    *p++ = 0;
    *p++ = 2;  /* Length */
    *p++ = (TLS_RSA_WITH_AES_128_CBC_SHA256 >> 8) & 0xFF;
    *p++ = TLS_RSA_WITH_AES_128_CBC_SHA256 & 0xFF;

    /* Compression methods */
    *p++ = 1;  /* Length */
    *p++ = 0;  /* null */

    /* Extensions (minimal - SNI would go here) */
    *p++ = 0;
    *p++ = 0;  /* No extensions */

    /* Fill in length */
    u32 len = p - buffer - 4;
    len_ptr[0] = (len >> 16) & 0xFF;
    len_ptr[1] = (len >> 8) & 0xFF;
    len_ptr[2] = len & 0xFF;

    return p - buffer;
}

/* Send TLS record */
static int tls_send_record(TlsConnection* conn, u8 type,
                            const void* data, u32 len) {
    if (len > TLS_MAX_RECORD_SIZE - 5) return -1;

    TlsRecordHeader hdr;
    hdr.type = type;
    hdr.version_major = 0x03;
    hdr.version_minor = 0x03;
    hdr.length = htons(len);

    /* Send header */
    if (tcp_send(conn->tcp, &hdr, sizeof(hdr)) < 0) return -2;

    /* Send data */
    if (len > 0 && tcp_send(conn->tcp, data, len) < 0) return -3;

    return 0;
}

/* Receive TLS record */
static int tls_recv_record(TlsConnection* conn, u8* type,
                            void* data, u32 max_len) {
    /* Wait for data with timeout */
    u64 start = pit_get_uptime_ms();
    while (!tcp_data_available(conn->tcp)) {
        tcp_poll();
        pit_sleep_ms(10);
        if (pit_get_uptime_ms() - start > 10000) return -1;  /* Timeout */
    }

    /* Read header */
    TlsRecordHeader hdr;
    int ret = tcp_recv(conn->tcp, &hdr, sizeof(hdr));
    if (ret < (int)sizeof(hdr)) return -2;

    *type = hdr.type;
    u32 len = ntohs(hdr.length);
    if (len > max_len) return -3;

    /* Read data */
    u32 received = 0;
    while (received < len) {
        start = pit_get_uptime_ms();
        while (!tcp_data_available(conn->tcp)) {
            tcp_poll();
            pit_sleep_ms(10);
            if (pit_get_uptime_ms() - start > 10000) return -4;
        }

        ret = tcp_recv(conn->tcp, (u8*)data + received, len - received);
        if (ret <= 0) return -5;
        received += ret;
    }

    return len;
}

/* Parse ServerHello */
static int parse_server_hello(TlsConnection* conn, const u8* data, u32 len) {
    if (len < 38) return -1;

    const u8* p = data;

    /* Skip handshake type and length (4 bytes) */
    p += 4;

    /* Version */
    if (p[0] != 0x03 || p[1] != 0x03) return -2;  /* Not TLS 1.2 */
    p += 2;

    /* Server random */
    memcpy(conn->server_random, p, 32);
    p += 32;

    /* Session ID */
    u8 sid_len = *p++;
    p += sid_len;

    /* Cipher suite */
    u16 cipher = ((u16)p[0] << 8) | p[1];
    if (cipher != TLS_RSA_WITH_AES_128_CBC_SHA256) return -3;

    return 0;
}

/* Extract public key from certificate (simplified - assumes RSA) */
static int extract_rsa_pubkey(const u8* cert, u32 cert_len,
                               u8* modulus, u32* mod_len,
                               u8* exponent, u32* exp_len) {
    /* This is a very simplified ASN.1 parser */
    /* In production, use proper X.509 parsing */

    /* Look for RSA modulus pattern */
    /* The modulus is typically a large integer following certain sequences */

    /* For now, return a placeholder - real implementation needs ASN.1 parsing */
    (void)cert;
    (void)cert_len;
    (void)modulus;
    (void)mod_len;
    (void)exponent;
    (void)exp_len;

    console_printf("  TLS: Certificate parsing not fully implemented\n");
    return -1;
}

/* Create TLS connection */
TlsConnection* tls_connect(TcpConnection* tcp) {
    if (!tcp || tcp_get_state(tcp) != TCP_ESTABLISHED) {
        return NULL;
    }

    TlsConnection* conn = tls_alloc_connection();
    if (!conn) {
        console_printf("  TLS: No free connections\n");
        return NULL;
    }

    conn->tcp = tcp;
    conn->state = TLS_STATE_INIT;

    return conn;
}

/* Perform TLS handshake */
int tls_handshake(TlsConnection* conn) {
    if (!conn || !conn->tcp) return -1;

    console_printf("  TLS: Starting handshake...\n");

    /* Reset handshake buffer */
    handshake_len = 0;

    /* Build and send ClientHello */
    int hello_len = build_client_hello(conn, handshake_buffer);
    if (hello_len < 0) return -2;

    /* Save for handshake hash */
    memcpy(handshake_buffer + handshake_len, handshake_buffer, hello_len);
    handshake_len += hello_len;

    if (tls_send_record(conn, TLS_HANDSHAKE, handshake_buffer, hello_len) < 0) {
        console_printf("  TLS: Failed to send ClientHello\n");
        return -3;
    }

    conn->state = TLS_STATE_CLIENT_HELLO_SENT;
    console_printf("  TLS: ClientHello sent\n");

    /* Receive ServerHello */
    u8 type;
    int len = tls_recv_record(conn, &type, tls_rx_buffer, sizeof(tls_rx_buffer));
    if (len < 0 || type != TLS_HANDSHAKE) {
        console_printf("  TLS: Failed to receive ServerHello\n");
        return -4;
    }

    if (tls_rx_buffer[0] != TLS_SERVER_HELLO) {
        console_printf("  TLS: Expected ServerHello, got %d\n", tls_rx_buffer[0]);
        return -5;
    }

    if (parse_server_hello(conn, tls_rx_buffer, len) < 0) {
        console_printf("  TLS: Failed to parse ServerHello\n");
        return -6;
    }

    conn->state = TLS_STATE_SERVER_HELLO_RECEIVED;
    console_printf("  TLS: ServerHello received\n");

    /* For this minimal implementation, we stop here */
    /* A full implementation would continue with:
     * - Certificate parsing and validation
     * - ClientKeyExchange with RSA-encrypted premaster secret
     * - ChangeCipherSpec
     * - Finished message verification
     */

    console_printf("  TLS: Handshake incomplete (minimal implementation)\n");
    conn->state = TLS_STATE_ERROR;

    return -100;  /* Incomplete implementation */
}

/* Send encrypted data */
int tls_send(TlsConnection* conn, const void* data, u32 len) {
    if (!conn || conn->state != TLS_STATE_ESTABLISHED) return -1;

    /* Encrypt and send data */
    /* Implementation would use AES-CBC with HMAC */

    (void)data;
    (void)len;
    return -1;  /* Not implemented */
}

/* Receive decrypted data */
int tls_recv(TlsConnection* conn, void* buffer, u32 max_len) {
    if (!conn || conn->state != TLS_STATE_ESTABLISHED) return -1;

    /* Receive and decrypt data */
    (void)buffer;
    (void)max_len;
    return -1;  /* Not implemented */
}

/* Close TLS connection */
void tls_close(TlsConnection* conn) {
    if (!conn) return;

    if (conn->rx_buffer) {
        kfree(conn->rx_buffer);
        conn->rx_buffer = NULL;
    }

    conn->state = TLS_STATE_INIT;
    conn->tcp = NULL;
}

/* Get TLS state */
TlsState tls_get_state(TlsConnection* conn) {
    return conn ? conn->state : TLS_STATE_INIT;
}

/* Check if connection is established */
bool tls_is_connected(TlsConnection* conn) {
    return conn && conn->state == TLS_STATE_ESTABLISHED;
}
