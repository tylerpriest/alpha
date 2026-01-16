/*
 * AlphaOS - IPv4 Implementation
 *
 * Research Summary:
 * - RFC 791: Internet Protocol
 * - RFC 792: ICMP (Internet Control Message Protocol)
 */

#ifndef _IP_H
#define _IP_H

#include "types.h"
#include "ethernet.h"

/* IP version */
#define IP_VERSION_4    4

/* IP protocols */
#define IP_PROTO_ICMP   1
#define IP_PROTO_TCP    6
#define IP_PROTO_UDP    17

/* IP header flags */
#define IP_FLAG_DF      0x4000  /* Don't Fragment */
#define IP_FLAG_MF      0x2000  /* More Fragments */

/* Default TTL */
#define IP_DEFAULT_TTL  64

/* IP header (20 bytes minimum) */
typedef struct {
    u8  version_ihl;        /* Version (4 bits) + IHL (4 bits) */
    u8  tos;                /* Type of Service */
    u16 total_length;       /* Total length in bytes */
    u16 identification;     /* Fragment identification */
    u16 flags_fragment;     /* Flags (3 bits) + Fragment offset (13 bits) */
    u8  ttl;                /* Time To Live */
    u8  protocol;           /* Protocol (ICMP=1, TCP=6, UDP=17) */
    u16 checksum;           /* Header checksum */
    u32 src_addr;           /* Source IP address */
    u32 dst_addr;           /* Destination IP address */
} __attribute__((packed)) IpHeader;

/* ICMP header */
typedef struct {
    u8  type;
    u8  code;
    u16 checksum;
    u16 identifier;
    u16 sequence;
} __attribute__((packed)) IcmpHeader;

/* ICMP types */
#define ICMP_ECHO_REPLY     0
#define ICMP_ECHO_REQUEST   8

/* IP configuration */
typedef struct {
    u32 ip_addr;            /* Our IP address */
    u32 netmask;            /* Subnet mask */
    u32 gateway;            /* Default gateway */
    u32 dns_server;         /* DNS server */
    bool configured;
} IpConfig;

/* Initialize IP subsystem */
void ip_init(void);

/* Get/set IP configuration */
IpConfig* ip_get_config(void);
void ip_set_config(u32 ip, u32 netmask, u32 gateway, u32 dns);

/* Send IP packet */
int ip_send(u32 dst_ip, u8 protocol, const void* data, u32 len);

/* Process received IP packet */
void ip_receive(const void* packet, u32 len);

/* Send ICMP echo (ping) */
int ip_ping(u32 dst_ip);

/* Calculate IP checksum */
u16 ip_checksum(const void* data, u32 len);

/* IP address helpers */
u32 ip_addr(u8 a, u8 b, u8 c, u8 d);
void ip_format(u32 ip, char* buffer);

/* Check if IP is in our subnet */
bool ip_in_subnet(u32 ip);

/* Get destination MAC for IP (via ARP) */
int ip_resolve_mac(u32 ip, u8* mac);

#endif /* _IP_H */
