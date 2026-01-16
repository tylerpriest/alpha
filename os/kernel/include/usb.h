/*
 * AlphaOS - USB Core Definitions
 */

#ifndef _USB_H
#define _USB_H

#include "types.h"

/* USB Request Types */
#define USB_REQ_TYPE_STANDARD    0x00
#define USB_REQ_TYPE_CLASS       0x20
#define USB_REQ_TYPE_VENDOR      0x40

#define USB_REQ_DIR_OUT          0x00
#define USB_REQ_DIR_IN           0x80

#define USB_REQ_RECIP_DEVICE     0x00
#define USB_REQ_RECIP_INTERFACE  0x01
#define USB_REQ_RECIP_ENDPOINT   0x02

/* Standard USB Requests */
#define USB_REQ_GET_STATUS       0x00
#define USB_REQ_CLEAR_FEATURE    0x01
#define USB_REQ_SET_FEATURE      0x03
#define USB_REQ_SET_ADDRESS      0x05
#define USB_REQ_GET_DESCRIPTOR   0x06
#define USB_REQ_SET_DESCRIPTOR   0x07
#define USB_REQ_GET_CONFIG       0x08
#define USB_REQ_SET_CONFIG       0x09
#define USB_REQ_GET_INTERFACE    0x0A
#define USB_REQ_SET_INTERFACE    0x0B

/* Descriptor Types */
#define USB_DESC_DEVICE          0x01
#define USB_DESC_CONFIG          0x02
#define USB_DESC_STRING          0x03
#define USB_DESC_INTERFACE       0x04
#define USB_DESC_ENDPOINT        0x05
#define USB_DESC_HID             0x21
#define USB_DESC_HID_REPORT      0x22

/* USB Class Codes */
#define USB_CLASS_HID            0x03
#define USB_CLASS_HUB            0x09

/* HID Subclass */
#define USB_HID_SUBCLASS_BOOT    0x01

/* HID Protocol */
#define USB_HID_PROTOCOL_KEYBOARD  0x01
#define USB_HID_PROTOCOL_MOUSE     0x02

/* HID Class Requests */
#define HID_REQ_GET_REPORT       0x01
#define HID_REQ_GET_IDLE         0x02
#define HID_REQ_GET_PROTOCOL     0x03
#define HID_REQ_SET_REPORT       0x09
#define HID_REQ_SET_IDLE         0x0A
#define HID_REQ_SET_PROTOCOL     0x0B

/* USB Device Descriptor */
typedef struct {
    u8  bLength;
    u8  bDescriptorType;
    u16 bcdUSB;
    u8  bDeviceClass;
    u8  bDeviceSubClass;
    u8  bDeviceProtocol;
    u8  bMaxPacketSize0;
    u16 idVendor;
    u16 idProduct;
    u16 bcdDevice;
    u8  iManufacturer;
    u8  iProduct;
    u8  iSerialNumber;
    u8  bNumConfigurations;
} __attribute__((packed)) UsbDeviceDescriptor;

/* USB Configuration Descriptor */
typedef struct {
    u8  bLength;
    u8  bDescriptorType;
    u16 wTotalLength;
    u8  bNumInterfaces;
    u8  bConfigurationValue;
    u8  iConfiguration;
    u8  bmAttributes;
    u8  bMaxPower;
} __attribute__((packed)) UsbConfigDescriptor;

/* USB Interface Descriptor */
typedef struct {
    u8  bLength;
    u8  bDescriptorType;
    u8  bInterfaceNumber;
    u8  bAlternateSetting;
    u8  bNumEndpoints;
    u8  bInterfaceClass;
    u8  bInterfaceSubClass;
    u8  bInterfaceProtocol;
    u8  iInterface;
} __attribute__((packed)) UsbInterfaceDescriptor;

/* USB Endpoint Descriptor */
typedef struct {
    u8  bLength;
    u8  bDescriptorType;
    u8  bEndpointAddress;
    u8  bmAttributes;
    u16 wMaxPacketSize;
    u8  bInterval;
} __attribute__((packed)) UsbEndpointDescriptor;

/* HID Descriptor */
typedef struct {
    u8  bLength;
    u8  bDescriptorType;
    u16 bcdHID;
    u8  bCountryCode;
    u8  bNumDescriptors;
    u8  bReportDescriptorType;
    u16 wReportDescriptorLength;
} __attribute__((packed)) UsbHidDescriptor;

/* USB Device State */
typedef struct {
    u8 slot_id;
    u8 port;
    u8 speed;
    u8 address;
    u16 vendor_id;
    u16 product_id;
    u8 class_code;
    u8 subclass;
    u8 protocol;
    u8 num_configs;
    u8 config_value;
    u8 interface_num;
    u8 ep_in;
    u8 ep_out;
    u16 ep_in_max_packet;
    bool configured;
} UsbDevice;

/* Initialize USB subsystem */
void usb_init(void);

/* Enumerate connected devices */
int usb_enumerate(void);

/* Get device descriptor */
int usb_get_device_descriptor(u8 slot_id, UsbDeviceDescriptor* desc);

/* Get configuration descriptor */
int usb_get_config_descriptor(u8 slot_id, u8* buffer, u16 length);

/* Set configuration */
int usb_set_configuration(u8 slot_id, u8 config_value);

/* Set protocol (for HID) */
int usb_hid_set_protocol(u8 slot_id, u8 interface, u8 protocol);

/* Set idle rate */
int usb_hid_set_idle(u8 slot_id, u8 interface, u8 duration, u8 report_id);

/* Find HID keyboard device */
UsbDevice* usb_find_keyboard(void);

/* Get device count */
u32 usb_get_device_count(void);
UsbDevice* usb_get_device(u32 index);

#endif /* _USB_H */
