/*
 * AlphaOS - USB Core Implementation
 */

#include "usb.h"
#include "xhci.h"
#include "console.h"

/* Maximum USB devices */
#define USB_MAX_DEVICES 16

/* Device storage */
static UsbDevice usb_devices[USB_MAX_DEVICES];
static u32 usb_device_count = 0;

/* Configuration descriptor buffer */
static u8 config_buffer[512] __attribute__((aligned(64)));

/* Initialize USB subsystem */
void usb_init(void) {
    usb_device_count = 0;
    for (int i = 0; i < USB_MAX_DEVICES; i++) {
        usb_devices[i].configured = false;
    }
}

/* Get device descriptor */
int usb_get_device_descriptor(u8 slot_id, UsbDeviceDescriptor* desc) {
    return xhci_control_transfer(slot_id,
        USB_REQ_DIR_IN | USB_REQ_TYPE_STANDARD | USB_REQ_RECIP_DEVICE,
        USB_REQ_GET_DESCRIPTOR,
        (USB_DESC_DEVICE << 8) | 0,
        0,
        desc,
        sizeof(UsbDeviceDescriptor));
}

/* Get configuration descriptor */
int usb_get_config_descriptor(u8 slot_id, u8* buffer, u16 length) {
    return xhci_control_transfer(slot_id,
        USB_REQ_DIR_IN | USB_REQ_TYPE_STANDARD | USB_REQ_RECIP_DEVICE,
        USB_REQ_GET_DESCRIPTOR,
        (USB_DESC_CONFIG << 8) | 0,
        0,
        buffer,
        length);
}

/* Set device configuration */
int usb_set_configuration(u8 slot_id, u8 config_value) {
    return xhci_control_transfer(slot_id,
        USB_REQ_DIR_OUT | USB_REQ_TYPE_STANDARD | USB_REQ_RECIP_DEVICE,
        USB_REQ_SET_CONFIG,
        config_value,
        0,
        NULL,
        0);
}

/* HID Set Protocol */
int usb_hid_set_protocol(u8 slot_id, u8 interface, u8 protocol) {
    return xhci_control_transfer(slot_id,
        USB_REQ_DIR_OUT | USB_REQ_TYPE_CLASS | USB_REQ_RECIP_INTERFACE,
        HID_REQ_SET_PROTOCOL,
        protocol,
        interface,
        NULL,
        0);
}

/* HID Set Idle */
int usb_hid_set_idle(u8 slot_id, u8 interface, u8 duration, u8 report_id) {
    return xhci_control_transfer(slot_id,
        USB_REQ_DIR_OUT | USB_REQ_TYPE_CLASS | USB_REQ_RECIP_INTERFACE,
        HID_REQ_SET_IDLE,
        (duration << 8) | report_id,
        interface,
        NULL,
        0);
}

/* Parse configuration descriptor and find endpoints */
static void parse_config_descriptor(UsbDevice* dev, u8* buffer, u16 length) {
    u16 offset = 0;

    while (offset < length) {
        u8 desc_len = buffer[offset];
        u8 desc_type = buffer[offset + 1];

        if (desc_len == 0) break;

        if (desc_type == USB_DESC_INTERFACE) {
            UsbInterfaceDescriptor* iface = (UsbInterfaceDescriptor*)(buffer + offset);
            dev->interface_num = iface->bInterfaceNumber;
            dev->class_code = iface->bInterfaceClass;
            dev->subclass = iface->bInterfaceSubClass;
            dev->protocol = iface->bInterfaceProtocol;
        }
        else if (desc_type == USB_DESC_ENDPOINT) {
            UsbEndpointDescriptor* ep = (UsbEndpointDescriptor*)(buffer + offset);
            u8 ep_addr = ep->bEndpointAddress;
            u8 ep_type = ep->bmAttributes & 0x03;

            /* We care about interrupt endpoints for HID */
            if (ep_type == 0x03) {  /* Interrupt */
                if (ep_addr & 0x80) {  /* IN endpoint */
                    dev->ep_in = ep_addr & 0x0F;
                    dev->ep_in_max_packet = ep->wMaxPacketSize;
                } else {  /* OUT endpoint */
                    dev->ep_out = ep_addr & 0x0F;
                }
            }
        }

        offset += desc_len;
    }
}

/* Enumerate a single port */
static int enumerate_port(u8 port) {
    XhciController* xhci = xhci_get_controller();
    if (!xhci) return -1;

    if (!xhci_port_connected(port)) {
        return 0;  /* No device */
    }

    /* Reset the port */
    if (xhci_port_reset(port) != 0) {
        console_printf("  USB: Port %d reset failed\n", port);
        return -1;
    }

    /* Get port speed */
    int speed = xhci_get_port_speed(port);
    if (speed < 1) {
        return -1;
    }

    const char* speed_str = (speed == 4) ? "Super" :
                            (speed == 3) ? "High" :
                            (speed == 2) ? "Low" : "Full";

    /* Enable a slot */
    u8 slot_id;
    if (xhci_enable_slot(&slot_id) != 0) {
        console_printf("  USB: Enable slot failed\n");
        return -1;
    }

    /* Address the device */
    if (xhci_address_device(slot_id, port, speed) != 0) {
        console_printf("  USB: Address device failed\n");
        return -1;
    }

    /* Create device entry */
    if (usb_device_count >= USB_MAX_DEVICES) {
        return -1;
    }

    UsbDevice* dev = &usb_devices[usb_device_count];
    dev->slot_id = slot_id;
    dev->port = port;
    dev->speed = speed;
    dev->configured = false;

    /* Get device descriptor */
    static UsbDeviceDescriptor dev_desc __attribute__((aligned(64)));
    if (usb_get_device_descriptor(slot_id, &dev_desc) != 0) {
        console_printf("  USB: Get descriptor failed\n");
        return -1;
    }

    dev->vendor_id = dev_desc.idVendor;
    dev->product_id = dev_desc.idProduct;
    dev->class_code = dev_desc.bDeviceClass;
    dev->subclass = dev_desc.bDeviceSubClass;
    dev->protocol = dev_desc.bDeviceProtocol;
    dev->num_configs = dev_desc.bNumConfigurations;

    console_printf("  USB: Port %d [%s] %04x:%04x\n",
        port, speed_str, dev->vendor_id, dev->product_id);

    /* Get configuration descriptor */
    if (usb_get_config_descriptor(slot_id, config_buffer, sizeof(config_buffer)) == 0) {
        UsbConfigDescriptor* cfg = (UsbConfigDescriptor*)config_buffer;
        dev->config_value = cfg->bConfigurationValue;
        parse_config_descriptor(dev, config_buffer, cfg->wTotalLength);

        /* Check if this is a HID device */
        if (dev->class_code == USB_CLASS_HID ||
            (dev->class_code == 0 && dev->subclass == USB_HID_SUBCLASS_BOOT)) {

            const char* type_str = (dev->protocol == USB_HID_PROTOCOL_KEYBOARD) ? "Keyboard" :
                                   (dev->protocol == USB_HID_PROTOCOL_MOUSE) ? "Mouse" : "HID";
            console_printf("  USB: %s detected (ep_in=%d)\n", type_str, dev->ep_in);
        }
    }

    usb_device_count++;
    return 0;
}

/* Enumerate all USB devices */
int usb_enumerate(void) {
    XhciController* xhci = xhci_get_controller();
    if (!xhci) {
        console_printf("  USB: No xHCI controller\n");
        return -1;
    }

    /* Scan all ports */
    for (u8 port = 1; port <= 16; port++) {
        enumerate_port(port);
    }

    console_printf("  USB: %lu device(s) found\n", (u64)usb_device_count);
    return 0;
}

/* Find a HID keyboard */
UsbDevice* usb_find_keyboard(void) {
    for (u32 i = 0; i < usb_device_count; i++) {
        UsbDevice* dev = &usb_devices[i];
        if ((dev->class_code == USB_CLASS_HID || dev->class_code == 0) &&
            dev->protocol == USB_HID_PROTOCOL_KEYBOARD) {
            return dev;
        }
    }
    return NULL;
}

/* Get device count */
u32 usb_get_device_count(void) {
    return usb_device_count;
}

/* Get device by index */
UsbDevice* usb_get_device(u32 index) {
    if (index >= usb_device_count) return NULL;
    return &usb_devices[index];
}
