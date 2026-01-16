/*
 * AlphaOS - Ethernet Driver Interface
 *
 * Research Summary:
 * - IEEE 802.3 Ethernet standard
 * - Frame format: 14-byte header + payload + 4-byte FCS
 * - MTU typically 1500 bytes
 */

#ifndef _ETHERNET_H
#define _ETHERNET_H

#include "types.h"

/* Ethernet constants */
#define ETH_ALEN        6       /* MAC address length */
#define ETH_HEADER_LEN  14      /* Ethernet header size */
#define ETH_MTU         1500    /* Maximum Transmission Unit */
#define ETH_MAX_FRAME   1518    /* Max frame size (header + MTU + FCS) */

/* Ethertype values */
#define ETH_TYPE_IPV4   0x0800
#define ETH_TYPE_ARP    0x0806
#define ETH_TYPE_IPV6   0x86DD

/* Ethernet header */
typedef struct {
    u8  dst_mac[ETH_ALEN];
    u8  src_mac[ETH_ALEN];
    u16 ethertype;          /* Network byte order (big endian) */
} __attribute__((packed)) EthHeader;

/* Ethernet device interface */
typedef struct EthDevice {
    u8  mac_address[ETH_ALEN];
    u16 mtu;
    bool link_up;

    /* Driver-specific data */
    void* driver_data;

    /* Driver callbacks */
    int (*send)(struct EthDevice* dev, const void* data, u32 len);
    int (*recv)(struct EthDevice* dev, void* buffer, u32 max_len);
    int (*poll)(struct EthDevice* dev);
} EthDevice;

/* Get global Ethernet device */
EthDevice* eth_get_device(void);

/* Set active Ethernet device */
void eth_set_device(EthDevice* dev);

/* Send Ethernet frame */
int eth_send(const u8* dst_mac, u16 ethertype, const void* data, u32 len);

/* Receive Ethernet frame (non-blocking) */
int eth_recv(void* buffer, u32 max_len);

/* Poll for incoming frames */
void eth_poll(void);

/* Process received Ethernet frame and dispatch to protocol handler */
void eth_process_frame(const void* frame, u32 len);

/* Format MAC address as string */
void eth_format_mac(const u8* mac, char* buffer);

/* Compare MAC addresses */
bool eth_mac_equal(const u8* mac1, const u8* mac2);

/* Broadcast MAC address (FF:FF:FF:FF:FF:FF) */
extern const u8 ETH_BROADCAST_MAC[ETH_ALEN];

/* Host to network byte order (big endian) */
static inline u16 htons(u16 x) {
    return ((x >> 8) & 0xFF) | ((x << 8) & 0xFF00);
}

static inline u16 ntohs(u16 x) {
    return htons(x);
}

static inline u32 htonl(u32 x) {
    return ((x >> 24) & 0xFF) |
           ((x >> 8) & 0xFF00) |
           ((x << 8) & 0xFF0000) |
           ((x << 24) & 0xFF000000);
}

static inline u32 ntohl(u32 x) {
    return htonl(x);
}

#endif /* _ETHERNET_H */
