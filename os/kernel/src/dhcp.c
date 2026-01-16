/*
 * AlphaOS - DHCP Client Implementation
 *
 * Implements DHCP DORA flow for automatic IP configuration.
 */

#include "dhcp.h"
#include "udp.h"
#include "ip.h"
#include "ethernet.h"
#include "pit.h"
#include "console.h"
#include "string.h"

/* DHCP magic cookie */
#define DHCP_MAGIC_COOKIE   0x63825363

/* DHCP timeouts */
#define DHCP_TIMEOUT_MS     5000

/* Current lease */
static DhcpLease dhcp_lease;

/* Transaction ID */
static u32 dhcp_xid;

/* Last message time */
static u64 dhcp_last_time;

/* DHCP message handler (registered with UDP) */
static void dhcp_receive(u32 src_ip, u16 src_port, u16 dst_port,
                         const void* data, u32 len);

/* Initialize DHCP client */
void dhcp_init(void) {
    memset(&dhcp_lease, 0, sizeof(dhcp_lease));
    dhcp_lease.state = DHCP_STATE_INIT;

    /* Generate transaction ID from uptime */
    dhcp_xid = pit_get_ticks() * 0x12345678;

    /* Register UDP handler for DHCP client port */
    udp_register_handler(DHCP_CLIENT_PORT, dhcp_receive);

    console_printf("  DHCP: Client initialized\n");
}

/* Build DHCP packet */
static int dhcp_build_packet(DhcpPacket* pkt, u8 msg_type, u32 requested_ip) {
    EthDevice* eth = eth_get_device();
    if (!eth) return -1;

    memset(pkt, 0, sizeof(*pkt));

    pkt->op = 1;        /* BOOTREQUEST */
    pkt->htype = 1;     /* Ethernet */
    pkt->hlen = 6;      /* MAC address length */
    pkt->hops = 0;
    pkt->xid = htonl(dhcp_xid);
    pkt->secs = 0;
    pkt->flags = htons(0x8000);  /* Broadcast flag */
    pkt->ciaddr = 0;
    pkt->yiaddr = 0;
    pkt->siaddr = 0;
    pkt->giaddr = 0;

    /* Copy MAC address */
    memcpy(pkt->chaddr, eth->mac_address, 6);

    /* Add magic cookie */
    u8* opt = pkt->options;
    *opt++ = (DHCP_MAGIC_COOKIE >> 24) & 0xFF;
    *opt++ = (DHCP_MAGIC_COOKIE >> 16) & 0xFF;
    *opt++ = (DHCP_MAGIC_COOKIE >> 8) & 0xFF;
    *opt++ = DHCP_MAGIC_COOKIE & 0xFF;

    /* Option: Message type */
    *opt++ = DHCP_OPT_MSG_TYPE;
    *opt++ = 1;
    *opt++ = msg_type;

    /* Option: Requested IP (for REQUEST) */
    if (requested_ip != 0) {
        *opt++ = DHCP_OPT_REQUESTED_IP;
        *opt++ = 4;
        *opt++ = (requested_ip >> 24) & 0xFF;
        *opt++ = (requested_ip >> 16) & 0xFF;
        *opt++ = (requested_ip >> 8) & 0xFF;
        *opt++ = requested_ip & 0xFF;
    }

    /* Option: Server ID (for REQUEST) */
    if (msg_type == DHCP_REQUEST && dhcp_lease.server_id != 0) {
        *opt++ = DHCP_OPT_SERVER_ID;
        *opt++ = 4;
        u32 sid = dhcp_lease.server_id;
        *opt++ = (sid >> 24) & 0xFF;
        *opt++ = (sid >> 16) & 0xFF;
        *opt++ = (sid >> 8) & 0xFF;
        *opt++ = sid & 0xFF;
    }

    /* Option: Parameter request list */
    *opt++ = DHCP_OPT_PARAM_REQ;
    *opt++ = 4;
    *opt++ = DHCP_OPT_SUBNET;
    *opt++ = DHCP_OPT_ROUTER;
    *opt++ = DHCP_OPT_DNS;
    *opt++ = DHCP_OPT_LEASE_TIME;

    /* Option: End */
    *opt++ = DHCP_OPT_END;

    return 0;
}

/* Parse DHCP options */
static void dhcp_parse_options(const u8* options, u32 len,
                                u8* msg_type, DhcpLease* lease) {
    const u8* ptr = options + 4;  /* Skip magic cookie */
    const u8* end = options + len;

    while (ptr < end && *ptr != DHCP_OPT_END) {
        if (*ptr == DHCP_OPT_PAD) {
            ptr++;
            continue;
        }

        u8 opt = *ptr++;
        if (ptr >= end) break;
        u8 opt_len = *ptr++;
        if (ptr + opt_len > end) break;

        switch (opt) {
            case DHCP_OPT_MSG_TYPE:
                if (opt_len >= 1) *msg_type = ptr[0];
                break;

            case DHCP_OPT_SUBNET:
                if (opt_len >= 4) {
                    lease->netmask = ((u32)ptr[0] << 24) |
                                     ((u32)ptr[1] << 16) |
                                     ((u32)ptr[2] << 8) |
                                     ptr[3];
                }
                break;

            case DHCP_OPT_ROUTER:
                if (opt_len >= 4) {
                    lease->gateway = ((u32)ptr[0] << 24) |
                                     ((u32)ptr[1] << 16) |
                                     ((u32)ptr[2] << 8) |
                                     ptr[3];
                }
                break;

            case DHCP_OPT_DNS:
                if (opt_len >= 4) {
                    lease->dns_server = ((u32)ptr[0] << 24) |
                                        ((u32)ptr[1] << 16) |
                                        ((u32)ptr[2] << 8) |
                                        ptr[3];
                }
                break;

            case DHCP_OPT_SERVER_ID:
                if (opt_len >= 4) {
                    lease->server_id = ((u32)ptr[0] << 24) |
                                       ((u32)ptr[1] << 16) |
                                       ((u32)ptr[2] << 8) |
                                       ptr[3];
                }
                break;

            case DHCP_OPT_LEASE_TIME:
                if (opt_len >= 4) {
                    lease->lease_time = ((u32)ptr[0] << 24) |
                                        ((u32)ptr[1] << 16) |
                                        ((u32)ptr[2] << 8) |
                                        ptr[3];
                }
                break;
        }

        ptr += opt_len;
    }
}

/* DHCP message handler */
static void dhcp_receive(u32 src_ip, u16 src_port, u16 dst_port,
                         const void* data, u32 len) {
    (void)src_ip;
    (void)src_port;
    (void)dst_port;

    if (len < sizeof(DhcpPacket) - 312 + 4) return;  /* Min size with magic */

    const DhcpPacket* pkt = (const DhcpPacket*)data;

    /* Verify it's a reply for us */
    if (pkt->op != 2) return;  /* Not BOOTREPLY */
    if (ntohl(pkt->xid) != dhcp_xid) return;  /* Wrong transaction */

    /* Parse options */
    u8 msg_type = 0;
    DhcpLease temp_lease;
    memset(&temp_lease, 0, sizeof(temp_lease));

    u32 options_len = len - (sizeof(DhcpPacket) - 312);
    dhcp_parse_options(pkt->options, options_len, &msg_type, &temp_lease);

    /* Get offered IP */
    u32 offered_ip = ntohl(pkt->yiaddr);

    char ip_str[16];

    switch (dhcp_lease.state) {
        case DHCP_STATE_SELECTING:
            if (msg_type == DHCP_OFFER) {
                ip_format(offered_ip, ip_str);
                console_printf("  DHCP: Offer received: %s\n", ip_str);

                /* Save offer details */
                dhcp_lease.ip_addr = offered_ip;
                dhcp_lease.netmask = temp_lease.netmask;
                dhcp_lease.gateway = temp_lease.gateway;
                dhcp_lease.dns_server = temp_lease.dns_server;
                dhcp_lease.server_id = temp_lease.server_id;
                dhcp_lease.lease_time = temp_lease.lease_time;

                /* Send REQUEST */
                DhcpPacket req;
                if (dhcp_build_packet(&req, DHCP_REQUEST, offered_ip) == 0) {
                    udp_send(0xFFFFFFFF, DHCP_CLIENT_PORT, DHCP_SERVER_PORT,
                             &req, sizeof(req));
                    dhcp_lease.state = DHCP_STATE_REQUESTING;
                    dhcp_last_time = pit_get_uptime_ms();
                    console_printf("  DHCP: REQUEST sent\n");
                }
            }
            break;

        case DHCP_STATE_REQUESTING:
            if (msg_type == DHCP_ACK) {
                dhcp_lease.lease_start = pit_get_uptime_ms();
                dhcp_lease.state = DHCP_STATE_BOUND;

                /* Configure IP stack */
                ip_set_config(dhcp_lease.ip_addr, dhcp_lease.netmask,
                              dhcp_lease.gateway, dhcp_lease.dns_server);

                ip_format(dhcp_lease.ip_addr, ip_str);
                console_printf("  DHCP: ACK received - bound to %s\n", ip_str);
            } else if (msg_type == DHCP_NAK) {
                console_printf("  DHCP: NAK received - restarting\n");
                dhcp_lease.state = DHCP_STATE_INIT;
            }
            break;

        default:
            break;
    }
}

/* Start DHCP discovery */
int dhcp_discover(void) {
    EthDevice* eth = eth_get_device();
    if (!eth || !eth->link_up) {
        console_printf("  DHCP: No network interface\n");
        return -1;
    }

    /* Generate new transaction ID */
    dhcp_xid = pit_get_ticks() * 0x12345678;

    /* Build DISCOVER packet */
    DhcpPacket pkt;
    if (dhcp_build_packet(&pkt, DHCP_DISCOVER, 0) != 0) {
        return -2;
    }

    /* Send to broadcast */
    console_printf("  DHCP: Sending DISCOVER...\n");
    int ret = udp_send(0xFFFFFFFF, DHCP_CLIENT_PORT, DHCP_SERVER_PORT,
                       &pkt, sizeof(pkt));

    if (ret == 0) {
        dhcp_lease.state = DHCP_STATE_SELECTING;
        dhcp_last_time = pit_get_uptime_ms();
    }

    return ret;
}

/* Poll DHCP state machine */
void dhcp_poll(void) {
    u64 now = pit_get_uptime_ms();

    switch (dhcp_lease.state) {
        case DHCP_STATE_SELECTING:
        case DHCP_STATE_REQUESTING:
            /* Check for timeout */
            if (now - dhcp_last_time > DHCP_TIMEOUT_MS) {
                console_printf("  DHCP: Timeout, retrying...\n");
                dhcp_discover();
            }
            break;

        case DHCP_STATE_BOUND:
            /* Check lease expiry (simplified - no renewal) */
            if (dhcp_lease.lease_time > 0) {
                u64 elapsed = (now - dhcp_lease.lease_start) / 1000;
                if (elapsed > dhcp_lease.lease_time) {
                    console_printf("  DHCP: Lease expired\n");
                    dhcp_lease.state = DHCP_STATE_INIT;
                }
            }
            break;

        default:
            break;
    }
}

/* Get current DHCP lease */
DhcpLease* dhcp_get_lease(void) {
    return &dhcp_lease;
}

/* Get DHCP state */
DhcpState dhcp_get_state(void) {
    return dhcp_lease.state;
}

/* Check if DHCP is complete */
bool dhcp_is_configured(void) {
    return dhcp_lease.state == DHCP_STATE_BOUND;
}

/* Blocking DHCP configuration */
int dhcp_configure(u32 timeout_ms) {
    if (dhcp_discover() != 0) {
        dhcp_lease.state = DHCP_STATE_FAILED;
        return -1;
    }

    u64 start = pit_get_uptime_ms();
    while (pit_get_uptime_ms() - start < timeout_ms) {
        eth_poll();
        dhcp_poll();

        if (dhcp_lease.state == DHCP_STATE_BOUND) {
            return 0;
        }

        pit_sleep_ms(50);
    }

    console_printf("  DHCP: Configuration timeout\n");
    dhcp_lease.state = DHCP_STATE_FAILED;
    return -2;
}
