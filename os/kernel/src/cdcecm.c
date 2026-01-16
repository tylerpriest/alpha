/*
 * AlphaOS - USB CDC-ECM Ethernet Driver Implementation
 *
 * Research Summary:
 * - USB CDC specification 1.2
 * - ECM (Ethernet Control Model) subclass
 * - Linux cdc_ether.c driver reference
 */

#include "cdcecm.h"
#include "xhci.h"
#include "usb.h"
#include "console.h"
#include "string.h"
#include "heap.h"

/* Single global CDC-ECM device */
static CdcEcmDevice cdcecm_dev;

/* RX/TX buffer size */
#define CDCECM_BUFFER_SIZE 2048

/* Driver callbacks for EthDevice */
static int cdcecm_send(EthDevice* dev, const void* data, u32 len);
static int cdcecm_recv(EthDevice* dev, void* buffer, u32 max_len);
static int cdcecm_poll(EthDevice* dev);

/* Check if USB device is CDC-ECM compatible */
bool cdcecm_is_compatible(UsbDevice* dev) {
    if (!dev) return false;

    /* Check for Communications class, ECM subclass */
    if (dev->class_code == CDC_CLASS_COMM &&
        dev->subclass == CDC_SUBCLASS_ECM) {
        return true;
    }

    /* Some devices report class at interface level */
    /* Would need to parse interface descriptors */
    return false;
}

/* Parse MAC address from USB string descriptor */
static int cdcecm_get_mac(u8 slot_id, u8 string_idx, u8* mac) {
    /* MAC is encoded as Unicode string "XXXXXXXXXXXX" */
    static u8 string_buf[64] __attribute__((aligned(64)));

    int ret = xhci_control_transfer(slot_id,
        USB_REQ_DIR_IN | USB_REQ_TYPE_STANDARD | USB_REQ_RECIP_DEVICE,
        USB_REQ_GET_DESCRIPTOR,
        (USB_DESC_STRING << 8) | string_idx,
        0x0409,  /* English */
        string_buf,
        sizeof(string_buf));

    if (ret != 0) return -1;

    /* Parse MAC from Unicode hex string */
    u8* data = string_buf + 2;  /* Skip length and type */
    int len = string_buf[0] - 2;

    if (len < 24) return -1;  /* Need 12 hex chars (24 bytes Unicode) */

    for (int i = 0; i < 6; i++) {
        u8 hi = data[i * 4];      /* High nibble */
        u8 lo = data[i * 4 + 2];  /* Low nibble */

        /* Convert hex to value */
        hi = (hi >= 'A') ? (hi - 'A' + 10) : (hi - '0');
        lo = (lo >= 'A') ? (lo - 'A' + 10) : (lo - '0');

        mac[i] = (hi << 4) | lo;
    }

    return 0;
}

/* Set packet filter for receiving */
static int cdcecm_set_filter(u8 slot_id, u8 interface, u16 filter) {
    return xhci_control_transfer(slot_id,
        USB_REQ_DIR_OUT | USB_REQ_TYPE_CLASS | USB_REQ_RECIP_INTERFACE,
        CDC_SET_ETHERNET_PACKET_FILTER,
        filter,
        interface,
        NULL,
        0);
}

/* Initialize CDC-ECM device */
int cdcecm_init(UsbDevice* usb_dev) {
    if (!usb_dev) return -1;

    console_printf("  CDC-ECM: Initializing USB Ethernet %04x:%04x\n",
        usb_dev->vendor_id, usb_dev->product_id);

    memset(&cdcecm_dev, 0, sizeof(cdcecm_dev));
    cdcecm_dev.usb_dev = usb_dev;

    /* Get endpoints from USB configuration */
    cdcecm_dev.bulk_in_ep = usb_dev->ep_in;
    cdcecm_dev.bulk_out_ep = usb_dev->ep_out;

    /* Default MAC if we can't read it */
    cdcecm_dev.eth.mac_address[0] = 0x02;  /* Locally administered */
    cdcecm_dev.eth.mac_address[1] = 0x00;
    cdcecm_dev.eth.mac_address[2] = 0xAB;
    cdcecm_dev.eth.mac_address[3] = 0xCD;
    cdcecm_dev.eth.mac_address[4] = 0xEF;
    cdcecm_dev.eth.mac_address[5] = 0x01;

    /* Try to get real MAC address */
    /* TODO: Parse CDC Ethernet Functional Descriptor for iMACAddress */

    cdcecm_dev.eth.mtu = ETH_MTU;
    cdcecm_dev.eth.link_up = false;
    cdcecm_dev.eth.driver_data = &cdcecm_dev;
    cdcecm_dev.eth.send = cdcecm_send;
    cdcecm_dev.eth.recv = cdcecm_recv;
    cdcecm_dev.eth.poll = cdcecm_poll;

    /* Allocate RX/TX buffers */
    cdcecm_dev.rx_buffer = kmalloc(CDCECM_BUFFER_SIZE);
    cdcecm_dev.tx_buffer = kmalloc(CDCECM_BUFFER_SIZE);

    if (!cdcecm_dev.rx_buffer || !cdcecm_dev.tx_buffer) {
        console_printf("  CDC-ECM: Buffer allocation failed\n");
        return -1;
    }

    /* Set device configuration */
    if (usb_set_configuration(usb_dev->slot_id, usb_dev->config_value) != 0) {
        console_printf("  CDC-ECM: Set configuration failed\n");
        return -1;
    }

    /* Enable packet filter for broadcast and directed */
    u16 filter = CDC_PACKET_DIRECTED | CDC_PACKET_BROADCAST;
    cdcecm_set_filter(usb_dev->slot_id, usb_dev->interface_num, filter);

    /* Print MAC address */
    char mac_str[18];
    eth_format_mac(cdcecm_dev.eth.mac_address, mac_str);
    console_printf("  CDC-ECM: MAC Address: %s\n", mac_str);

    cdcecm_dev.eth.link_up = true;  /* Assume link up for now */
    cdcecm_dev.initialized = true;

    /* Register as active Ethernet device */
    eth_set_device(&cdcecm_dev.eth);

    console_printf("  CDC-ECM: Initialized successfully\n");
    return 0;
}

/* Send Ethernet frame */
static int cdcecm_send(EthDevice* dev, const void* data, u32 len) {
    CdcEcmDevice* cdc = (CdcEcmDevice*)dev->driver_data;
    if (!cdc || !cdc->initialized) return -1;

    /* TODO: Implement bulk OUT transfer via xHCI */
    /* For now, just return success */
    (void)data;
    (void)len;

    return 0;
}

/* Receive Ethernet frame */
static int cdcecm_recv(EthDevice* dev, void* buffer, u32 max_len) {
    CdcEcmDevice* cdc = (CdcEcmDevice*)dev->driver_data;
    if (!cdc || !cdc->initialized) return -1;

    /* TODO: Implement bulk IN transfer via xHCI */
    (void)buffer;
    (void)max_len;

    return 0;  /* No data */
}

/* Poll for incoming data */
static int cdcecm_poll(EthDevice* dev) {
    /* TODO: Check for incoming packets */
    (void)dev;
    return 0;
}

/* Get CDC-ECM Ethernet device */
EthDevice* cdcecm_get_eth_device(void) {
    return cdcecm_dev.initialized ? &cdcecm_dev.eth : NULL;
}

/* Find and initialize CDC-ECM device from enumerated USB devices */
int cdcecm_probe(void) {
    console_printf("  CDC-ECM: Probing for USB Ethernet adapters...\n");

    u32 count = usb_get_device_count();
    for (u32 i = 0; i < count; i++) {
        UsbDevice* dev = usb_get_device(i);
        if (cdcecm_is_compatible(dev)) {
            console_printf("  CDC-ECM: Found compatible device\n");
            return cdcecm_init(dev);
        }
    }

    console_printf("  CDC-ECM: No USB Ethernet adapter found\n");
    return -1;
}
