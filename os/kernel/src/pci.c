/*
 * AlphaOS - PCI Bus Driver Implementation
 */

#include "pci.h"
#include "console.h"

/* Device storage */
static PciDevice pci_devices[PCI_MAX_DEVICES];
static u32 pci_device_count = 0;

/* Build PCI config address */
static inline u32 pci_address(u8 bus, u8 device, u8 func, u8 offset) {
    return (1U << 31) |                /* Enable bit */
           ((u32)bus << 16) |
           ((u32)(device & 0x1F) << 11) |
           ((u32)(func & 0x07) << 8) |
           (offset & 0xFC);
}

/* PCI Configuration Space Read Operations */
u32 pci_read32(u8 bus, u8 device, u8 func, u8 offset) {
    outl(PCI_CONFIG_ADDR, pci_address(bus, device, func, offset));
    return inl(PCI_CONFIG_DATA);
}

u16 pci_read16(u8 bus, u8 device, u8 func, u8 offset) {
    u32 val = pci_read32(bus, device, func, offset & ~3);
    return (val >> ((offset & 2) * 8)) & 0xFFFF;
}

u8 pci_read8(u8 bus, u8 device, u8 func, u8 offset) {
    u32 val = pci_read32(bus, device, func, offset & ~3);
    return (val >> ((offset & 3) * 8)) & 0xFF;
}

/* PCI Configuration Space Write Operations */
void pci_write32(u8 bus, u8 device, u8 func, u8 offset, u32 value) {
    outl(PCI_CONFIG_ADDR, pci_address(bus, device, func, offset));
    outl(PCI_CONFIG_DATA, value);
}

void pci_write16(u8 bus, u8 device, u8 func, u8 offset, u16 value) {
    u32 addr = pci_address(bus, device, func, offset & ~3);
    outl(PCI_CONFIG_ADDR, addr);
    u32 old = inl(PCI_CONFIG_DATA);
    u32 shift = (offset & 2) * 8;
    u32 mask = 0xFFFF << shift;
    u32 new_val = (old & ~mask) | ((u32)value << shift);
    outl(PCI_CONFIG_DATA, new_val);
}

void pci_write8(u8 bus, u8 device, u8 func, u8 offset, u8 value) {
    u32 addr = pci_address(bus, device, func, offset & ~3);
    outl(PCI_CONFIG_ADDR, addr);
    u32 old = inl(PCI_CONFIG_DATA);
    u32 shift = (offset & 3) * 8;
    u32 mask = 0xFF << shift;
    u32 new_val = (old & ~mask) | ((u32)value << shift);
    outl(PCI_CONFIG_DATA, new_val);
}

/* Read BAR and determine its size/type */
static u64 read_bar(u8 bus, u8 device, u8 func, u8 bar_offset) {
    u32 bar_low = pci_read32(bus, device, func, bar_offset);

    if (bar_low == 0) {
        return 0;
    }

    /* Check if memory or I/O */
    if (bar_low & PCI_BAR_TYPE_IO) {
        /* I/O BAR - 16-bit address */
        return bar_low & ~0x3;
    }

    /* Memory BAR */
    u64 address = bar_low & ~0xF;

    /* Check if 64-bit BAR */
    if ((bar_low & PCI_BAR_MEM_TYPE_MASK) == PCI_BAR_MEM_TYPE_64) {
        u32 bar_high = pci_read32(bus, device, func, bar_offset + 4);
        address |= ((u64)bar_high << 32);
    }

    return address;
}

/* Check and add a PCI device */
static void check_device(u8 bus, u8 device, u8 func) {
    u16 vendor_id = pci_read16(bus, device, func, PCI_VENDOR_ID);

    if (vendor_id == 0xFFFF) {
        return;  /* No device */
    }

    if (pci_device_count >= PCI_MAX_DEVICES) {
        return;  /* Too many devices */
    }

    PciDevice* dev = &pci_devices[pci_device_count];

    dev->bus = bus;
    dev->device = device;
    dev->function = func;
    dev->vendor_id = vendor_id;
    dev->device_id = pci_read16(bus, device, func, PCI_DEVICE_ID);
    dev->class_code = pci_read8(bus, device, func, PCI_CLASS);
    dev->subclass = pci_read8(bus, device, func, PCI_SUBCLASS);
    dev->prog_if = pci_read8(bus, device, func, PCI_PROG_IF);
    dev->revision = pci_read8(bus, device, func, PCI_REVISION_ID);
    dev->header_type = pci_read8(bus, device, func, PCI_HEADER_TYPE);
    dev->interrupt_line = pci_read8(bus, device, func, PCI_INTERRUPT_LINE);

    /* Read BARs (only for type 0 headers) */
    if ((dev->header_type & 0x7F) == 0) {
        for (int i = 0; i < 6; i++) {
            u8 bar_offset = PCI_BAR0 + (i * 4);
            dev->bar[i] = read_bar(bus, device, func, bar_offset);

            /* Skip next BAR if this was 64-bit */
            u32 bar_val = pci_read32(bus, device, func, bar_offset);
            if ((bar_val & PCI_BAR_TYPE_MASK) == PCI_BAR_TYPE_MEM &&
                (bar_val & PCI_BAR_MEM_TYPE_MASK) == PCI_BAR_MEM_TYPE_64) {
                i++;  /* Skip the high 32 bits */
                if (i < 6) dev->bar[i] = 0;
            }
        }
    }

    pci_device_count++;
}

/* Scan a single bus */
static void scan_bus(u8 bus) {
    for (u8 device = 0; device < 32; device++) {
        u16 vendor = pci_read16(bus, device, 0, PCI_VENDOR_ID);
        if (vendor == 0xFFFF) continue;

        check_device(bus, device, 0);

        /* Check for multi-function device */
        u8 header = pci_read8(bus, device, 0, PCI_HEADER_TYPE);
        if (header & 0x80) {
            for (u8 func = 1; func < 8; func++) {
                check_device(bus, device, func);
            }
        }
    }
}

/* Initialize PCI and enumerate all devices */
void pci_init(void) {
    pci_device_count = 0;

    /* Scan all buses */
    for (u16 bus = 0; bus < 256; bus++) {
        scan_bus((u8)bus);
    }

    console_printf("  PCI: Found %lu devices\n", (u64)pci_device_count);
}

/* Find device by class/subclass/progif */
PciDevice* pci_find_device(u8 class_code, u8 subclass, u8 prog_if) {
    for (u32 i = 0; i < pci_device_count; i++) {
        PciDevice* dev = &pci_devices[i];
        if (dev->class_code == class_code &&
            dev->subclass == subclass &&
            dev->prog_if == prog_if) {
            return dev;
        }
    }
    return NULL;
}

/* Find device by vendor/device ID */
PciDevice* pci_find_device_by_id(u16 vendor_id, u16 device_id) {
    for (u32 i = 0; i < pci_device_count; i++) {
        PciDevice* dev = &pci_devices[i];
        if (dev->vendor_id == vendor_id && dev->device_id == device_id) {
            return dev;
        }
    }
    return NULL;
}

/* Get device count */
u32 pci_get_device_count(void) {
    return pci_device_count;
}

/* Get device by index */
PciDevice* pci_get_device(u32 index) {
    if (index >= pci_device_count) return NULL;
    return &pci_devices[index];
}

/* Enable bus mastering */
void pci_enable_bus_master(PciDevice* dev) {
    u16 cmd = pci_read16(dev->bus, dev->device, dev->function, PCI_COMMAND);
    cmd |= PCI_CMD_BUS_MASTER | PCI_CMD_MEMORY_SPACE;
    pci_write16(dev->bus, dev->device, dev->function, PCI_COMMAND, cmd);
}

/* Get BAR address */
u64 pci_get_bar_address(PciDevice* dev, u8 bar_index) {
    if (bar_index >= 6) return 0;
    return dev->bar[bar_index];
}
