/*
 * AlphaOS - Intel LPSS SPI Controller Driver
 *
 * For MacBook Pro A1706 internal keyboard/trackpad
 */

#ifndef _SPI_H
#define _SPI_H

#include "types.h"
#include "pci.h"

/* Intel LPSS SPI PCI Device IDs */
#define PCI_VENDOR_INTEL          0x8086
#define PCI_DEVICE_SPT_LP_SPI0    0x9D24  /* Sunrise Point-LP SPI #0 */
#define PCI_DEVICE_SPT_LP_SPI1    0x9D25  /* Sunrise Point-LP SPI #1 */
#define PCI_DEVICE_KBL_LP_SPI0    0x9D24  /* Kaby Lake-LP SPI #0 */
#define PCI_DEVICE_KBL_LP_SPI1    0x9D25  /* Kaby Lake-LP SPI #1 */

/* LPSS SPI Register Offsets */
#define SSCR0           0x00    /* SSP Control Register 0 */
#define SSCR1           0x04    /* SSP Control Register 1 */
#define SSSR            0x08    /* SSP Status Register */
#define SSITR           0x0C    /* SSP Interrupt Test Register */
#define SSDR            0x10    /* SSP Data Register */
#define SSTO            0x28    /* SSP Timeout */
#define SSPSP           0x2C    /* SSP Programmable Serial Protocol */
#define SSTSA           0x30    /* SSP TX Timeslot Active */
#define SSRSA           0x34    /* SSP RX Timeslot Active */
#define SSTSS           0x38    /* SSP Timeslot Status */
#define SSACD           0x3C    /* SSP Audio Clock Divider */

/* LPSS Private Registers (offset 0x200) */
#define LPSS_PRIV_OFFSET     0x200
#define LPSS_PRIV_RESETS     0x04
#define LPSS_PRIV_CAPS       0xFC

/* SSCR0 bits */
#define SSCR0_DSS_MASK       0x0F        /* Data Size Select */
#define SSCR0_FRF_MASK       0x30        /* Frame Format */
#define SSCR0_FRF_SPI        0x00        /* Motorola SPI */
#define SSCR0_ECS            (1 << 6)    /* External Clock Select */
#define SSCR0_SSE            (1 << 7)    /* SSP Enable */
#define SSCR0_SCR_SHIFT      8           /* Serial Clock Rate */
#define SSCR0_EDSS           (1 << 20)   /* Extended Data Size Select */
#define SSCR0_NCS            (1 << 21)   /* Network Clock Select */
#define SSCR0_RIM            (1 << 22)   /* Receive FIFO Overrun Int Mask */
#define SSCR0_TIM            (1 << 23)   /* Transmit FIFO Underrun Int Mask */
#define SSCR0_FRDC_SHIFT     24          /* Frame Rate Divider Control */
#define SSCR0_MOD            (1 << 31)   /* Mode */

/* SSCR1 bits */
#define SSCR1_RIE            (1 << 0)    /* Receive FIFO Interrupt Enable */
#define SSCR1_TIE            (1 << 1)    /* Transmit FIFO Interrupt Enable */
#define SSCR1_LBM            (1 << 2)    /* Loopback Mode */
#define SSCR1_SPO            (1 << 3)    /* SPI Clock Polarity */
#define SSCR1_SPH            (1 << 4)    /* SPI Clock Phase */
#define SSCR1_MWDS           (1 << 5)    /* Microwire Transmit Data Size */
#define SSCR1_TFT_SHIFT      6           /* Transmit FIFO Threshold */
#define SSCR1_RFT_SHIFT      10          /* Receive FIFO Threshold */
#define SSCR1_EFWR           (1 << 14)   /* Enable FIFO Write/Read */
#define SSCR1_STRF           (1 << 15)   /* Select FIFO for EFWR */
#define SSCR1_IFS            (1 << 16)   /* Invert Frame Signal */
#define SSCR1_RWOT           (1 << 23)   /* Receive Without Transmit */
#define SSCR1_TRAIL          (1 << 25)   /* Trailing Byte */
#define SSCR1_TSRE           (1 << 26)   /* DMA TX Service Request Enable */
#define SSCR1_RSRE           (1 << 27)   /* DMA RX Service Request Enable */

/* SSSR bits */
#define SSSR_TNF             (1 << 2)    /* Transmit FIFO Not Full */
#define SSSR_RNE             (1 << 3)    /* Receive FIFO Not Empty */
#define SSSR_BSY             (1 << 4)    /* SSP Busy */
#define SSSR_TFS             (1 << 5)    /* Transmit FIFO Service Request */
#define SSSR_RFS             (1 << 6)    /* Receive FIFO Service Request */
#define SSSR_ROR             (1 << 7)    /* Receive FIFO Overrun */
#define SSSR_TFL_MASK        0x1F00      /* Transmit FIFO Level */
#define SSSR_RFL_MASK        0x1F0000    /* Receive FIFO Level */

/* SPI Controller State */
typedef struct {
    volatile u8* mmio_base;
    volatile u8* priv_base;
    u32 cs_gpio;              /* Chip select GPIO (if used) */
    u32 clock_rate;
    bool initialized;
} SpiController;

/* Initialize SPI controller */
int spi_init(PciDevice* pci_dev);

/* Enable/disable SPI controller */
void spi_enable(void);
void spi_disable(void);

/* Transfer data (full duplex) */
int spi_transfer(const u8* tx_buf, u8* rx_buf, u32 length);

/* Write data */
int spi_write(const u8* data, u32 length);

/* Read data */
int spi_read(u8* buffer, u32 length);

/* Get controller */
SpiController* spi_get_controller(void);

/* Set GPIO pin for chip select */
void spi_set_cs_gpio(u32 gpio_pin);

/* Transfer with GPIO chip select control */
int spi_transfer_cs(const u8* tx_buf, u8* rx_buf, u32 length);

#endif /* _SPI_H */
