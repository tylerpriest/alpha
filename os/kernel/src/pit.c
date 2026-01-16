/*
 * AlphaOS - Programmable Interval Timer Implementation
 *
 * Provides system tick, uptime tracking, and delay functions.
 * Uses PIT channel 0 connected to IRQ0 (vector 32 after PIC remap).
 */

#include "pit.h"
#include "idt.h"
#include "console.h"

/* Current tick count (volatile since modified in IRQ handler) */
static volatile u64 pit_ticks = 0;

/* Configured frequency */
static u32 pit_hz = PIT_DEFAULT_HZ;

/* Unmask PIC IRQ */
static void pic_unmask_irq(u8 irq) {
    u16 port;
    u8 mask;

    if (irq < 8) {
        port = 0x21;  /* PIC1 data */
    } else {
        port = 0xA1;  /* PIC2 data */
        irq -= 8;
    }

    mask = inb(port);
    mask &= ~(1 << irq);
    outb(port, mask);
}

/* IRQ0 handler - called from IDT on each timer tick */
static void pit_irq0_handler(InterruptFrame* frame) {
    (void)frame;  /* Unused */
    pit_ticks++;
}

/* Initialize PIT with specified frequency */
void pit_init_freq(u32 hz) {
    /* Calculate divisor */
    u32 divisor = PIT_FREQUENCY / hz;

    /* Clamp divisor to valid range (max 16 bits) */
    if (divisor > 65535) {
        divisor = 65535;
        hz = PIT_FREQUENCY / divisor;
    }
    if (divisor < 1) {
        divisor = 1;
    }

    pit_hz = hz;

    /* Configure channel 0 for rate generator mode */
    u8 cmd = PIT_CMD_CHANNEL0 | PIT_CMD_ACCESS_LOHI | PIT_CMD_MODE2 | PIT_CMD_BINARY;
    outb(PIT_COMMAND, cmd);

    /* Set divisor (low byte first, then high byte) */
    outb(PIT_CHANNEL0_DATA, (u8)(divisor & 0xFF));
    outb(PIT_CHANNEL0_DATA, (u8)((divisor >> 8) & 0xFF));

    /* Register IRQ handler with IDT */
    idt_register_handler(IRQ_TIMER, pit_irq0_handler);

    /* Unmask IRQ0 in PIC */
    pic_unmask_irq(0);

    console_printf("  PIT: %u Hz (divisor %u)\n", hz, divisor);
}

/* Initialize PIT with default 100Hz frequency */
void pit_init(void) {
    pit_init_freq(PIT_DEFAULT_HZ);
}

/* Get current tick count */
u64 pit_get_ticks(void) {
    return pit_ticks;
}

/* Get uptime in milliseconds */
u64 pit_get_uptime_ms(void) {
    return (pit_ticks * 1000) / pit_hz;
}

/* Get uptime in seconds */
u64 pit_get_uptime_sec(void) {
    return pit_ticks / pit_hz;
}

/* Sleep for specified milliseconds (busy wait) */
void pit_sleep_ms(u32 ms) {
    u64 target_ticks = pit_ticks + ((u64)ms * pit_hz) / 1000;
    if (target_ticks == pit_ticks) {
        target_ticks++;  /* At least 1 tick */
    }

    while (pit_ticks < target_ticks) {
        hlt();  /* Wait for interrupt */
    }
}

/* Sleep for specified ticks (busy wait) */
void pit_sleep_ticks(u64 ticks) {
    u64 target = pit_ticks + ticks;

    while (pit_ticks < target) {
        hlt();  /* Wait for interrupt */
    }
}

/* Direct IRQ handler (if not using custom handler registration) */
void pit_irq_handler(void) {
    pit_ticks++;
}
