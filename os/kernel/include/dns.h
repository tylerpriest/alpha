/*
 * AlphaOS - DNS Client
 *
 * Domain Name System for hostname resolution.
 * RFC 1035: DNS
 */

#ifndef _DNS_H
#define _DNS_H

#include "types.h"

/* DNS ports */
#define DNS_PORT    53

/* DNS record types */
#define DNS_TYPE_A      1   /* IPv4 address */
#define DNS_TYPE_CNAME  5   /* Canonical name */
#define DNS_TYPE_AAAA   28  /* IPv6 address */

/* DNS classes */
#define DNS_CLASS_IN    1   /* Internet */

/* DNS header flags */
#define DNS_FLAG_QR     0x8000  /* Query/Response */
#define DNS_FLAG_RD     0x0100  /* Recursion Desired */
#define DNS_FLAG_RA     0x0080  /* Recursion Available */

/* DNS header (12 bytes) */
typedef struct {
    u16 id;             /* Transaction ID */
    u16 flags;          /* Flags */
    u16 qdcount;        /* Number of questions */
    u16 ancount;        /* Number of answers */
    u16 nscount;        /* Number of authority records */
    u16 arcount;        /* Number of additional records */
} __attribute__((packed)) DnsHeader;

/* Initialize DNS client */
void dns_init(void);

/* Resolve hostname to IPv4 address */
int dns_resolve(const char* hostname, u32* ip_addr);

/* Non-blocking resolve (returns -EAGAIN if pending) */
int dns_resolve_start(const char* hostname);
int dns_resolve_check(u32* ip_addr);

#endif /* _DNS_H */
