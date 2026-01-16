/*
 * AlphaOS - Intel LPSS GPIO Controller Driver
 *
 * For controlling chip select on MacBook Pro A1706
 */

#ifndef _GPIO_H
#define _GPIO_H

#include "types.h"

/* Intel Sunrise Point-LP GPIO communities */
#define GPIO_COMMUNITY_SOUTHWEST   0  /* GPP_A, GPP_B */
#define GPIO_COMMUNITY_NORTHWEST   1  /* GPP_C, GPP_D, GPP_E */
#define GPIO_COMMUNITY_NORTH       2  /* GPP_F, GPP_G */
#define GPIO_COMMUNITY_SOUTH       3  /* GPP_H */

/* GPIO pad configuration registers (per pad) */
#define GPIO_PADCFG0_OFFSET       0x00
#define GPIO_PADCFG1_OFFSET       0x04

/* PADCFG0 bits */
#define GPIO_PADCFG0_GPIORXDIS    (1 << 9)   /* RX disable */
#define GPIO_PADCFG0_GPIOTXDIS    (1 << 8)   /* TX disable */
#define GPIO_PADCFG0_GPIORXSTATE  (1 << 1)   /* RX state (read) */
#define GPIO_PADCFG0_GPIOTXSTATE  (1 << 0)   /* TX state (read/write) */
#define GPIO_PADCFG0_PMODE_MASK   0x1C00     /* Pad mode */
#define GPIO_PADCFG0_PMODE_GPIO   0x0000     /* GPIO mode */

/* GPIO direction */
#define GPIO_DIR_INPUT   0
#define GPIO_DIR_OUTPUT  1

/* GPIO controller state */
typedef struct {
    volatile u8* base;
    u32 community;
    u32 num_pads;
    bool initialized;
} GpioController;

/* Initialize GPIO controller */
int gpio_init(void);

/* Set GPIO direction */
int gpio_set_direction(u32 pin, u32 direction);

/* Set GPIO output value */
int gpio_set_value(u32 pin, u32 value);

/* Get GPIO input value */
int gpio_get_value(u32 pin);

/* Configure GPIO for SPI chip select */
int gpio_configure_spi_cs(u32 pin);

/* Assert chip select (active low) */
void gpio_cs_assert(u32 pin);

/* Deassert chip select */
void gpio_cs_deassert(u32 pin);

/* Get configured CS pin */
u32 gpio_get_cs_pin(void);

#endif /* _GPIO_H */
