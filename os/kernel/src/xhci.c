/*
 * AlphaOS - xHCI (USB 3.0) Host Controller Driver
 */

#include "xhci.h"
#include "console.h"
#include "string.h"

/* Global controller state */
static XhciController xhci;
static bool xhci_initialized = false;

/* Aligned memory regions (simple static allocation for now) */
static u64 dcbaa_memory[256] __attribute__((aligned(4096)));
static u8 cmd_ring_memory[4096] __attribute__((aligned(4096)));
static u8 event_ring_memory[4096] __attribute__((aligned(4096)));
static XhciErstEntry erst_memory[1] __attribute__((aligned(64)));
static u8 device_contexts[16][4096] __attribute__((aligned(4096)));
static u8 input_context_memory[4096] __attribute__((aligned(4096)));
static u8 transfer_rings[16][4096] __attribute__((aligned(4096)));

/* MMIO read/write helpers */
static inline u32 xhci_read32(volatile u8* base, u32 offset) {
    return *(volatile u32*)(base + offset);
}

static inline void xhci_write32(volatile u8* base, u32 offset, u32 value) {
    *(volatile u32*)(base + offset) = value;
}

static inline u64 xhci_read64(volatile u8* base, u32 offset) {
    return *(volatile u64*)(base + offset);
}

static inline void xhci_write64(volatile u8* base, u32 offset, u64 value) {
    *(volatile u64*)(base + offset) = value;
}

/* Simple delay loop */
static void delay_us(u32 us) {
    for (volatile u32 i = 0; i < us * 100; i++) {
        asm volatile("pause");
    }
}

/* Wait for controller ready */
static int wait_cnr_clear(void) {
    for (int i = 0; i < 1000; i++) {
        u32 sts = xhci_read32(xhci.op_base, XHCI_USBSTS);
        if (!(sts & XHCI_STS_CNR)) {
            return 0;
        }
        delay_us(1000);
    }
    return -1;
}

/* Reset the controller */
static int xhci_reset(void) {
    /* Stop the controller */
    u32 cmd = xhci_read32(xhci.op_base, XHCI_USBCMD);
    cmd &= ~XHCI_CMD_RUN;
    xhci_write32(xhci.op_base, XHCI_USBCMD, cmd);

    /* Wait for halt */
    for (int i = 0; i < 100; i++) {
        u32 sts = xhci_read32(xhci.op_base, XHCI_USBSTS);
        if (sts & XHCI_STS_HCH) break;
        delay_us(1000);
    }

    /* Issue reset */
    cmd = xhci_read32(xhci.op_base, XHCI_USBCMD);
    cmd |= XHCI_CMD_HCRST;
    xhci_write32(xhci.op_base, XHCI_USBCMD, cmd);

    /* Wait for reset to complete */
    for (int i = 0; i < 1000; i++) {
        cmd = xhci_read32(xhci.op_base, XHCI_USBCMD);
        if (!(cmd & XHCI_CMD_HCRST)) {
            return wait_cnr_clear();
        }
        delay_us(1000);
    }

    return -1;
}

/* Ring doorbell */
static void ring_doorbell(u8 slot_id, u8 target) {
    xhci.doorbell[slot_id] = target;
}

/* Send command and wait for completion */
static int xhci_send_command(XhciTrb* trb) {
    /* Copy TRB to command ring */
    u32 index = xhci.cmd_ring_index;
    XhciTrb* dest = &xhci.cmd_ring[index];

    dest->parameter = trb->parameter;
    dest->status = trb->status;
    dest->control = (trb->control & ~1) | xhci.cmd_ring_cycle;

    /* Advance index */
    xhci.cmd_ring_index++;
    if (xhci.cmd_ring_index >= 64 - 1) {
        /* Link TRB */
        XhciTrb* link = &xhci.cmd_ring[63];
        link->parameter = (u64)xhci.cmd_ring;
        link->status = 0;
        link->control = (TRB_TYPE_LINK << 10) | xhci.cmd_ring_cycle | (1 << 1);
        xhci.cmd_ring_index = 0;
        xhci.cmd_ring_cycle ^= 1;
    }

    /* Ring host controller doorbell */
    ring_doorbell(0, 0);

    /* Wait for completion event */
    for (int timeout = 0; timeout < 5000; timeout++) {
        u32 evt_idx = xhci.event_ring_index;
        XhciTrb* event = &xhci.event_ring[evt_idx];

        if ((event->control & 1) == xhci.event_ring_cycle) {
            u8 type = (event->control >> 10) & 0x3F;
            u8 code = (event->status >> 24) & 0xFF;

            /* Advance event ring */
            xhci.event_ring_index++;
            if (xhci.event_ring_index >= 64) {
                xhci.event_ring_index = 0;
                xhci.event_ring_cycle ^= 1;
            }

            /* Update ERDP */
            volatile u8* intr_base = xhci.rt_base + 0x20;
            u64 erdp = (u64)&xhci.event_ring[xhci.event_ring_index];
            erdp |= (1 << 3);  /* Clear EHB */
            xhci_write64(intr_base, 0x18, erdp);

            if (type == TRB_TYPE_CMD_COMPLETE) {
                if (code == TRB_COMP_SUCCESS) {
                    trb->parameter = event->parameter;
                    trb->status = event->status;
                    return 0;
                }
                return -code;
            }
        }
        delay_us(100);
    }

    return -1;  /* Timeout */
}

/* Initialize xHCI controller */
int xhci_init(PciDevice* pci_dev) {
    if (!pci_dev) return -1;

    console_printf("  xHCI: Initializing controller %x:%x\n",
        pci_dev->vendor_id, pci_dev->device_id);

    /* Enable bus mastering and memory space */
    pci_enable_bus_master(pci_dev);

    /* Get MMIO base address */
    u64 mmio_addr = pci_get_bar_address(pci_dev, 0);
    if (mmio_addr == 0) {
        console_printf("  xHCI: Invalid BAR0\n");
        return -1;
    }

    xhci.mmio_base = (volatile u8*)mmio_addr;

    /* Read capability registers */
    u8 cap_length = *(volatile u8*)xhci.mmio_base;
    u32 hcsparams1 = xhci_read32(xhci.mmio_base, XHCI_HCSPARAMS1);
    u32 dboff = xhci_read32(xhci.mmio_base, XHCI_DBOFF);
    u32 rtsoff = xhci_read32(xhci.mmio_base, XHCI_RTSOFF);

    xhci.max_slots = hcsparams1 & 0xFF;
    xhci.max_ports = (hcsparams1 >> 24) & 0xFF;

    /* Calculate register bases */
    xhci.op_base = xhci.mmio_base + cap_length;
    xhci.rt_base = xhci.mmio_base + (rtsoff & ~0x1F);
    xhci.doorbell = (volatile u32*)(xhci.mmio_base + (dboff & ~0x3));

    console_printf("  xHCI: %d slots, %d ports\n", xhci.max_slots, xhci.max_ports);

    /* Reset controller */
    if (xhci_reset() != 0) {
        console_printf("  xHCI: Reset failed\n");
        return -1;
    }

    /* Set up DCBAA */
    memset(dcbaa_memory, 0, sizeof(dcbaa_memory));
    xhci.dcbaa = dcbaa_memory;
    xhci_write64(xhci.op_base, XHCI_DCBAAP, (u64)xhci.dcbaa);

    /* Set max slots enabled */
    u32 config = xhci.max_slots;
    xhci_write32(xhci.op_base, XHCI_CONFIG, config);

    /* Set up Command Ring */
    memset(cmd_ring_memory, 0, sizeof(cmd_ring_memory));
    xhci.cmd_ring = (XhciTrb*)cmd_ring_memory;
    xhci.cmd_ring_index = 0;
    xhci.cmd_ring_cycle = 1;

    u64 crcr = (u64)xhci.cmd_ring | xhci.cmd_ring_cycle;
    xhci_write64(xhci.op_base, XHCI_CRCR, crcr);

    /* Set up Event Ring */
    memset(event_ring_memory, 0, sizeof(event_ring_memory));
    xhci.event_ring = (XhciTrb*)event_ring_memory;
    xhci.event_ring_index = 0;
    xhci.event_ring_cycle = 1;

    /* Set up ERST */
    memset(erst_memory, 0, sizeof(erst_memory));
    xhci.erst = erst_memory;
    xhci.erst[0].base_addr = (u64)xhci.event_ring;
    xhci.erst[0].size = 64;

    /* Configure interrupter 0 */
    volatile u8* intr_base = xhci.rt_base + 0x20;

    /* Set ERSTSZ */
    xhci_write32(intr_base, 0x08, 1);

    /* Set ERDP */
    xhci_write64(intr_base, 0x18, (u64)xhci.event_ring | (1 << 3));

    /* Set ERSTBA */
    xhci_write64(intr_base, 0x10, (u64)xhci.erst);

    /* Start the controller */
    u32 cmd = xhci_read32(xhci.op_base, XHCI_USBCMD);
    cmd |= XHCI_CMD_RUN | XHCI_CMD_INTE;
    xhci_write32(xhci.op_base, XHCI_USBCMD, cmd);

    /* Wait for running */
    for (int i = 0; i < 100; i++) {
        u32 sts = xhci_read32(xhci.op_base, XHCI_USBSTS);
        if (!(sts & XHCI_STS_HCH)) {
            xhci_initialized = true;
            console_printf("  xHCI: Controller started\n");
            return 0;
        }
        delay_us(1000);
    }

    console_printf("  xHCI: Failed to start\n");
    return -1;
}

/* Get port status register offset */
static u32 portsc_offset(u8 port) {
    return 0x400 + (port - 1) * 0x10;
}

/* Check if port has device connected */
bool xhci_port_connected(u8 port) {
    if (port < 1 || port > xhci.max_ports) return false;
    u32 portsc = xhci_read32(xhci.op_base, portsc_offset(port));
    return (portsc & XHCI_PORTSC_CCS) != 0;
}

/* Get port speed */
int xhci_get_port_speed(u8 port) {
    if (port < 1 || port > xhci.max_ports) return -1;
    u32 portsc = xhci_read32(xhci.op_base, portsc_offset(port));
    return (portsc >> 10) & 0xF;
}

/* Reset a port */
int xhci_port_reset(u8 port) {
    if (port < 1 || port > xhci.max_ports) return -1;

    u32 offset = portsc_offset(port);
    u32 portsc = xhci_read32(xhci.op_base, offset);

    /* Clear change bits and set reset */
    portsc &= ~(XHCI_PORTSC_PED);
    portsc |= XHCI_PORTSC_PR;
    xhci_write32(xhci.op_base, offset, portsc);

    /* Wait for reset to complete */
    for (int i = 0; i < 500; i++) {
        delay_us(1000);
        portsc = xhci_read32(xhci.op_base, offset);
        if (portsc & XHCI_PORTSC_PRC) {
            /* Clear reset change bit */
            xhci_write32(xhci.op_base, offset, portsc | XHCI_PORTSC_PRC);
            return 0;
        }
    }

    return -1;
}

/* Enable a slot for a new device */
int xhci_enable_slot(u8* slot_id) {
    XhciTrb trb = {0};
    trb.control = (TRB_TYPE_ENABLE_SLOT << 10);

    int ret = xhci_send_command(&trb);
    if (ret != 0) return ret;

    *slot_id = (trb.control >> 24) & 0xFF;
    return 0;
}

/* Address a device */
int xhci_address_device(u8 slot_id, u8 port, u8 speed) {
    if (slot_id == 0 || slot_id > xhci.max_slots) return -1;

    /* Allocate device context */
    memset(device_contexts[slot_id], 0, 4096);
    xhci.dev_ctx[slot_id] = (XhciDevCtx*)device_contexts[slot_id];
    xhci.dcbaa[slot_id] = (u64)xhci.dev_ctx[slot_id];

    /* Set up input context */
    XhciInputCtx* input = (XhciInputCtx*)input_context_memory;
    memset(input, 0, sizeof(XhciInputCtx));

    /* Add slot and EP0 */
    input->ctrl.add_flags = (1 << 0) | (1 << 1);

    /* Slot context */
    input->slot.info1 = (1 << 27) |          /* Context entries = 1 */
                        ((u32)speed << 20) | /* Speed */
                        (0 << 0);            /* Route string */
    input->slot.info2 = (port << 16);        /* Root hub port */

    /* EP0 context */
    u16 max_packet = (speed == XHCI_SPEED_SUPER) ? 512 :
                     (speed == XHCI_SPEED_HIGH) ? 64 :
                     (speed == XHCI_SPEED_LOW) ? 8 : 64;

    memset(transfer_rings[slot_id], 0, 4096);
    u64 tr_addr = (u64)transfer_rings[slot_id];

    input->endpoints[0].info1 = 0;
    input->endpoints[0].info2 = (EP_TYPE_CONTROL << 3) |
                                 (3 << 1) |  /* CErr = 3 */
                                 ((u32)max_packet << 16);
    input->endpoints[0].tr_dequeue = tr_addr | 1;  /* DCS = 1 */
    input->endpoints[0].tx_info = 8;  /* Average TRB length */

    /* Send Address Device command */
    XhciTrb trb = {0};
    trb.parameter = (u64)input;
    trb.control = (TRB_TYPE_ADDRESS_DEV << 10) | ((u32)slot_id << 24);

    int ret = xhci_send_command(&trb);
    if (ret != 0) {
        console_printf("  xHCI: Address device failed: %d\n", ret);
        return ret;
    }

    xhci.slot_ids[port] = slot_id;
    return 0;
}

/* Control transfer */
int xhci_control_transfer(u8 slot_id, u8 request_type, u8 request,
                          u16 value, u16 index, void* data, u16 length) {
    if (slot_id == 0 || slot_id > xhci.max_slots) return -1;

    XhciTrb* ring = (XhciTrb*)transfer_rings[slot_id];
    static u32 ring_index[16] = {0};
    static u32 ring_cycle[16] = {1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1};

    u32 idx = ring_index[slot_id];
    u32 cycle = ring_cycle[slot_id];

    /* Setup TRB */
    ring[idx].parameter = ((u64)length << 48) |
                          ((u64)index << 32) |
                          ((u64)value << 16) |
                          ((u64)request << 8) |
                          request_type;
    ring[idx].status = 8;  /* Transfer length */
    ring[idx].control = (TRB_TYPE_SETUP << 10) |
                        (1 << 6) |  /* IDT */
                        ((length > 0 ? (request_type & 0x80 ? 3 : 2) : 0) << 16) |
                        cycle;
    idx++;

    /* Data TRB (if needed) */
    if (length > 0 && data) {
        ring[idx].parameter = (u64)data;
        ring[idx].status = length;
        ring[idx].control = (TRB_TYPE_DATA << 10) |
                            ((request_type & 0x80) ? (1 << 16) : 0) |
                            cycle;
        idx++;
    }

    /* Status TRB */
    ring[idx].parameter = 0;
    ring[idx].status = 0;
    ring[idx].control = (TRB_TYPE_STATUS << 10) |
                        ((length > 0 && (request_type & 0x80)) ? 0 : (1 << 16)) |
                        (1 << 5) |  /* IOC */
                        cycle;
    idx++;

    ring_index[slot_id] = idx;

    /* Ring doorbell for EP0 */
    ring_doorbell(slot_id, 1);

    /* Wait for completion */
    for (int timeout = 0; timeout < 5000; timeout++) {
        u32 evt_idx = xhci.event_ring_index;
        XhciTrb* event = &xhci.event_ring[evt_idx];

        if ((event->control & 1) == xhci.event_ring_cycle) {
            u8 type = (event->control >> 10) & 0x3F;
            u8 code = (event->status >> 24) & 0xFF;

            xhci.event_ring_index++;
            if (xhci.event_ring_index >= 64) {
                xhci.event_ring_index = 0;
                xhci.event_ring_cycle ^= 1;
            }

            volatile u8* intr_base = xhci.rt_base + 0x20;
            u64 erdp = (u64)&xhci.event_ring[xhci.event_ring_index] | (1 << 3);
            xhci_write64(intr_base, 0x18, erdp);

            if (type == TRB_TYPE_TRANSFER) {
                if (code == TRB_COMP_SUCCESS || code == TRB_COMP_SHORT_PKT) {
                    return 0;
                }
                return -code;
            }
        }
        delay_us(100);
    }

    return -1;
}

/* Get controller */
XhciController* xhci_get_controller(void) {
    return xhci_initialized ? &xhci : NULL;
}
