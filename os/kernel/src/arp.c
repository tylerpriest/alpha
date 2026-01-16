/*
 * AlphaOS - ARP Implementation
 *
 * Address Resolution Protocol for mapping IPv4 to MAC addresses.
 */

#include "arp.h"
#include "ip.h"
#include "ethernet.h"
#include "pit.h"
#include "console.h"
#include "string.h"

/* ARP cache size */
#define ARP_CACHE_SIZE 32

/* ARP timeout in milliseconds */
#define ARP_REQUEST_TIMEOUT 3000
#define ARP_CACHE_TIMEOUT   300000  /* 5 minutes */

/* ARP cache */
static ArpEntry arp_cache[ARP_CACHE_SIZE];

/* Initialize ARP subsystem */
void arp_init(void) {
    memset(arp_cache, 0, sizeof(arp_cache));
    console_printf("  ARP: Subsystem initialized\n");
}

/* Find entry in cache */
static ArpEntry* arp_find_entry(u32 ip) {
    for (int i = 0; i < ARP_CACHE_SIZE; i++) {
        if (arp_cache[i].valid && arp_cache[i].ip_addr == ip) {
            return &arp_cache[i];
        }
    }
    return NULL;
}

/* Find free or oldest entry */
static ArpEntry* arp_alloc_entry(void) {
    ArpEntry* oldest = &arp_cache[0];
    u64 oldest_time = arp_cache[0].timestamp;

    for (int i = 0; i < ARP_CACHE_SIZE; i++) {
        if (!arp_cache[i].valid) {
            return &arp_cache[i];
        }
        if (arp_cache[i].timestamp < oldest_time) {
            oldest = &arp_cache[i];
            oldest_time = arp_cache[i].timestamp;
        }
    }

    return oldest;  /* Replace oldest */
}

/* Add entry to ARP cache */
void arp_add_entry(u32 ip, const u8* mac) {
    ArpEntry* entry = arp_find_entry(ip);
    if (!entry) {
        entry = arp_alloc_entry();
    }

    entry->ip_addr = ip;
    memcpy(entry->mac_addr, mac, 6);
    entry->timestamp = pit_get_uptime_ms();
    entry->valid = true;
}

/* Lookup in ARP cache (non-blocking) */
bool arp_lookup(u32 ip, u8* mac) {
    ArpEntry* entry = arp_find_entry(ip);
    if (entry) {
        /* Check if entry is still fresh */
        if (pit_get_uptime_ms() - entry->timestamp < ARP_CACHE_TIMEOUT) {
            memcpy(mac, entry->mac_addr, 6);
            return true;
        }
        /* Entry expired */
        entry->valid = false;
    }
    return false;
}

/* Send ARP request */
int arp_send_request(u32 target_ip) {
    IpConfig* cfg = ip_get_config();
    if (!cfg->configured) return -1;

    EthDevice* eth = eth_get_device();
    if (!eth) return -2;

    ArpPacket arp;
    arp.hw_type = htons(ARP_HW_ETHERNET);
    arp.proto_type = htons(ETH_TYPE_IPV4);
    arp.hw_len = 6;
    arp.proto_len = 4;
    arp.operation = htons(ARP_OP_REQUEST);

    /* Sender is us */
    memcpy(arp.sender_mac, eth->mac_address, 6);
    arp.sender_ip = htonl(cfg->ip_addr);

    /* Target MAC is unknown (set to zeros) */
    memset(arp.target_mac, 0, 6);
    arp.target_ip = htonl(target_ip);

    /* Send to broadcast */
    return eth_send(ETH_BROADCAST_MAC, ETH_TYPE_ARP, &arp, sizeof(arp));
}

/* Send ARP reply */
int arp_send_reply(u32 target_ip, const u8* target_mac) {
    IpConfig* cfg = ip_get_config();
    if (!cfg->configured) return -1;

    EthDevice* eth = eth_get_device();
    if (!eth) return -2;

    ArpPacket arp;
    arp.hw_type = htons(ARP_HW_ETHERNET);
    arp.proto_type = htons(ETH_TYPE_IPV4);
    arp.hw_len = 6;
    arp.proto_len = 4;
    arp.operation = htons(ARP_OP_REPLY);

    /* Sender is us */
    memcpy(arp.sender_mac, eth->mac_address, 6);
    arp.sender_ip = htonl(cfg->ip_addr);

    /* Target is who asked */
    memcpy(arp.target_mac, target_mac, 6);
    arp.target_ip = htonl(target_ip);

    /* Send directly to requestor */
    return eth_send(target_mac, ETH_TYPE_ARP, &arp, sizeof(arp));
}

/* Resolve IP to MAC (may block for ARP request) */
int arp_resolve(u32 ip, u8* mac) {
    /* Check cache first */
    if (arp_lookup(ip, mac)) {
        return 0;
    }

    /* Send ARP request */
    if (arp_send_request(ip) != 0) {
        return -1;
    }

    /* Wait for reply */
    u64 start = pit_get_uptime_ms();
    while (pit_get_uptime_ms() - start < ARP_REQUEST_TIMEOUT) {
        /* Poll for incoming ARP replies */
        eth_poll();

        /* Check if we got a reply */
        if (arp_lookup(ip, mac)) {
            return 0;
        }

        pit_sleep_ms(10);
    }

    char ip_str[16];
    ip_format(ip, ip_str);
    console_printf("  ARP: Timeout resolving %s\n", ip_str);
    return -2;
}

/* Process received ARP packet */
void arp_receive(const void* packet, u32 len) {
    if (len < sizeof(ArpPacket)) return;

    const ArpPacket* arp = (const ArpPacket*)packet;

    /* Verify it's Ethernet/IPv4 */
    if (ntohs(arp->hw_type) != ARP_HW_ETHERNET ||
        ntohs(arp->proto_type) != ETH_TYPE_IPV4) {
        return;
    }

    u32 sender_ip = ntohl(arp->sender_ip);
    u32 target_ip = ntohl(arp->target_ip);

    /* Add sender to cache (we learned something!) */
    arp_add_entry(sender_ip, arp->sender_mac);

    IpConfig* cfg = ip_get_config();
    if (!cfg->configured) return;

    u16 op = ntohs(arp->operation);

    switch (op) {
        case ARP_OP_REQUEST:
            /* Someone is looking for us? */
            if (target_ip == cfg->ip_addr) {
                arp_send_reply(sender_ip, arp->sender_mac);
            }
            break;

        case ARP_OP_REPLY:
            /* Already added to cache above */
            break;
    }
}
