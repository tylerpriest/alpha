/*
 * AlphaOS - Interrupt Descriptor Table Implementation
 *
 * Sets up IDT for x86_64 long mode with:
 * - Exception handlers (0-31)
 * - IRQ handlers (32-47) via PIC
 * - Future: APIC support
 */

#include "idt.h"
#include "console.h"
#include "string.h"

/* IDT table - 256 entries, 16 bytes each */
static IdtEntry idt[IDT_ENTRIES] __attribute__((aligned(16)));

/* IDTR for lidt instruction */
static Idtr idtr;

/* Custom handlers registered by drivers */
static interrupt_handler_t custom_handlers[IDT_ENTRIES];

/* GDT code segment selector (set by Limine, typically 0x28) */
#define KERNEL_CS 0x28

/* Exception names for debugging */
static const char* exception_names[] = {
    "Divide Error",
    "Debug",
    "NMI",
    "Breakpoint",
    "Overflow",
    "Bound Range Exceeded",
    "Invalid Opcode",
    "Device Not Available",
    "Double Fault",
    "Coprocessor Segment Overrun",
    "Invalid TSS",
    "Segment Not Present",
    "Stack-Segment Fault",
    "General Protection Fault",
    "Page Fault",
    "Reserved",
    "x87 FPU Error",
    "Alignment Check",
    "Machine Check",
    "SIMD Exception",
    "Virtualization Exception",
    "Control Protection Exception",
    "Reserved", "Reserved", "Reserved", "Reserved",
    "Reserved", "Reserved",
    "Hypervisor Injection",
    "VMM Communication",
    "Security Exception",
    "Reserved"
};

/* External ISR stubs from assembly */
extern void isr_stub_0(void);
extern void isr_stub_1(void);
extern void isr_stub_2(void);
extern void isr_stub_3(void);
extern void isr_stub_4(void);
extern void isr_stub_5(void);
extern void isr_stub_6(void);
extern void isr_stub_7(void);
extern void isr_stub_8(void);
extern void isr_stub_9(void);
extern void isr_stub_10(void);
extern void isr_stub_11(void);
extern void isr_stub_12(void);
extern void isr_stub_13(void);
extern void isr_stub_14(void);
extern void isr_stub_15(void);
extern void isr_stub_16(void);
extern void isr_stub_17(void);
extern void isr_stub_18(void);
extern void isr_stub_19(void);
extern void isr_stub_20(void);
extern void isr_stub_21(void);
extern void isr_stub_22(void);
extern void isr_stub_23(void);
extern void isr_stub_24(void);
extern void isr_stub_25(void);
extern void isr_stub_26(void);
extern void isr_stub_27(void);
extern void isr_stub_28(void);
extern void isr_stub_29(void);
extern void isr_stub_30(void);
extern void isr_stub_31(void);

/* IRQ stubs (32-47) */
extern void isr_stub_32(void);
extern void isr_stub_33(void);
extern void isr_stub_34(void);
extern void isr_stub_35(void);
extern void isr_stub_36(void);
extern void isr_stub_37(void);
extern void isr_stub_38(void);
extern void isr_stub_39(void);
extern void isr_stub_40(void);
extern void isr_stub_41(void);
extern void isr_stub_42(void);
extern void isr_stub_43(void);
extern void isr_stub_44(void);
extern void isr_stub_45(void);
extern void isr_stub_46(void);
extern void isr_stub_47(void);

/* ISR stub table */
static void* isr_stubs[48] = {
    isr_stub_0,  isr_stub_1,  isr_stub_2,  isr_stub_3,
    isr_stub_4,  isr_stub_5,  isr_stub_6,  isr_stub_7,
    isr_stub_8,  isr_stub_9,  isr_stub_10, isr_stub_11,
    isr_stub_12, isr_stub_13, isr_stub_14, isr_stub_15,
    isr_stub_16, isr_stub_17, isr_stub_18, isr_stub_19,
    isr_stub_20, isr_stub_21, isr_stub_22, isr_stub_23,
    isr_stub_24, isr_stub_25, isr_stub_26, isr_stub_27,
    isr_stub_28, isr_stub_29, isr_stub_30, isr_stub_31,
    isr_stub_32, isr_stub_33, isr_stub_34, isr_stub_35,
    isr_stub_36, isr_stub_37, isr_stub_38, isr_stub_39,
    isr_stub_40, isr_stub_41, isr_stub_42, isr_stub_43,
    isr_stub_44, isr_stub_45, isr_stub_46, isr_stub_47
};

/* Set an IDT gate */
void idt_set_gate(u8 vector, void* handler, u8 type_attr) {
    u64 addr = (u64)handler;

    idt[vector].offset_low  = addr & 0xFFFF;
    idt[vector].selector    = KERNEL_CS;
    idt[vector].ist         = 0;  /* Don't use IST */
    idt[vector].type_attr   = type_attr;
    idt[vector].offset_mid  = (addr >> 16) & 0xFFFF;
    idt[vector].offset_high = (addr >> 32) & 0xFFFFFFFF;
    idt[vector].reserved    = 0;
}

/* PIC ports */
#define PIC1_CMD  0x20
#define PIC1_DATA 0x21
#define PIC2_CMD  0xA0
#define PIC2_DATA 0xA1

/* Small delay for PIC (uses outb from types.h) */
static inline void io_wait(void) {
    outb(0x80, 0);
}

/* Remap PIC to vectors 32-47 */
static void pic_remap(void) {
    u8 mask1, mask2;

    /* Save masks */
    mask1 = inb(PIC1_DATA);
    mask2 = inb(PIC2_DATA);

    /* Start initialization sequence */
    outb(PIC1_CMD, 0x11); io_wait();
    outb(PIC2_CMD, 0x11); io_wait();

    /* Set vector offsets */
    outb(PIC1_DATA, 32); io_wait();  /* PIC1 starts at 32 */
    outb(PIC2_DATA, 40); io_wait();  /* PIC2 starts at 40 */

    /* Tell PICs about each other */
    outb(PIC1_DATA, 4); io_wait();   /* PIC2 at IRQ2 */
    outb(PIC2_DATA, 2); io_wait();   /* Cascade identity */

    /* 8086 mode */
    outb(PIC1_DATA, 0x01); io_wait();
    outb(PIC2_DATA, 0x01); io_wait();

    /* Restore masks */
    outb(PIC1_DATA, mask1);
    outb(PIC2_DATA, mask2);
}

/* Send End-Of-Interrupt to PIC */
static void pic_eoi(u8 irq) {
    if (irq >= 8) {
        outb(PIC2_CMD, 0x20);
    }
    outb(PIC1_CMD, 0x20);
}

/* Initialize IDT */
void idt_init(void) {
    /* Clear IDT and handlers */
    memset(idt, 0, sizeof(idt));
    memset(custom_handlers, 0, sizeof(custom_handlers));

    /* Set up exception handlers (0-31) */
    for (int i = 0; i < 32; i++) {
        idt_set_gate(i, isr_stubs[i], IDT_GATE_INTERRUPT);
    }

    /* Set up IRQ handlers (32-47) */
    for (int i = 32; i < 48; i++) {
        idt_set_gate(i, isr_stubs[i], IDT_GATE_INTERRUPT);
    }

    /* Remap PIC */
    pic_remap();

    /* Load IDT */
    idtr.limit = sizeof(idt) - 1;
    idtr.base = (u64)&idt;

    asm volatile("lidt %0" : : "m"(idtr));

    console_printf("  IDT: Loaded at 0x%lx (%d entries)\n",
                   (u64)&idt, IDT_ENTRIES);
}

/* Register a custom handler */
void idt_register_handler(u8 vector, interrupt_handler_t handler) {
    custom_handlers[vector] = handler;
}

/* Exception handler - called from assembly */
void exception_handler(InterruptFrame* frame) {
    /* Check for custom handler */
    if (custom_handlers[frame->vector]) {
        custom_handlers[frame->vector](frame);
        return;
    }

    /* Default: print info and halt */
    console_set_color(0x00FF0000, 0x00000000);  /* Red on black */
    console_printf("\n!!! EXCEPTION: %s (vector %lu)\n",
                   frame->vector < 32 ? exception_names[frame->vector] : "Unknown",
                   frame->vector);

    console_set_color(0x00FFFFFF, 0x00000000);
    console_printf("Error code: 0x%lx\n", frame->error_code);
    console_printf("RIP: 0x%lx  CS: 0x%lx\n", frame->rip, frame->cs);
    console_printf("RSP: 0x%lx  SS: 0x%lx\n", frame->rsp, frame->ss);
    console_printf("RFLAGS: 0x%lx\n", frame->rflags);
    console_printf("\nRegisters:\n");
    console_printf("RAX: 0x%lx  RBX: 0x%lx\n", frame->rax, frame->rbx);
    console_printf("RCX: 0x%lx  RDX: 0x%lx\n", frame->rcx, frame->rdx);
    console_printf("RSI: 0x%lx  RDI: 0x%lx\n", frame->rsi, frame->rdi);
    console_printf("RBP: 0x%lx  R8:  0x%lx\n", frame->rbp, frame->r8);
    console_printf("R9:  0x%lx  R10: 0x%lx\n", frame->r9, frame->r10);
    console_printf("R11: 0x%lx  R12: 0x%lx\n", frame->r11, frame->r12);
    console_printf("R13: 0x%lx  R14: 0x%lx\n", frame->r13, frame->r14);
    console_printf("R15: 0x%lx\n", frame->r15);

    /* Page fault specific info */
    if (frame->vector == EXCEPTION_PAGE_FAULT) {
        u64 cr2;
        asm volatile("mov %%cr2, %0" : "=r"(cr2));
        console_printf("\nPage Fault Address (CR2): 0x%lx\n", cr2);
        console_printf("Flags: %s %s %s\n",
                       frame->error_code & 1 ? "Present" : "Not-Present",
                       frame->error_code & 2 ? "Write" : "Read",
                       frame->error_code & 4 ? "User" : "Supervisor");
    }

    console_printf("\nSystem halted.\n");

    /* Halt */
    asm volatile("cli; hlt");
    while (1) { asm volatile("hlt"); }
}

/* IRQ handler - called from assembly */
void irq_handler(InterruptFrame* frame) {
    u8 irq = frame->vector - 32;

    /* Check for custom handler */
    if (custom_handlers[frame->vector]) {
        custom_handlers[frame->vector](frame);
    }

    /* Send EOI */
    pic_eoi(irq);
}
