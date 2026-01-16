/*
 * AlphaOS - PCI Bus Driver
 */

#ifndef _PCI_H
#define _PCI_H

#include "types.h"

/* PCI Configuration Space Ports */
#define PCI_CONFIG_ADDR  0xCF8
#define PCI_CONFIG_DATA  0xCFC

/* PCI Configuration Space Registers */
#define PCI_VENDOR_ID        0x00
#define PCI_DEVICE_ID        0x02
#define PCI_COMMAND          0x04
#define PCI_STATUS           0x06
#define PCI_REVISION_ID      0x08
#define PCI_PROG_IF          0x09
#define PCI_SUBCLASS         0x0A
#define PCI_CLASS            0x0B
#define PCI_CACHE_LINE_SIZE  0x0C
#define PCI_LATENCY_TIMER    0x0D
#define PCI_HEADER_TYPE      0x0E
#define PCI_BIST             0x0F
#define PCI_BAR0             0x10
#define PCI_BAR1             0x14
#define PCI_BAR2             0x18
#define PCI_BAR3             0x1C
#define PCI_BAR4             0x20
#define PCI_BAR5             0x24
#define PCI_INTERRUPT_LINE   0x3C
#define PCI_INTERRUPT_PIN    0x3D

/* PCI Command Register Bits */
#define PCI_CMD_IO_SPACE        (1 << 0)
#define PCI_CMD_MEMORY_SPACE    (1 << 1)
#define PCI_CMD_BUS_MASTER      (1 << 2)
#define PCI_CMD_INTERRUPT_DIS   (1 << 10)

/* PCI Class Codes */
#define PCI_CLASS_SERIAL_BUS    0x0C
#define PCI_SUBCLASS_USB        0x03
#define PCI_PROGIF_XHCI         0x30
#define PCI_PROGIF_EHCI         0x20
#define PCI_PROGIF_OHCI         0x10
#define PCI_PROGIF_UHCI         0x00

/* BAR Types */
#define PCI_BAR_TYPE_MASK       0x01
#define PCI_BAR_TYPE_MEM        0x00
#define PCI_BAR_TYPE_IO         0x01
#define PCI_BAR_MEM_TYPE_MASK   0x06
#define PCI_BAR_MEM_TYPE_32     0x00
#define PCI_BAR_MEM_TYPE_64     0x04
#define PCI_BAR_MEM_PREFETCH    0x08

/* Maximum PCI devices to track */
#define PCI_MAX_DEVICES  64

/* PCI Device Structure */
typedef struct {
    u8  bus;
    u8  device;
    u8  function;
    u16 vendor_id;
    u16 device_id;
    u8  class_code;
    u8  subclass;
    u8  prog_if;
    u8  revision;
    u8  header_type;
    u8  interrupt_line;
    u64 bar[6];
} PciDevice;

/* Initialize PCI subsystem and enumerate devices */
void pci_init(void);

/* Read/Write PCI configuration space */
u8  pci_read8(u8 bus, u8 device, u8 func, u8 offset);
u16 pci_read16(u8 bus, u8 device, u8 func, u8 offset);
u32 pci_read32(u8 bus, u8 device, u8 func, u8 offset);
void pci_write8(u8 bus, u8 device, u8 func, u8 offset, u8 value);
void pci_write16(u8 bus, u8 device, u8 func, u8 offset, u16 value);
void pci_write32(u8 bus, u8 device, u8 func, u8 offset, u32 value);

/* Find devices by class */
PciDevice* pci_find_device(u8 class_code, u8 subclass, u8 prog_if);
PciDevice* pci_find_device_by_id(u16 vendor_id, u16 device_id);

/* Get device count */
u32 pci_get_device_count(void);
PciDevice* pci_get_device(u32 index);

/* Enable bus mastering for a device */
void pci_enable_bus_master(PciDevice* dev);

/* Get BAR address (handles 64-bit BARs) */
u64 pci_get_bar_address(PciDevice* dev, u8 bar_index);

#endif /* _PCI_H */
