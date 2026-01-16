/*
 * AlphaOS - Intel LPSS GPIO Controller Driver
 *
 * Intel Sunrise Point-LP GPIO for MacBook Pro A1706
 */

#include "gpio.h"
#include "pci.h"
#include "console.h"
#include "acpi.h"

/*
 * Intel Sunrise Point-LP GPIO Memory Map:
 *
 * The GPIO controller is accessed via MMIO, typically found via ACPI.
 * For MacBook Pro A1706, the relevant GPIO for SPI chip select is
 * in the PCH GPIO block.
 *
 * GPIO communities on Sunrise Point-LP:
 * - Community 0: GPP_A, GPP_B (SW)
 * - Community 1: GPP_C, GPP_D, GPP_E, GPP_F (NW)
 * - Community 2: GPP_G (N) - This has SPI CS pins
 * - Community 3: GPP_H (S)
 *
 * Each community has its own MMIO region. The base addresses are
 * typically:
 * - Community 0: PCH_BASE + 0xAF0000
 * - Community 1: PCH_BASE + 0xAE0000
 * - Community 2: PCH_BASE + 0xAD0000
 * - Community 3: PCH_BASE + 0xAC0000
 *
 * On MacBook, we need to find these via ACPI or hardcoded based
 * on reverse engineering.
 */

/* Known GPIO base for Sunrise Point-LP (from Linux driver) */
#define SPT_LP_GPIO_COMMUNITY0_BASE  0xFD6A0000  /* GPP_A, GPP_B */
#define SPT_LP_GPIO_COMMUNITY1_BASE  0xFD6B0000  /* GPP_C, GPP_D, GPP_E */
#define SPT_LP_GPIO_COMMUNITY2_BASE  0xFD6C0000  /* GPP_F, GPP_G */
#define SPT_LP_GPIO_COMMUNITY3_BASE  0xFD6D0000  /* GPP_H */

/* Pad configuration offset per community */
#define GPIO_PAD_BASE_OFFSET   0x400  /* Pad config starts at offset 0x400 */
#define GPIO_PAD_SIZE          8      /* 8 bytes per pad (PADCFG0 + PADCFG1) */

/* GPIO pin to community mapping for SPT-LP */
#define GPP_A_BASE   0
#define GPP_B_BASE   24
#define GPP_C_BASE   48
#define GPP_D_BASE   72
#define GPP_E_BASE   96
#define GPP_F_BASE   120
#define GPP_G_BASE   144
#define GPP_H_BASE   168

/* Global state */
static struct {
    volatile u8* community_base[4];
    bool initialized;
    u32 cs_pin;  /* Chip select pin for SPI */
} gpio;

/* Get community base for a pin */
static volatile u8* get_community_base(u32 pin, u32* local_pin) {
    if (pin < GPP_B_BASE) {
        *local_pin = pin - GPP_A_BASE;
        return gpio.community_base[0];
    } else if (pin < GPP_C_BASE) {
        *local_pin = pin - GPP_B_BASE;
        return gpio.community_base[0];
    } else if (pin < GPP_D_BASE) {
        *local_pin = pin - GPP_C_BASE;
        return gpio.community_base[1];
    } else if (pin < GPP_E_BASE) {
        *local_pin = pin - GPP_D_BASE;
        return gpio.community_base[1];
    } else if (pin < GPP_F_BASE) {
        *local_pin = pin - GPP_E_BASE;
        return gpio.community_base[1];
    } else if (pin < GPP_G_BASE) {
        *local_pin = pin - GPP_F_BASE;
        return gpio.community_base[2];
    } else if (pin < GPP_H_BASE) {
        *local_pin = pin - GPP_G_BASE;
        return gpio.community_base[2];
    } else {
        *local_pin = pin - GPP_H_BASE;
        return gpio.community_base[3];
    }
}

/* Read pad config register */
static u32 gpio_read_padcfg(u32 pin, u32 reg) {
    u32 local_pin;
    volatile u8* base = get_community_base(pin, &local_pin);
    if (!base) return 0;

    u32 offset = GPIO_PAD_BASE_OFFSET + (local_pin * GPIO_PAD_SIZE) + reg;
    return *(volatile u32*)(base + offset);
}

/* Write pad config register */
static void gpio_write_padcfg(u32 pin, u32 reg, u32 value) {
    u32 local_pin;
    volatile u8* base = get_community_base(pin, &local_pin);
    if (!base) return;

    u32 offset = GPIO_PAD_BASE_OFFSET + (local_pin * GPIO_PAD_SIZE) + reg;
    *(volatile u32*)(base + offset) = value;
}

/* Initialize GPIO controller */
int gpio_init(void) {
    console_printf("  GPIO: Initializing Intel Sunrise Point-LP GPIO\n");

    /*
     * Map GPIO community MMIO regions.
     * These are identity-mapped in our simple memory model.
     */
    gpio.community_base[0] = (volatile u8*)SPT_LP_GPIO_COMMUNITY0_BASE;
    gpio.community_base[1] = (volatile u8*)SPT_LP_GPIO_COMMUNITY1_BASE;
    gpio.community_base[2] = (volatile u8*)SPT_LP_GPIO_COMMUNITY2_BASE;
    gpio.community_base[3] = (volatile u8*)SPT_LP_GPIO_COMMUNITY3_BASE;

    /* Verify we can read from the GPIO regions */
    u32 test = *(volatile u32*)gpio.community_base[0];
    console_printf("  GPIO: Community 0 ID = 0x%08x\n", test);

    gpio.initialized = true;
    gpio.cs_pin = 0;

    console_printf("  GPIO: Controller initialized\n");
    return 0;
}

/* Set GPIO direction */
int gpio_set_direction(u32 pin, u32 direction) {
    if (!gpio.initialized) return -1;

    u32 cfg = gpio_read_padcfg(pin, GPIO_PADCFG0_OFFSET);

    /* Clear mode bits, set to GPIO mode */
    cfg &= ~GPIO_PADCFG0_PMODE_MASK;

    if (direction == GPIO_DIR_OUTPUT) {
        /* Enable TX, disable RX */
        cfg &= ~GPIO_PADCFG0_GPIOTXDIS;
        cfg |= GPIO_PADCFG0_GPIORXDIS;
    } else {
        /* Enable RX, disable TX */
        cfg |= GPIO_PADCFG0_GPIOTXDIS;
        cfg &= ~GPIO_PADCFG0_GPIORXDIS;
    }

    gpio_write_padcfg(pin, GPIO_PADCFG0_OFFSET, cfg);
    return 0;
}

/* Set GPIO output value */
int gpio_set_value(u32 pin, u32 value) {
    if (!gpio.initialized) return -1;

    u32 cfg = gpio_read_padcfg(pin, GPIO_PADCFG0_OFFSET);

    if (value) {
        cfg |= GPIO_PADCFG0_GPIOTXSTATE;
    } else {
        cfg &= ~GPIO_PADCFG0_GPIOTXSTATE;
    }

    gpio_write_padcfg(pin, GPIO_PADCFG0_OFFSET, cfg);
    return 0;
}

/* Get GPIO input value */
int gpio_get_value(u32 pin) {
    if (!gpio.initialized) return -1;

    u32 cfg = gpio_read_padcfg(pin, GPIO_PADCFG0_OFFSET);
    return (cfg & GPIO_PADCFG0_GPIORXSTATE) ? 1 : 0;
}

/* Configure GPIO for SPI chip select */
int gpio_configure_spi_cs(u32 pin) {
    if (!gpio.initialized) return -1;

    console_printf("  GPIO: Configuring pin %u for SPI CS\n", pin);

    /* Set as output */
    gpio_set_direction(pin, GPIO_DIR_OUTPUT);

    /* Deassert (high) initially - CS is active low */
    gpio_set_value(pin, 1);

    gpio.cs_pin = pin;

    console_printf("  GPIO: Pin %u configured for SPI CS (active low)\n", pin);
    return 0;
}

/* Assert chip select (active low) */
void gpio_cs_assert(u32 pin) {
    gpio_set_value(pin, 0);

    /* Small delay for CS setup time */
    for (volatile int i = 0; i < 100; i++);
}

/* Deassert chip select */
void gpio_cs_deassert(u32 pin) {
    gpio_set_value(pin, 1);

    /* Small delay for CS hold time */
    for (volatile int i = 0; i < 100; i++);
}

/* Get the configured CS pin */
u32 gpio_get_cs_pin(void) {
    return gpio.cs_pin;
}
