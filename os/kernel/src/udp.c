/*
 * AlphaOS - UDP Implementation
 *
 * User Datagram Protocol for connectionless messaging.
 */

#include "udp.h"
#include "ip.h"
#include "ethernet.h"
#include "console.h"
#include "string.h"

/* Maximum registered handlers */
#define UDP_MAX_HANDLERS 8

/* Port handler entry */
typedef struct {
    u16 port;
    UdpHandler handler;
} UdpPortHandler;

/* Handler table */
static UdpPortHandler handlers[UDP_MAX_HANDLERS];

/* Initialize UDP subsystem */
void udp_init(void) {
    memset(handlers, 0, sizeof(handlers));
    console_printf("  UDP: Subsystem initialized\n");
}

/* Register UDP port handler */
void udp_register_handler(u16 port, UdpHandler handler) {
    for (int i = 0; i < UDP_MAX_HANDLERS; i++) {
        if (handlers[i].port == 0) {
            handlers[i].port = port;
            handlers[i].handler = handler;
            return;
        }
    }
}

/* Find handler for port */
static UdpHandler udp_find_handler(u16 port) {
    for (int i = 0; i < UDP_MAX_HANDLERS; i++) {
        if (handlers[i].port == port && handlers[i].handler) {
            return handlers[i].handler;
        }
    }
    return NULL;
}

/* Calculate UDP checksum with pseudo-header */
u16 udp_checksum(u32 src_ip, u32 dst_ip, const UdpHeader* udp, u32 len) {
    u32 sum = 0;

    /* Pseudo-header */
    sum += (src_ip >> 16) & 0xFFFF;
    sum += src_ip & 0xFFFF;
    sum += (dst_ip >> 16) & 0xFFFF;
    sum += dst_ip & 0xFFFF;
    sum += htons(IP_PROTO_UDP);
    sum += htons(len);

    /* UDP header + data */
    const u16* ptr = (const u16*)udp;
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

    return ~sum ? ~sum : 0xFFFF;  /* 0 means no checksum */
}

/* Send UDP datagram */
int udp_send(u32 dst_ip, u16 src_port, u16 dst_port,
             const void* data, u32 len) {
    IpConfig* cfg = ip_get_config();
    if (!cfg->configured && dst_ip != 0xFFFFFFFF) return -1;

    /* Build UDP packet */
    static u8 packet[ETH_MTU] __attribute__((aligned(64)));
    UdpHeader* udp = (UdpHeader*)packet;

    u32 total_len = sizeof(UdpHeader) + len;
    if (total_len > ETH_MTU) return -2;

    udp->src_port = htons(src_port);
    udp->dst_port = htons(dst_port);
    udp->length = htons(total_len);
    udp->checksum = 0;

    /* Copy data */
    if (data && len > 0) {
        memcpy(packet + sizeof(UdpHeader), data, len);
    }

    /* Calculate checksum */
    u32 src_ip_net = cfg->configured ? cfg->ip_addr : 0;
    udp->checksum = udp_checksum(src_ip_net, dst_ip, udp, total_len);

    /* Send via IP */
    return ip_send(dst_ip, IP_PROTO_UDP, packet, total_len);
}

/* Process received UDP packet */
void udp_receive(u32 src_ip, const void* packet, u32 len) {
    if (len < sizeof(UdpHeader)) return;

    const UdpHeader* udp = (const UdpHeader*)packet;
    u16 src_port = ntohs(udp->src_port);
    u16 dst_port = ntohs(udp->dst_port);
    u16 udp_len = ntohs(udp->length);

    if (udp_len < sizeof(UdpHeader) || udp_len > len) return;

    /* Find handler for this port */
    UdpHandler handler = udp_find_handler(dst_port);
    if (handler) {
        const u8* data = (const u8*)packet + sizeof(UdpHeader);
        u32 data_len = udp_len - sizeof(UdpHeader);
        handler(src_ip, src_port, dst_port, data, data_len);
    }
}
