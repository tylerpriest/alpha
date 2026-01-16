/*
 * AlphaOS - Intel LPSS SPI Controller Driver
 */

#include "spi.h"
#include "gpio.h"
#include "console.h"

/* Global controller state */
static SpiController spi;

/* MMIO helpers */
static inline u32 spi_read32(u32 offset) {
    return *(volatile u32*)(spi.mmio_base + offset);
}

static inline void spi_write32(u32 offset, u32 value) {
    *(volatile u32*)(spi.mmio_base + offset) = value;
}

static inline u32 spi_priv_read32(u32 offset) {
    return *(volatile u32*)(spi.priv_base + offset);
}

static inline void spi_priv_write32(u32 offset, u32 value) {
    *(volatile u32*)(spi.priv_base + offset) = value;
}

/* Simple delay */
static void spi_delay(u32 us) {
    for (volatile u32 i = 0; i < us * 100; i++) {
        asm volatile("pause");
    }
}

/* Wait for TX FIFO not full */
static int spi_wait_tx_ready(void) {
    for (int i = 0; i < 10000; i++) {
        if (spi_read32(SSSR) & SSSR_TNF) {
            return 0;
        }
        spi_delay(1);
    }
    return -1;
}

/* Wait for RX FIFO not empty */
static int spi_wait_rx_ready(void) {
    for (int i = 0; i < 10000; i++) {
        if (spi_read32(SSSR) & SSSR_RNE) {
            return 0;
        }
        spi_delay(1);
    }
    return -1;
}

/* Wait for SPI not busy */
static int spi_wait_done(void) {
    for (int i = 0; i < 10000; i++) {
        u32 status = spi_read32(SSSR);
        if (!(status & SSSR_BSY)) {
            return 0;
        }
        spi_delay(1);
    }
    return -1;
}

/* Flush FIFOs */
static void spi_flush_fifos(void) {
    /* Read any remaining data from RX FIFO */
    while (spi_read32(SSSR) & SSSR_RNE) {
        (void)spi_read32(SSDR);
    }

    /* Clear overrun if set */
    u32 status = spi_read32(SSSR);
    if (status & SSSR_ROR) {
        spi_write32(SSSR, SSSR_ROR);
    }
}

/* Read LPSS capabilities to get clock info */
static void spi_read_caps(void) {
    u32 caps = spi_priv_read32(LPSS_PRIV_CAPS);
    console_printf("  SPI: LPSS caps = 0x%08x\n", caps);
}

/* Initialize SPI controller */
int spi_init(PciDevice* pci_dev) {
    if (!pci_dev) return -1;

    console_printf("  SPI: Initializing Intel LPSS SPI %04x:%04x\n",
        pci_dev->vendor_id, pci_dev->device_id);

    /* Enable bus mastering and memory space */
    pci_enable_bus_master(pci_dev);

    /* Get MMIO base */
    u64 mmio_addr = pci_get_bar_address(pci_dev, 0);
    if (mmio_addr == 0) {
        console_printf("  SPI: Invalid BAR0\n");
        return -1;
    }

    console_printf("  SPI: MMIO base = 0x%lx\n", mmio_addr);

    spi.mmio_base = (volatile u8*)mmio_addr;
    spi.priv_base = spi.mmio_base + LPSS_PRIV_OFFSET;

    /* Read capabilities */
    spi_read_caps();

    /* Reset the controller */
    console_printf("  SPI: Resetting controller...\n");
    spi_priv_write32(LPSS_PRIV_RESETS, 0);
    spi_delay(100);
    spi_priv_write32(LPSS_PRIV_RESETS, 3);  /* Release reset */
    spi_delay(100);

    /* Disable SSP first */
    spi_write32(SSCR0, 0);
    spi_delay(10);

    /*
     * Configure for SPI mode:
     * - 8-bit data
     * - SPI frame format (Motorola)
     * - Internal clock
     * - Clock divider for ~8MHz (Apple SPI keyboard speed)
     *
     * Intel LPSS base clock is typically 100MHz or 120MHz
     * SCR divider: output_clk = base_clk / (2 * (SCR + 1))
     * For 8MHz: SCR = (100MHz / (2 * 8MHz)) - 1 = 5.25, use 6
     * For safety, start slower at ~1MHz: SCR = 49
     */
    u32 scr = 6;  /* ~8MHz with 100MHz base (Apple SPI speed) */

    u32 sscr0 = SSCR0_FRF_SPI |           /* SPI format */
                (7 << 0) |                 /* 8-bit data (DSS=7 means 8 bits) */
                (scr << SSCR0_SCR_SHIFT) | /* Clock divider for ~8MHz */
                SSCR0_RIM |                /* Mask RX overrun int */
                SSCR0_TIM;                 /* Mask TX underrun int */

    /*
     * Configure SSCR1:
     * - SPI mode 0 (CPOL=0, CPHA=0) - Apple uses mode 0
     * - FIFO thresholds
     * - Trailing byte handling
     */
    u32 sscr1 = (4 << SSCR1_TFT_SHIFT) |  /* TX threshold = 4 */
                (4 << SSCR1_RFT_SHIFT) |  /* RX threshold = 4 */
                SSCR1_TRAIL;              /* Handle trailing bytes */

    spi_write32(SSCR1, sscr1);
    spi_write32(SSCR0, sscr0);

    console_printf("  SPI: SSCR0 = 0x%08x, SSCR1 = 0x%08x\n", sscr0, sscr1);

    /* Enable SSP */
    sscr0 |= SSCR0_SSE;
    spi_write32(SSCR0, sscr0);

    spi_flush_fifos();

    /* Read status */
    u32 status = spi_read32(SSSR);
    console_printf("  SPI: Status = 0x%08x\n", status);

    spi.initialized = true;
    console_printf("  SPI: Controller initialized at ~8MHz\n");

    return 0;
}

/* Enable SPI */
void spi_enable(void) {
    u32 sscr0 = spi_read32(SSCR0);
    sscr0 |= SSCR0_SSE;
    spi_write32(SSCR0, sscr0);
}

/* Disable SPI */
void spi_disable(void) {
    spi_wait_done();
    u32 sscr0 = spi_read32(SSCR0);
    sscr0 &= ~SSCR0_SSE;
    spi_write32(SSCR0, sscr0);
}

/* Full duplex transfer */
int spi_transfer(const u8* tx_buf, u8* rx_buf, u32 length) {
    if (!spi.initialized) return -1;

    for (u32 i = 0; i < length; i++) {
        /* Wait for TX FIFO ready */
        if (spi_wait_tx_ready() != 0) {
            return -1;
        }

        /* Write TX data */
        u8 tx_byte = tx_buf ? tx_buf[i] : 0xFF;
        spi_write32(SSDR, tx_byte);

        /* Wait for RX data */
        if (spi_wait_rx_ready() != 0) {
            return -1;
        }

        /* Read RX data */
        u8 rx_byte = spi_read32(SSDR) & 0xFF;
        if (rx_buf) {
            rx_buf[i] = rx_byte;
        }
    }

    return spi_wait_done();
}

/* Write only */
int spi_write(const u8* data, u32 length) {
    return spi_transfer(data, NULL, length);
}

/* Read only */
int spi_read(u8* buffer, u32 length) {
    return spi_transfer(NULL, buffer, length);
}

/* Get controller */
SpiController* spi_get_controller(void) {
    return spi.initialized ? &spi : NULL;
}

/* Set GPIO pin for chip select */
void spi_set_cs_gpio(u32 gpio_pin) {
    spi.cs_gpio = gpio_pin;
    console_printf("  SPI: CS GPIO set to pin %u\n", gpio_pin);
}

/* Transfer with GPIO chip select control */
int spi_transfer_cs(const u8* tx_buf, u8* rx_buf, u32 length) {
    if (!spi.initialized) return -1;

    /* Assert chip select via GPIO */
    if (spi.cs_gpio != 0) {
        gpio_cs_assert(spi.cs_gpio);
    }

    /* Perform transfer */
    int result = spi_transfer(tx_buf, rx_buf, length);

    /* Deassert chip select */
    if (spi.cs_gpio != 0) {
        gpio_cs_deassert(spi.cs_gpio);
    }

    return result;
}
