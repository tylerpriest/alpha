/*
 * AlphaOS - Programmable Interval Timer (8253/8254 PIT)
 *
 * Research Summary:
 * - OSDev Wiki: https://wiki.osdev.org/Programmable_Interval_Timer
 * - Intel 8254 datasheet
 *
 * Key facts:
 * - Base frequency: 1.193182 MHz (actually 1193182 Hz)
 * - Channel 0 connected to IRQ0 (vector 32)
 * - Divisor = base_freq / desired_freq
 * - Max divisor is 65535 (~18.2 Hz min)
 */

#ifndef _PIT_H
#define _PIT_H

#include "types.h"

/* PIT base frequency (1.193182 MHz) */
#define PIT_FREQUENCY 1193182

/* Default tick frequency (100 Hz = 10ms per tick) */
#define PIT_DEFAULT_HZ 100

/* I/O ports */
#define PIT_CHANNEL0_DATA   0x40
#define PIT_CHANNEL1_DATA   0x41
#define PIT_CHANNEL2_DATA   0x42
#define PIT_COMMAND         0x43

/* Command byte bits */
#define PIT_CMD_CHANNEL0    (0 << 6)
#define PIT_CMD_CHANNEL1    (1 << 6)
#define PIT_CMD_CHANNEL2    (2 << 6)
#define PIT_CMD_ACCESS_LO   (1 << 4)
#define PIT_CMD_ACCESS_HI   (2 << 4)
#define PIT_CMD_ACCESS_LOHI (3 << 4)
#define PIT_CMD_MODE0       (0 << 1)  /* Interrupt on terminal count */
#define PIT_CMD_MODE2       (2 << 1)  /* Rate generator */
#define PIT_CMD_MODE3       (3 << 1)  /* Square wave generator */
#define PIT_CMD_BINARY      (0 << 0)  /* Binary counting */

/* Initialize PIT with default 100Hz frequency */
void pit_init(void);

/* Initialize PIT with custom frequency (Hz) */
void pit_init_freq(u32 hz);

/* Get current tick count (increments at PIT_DEFAULT_HZ) */
u64 pit_get_ticks(void);

/* Get uptime in milliseconds */
u64 pit_get_uptime_ms(void);

/* Get uptime in seconds */
u64 pit_get_uptime_sec(void);

/* Sleep for specified milliseconds (busy wait) */
void pit_sleep_ms(u32 ms);

/* Sleep for specified ticks (busy wait) */
void pit_sleep_ticks(u64 ticks);

/* PIT IRQ handler (called from IDT) */
void pit_irq_handler(void);

#endif /* _PIT_H */
