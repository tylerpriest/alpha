/*
 * AlphaOS - DNS Client Implementation
 *
 * Simple DNS resolver for A records (IPv4 addresses).
 */

#include "dns.h"
#include "udp.h"
#include "ip.h"
#include "ethernet.h"
#include "pit.h"
#include "console.h"
#include "string.h"

/* DNS timeout */
#define DNS_TIMEOUT_MS  5000

/* Current query state */
static struct {
    u16 query_id;
    bool pending;
    bool complete;
    u32 resolved_ip;
} dns_state;

/* DNS response handler */
static void dns_receive(u32 src_ip, u16 src_port, u16 dst_port,
                        const void* data, u32 len);

/* Initialize DNS client */
void dns_init(void) {
    memset(&dns_state, 0, sizeof(dns_state));
    dns_state.query_id = pit_get_ticks() & 0xFFFF;

    /* Register UDP handler for DNS responses */
    udp_register_handler(DNS_PORT, dns_receive);

    console_printf("  DNS: Client initialized\n");
}

/* Encode hostname into DNS name format */
static int dns_encode_name(const char* hostname, u8* buffer) {
    u8* label_len = buffer;
    u8* p = buffer + 1;
    const char* src = hostname;

    *label_len = 0;

    while (*src) {
        if (*src == '.') {
            label_len = p;
            *label_len = 0;
            p++;
        } else {
            *p++ = *src;
            (*label_len)++;
        }
        src++;
    }

    *p++ = 0;  /* Root label */
    return p - buffer;
}

/* Build DNS query */
static int dns_build_query(const char* hostname, u8* buffer, u32 max_len) {
    if (max_len < sizeof(DnsHeader) + 256 + 4) return -1;

    DnsHeader* hdr = (DnsHeader*)buffer;
    hdr->id = htons(dns_state.query_id);
    hdr->flags = htons(DNS_FLAG_RD);  /* Recursion desired */
    hdr->qdcount = htons(1);
    hdr->ancount = 0;
    hdr->nscount = 0;
    hdr->arcount = 0;

    /* Encode hostname */
    u8* qname = buffer + sizeof(DnsHeader);
    int name_len = dns_encode_name(hostname, qname);

    /* Add question type and class */
    u8* qtype = qname + name_len;
    qtype[0] = 0;
    qtype[1] = DNS_TYPE_A;    /* A record */
    qtype[2] = 0;
    qtype[3] = DNS_CLASS_IN;  /* Internet */

    return sizeof(DnsHeader) + name_len + 4;
}

/* Parse DNS response */
static int dns_parse_response(const void* data, u32 len, u32* ip_out) {
    if (len < sizeof(DnsHeader)) return -1;

    const DnsHeader* hdr = (const DnsHeader*)data;

    /* Verify response */
    if (ntohs(hdr->id) != dns_state.query_id) return -2;
    if (!(ntohs(hdr->flags) & DNS_FLAG_QR)) return -3;  /* Not a response */

    u16 ancount = ntohs(hdr->ancount);
    if (ancount == 0) return -4;  /* No answers */

    /* Skip question section */
    const u8* ptr = (const u8*)data + sizeof(DnsHeader);
    const u8* end = (const u8*)data + len;

    /* Skip QNAME */
    while (ptr < end && *ptr != 0) {
        if ((*ptr & 0xC0) == 0xC0) {
            ptr += 2;  /* Compression pointer */
            break;
        }
        ptr += *ptr + 1;
    }
    if (*ptr == 0) ptr++;  /* Skip null terminator */

    ptr += 4;  /* Skip QTYPE and QCLASS */

    /* Parse answer section */
    for (u16 i = 0; i < ancount && ptr < end; i++) {
        /* Skip NAME (might be compressed) */
        if ((*ptr & 0xC0) == 0xC0) {
            ptr += 2;  /* Compression pointer */
        } else {
            while (ptr < end && *ptr != 0) {
                ptr += *ptr + 1;
            }
            ptr++;  /* Skip null terminator */
        }

        if (ptr + 10 > end) break;

        u16 rtype = (ptr[0] << 8) | ptr[1];
        u16 rclass = (ptr[2] << 8) | ptr[3];
        /* u32 ttl = (ptr[4] << 24) | (ptr[5] << 16) | (ptr[6] << 8) | ptr[7]; */
        u16 rdlen = (ptr[8] << 8) | ptr[9];
        ptr += 10;

        if (ptr + rdlen > end) break;

        /* Check for A record */
        if (rtype == DNS_TYPE_A && rclass == DNS_CLASS_IN && rdlen == 4) {
            *ip_out = ((u32)ptr[0] << 24) | ((u32)ptr[1] << 16) |
                      ((u32)ptr[2] << 8) | ptr[3];
            return 0;
        }

        ptr += rdlen;
    }

    return -5;  /* No A record found */
}

/* DNS response handler */
static void dns_receive(u32 src_ip, u16 src_port, u16 dst_port,
                        const void* data, u32 len) {
    (void)src_ip;
    (void)src_port;
    (void)dst_port;

    if (!dns_state.pending) return;

    u32 resolved_ip = 0;
    if (dns_parse_response(data, len, &resolved_ip) == 0) {
        dns_state.resolved_ip = resolved_ip;
        dns_state.complete = true;
        dns_state.pending = false;
    }
}

/* Start non-blocking DNS resolve */
int dns_resolve_start(const char* hostname) {
    IpConfig* cfg = ip_get_config();
    if (!cfg->configured || cfg->dns_server == 0) {
        console_printf("  DNS: No DNS server configured\n");
        return -1;
    }

    /* Build query */
    static u8 query[512] __attribute__((aligned(64)));
    int query_len = dns_build_query(hostname, query, sizeof(query));
    if (query_len < 0) return -2;

    /* Reset state */
    dns_state.query_id++;
    dns_state.pending = true;
    dns_state.complete = false;
    dns_state.resolved_ip = 0;

    /* Update query ID in packet */
    DnsHeader* hdr = (DnsHeader*)query;
    hdr->id = htons(dns_state.query_id);

    /* Send query to DNS server */
    console_printf("  DNS: Resolving %s...\n", hostname);
    return udp_send(cfg->dns_server, DNS_PORT, DNS_PORT, query, query_len);
}

/* Check non-blocking DNS resolve */
int dns_resolve_check(u32* ip_addr) {
    if (!dns_state.pending && !dns_state.complete) {
        return -1;  /* No query in progress */
    }

    if (dns_state.complete) {
        *ip_addr = dns_state.resolved_ip;
        return 0;
    }

    return -2;  /* Still pending */
}

/* Blocking DNS resolve */
int dns_resolve(const char* hostname, u32* ip_addr) {
    if (dns_resolve_start(hostname) != 0) {
        return -1;
    }

    u64 start = pit_get_uptime_ms();
    while (pit_get_uptime_ms() - start < DNS_TIMEOUT_MS) {
        eth_poll();

        if (dns_resolve_check(ip_addr) == 0) {
            char ip_str[16];
            ip_format(*ip_addr, ip_str);
            console_printf("  DNS: Resolved to %s\n", ip_str);
            return 0;
        }

        pit_sleep_ms(50);
    }

    console_printf("  DNS: Resolution timeout for %s\n", hostname);
    dns_state.pending = false;
    return -2;
}
