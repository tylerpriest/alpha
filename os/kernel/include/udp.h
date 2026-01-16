/*
 * AlphaOS - UDP Implementation
 *
 * User Datagram Protocol for connectionless messaging (DHCP, DNS).
 */

#ifndef _UDP_H
#define _UDP_H

#include "types.h"

/* UDP header (8 bytes) */
typedef struct {
    u16 src_port;
    u16 dst_port;
    u16 length;
    u16 checksum;
} __attribute__((packed)) UdpHeader;

/* Initialize UDP subsystem */
void udp_init(void);

/* Send UDP datagram */
int udp_send(u32 dst_ip, u16 src_port, u16 dst_port,
             const void* data, u32 len);

/* Process received UDP packet */
void udp_receive(u32 src_ip, const void* packet, u32 len);

/* Calculate UDP checksum with pseudo-header */
u16 udp_checksum(u32 src_ip, u32 dst_ip, const UdpHeader* udp, u32 len);

/* Register UDP port handler */
typedef void (*UdpHandler)(u32 src_ip, u16 src_port, u16 dst_port,
                           const void* data, u32 len);
void udp_register_handler(u16 port, UdpHandler handler);

#endif /* _UDP_H */
