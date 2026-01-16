/*
 * AlphaOS - TLS 1.2 Client
 *
 * Minimal TLS implementation for HTTPS connectivity.
 * Supports TLS_RSA_WITH_AES_128_CBC_SHA256
 */

#ifndef _TLS_H
#define _TLS_H

#include "types.h"
#include "tcp.h"

/* TLS version */
#define TLS_VERSION_1_2     0x0303

/* TLS content types */
#define TLS_CHANGE_CIPHER   20
#define TLS_ALERT           21
#define TLS_HANDSHAKE       22
#define TLS_APPLICATION     23

/* TLS handshake types */
#define TLS_CLIENT_HELLO        1
#define TLS_SERVER_HELLO        2
#define TLS_CERTIFICATE         11
#define TLS_SERVER_KEY_EXCHANGE 12
#define TLS_SERVER_HELLO_DONE   14
#define TLS_CLIENT_KEY_EXCHANGE 16
#define TLS_FINISHED            20

/* Cipher suite */
#define TLS_RSA_WITH_AES_128_CBC_SHA256 0x003C

/* TLS state */
typedef enum {
    TLS_STATE_INIT,
    TLS_STATE_CLIENT_HELLO_SENT,
    TLS_STATE_SERVER_HELLO_RECEIVED,
    TLS_STATE_CERTIFICATE_RECEIVED,
    TLS_STATE_SERVER_DONE_RECEIVED,
    TLS_STATE_KEY_EXCHANGE_SENT,
    TLS_STATE_CHANGE_CIPHER_SENT,
    TLS_STATE_FINISHED_SENT,
    TLS_STATE_ESTABLISHED,
    TLS_STATE_ERROR
} TlsState;

/* TLS connection */
typedef struct {
    TcpConnection* tcp;
    TlsState state;

    /* Handshake data */
    u8 client_random[32];
    u8 server_random[32];
    u8 master_secret[48];
    u8 premaster_secret[48];

    /* Session keys */
    u8 client_write_key[16];
    u8 server_write_key[16];
    u8 client_write_mac_key[32];
    u8 server_write_mac_key[32];
    u8 client_write_iv[16];
    u8 server_write_iv[16];

    /* Sequence numbers */
    u64 client_seq;
    u64 server_seq;

    /* Certificate info */
    u8 server_cert_hash[32];

    /* Handshake messages hash (for Finished) */
    u8 handshake_hash[32];

    /* Receive buffer for decrypted data */
    u8* rx_buffer;
    u32 rx_len;
    u32 rx_capacity;
} TlsConnection;

/* Initialize TLS subsystem */
void tls_init(void);

/* Create TLS connection over existing TCP connection */
TlsConnection* tls_connect(TcpConnection* tcp);

/* Perform TLS handshake */
int tls_handshake(TlsConnection* conn);

/* Send encrypted data */
int tls_send(TlsConnection* conn, const void* data, u32 len);

/* Receive decrypted data */
int tls_recv(TlsConnection* conn, void* buffer, u32 max_len);

/* Close TLS connection */
void tls_close(TlsConnection* conn);

/* Get TLS state */
TlsState tls_get_state(TlsConnection* conn);

/* Check if connection is established */
bool tls_is_connected(TlsConnection* conn);

#endif /* _TLS_H */
