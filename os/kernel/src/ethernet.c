/*
 * AlphaOS - Ethernet Interface Implementation
 */

#include "ethernet.h"
#include "ip.h"
#include "arp.h"
#include "string.h"

/* Broadcast MAC address */
const u8 ETH_BROADCAST_MAC[ETH_ALEN] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

/* Active Ethernet device */
static EthDevice* active_device = NULL;

/* Get global Ethernet device */
EthDevice* eth_get_device(void) {
    return active_device;
}

/* Set active Ethernet device */
void eth_set_device(EthDevice* dev) {
    active_device = dev;
}

/* Send Ethernet frame */
int eth_send(const u8* dst_mac, u16 ethertype, const void* data, u32 len) {
    if (!active_device || !active_device->send) return -1;
    if (!active_device->link_up) return -2;
    if (len > ETH_MTU) return -3;

    /* Build frame in temporary buffer */
    static u8 frame[ETH_MAX_FRAME] __attribute__((aligned(64)));
    EthHeader* hdr = (EthHeader*)frame;

    /* Set destination and source MAC */
    memcpy(hdr->dst_mac, dst_mac, ETH_ALEN);
    memcpy(hdr->src_mac, active_device->mac_address, ETH_ALEN);
    hdr->ethertype = htons(ethertype);

    /* Copy payload */
    memcpy(frame + ETH_HEADER_LEN, data, len);

    /* Send via driver */
    return active_device->send(active_device, frame, ETH_HEADER_LEN + len);
}

/* Receive Ethernet frame (non-blocking) */
int eth_recv(void* buffer, u32 max_len) {
    if (!active_device || !active_device->recv) return -1;
    return active_device->recv(active_device, buffer, max_len);
}

/* Poll for incoming frames */
void eth_poll(void) {
    if (active_device && active_device->poll) {
        active_device->poll(active_device);
    }
}

/* Format MAC address as string */
void eth_format_mac(const u8* mac, char* buffer) {
    static const char hex[] = "0123456789ABCDEF";
    for (int i = 0; i < 6; i++) {
        buffer[i * 3] = hex[(mac[i] >> 4) & 0xF];
        buffer[i * 3 + 1] = hex[mac[i] & 0xF];
        buffer[i * 3 + 2] = (i < 5) ? ':' : '\0';
    }
}

/* Compare MAC addresses */
bool eth_mac_equal(const u8* mac1, const u8* mac2) {
    return memcmp(mac1, mac2, ETH_ALEN) == 0;
}

/* Process received Ethernet frame and dispatch to protocol handler */
void eth_process_frame(const void* frame, u32 len) {
    if (len < ETH_HEADER_LEN) return;

    const EthHeader* hdr = (const EthHeader*)frame;
    const u8* payload = (const u8*)frame + ETH_HEADER_LEN;
    u32 payload_len = len - ETH_HEADER_LEN;

    /* Check if frame is for us */
    if (!active_device) return;

    bool for_us = eth_mac_equal(hdr->dst_mac, active_device->mac_address) ||
                  eth_mac_equal(hdr->dst_mac, ETH_BROADCAST_MAC);
    if (!for_us) return;

    /* Dispatch by EtherType */
    u16 ethertype = ntohs(hdr->ethertype);
    switch (ethertype) {
        case ETH_TYPE_IPV4:
            ip_receive(payload, payload_len);
            break;
        case ETH_TYPE_ARP:
            arp_receive(payload, payload_len);
            break;
        default:
            /* Unknown protocol - ignore */
            break;
    }
}
