/*
 * AlphaOS - Interrupt Descriptor Table
 *
 * Research Summary:
 * - OSDev Wiki: https://wiki.osdev.org/Interrupt_Descriptor_Table
 * - Intel SDM Vol 3A, Section 6.14.1
 *
 * Key gotchas:
 * - x86_64 uses 16-byte IDT entries (not 8 like 32-bit)
 * - Must use IRETQ not IRET in 64-bit mode
 * - Exceptions 8, 10-14, 17, 21, 29, 30 push error codes
 * - IST field allows per-interrupt stacks (useful for double fault)
 */

#ifndef _IDT_H
#define _IDT_H

#include "types.h"

/* Number of IDT entries */
#define IDT_ENTRIES 256

/* Exception vectors (0-31 reserved by CPU) */
#define EXCEPTION_DIVIDE_ERROR      0
#define EXCEPTION_DEBUG             1
#define EXCEPTION_NMI               2
#define EXCEPTION_BREAKPOINT        3
#define EXCEPTION_OVERFLOW          4
#define EXCEPTION_BOUND_RANGE       5
#define EXCEPTION_INVALID_OPCODE    6
#define EXCEPTION_DEVICE_NOT_AVAIL  7
#define EXCEPTION_DOUBLE_FAULT      8
#define EXCEPTION_COPROCESSOR_SEG   9
#define EXCEPTION_INVALID_TSS       10
#define EXCEPTION_SEGMENT_NOT_PRESENT 11
#define EXCEPTION_STACK_FAULT       12
#define EXCEPTION_GENERAL_PROTECTION 13
#define EXCEPTION_PAGE_FAULT        14
#define EXCEPTION_X87_FPU           16
#define EXCEPTION_ALIGNMENT_CHECK   17
#define EXCEPTION_MACHINE_CHECK     18
#define EXCEPTION_SIMD_FPU          19
#define EXCEPTION_VIRTUALIZATION    20
#define EXCEPTION_CONTROL_PROTECTION 21
#define EXCEPTION_HYPERVISOR        28
#define EXCEPTION_VMM_COMMUNICATION 29
#define EXCEPTION_SECURITY          30

/* IRQ vectors (remapped to 32-47) */
#define IRQ_TIMER       32
#define IRQ_KEYBOARD    33
#define IRQ_CASCADE     34
#define IRQ_COM2        35
#define IRQ_COM1        36
#define IRQ_LPT2        37
#define IRQ_FLOPPY      38
#define IRQ_LPT1        39
#define IRQ_RTC         40
#define IRQ_FREE1       41
#define IRQ_FREE2       42
#define IRQ_FREE3       43
#define IRQ_MOUSE       44
#define IRQ_FPU         45
#define IRQ_ATA_PRIMARY 46
#define IRQ_ATA_SECONDARY 47

/* Gate types */
#define IDT_GATE_INTERRUPT  0x8E  /* P=1, DPL=0, Type=interrupt */
#define IDT_GATE_TRAP       0x8F  /* P=1, DPL=0, Type=trap */
#define IDT_GATE_CALL       0x8C  /* P=1, DPL=0, Type=call gate */
#define IDT_GATE_USER       0xEE  /* P=1, DPL=3, Type=interrupt (for syscalls) */

/*
 * IDT Entry (64-bit mode) - 16 bytes
 */
typedef struct {
    u16 offset_low;     /* Bits 0-15 of handler address */
    u16 selector;       /* Code segment selector */
    u8  ist;            /* Interrupt Stack Table offset (0 = don't switch) */
    u8  type_attr;      /* Type and attributes */
    u16 offset_mid;     /* Bits 16-31 of handler address */
    u32 offset_high;    /* Bits 32-63 of handler address */
    u32 reserved;       /* Must be 0 */
} __attribute__((packed)) IdtEntry;

/*
 * IDTR - IDT Register structure for LIDT instruction
 */
typedef struct {
    u16 limit;          /* Size of IDT - 1 */
    u64 base;           /* Base address of IDT */
} __attribute__((packed)) Idtr;

/*
 * Interrupt Frame - pushed by CPU on interrupt
 */
typedef struct {
    /* Pushed by our stub */
    u64 r15, r14, r13, r12, r11, r10, r9, r8;
    u64 rdi, rsi, rbp, rbx, rdx, rcx, rax;
    u64 vector;
    u64 error_code;

    /* Pushed by CPU */
    u64 rip;
    u64 cs;
    u64 rflags;
    u64 rsp;
    u64 ss;
} __attribute__((packed)) InterruptFrame;

/* Initialize IDT */
void idt_init(void);

/* Set a specific IDT entry */
void idt_set_gate(u8 vector, void* handler, u8 type_attr);

/* Exception handler (called from assembly stubs) */
void exception_handler(InterruptFrame* frame);

/* IRQ handler (called from assembly stubs) */
void irq_handler(InterruptFrame* frame);

/* Register a custom interrupt handler */
typedef void (*interrupt_handler_t)(InterruptFrame* frame);
void idt_register_handler(u8 vector, interrupt_handler_t handler);

#endif /* _IDT_H */
