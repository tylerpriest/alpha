/*
 * AlphaOS - ARP (Address Resolution Protocol)
 *
 * Research Summary:
 * - RFC 826: Address Resolution Protocol
 * - Maps IPv4 addresses to MAC addresses
 */

#ifndef _ARP_H
#define _ARP_H

#include "types.h"
#include "ethernet.h"

/* ARP hardware types */
#define ARP_HW_ETHERNET     1

/* ARP operations */
#define ARP_OP_REQUEST      1
#define ARP_OP_REPLY        2

/* ARP header for Ethernet/IPv4 */
typedef struct {
    u16 hw_type;        /* Hardware type (Ethernet = 1) */
    u16 proto_type;     /* Protocol type (IPv4 = 0x0800) */
    u8  hw_len;         /* Hardware address length (6 for Ethernet) */
    u8  proto_len;      /* Protocol address length (4 for IPv4) */
    u16 operation;      /* Operation (1=request, 2=reply) */
    u8  sender_mac[6];  /* Sender hardware address */
    u32 sender_ip;      /* Sender protocol address */
    u8  target_mac[6];  /* Target hardware address */
    u32 target_ip;      /* Target protocol address */
} __attribute__((packed)) ArpPacket;

/* ARP table entry */
typedef struct {
    u32 ip_addr;
    u8  mac_addr[6];
    u64 timestamp;      /* When entry was added/updated */
    bool valid;
} ArpEntry;

/* Initialize ARP subsystem */
void arp_init(void);

/* Resolve IP to MAC (may block for ARP request) */
int arp_resolve(u32 ip, u8* mac);

/* Process received ARP packet */
void arp_receive(const void* packet, u32 len);

/* Send ARP request */
int arp_send_request(u32 target_ip);

/* Send ARP reply */
int arp_send_reply(u32 target_ip, const u8* target_mac);

/* Lookup in ARP cache (non-blocking) */
bool arp_lookup(u32 ip, u8* mac);

/* Add entry to ARP cache */
void arp_add_entry(u32 ip, const u8* mac);

#endif /* _ARP_H */
