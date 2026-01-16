/*
 * AlphaOS - xHCI (USB 3.0) Host Controller Driver
 */

#ifndef _XHCI_H
#define _XHCI_H

#include "types.h"
#include "pci.h"

/* xHCI Capability Registers (offset from MMIO base) */
#define XHCI_CAPLENGTH      0x00    /* Capability Register Length */
#define XHCI_HCIVERSION     0x02    /* Interface Version Number */
#define XHCI_HCSPARAMS1     0x04    /* Structural Parameters 1 */
#define XHCI_HCSPARAMS2     0x08    /* Structural Parameters 2 */
#define XHCI_HCSPARAMS3     0x0C    /* Structural Parameters 3 */
#define XHCI_HCCPARAMS1     0x10    /* Capability Parameters 1 */
#define XHCI_DBOFF          0x14    /* Doorbell Offset */
#define XHCI_RTSOFF         0x18    /* Runtime Register Space Offset */
#define XHCI_HCCPARAMS2     0x1C    /* Capability Parameters 2 */

/* xHCI Operational Registers (offset from Op base) */
#define XHCI_USBCMD         0x00    /* USB Command */
#define XHCI_USBSTS         0x04    /* USB Status */
#define XHCI_PAGESIZE       0x08    /* Page Size */
#define XHCI_DNCTRL         0x14    /* Device Notification Control */
#define XHCI_CRCR           0x18    /* Command Ring Control */
#define XHCI_DCBAAP         0x30    /* Device Context Base Address Array Pointer */
#define XHCI_CONFIG         0x38    /* Configure */

/* USB Command Register bits */
#define XHCI_CMD_RUN        (1 << 0)    /* Run/Stop */
#define XHCI_CMD_HCRST      (1 << 1)    /* Host Controller Reset */
#define XHCI_CMD_INTE       (1 << 2)    /* Interrupter Enable */
#define XHCI_CMD_HSEE       (1 << 3)    /* Host System Error Enable */

/* USB Status Register bits */
#define XHCI_STS_HCH        (1 << 0)    /* HC Halted */
#define XHCI_STS_HSE        (1 << 2)    /* Host System Error */
#define XHCI_STS_EINT       (1 << 3)    /* Event Interrupt */
#define XHCI_STS_PCD        (1 << 4)    /* Port Change Detect */
#define XHCI_STS_CNR        (1 << 11)   /* Controller Not Ready */

/* Port Status/Control Register bits */
#define XHCI_PORTSC_CCS     (1 << 0)    /* Current Connect Status */
#define XHCI_PORTSC_PED     (1 << 1)    /* Port Enabled/Disabled */
#define XHCI_PORTSC_OCA     (1 << 3)    /* Over-current Active */
#define XHCI_PORTSC_PR      (1 << 4)    /* Port Reset */
#define XHCI_PORTSC_PP      (1 << 9)    /* Port Power */
#define XHCI_PORTSC_CSC     (1 << 17)   /* Connect Status Change */
#define XHCI_PORTSC_PEC     (1 << 18)   /* Port Enabled/Disabled Change */
#define XHCI_PORTSC_PRC     (1 << 21)   /* Port Reset Change */

/* Port speed values */
#define XHCI_SPEED_FULL     1
#define XHCI_SPEED_LOW      2
#define XHCI_SPEED_HIGH     3
#define XHCI_SPEED_SUPER    4

/* TRB Types */
#define TRB_TYPE_NORMAL         1
#define TRB_TYPE_SETUP          2
#define TRB_TYPE_DATA           3
#define TRB_TYPE_STATUS         4
#define TRB_TYPE_LINK           6
#define TRB_TYPE_EVENT_DATA     7
#define TRB_TYPE_NOOP           8
#define TRB_TYPE_ENABLE_SLOT    9
#define TRB_TYPE_DISABLE_SLOT   10
#define TRB_TYPE_ADDRESS_DEV    11
#define TRB_TYPE_CONFIG_EP      12
#define TRB_TYPE_EVAL_CTX       13
#define TRB_TYPE_RESET_EP       14
#define TRB_TYPE_STOP_EP        15
#define TRB_TYPE_SET_TR_DEQ     16
#define TRB_TYPE_RESET_DEV      17
#define TRB_TYPE_NOOP_CMD       23

/* Event TRB Types */
#define TRB_TYPE_TRANSFER       32
#define TRB_TYPE_CMD_COMPLETE   33
#define TRB_TYPE_PORT_CHANGE    34

/* TRB completion codes */
#define TRB_COMP_SUCCESS        1
#define TRB_COMP_SHORT_PKT      13

/* Endpoint types */
#define EP_TYPE_CONTROL         4
#define EP_TYPE_BULK_OUT        2
#define EP_TYPE_BULK_IN         6
#define EP_TYPE_INT_OUT         3
#define EP_TYPE_INT_IN          7

/* Transfer Request Block */
typedef struct {
    u64 parameter;
    u32 status;
    u32 control;
} __attribute__((packed)) XhciTrb;

/* Slot Context */
typedef struct {
    u32 info1;
    u32 info2;
    u32 tt_info;
    u32 state;
    u32 reserved[4];
} __attribute__((packed)) XhciSlotCtx;

/* Endpoint Context */
typedef struct {
    u32 info1;
    u32 info2;
    u64 tr_dequeue;
    u32 tx_info;
    u32 reserved[3];
} __attribute__((packed)) XhciEpCtx;

/* Device Context */
typedef struct {
    XhciSlotCtx slot;
    XhciEpCtx endpoints[31];
} __attribute__((packed)) XhciDevCtx;

/* Input Control Context */
typedef struct {
    u32 drop_flags;
    u32 add_flags;
    u32 reserved[6];
} __attribute__((packed)) XhciInputCtrlCtx;

/* Input Context */
typedef struct {
    XhciInputCtrlCtx ctrl;
    XhciSlotCtx slot;
    XhciEpCtx endpoints[31];
} __attribute__((packed)) XhciInputCtx;

/* Event Ring Segment Table Entry */
typedef struct {
    u64 base_addr;
    u32 size;
    u32 reserved;
} __attribute__((packed)) XhciErstEntry;

/* xHCI Controller State */
typedef struct {
    volatile u8* mmio_base;
    volatile u8* op_base;
    volatile u8* rt_base;
    volatile u32* doorbell;

    u8 max_slots;
    u8 max_ports;
    u16 max_intrs;

    /* Device Context Base Address Array */
    u64* dcbaa;

    /* Command Ring */
    XhciTrb* cmd_ring;
    u32 cmd_ring_index;
    u32 cmd_ring_cycle;

    /* Event Ring */
    XhciTrb* event_ring;
    XhciErstEntry* erst;
    u32 event_ring_index;
    u32 event_ring_cycle;

    /* Device tracking */
    u8 slot_ids[16];    /* Slot ID for each port */
    XhciDevCtx* dev_ctx[256];
} XhciController;

/* Initialize xHCI controller */
int xhci_init(PciDevice* pci_dev);

/* Port operations */
int xhci_port_reset(u8 port);
int xhci_get_port_speed(u8 port);
bool xhci_port_connected(u8 port);

/* Device operations */
int xhci_enable_slot(u8* slot_id);
int xhci_address_device(u8 slot_id, u8 port, u8 speed);
int xhci_configure_endpoint(u8 slot_id, u8 ep_num, u8 ep_type, u16 max_packet, u8 interval);

/* Transfer operations */
int xhci_control_transfer(u8 slot_id, u8 request_type, u8 request, u16 value, u16 index, void* data, u16 length);
int xhci_interrupt_transfer(u8 slot_id, u8 ep_num, void* data, u16 length);

/* Get controller */
XhciController* xhci_get_controller(void);

#endif /* _XHCI_H */
