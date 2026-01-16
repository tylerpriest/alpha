/*
 * AlphaOS - USB CDC-ECM Ethernet Driver
 *
 * Research Summary:
 * - USB CDC (Communications Device Class) specification
 * - ECM (Ethernet Control Model) subclass
 * - Standard USB Ethernet adapter protocol
 * - Used by most USB-to-Ethernet adapters
 *
 * Key facts:
 * - Class 0x02 (Communications), Subclass 0x06 (ECM)
 * - Uses bulk endpoints for data transfer
 * - Interrupt endpoint for link status
 * - MAC address provided via USB descriptor
 */

#ifndef _CDCECM_H
#define _CDCECM_H

#include "types.h"
#include "usb.h"
#include "ethernet.h"

/* CDC Class codes */
#define CDC_CLASS_COMM          0x02
#define CDC_SUBCLASS_ECM        0x06
#define CDC_PROTOCOL_NONE       0x00

/* CDC Data class */
#define CDC_CLASS_DATA          0x0A

/* CDC Functional Descriptor Types */
#define CDC_FUNC_HEADER         0x00
#define CDC_FUNC_UNION          0x06
#define CDC_FUNC_ETHERNET       0x0F

/* CDC-ECM requests */
#define CDC_SET_ETHERNET_MULTICAST_FILTERS  0x40
#define CDC_SET_ETHERNET_PM_PATTERN_FILTER  0x41
#define CDC_GET_ETHERNET_PM_PATTERN_FILTER  0x42
#define CDC_SET_ETHERNET_PACKET_FILTER      0x43
#define CDC_GET_ETHERNET_STATISTIC          0x44

/* Packet filter bits */
#define CDC_PACKET_PROMISCUOUS      (1 << 0)
#define CDC_PACKET_ALL_MULTICAST    (1 << 1)
#define CDC_PACKET_DIRECTED         (1 << 2)
#define CDC_PACKET_BROADCAST        (1 << 3)
#define CDC_PACKET_MULTICAST        (1 << 4)

/* CDC-ECM notification codes */
#define CDC_NOTIFY_NETWORK_CONNECTION   0x00
#define CDC_NOTIFY_SPEED_CHANGE         0x2A

/* CDC Ethernet Functional Descriptor */
typedef struct {
    u8  bLength;
    u8  bDescriptorType;
    u8  bDescriptorSubtype;
    u8  iMACAddress;        /* String index for MAC address */
    u32 bmEthernetStatistics;
    u16 wMaxSegmentSize;
    u16 wNumberMCFilters;
    u8  bNumberPowerFilters;
} __attribute__((packed)) CdcEthDescriptor;

/* CDC-ECM device state */
typedef struct {
    UsbDevice* usb_dev;
    EthDevice eth;

    /* USB endpoints */
    u8 bulk_in_ep;
    u8 bulk_out_ep;
    u8 interrupt_ep;

    /* Buffers */
    u8* rx_buffer;
    u8* tx_buffer;

    /* State */
    bool initialized;
} CdcEcmDevice;

/* Initialize CDC-ECM driver */
int cdcecm_init(UsbDevice* usb_dev);

/* Get CDC-ECM Ethernet device */
EthDevice* cdcecm_get_eth_device(void);

/* Check if device is CDC-ECM class */
bool cdcecm_is_compatible(UsbDevice* dev);

/* Find and initialize CDC-ECM device */
int cdcecm_probe(void);

#endif /* _CDCECM_H */
