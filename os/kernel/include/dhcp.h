/*
 * AlphaOS - DHCP Client
 *
 * Dynamic Host Configuration Protocol for automatic IP configuration.
 * RFC 2131: DHCP
 */

#ifndef _DHCP_H
#define _DHCP_H

#include "types.h"

/* DHCP ports */
#define DHCP_SERVER_PORT    67
#define DHCP_CLIENT_PORT    68

/* DHCP message types */
#define DHCP_DISCOVER       1
#define DHCP_OFFER          2
#define DHCP_REQUEST        3
#define DHCP_DECLINE        4
#define DHCP_ACK            5
#define DHCP_NAK            6
#define DHCP_RELEASE        7
#define DHCP_INFORM         8

/* DHCP options */
#define DHCP_OPT_PAD            0
#define DHCP_OPT_SUBNET         1
#define DHCP_OPT_ROUTER         3
#define DHCP_OPT_DNS            6
#define DHCP_OPT_HOSTNAME      12
#define DHCP_OPT_REQUESTED_IP  50
#define DHCP_OPT_LEASE_TIME    51
#define DHCP_OPT_MSG_TYPE      53
#define DHCP_OPT_SERVER_ID     54
#define DHCP_OPT_PARAM_REQ     55
#define DHCP_OPT_END          255

/* DHCP header */
typedef struct {
    u8  op;             /* 1 = BOOTREQUEST, 2 = BOOTREPLY */
    u8  htype;          /* Hardware type (1 = Ethernet) */
    u8  hlen;           /* Hardware address length (6) */
    u8  hops;
    u32 xid;            /* Transaction ID */
    u16 secs;           /* Seconds since start */
    u16 flags;          /* Flags (0x8000 = broadcast) */
    u32 ciaddr;         /* Client IP (if known) */
    u32 yiaddr;         /* Your (client) IP */
    u32 siaddr;         /* Server IP */
    u32 giaddr;         /* Gateway IP */
    u8  chaddr[16];     /* Client hardware address */
    u8  sname[64];      /* Server name */
    u8  file[128];      /* Boot file name */
    u8  options[312];   /* Options (starts with magic cookie) */
} __attribute__((packed)) DhcpPacket;

/* DHCP state */
typedef enum {
    DHCP_STATE_INIT,
    DHCP_STATE_SELECTING,
    DHCP_STATE_REQUESTING,
    DHCP_STATE_BOUND,
    DHCP_STATE_FAILED
} DhcpState;

/* DHCP lease info */
typedef struct {
    u32 ip_addr;
    u32 netmask;
    u32 gateway;
    u32 dns_server;
    u32 server_id;
    u32 lease_time;
    u64 lease_start;
    DhcpState state;
} DhcpLease;

/* Initialize DHCP client */
void dhcp_init(void);

/* Start DHCP discovery (non-blocking) */
int dhcp_discover(void);

/* Poll DHCP state machine */
void dhcp_poll(void);

/* Get current DHCP lease */
DhcpLease* dhcp_get_lease(void);

/* Get DHCP state */
DhcpState dhcp_get_state(void);

/* Check if DHCP is complete */
bool dhcp_is_configured(void);

/* Blocking DHCP configuration */
int dhcp_configure(u32 timeout_ms);

#endif /* _DHCP_H */
