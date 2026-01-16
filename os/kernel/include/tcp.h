/*
 * AlphaOS - TCP Implementation
 *
 * Research Summary:
 * - RFC 793: Transmission Control Protocol
 * - RFC 1122: Host Requirements (TCP specifics)
 * - Client-only implementation for HTTPS
 */

#ifndef _TCP_H
#define _TCP_H

#include "types.h"
#include "ip.h"

/* TCP header flags */
#define TCP_FLAG_FIN    0x01
#define TCP_FLAG_SYN    0x02
#define TCP_FLAG_RST    0x04
#define TCP_FLAG_PSH    0x08
#define TCP_FLAG_ACK    0x10
#define TCP_FLAG_URG    0x20

/* TCP states */
typedef enum {
    TCP_CLOSED,
    TCP_SYN_SENT,
    TCP_ESTABLISHED,
    TCP_FIN_WAIT_1,
    TCP_FIN_WAIT_2,
    TCP_TIME_WAIT,
    TCP_CLOSE_WAIT,
    TCP_LAST_ACK
} TcpState;

/* TCP header (20 bytes minimum) */
typedef struct {
    u16 src_port;
    u16 dst_port;
    u32 seq_num;
    u32 ack_num;
    u8  data_offset;    /* Upper 4 bits = header length in 32-bit words */
    u8  flags;
    u16 window;
    u16 checksum;
    u16 urgent_ptr;
} __attribute__((packed)) TcpHeader;

/* TCP connection */
typedef struct {
    /* Connection identity */
    u32 local_ip;
    u16 local_port;
    u32 remote_ip;
    u16 remote_port;

    /* State */
    TcpState state;

    /* Sequence numbers */
    u32 seq_num;        /* Our sequence number */
    u32 ack_num;        /* What we've acknowledged */
    u32 remote_seq;     /* Remote's sequence number */

    /* Window */
    u16 local_window;
    u16 remote_window;

    /* Receive buffer */
    u8* rx_buffer;
    u32 rx_len;
    u32 rx_capacity;

    /* Timeout */
    u64 last_activity;
    u32 retransmit_count;
} TcpConnection;

/* Initialize TCP subsystem */
void tcp_init(void);

/* Create new TCP connection (client) */
TcpConnection* tcp_connect(u32 remote_ip, u16 remote_port);

/* Send data on connection */
int tcp_send(TcpConnection* conn, const void* data, u32 len);

/* Receive data from connection (non-blocking) */
int tcp_recv(TcpConnection* conn, void* buffer, u32 max_len);

/* Check if data available */
bool tcp_data_available(TcpConnection* conn);

/* Close connection */
void tcp_close(TcpConnection* conn);

/* Get connection state */
TcpState tcp_get_state(TcpConnection* conn);

/* Process incoming TCP packet */
void tcp_receive(u32 src_ip, const void* packet, u32 len);

/* Poll TCP connections (handle timeouts, retransmits) */
void tcp_poll(void);

/* Calculate TCP checksum (includes pseudo-header) */
u16 tcp_checksum(u32 src_ip, u32 dst_ip, const TcpHeader* tcp, u32 len);

#endif /* _TCP_H */
