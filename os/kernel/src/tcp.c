/*
 * AlphaOS - TCP Implementation
 *
 * Minimal TCP client for HTTPS connectivity.
 * Implements three-way handshake, data transfer, and connection close.
 */

#include "tcp.h"
#include "ip.h"
#include "ethernet.h"
#include "pit.h"
#include "heap.h"
#include "console.h"
#include "string.h"

/* Maximum connections */
#define TCP_MAX_CONNECTIONS 8

/* Receive buffer size */
#define TCP_RX_BUFFER_SIZE  8192

/* Timeout in milliseconds */
#define TCP_CONNECT_TIMEOUT 5000
#define TCP_RETRANSMIT_TIMEOUT 1000
#define TCP_MAX_RETRANSMITS 5

/* Default window size */
#define TCP_WINDOW_SIZE 4096

/* Connection pool */
static TcpConnection connections[TCP_MAX_CONNECTIONS];
static u16 next_port = 49152;  /* Ephemeral port range start */

/* Initialize TCP subsystem */
void tcp_init(void) {
    memset(connections, 0, sizeof(connections));
    console_printf("  TCP: Subsystem initialized\n");
}

/* Allocate new connection */
static TcpConnection* tcp_alloc_connection(void) {
    for (int i = 0; i < TCP_MAX_CONNECTIONS; i++) {
        if (connections[i].state == TCP_CLOSED) {
            TcpConnection* conn = &connections[i];
            memset(conn, 0, sizeof(*conn));

            /* Allocate receive buffer */
            conn->rx_buffer = kmalloc(TCP_RX_BUFFER_SIZE);
            if (!conn->rx_buffer) return NULL;

            conn->rx_capacity = TCP_RX_BUFFER_SIZE;
            conn->local_window = TCP_WINDOW_SIZE;

            return conn;
        }
    }
    return NULL;
}

/* Find connection by ports and IPs */
static TcpConnection* tcp_find_connection(u32 local_ip, u16 local_port,
                                          u32 remote_ip, u16 remote_port) {
    for (int i = 0; i < TCP_MAX_CONNECTIONS; i++) {
        TcpConnection* conn = &connections[i];
        if (conn->state != TCP_CLOSED &&
            conn->local_port == local_port &&
            conn->remote_port == remote_port &&
            conn->remote_ip == remote_ip) {
            return conn;
        }
    }
    return NULL;
}

/* Send TCP segment */
static int tcp_send_segment(TcpConnection* conn, u8 flags,
                            const void* data, u32 len) {
    /* Build TCP segment */
    static u8 segment[ETH_MTU] __attribute__((aligned(64)));
    TcpHeader* tcp = (TcpHeader*)segment;

    tcp->src_port = htons(conn->local_port);
    tcp->dst_port = htons(conn->remote_port);
    tcp->seq_num = htonl(conn->seq_num);
    tcp->ack_num = htonl(conn->ack_num);
    tcp->data_offset = (5 << 4);  /* 20 bytes, no options */
    tcp->flags = flags;
    tcp->window = htons(conn->local_window);
    tcp->checksum = 0;
    tcp->urgent_ptr = 0;

    /* Copy data if present */
    if (data && len > 0) {
        memcpy(segment + sizeof(TcpHeader), data, len);
    }

    /* Calculate checksum */
    u32 total_len = sizeof(TcpHeader) + len;
    tcp->checksum = tcp_checksum(conn->local_ip, conn->remote_ip,
                                  tcp, total_len);

    /* Send via IP */
    int ret = ip_send(conn->remote_ip, IP_PROTO_TCP, segment, total_len);

    if (ret == 0) {
        conn->last_activity = pit_get_uptime_ms();
    }

    return ret;
}

/* Create new TCP connection (client) */
TcpConnection* tcp_connect(u32 remote_ip, u16 remote_port) {
    IpConfig* ip_cfg = ip_get_config();
    if (!ip_cfg->configured) {
        console_printf("  TCP: No IP configured\n");
        return NULL;
    }

    TcpConnection* conn = tcp_alloc_connection();
    if (!conn) {
        console_printf("  TCP: No free connections\n");
        return NULL;
    }

    /* Set up connection */
    conn->local_ip = ip_cfg->ip_addr;
    conn->local_port = next_port++;
    conn->remote_ip = remote_ip;
    conn->remote_port = remote_port;
    conn->state = TCP_SYN_SENT;

    /* Generate initial sequence number (simple for now) */
    conn->seq_num = pit_get_ticks() * 12345;

    char ip_str[16];
    ip_format(remote_ip, ip_str);
    console_printf("  TCP: Connecting to %s:%u\n", ip_str, remote_port);

    /* Send SYN */
    if (tcp_send_segment(conn, TCP_FLAG_SYN, NULL, 0) != 0) {
        console_printf("  TCP: Failed to send SYN\n");
        conn->state = TCP_CLOSED;
        return NULL;
    }

    conn->seq_num++;  /* SYN consumes one sequence number */

    /* Wait for SYN-ACK (simplified blocking wait) */
    u64 start = pit_get_uptime_ms();
    while (conn->state == TCP_SYN_SENT) {
        tcp_poll();
        pit_sleep_ms(10);

        if (pit_get_uptime_ms() - start > TCP_CONNECT_TIMEOUT) {
            console_printf("  TCP: Connection timeout\n");
            conn->state = TCP_CLOSED;
            return NULL;
        }
    }

    if (conn->state != TCP_ESTABLISHED) {
        console_printf("  TCP: Connection failed\n");
        return NULL;
    }

    console_printf("  TCP: Connected!\n");
    return conn;
}

/* Send data on connection */
int tcp_send(TcpConnection* conn, const void* data, u32 len) {
    if (!conn || conn->state != TCP_ESTABLISHED) return -1;

    const u8* ptr = (const u8*)data;
    u32 remaining = len;

    while (remaining > 0) {
        /* Max segment size (simple - no MSS negotiation) */
        u32 chunk = (remaining > 1400) ? 1400 : remaining;

        u8 flags = TCP_FLAG_ACK;
        if (remaining <= chunk) {
            flags |= TCP_FLAG_PSH;  /* Push on last segment */
        }

        if (tcp_send_segment(conn, flags, ptr, chunk) != 0) {
            return -1;
        }

        conn->seq_num += chunk;
        ptr += chunk;
        remaining -= chunk;
    }

    return len;
}

/* Receive data from connection (non-blocking) */
int tcp_recv(TcpConnection* conn, void* buffer, u32 max_len) {
    if (!conn) return -1;

    if (conn->rx_len == 0) return 0;

    u32 to_copy = (conn->rx_len < max_len) ? conn->rx_len : max_len;
    memcpy(buffer, conn->rx_buffer, to_copy);

    /* Shift remaining data */
    if (to_copy < conn->rx_len) {
        memmove(conn->rx_buffer, conn->rx_buffer + to_copy,
                conn->rx_len - to_copy);
    }
    conn->rx_len -= to_copy;

    return to_copy;
}

/* Check if data available */
bool tcp_data_available(TcpConnection* conn) {
    return conn && conn->rx_len > 0;
}

/* Close connection */
void tcp_close(TcpConnection* conn) {
    if (!conn) return;

    if (conn->state == TCP_ESTABLISHED) {
        /* Send FIN */
        conn->state = TCP_FIN_WAIT_1;
        tcp_send_segment(conn, TCP_FLAG_FIN | TCP_FLAG_ACK, NULL, 0);
        conn->seq_num++;
    }

    /* For simplicity, just close immediately */
    if (conn->rx_buffer) {
        kfree(conn->rx_buffer);
        conn->rx_buffer = NULL;
    }
    conn->state = TCP_CLOSED;
}

/* Get connection state */
TcpState tcp_get_state(TcpConnection* conn) {
    return conn ? conn->state : TCP_CLOSED;
}

/* Calculate TCP checksum with pseudo-header */
u16 tcp_checksum(u32 src_ip, u32 dst_ip, const TcpHeader* tcp, u32 len) {
    u32 sum = 0;

    /* Pseudo-header */
    sum += (src_ip >> 16) & 0xFFFF;
    sum += src_ip & 0xFFFF;
    sum += (dst_ip >> 16) & 0xFFFF;
    sum += dst_ip & 0xFFFF;
    sum += htons(IP_PROTO_TCP);
    sum += htons(len);

    /* TCP header + data */
    const u16* ptr = (const u16*)tcp;
    u32 remaining = len;

    while (remaining > 1) {
        sum += *ptr++;
        remaining -= 2;
    }

    if (remaining == 1) {
        sum += *(const u8*)ptr;
    }

    /* Fold to 16 bits */
    while (sum >> 16) {
        sum = (sum & 0xFFFF) + (sum >> 16);
    }

    return ~sum;
}

/* Process incoming TCP packet */
void tcp_receive(u32 src_ip, const void* packet, u32 len) {
    if (len < sizeof(TcpHeader)) return;

    const TcpHeader* tcp = (const TcpHeader*)packet;
    u16 src_port = ntohs(tcp->src_port);
    u16 dst_port = ntohs(tcp->dst_port);

    /* Find matching connection */
    IpConfig* ip_cfg = ip_get_config();
    TcpConnection* conn = tcp_find_connection(ip_cfg->ip_addr, dst_port,
                                               src_ip, src_port);

    if (!conn) return;

    u32 seq = ntohl(tcp->seq_num);
    u32 ack = ntohl(tcp->ack_num);
    u8 flags = tcp->flags;
    u32 header_len = ((tcp->data_offset >> 4) & 0xF) * 4;
    u32 data_len = len - header_len;

    switch (conn->state) {
        case TCP_SYN_SENT:
            /* Expecting SYN-ACK */
            if ((flags & (TCP_FLAG_SYN | TCP_FLAG_ACK)) ==
                (TCP_FLAG_SYN | TCP_FLAG_ACK)) {
                conn->remote_seq = seq + 1;
                conn->ack_num = seq + 1;
                conn->remote_window = ntohs(tcp->window);

                /* Send ACK */
                tcp_send_segment(conn, TCP_FLAG_ACK, NULL, 0);
                conn->state = TCP_ESTABLISHED;
            }
            break;

        case TCP_ESTABLISHED:
            /* Handle incoming data */
            if (flags & TCP_FLAG_ACK) {
                /* Update our understanding of what's been received */
            }

            if (data_len > 0) {
                /* Copy data to receive buffer */
                const u8* data = (const u8*)packet + header_len;
                u32 space = conn->rx_capacity - conn->rx_len;
                u32 to_copy = (data_len < space) ? data_len : space;

                memcpy(conn->rx_buffer + conn->rx_len, data, to_copy);
                conn->rx_len += to_copy;

                /* ACK the data */
                conn->ack_num = seq + data_len;
                tcp_send_segment(conn, TCP_FLAG_ACK, NULL, 0);
            }

            if (flags & TCP_FLAG_FIN) {
                /* Remote is closing */
                conn->ack_num = seq + 1;
                tcp_send_segment(conn, TCP_FLAG_ACK | TCP_FLAG_FIN, NULL, 0);
                conn->state = TCP_CLOSE_WAIT;
            }
            break;

        case TCP_FIN_WAIT_1:
            if (flags & TCP_FLAG_ACK) {
                conn->state = TCP_FIN_WAIT_2;
            }
            if (flags & TCP_FLAG_FIN) {
                conn->ack_num = seq + 1;
                tcp_send_segment(conn, TCP_FLAG_ACK, NULL, 0);
                conn->state = TCP_TIME_WAIT;
            }
            break;

        default:
            break;
    }

    conn->last_activity = pit_get_uptime_ms();
}

/* Poll TCP connections */
void tcp_poll(void) {
    /* Check for incoming packets via IP layer */
    /* This would be called from main loop */

    /* Handle timeouts and retransmits */
    u64 now = pit_get_uptime_ms();
    for (int i = 0; i < TCP_MAX_CONNECTIONS; i++) {
        TcpConnection* conn = &connections[i];
        if (conn->state == TCP_CLOSED) continue;

        /* Time-wait cleanup */
        if (conn->state == TCP_TIME_WAIT) {
            if (now - conn->last_activity > 2000) {
                tcp_close(conn);
            }
        }
    }
}
