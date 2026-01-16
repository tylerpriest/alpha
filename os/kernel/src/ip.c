/*
 * AlphaOS - IPv4 Implementation
 *
 * Minimal IP stack for TCP/IP connectivity.
 */

#include "ip.h"
#include "tcp.h"
#include "udp.h"
#include "arp.h"
#include "ethernet.h"
#include "console.h"
#include "string.h"

/* IP configuration */
static IpConfig ip_config;

/* Packet identification counter */
static u16 ip_ident = 0;

/* Initialize IP subsystem */
void ip_init(void) {
    memset(&ip_config, 0, sizeof(ip_config));
    ip_config.configured = false;
    console_printf("  IP: Subsystem initialized\n");
}

/* Get IP configuration */
IpConfig* ip_get_config(void) {
    return &ip_config;
}

/* Set IP configuration */
void ip_set_config(u32 ip, u32 netmask, u32 gateway, u32 dns) {
    ip_config.ip_addr = ip;
    ip_config.netmask = netmask;
    ip_config.gateway = gateway;
    ip_config.dns_server = dns;
    ip_config.configured = true;

    char buf[16];
    ip_format(ip, buf);
    console_printf("  IP: Configured - %s\n", buf);
}

/* Create IP address from bytes */
u32 ip_addr(u8 a, u8 b, u8 c, u8 d) {
    return ((u32)a << 24) | ((u32)b << 16) | ((u32)c << 8) | d;
}

/* Format IP address as string */
void ip_format(u32 ip, char* buffer) {
    u8 a = (ip >> 24) & 0xFF;
    u8 b = (ip >> 16) & 0xFF;
    u8 c = (ip >> 8) & 0xFF;
    u8 d = ip & 0xFF;

    /* Simple integer to string */
    char* p = buffer;
    for (int i = 0; i < 4; i++) {
        u8 val = (i == 0) ? a : (i == 1) ? b : (i == 2) ? c : d;

        if (val >= 100) {
            *p++ = '0' + val / 100;
            val %= 100;
            *p++ = '0' + val / 10;
            val %= 10;
        } else if (val >= 10) {
            *p++ = '0' + val / 10;
            val %= 10;
        }
        *p++ = '0' + val;

        if (i < 3) *p++ = '.';
    }
    *p = '\0';
}

/* Check if IP is in our subnet */
bool ip_in_subnet(u32 ip) {
    if (!ip_config.configured) return false;
    return (ip & ip_config.netmask) == (ip_config.ip_addr & ip_config.netmask);
}

/* Calculate IP/ICMP checksum */
u16 ip_checksum(const void* data, u32 len) {
    const u16* ptr = (const u16*)data;
    u32 sum = 0;

    while (len > 1) {
        sum += *ptr++;
        len -= 2;
    }

    /* Add odd byte if present */
    if (len == 1) {
        sum += *(const u8*)ptr;
    }

    /* Fold 32-bit sum to 16 bits */
    while (sum >> 16) {
        sum = (sum & 0xFFFF) + (sum >> 16);
    }

    return ~sum;
}

/* Resolve IP to MAC via ARP */
int ip_resolve_mac(u32 ip, u8* mac) {
    return arp_resolve(ip, mac);
}

/* Send IP packet */
int ip_send(u32 dst_ip, u8 protocol, const void* data, u32 len) {
    if (!ip_config.configured) return -1;

    EthDevice* eth = eth_get_device();
    if (!eth) return -2;

    /* Build IP packet */
    static u8 packet[ETH_MTU + sizeof(IpHeader)] __attribute__((aligned(64)));
    IpHeader* ip = (IpHeader*)packet;

    ip->version_ihl = (IP_VERSION_4 << 4) | 5;  /* IPv4, 20-byte header */
    ip->tos = 0;
    ip->total_length = htons(sizeof(IpHeader) + len);
    ip->identification = htons(ip_ident++);
    ip->flags_fragment = htons(IP_FLAG_DF);  /* Don't fragment */
    ip->ttl = IP_DEFAULT_TTL;
    ip->protocol = protocol;
    ip->checksum = 0;
    ip->src_addr = htonl(ip_config.ip_addr);
    ip->dst_addr = htonl(dst_ip);

    /* Calculate header checksum */
    ip->checksum = ip_checksum(ip, sizeof(IpHeader));

    /* Copy payload */
    memcpy(packet + sizeof(IpHeader), data, len);

    /* Get destination MAC */
    u8 dst_mac[ETH_ALEN];
    if (ip_in_subnet(dst_ip)) {
        /* Direct delivery - resolve destination IP */
        ip_resolve_mac(dst_ip, dst_mac);
    } else {
        /* Via gateway */
        ip_resolve_mac(ip_config.gateway, dst_mac);
    }

    /* Send via Ethernet */
    return eth_send(dst_mac, ETH_TYPE_IPV4, packet, sizeof(IpHeader) + len);
}

/* Process received IP packet */
void ip_receive(const void* packet, u32 len) {
    if (len < sizeof(IpHeader)) return;

    IpHeader* ip = (IpHeader*)packet;

    /* Verify version */
    if ((ip->version_ihl >> 4) != IP_VERSION_4) return;

    /* Get header length */
    u32 ihl = (ip->version_ihl & 0x0F) * 4;
    if (ihl < 20 || len < ihl) return;

    /* Verify checksum */
    if (ip_checksum(ip, ihl) != 0) return;

    /* Check if packet is for us */
    u32 dst_ip = ntohl(ip->dst_addr);
    if (dst_ip != ip_config.ip_addr &&
        dst_ip != 0xFFFFFFFF) {  /* Not broadcast */
        return;
    }

    /* Get payload */
    const u8* payload = (const u8*)packet + ihl;
    u32 payload_len = ntohs(ip->total_length) - ihl;

    /* Handle by protocol */
    switch (ip->protocol) {
        case IP_PROTO_ICMP:
            /* Handle ICMP (ping) */
            if (payload_len >= sizeof(IcmpHeader)) {
                IcmpHeader* icmp = (IcmpHeader*)payload;
                if (icmp->type == ICMP_ECHO_REQUEST) {
                    /* Send echo reply */
                    /* TODO: Implement ping reply */
                }
            }
            break;

        case IP_PROTO_TCP:
            /* Handle TCP */
            tcp_receive(ntohl(ip->src_addr), payload, payload_len);
            break;

        case IP_PROTO_UDP:
            /* Handle UDP (DHCP, DNS) */
            udp_receive(ntohl(ip->src_addr), payload, payload_len);
            break;
    }
}

/* Send ICMP echo request (ping) */
int ip_ping(u32 dst_ip) {
    static u16 seq = 0;

    IcmpHeader icmp;
    icmp.type = ICMP_ECHO_REQUEST;
    icmp.code = 0;
    icmp.checksum = 0;
    icmp.identifier = htons(0x1234);
    icmp.sequence = htons(seq++);

    /* Calculate ICMP checksum */
    icmp.checksum = ip_checksum(&icmp, sizeof(icmp));

    char buf[16];
    ip_format(dst_ip, buf);
    console_printf("  IP: Ping %s\n", buf);

    return ip_send(dst_ip, IP_PROTO_ICMP, &icmp, sizeof(icmp));
}
