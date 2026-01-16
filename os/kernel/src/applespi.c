/*
 * AlphaOS - Apple SPI Keyboard Driver Implementation
 *
 * Research Summary:
 * - Linux applespi.c: https://github.com/torvalds/linux/blob/master/drivers/input/keyboard/applespi.c
 * - Protocol: Fixed 256-byte SPI packets with GPIO chip select
 * - Device HID: APP000D (topcase containing keyboard + trackpad)
 * - CS pin varies by model, found in ACPI _CRS
 *
 * MacBook Pro A1706 Known Configuration:
 * - Intel Sunrise Point-LP SPI controller (8086:9D24)
 * - GPIO chip select (exact pin depends on board revision)
 * - SPI mode 0, 8-bit, ~8MHz clock
 *
 * Key gotchas:
 * - GPIO bases may differ from documentation
 * - CS pin must be found from ACPI or trial-and-error
 * - 256-byte fixed packet size is mandatory
 */

#include "applespi.h"
#include "spi.h"
#include "gpio.h"
#include "pci.h"
#include "console.h"   /* For cursor updates */
#include "keyboard.h"  /* For scancode tables */
#include "trackpad.h"  /* For trackpad processing */
#include "string.h"
#include "pit.h"       /* For proper delays */

/*
 * MacBook Pro A1706 SPI Chip Select GPIO Pin
 *
 * The Apple SPI keyboard uses a GPIO pin for chip select rather than
 * the SPI controller's native CS. Based on Linux applespi driver,
 * the pin varies by model. For MacBook Pro 13" (A1706), it's typically
 * in the GPP_B or GPP_G group.
 *
 * Known configurations from ACPI:
 * - MacBook Pro 13" 2016/2017: GPP_B19 (pin 43) or similar
 * - The exact pin is in the ACPI _CRS for device APP000D
 *
 * We try multiple pins if the first doesn't work.
 */
#define APPLESPI_CS_GPIO_DEFAULT  43  /* GPP_B19 - common on MBP 2016/2017 */

/* Input buffer */
#define APPLESPI_BUFFER_SIZE 64
static char input_buffer[APPLESPI_BUFFER_SIZE];
static u32 buffer_head = 0;
static u32 buffer_tail = 0;

/* State */
static AppleSpiState state;

/* SPI transfer buffers */
static u8 tx_buffer[256] __attribute__((aligned(64)));
static u8 rx_buffer[256] __attribute__((aligned(64)));

/* HID scancode to ASCII (same as USB keyboard) */
static const char scancode_ascii[128] = {
    0,   0,   0,   0,  'a', 'b', 'c', 'd',
   'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
   'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
   'u', 'v', 'w', 'x', 'y', 'z', '1', '2',
   '3', '4', '5', '6', '7', '8', '9', '0',
  '\n','\x1b','\b','\t',' ', '-', '=', '[',
   ']','\\', '#', ';','\'', '`', ',', '.',
   '/',  0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,  '/', '*', '-', '+',
  '\n', '1', '2', '3', '4', '5', '6', '7',
   '8', '9', '0', '.',  0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,
};

static const char scancode_ascii_shift[128] = {
    0,   0,   0,   0,  'A', 'B', 'C', 'D',
   'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
   'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
   'U', 'V', 'W', 'X', 'Y', 'Z', '!', '@',
   '#', '$', '%', '^', '&', '*', '(', ')',
  '\n','\x1b','\b','\t',' ', '_', '+', '{',
   '}', '|', '~', ':', '"', '~', '<', '>',
   '?',  0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,  '/', '*', '-', '+',
  '\n', '1', '2', '3', '4', '5', '6', '7',
   '8', '9', '0', '.',  0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,
};

/* Buffer push */
static void buffer_push(char c) {
    u32 next = (buffer_head + 1) % APPLESPI_BUFFER_SIZE;
    if (next != buffer_tail) {
        input_buffer[buffer_head] = c;
        buffer_head = next;
    }
}

/* Buffer pop */
static char buffer_pop(void) {
    if (buffer_head == buffer_tail) return 0;
    char c = input_buffer[buffer_tail];
    buffer_tail = (buffer_tail + 1) % APPLESPI_BUFFER_SIZE;
    return c;
}

/* Convert scancode to ASCII */
static char scancode_to_char(u8 scancode, u8 modifiers) {
    if (scancode >= 128) return 0;

    bool shift = (modifiers & (KB_MOD_LSHIFT | KB_MOD_RSHIFT)) != 0;
    char c = shift ? scancode_ascii_shift[scancode] : scancode_ascii[scancode];

    /* Ctrl combinations */
    if (modifiers & (KB_MOD_LCTRL | KB_MOD_RCTRL)) {
        if (c >= 'a' && c <= 'z') return c - 'a' + 1;
        if (c >= 'A' && c <= 'Z') return c - 'A' + 1;
    }

    return c;
}

/* Check if key is new */
static bool is_new_key(u8 scancode, u8* last_keys) {
    for (int i = 0; i < 6; i++) {
        if (last_keys[i] == scancode) return false;
    }
    return true;
}

/* Process keyboard report */
static void process_keyboard_report(AppleKeyboardReport* report) {
    state.modifiers = report->modifiers;
    state.fn_pressed = report->fn_pressed != 0;

    /* Check each key */
    for (int i = 0; i < 6; i++) {
        u8 scancode = report->keys[i];
        if (scancode == 0) continue;

        if (is_new_key(scancode, state.last_keys)) {
            char c = scancode_to_char(scancode, report->modifiers);
            if (c != 0) {
                buffer_push(c);
            }
        }
    }

    /* Save current keys */
    for (int i = 0; i < 6; i++) {
        state.last_keys[i] = report->keys[i];
    }
}

/* Calculate CRC-16-CCITT */
static u16 crc16_ccitt(const u8* data, u32 length) {
    u16 crc = 0xFFFF;
    for (u32 i = 0; i < length; i++) {
        crc ^= (u16)data[i] << 8;
        for (int j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }
        }
    }
    return crc;
}

/* Send read request to Apple SPI device */
static int applespi_read_packet(void) {
    SpiController* spi = spi_get_controller();
    if (!spi) return -1;

    /* Prepare read request - request both keyboard and trackpad */
    memset(tx_buffer, 0, sizeof(tx_buffer));
    tx_buffer[0] = APPLE_SPI_PKT_READ;
    tx_buffer[1] = APPLE_SPI_DEV_KEYBOARD;  /* Device handles both */

    /* SPI transfer with GPIO CS control */
    if (spi_transfer_cs(tx_buffer, rx_buffer, 256) != 0) {
        return -1;
    }

    /* Check response type */
    u8 pkt_type = rx_buffer[0];

    /* Handle keyboard packets */
    if (pkt_type == APPLE_SPI_PKT_KEYBOARD) {
        AppleSpiHeader* header = (AppleSpiHeader*)rx_buffer;
        if (header->length < sizeof(AppleKeyboardReport) + 4) {
            return 0;
        }

        u16 msg_type = *(u16*)(rx_buffer + sizeof(AppleSpiHeader));
        if (msg_type == APPLE_MSG_TYPE_KEYBOARD) {
            u8* report_data = rx_buffer + sizeof(AppleSpiHeader) + 4;
            AppleKeyboardReport* report = (AppleKeyboardReport*)report_data;
            process_keyboard_report(report);
            return 1;
        }
    }

    /* Handle trackpad packets (type 0x31) */
    if (pkt_type == 0x31) {
        /* Pass raw packet to trackpad driver for processing */
        trackpad_process_packet(rx_buffer, 256);
        return 2;  /* Return 2 to indicate trackpad data */
    }

    /* Handle trackpad packets (type 0x28 - alternate format) */
    if (pkt_type == APPLE_SPI_PKT_TRACKPAD) {
        trackpad_process_packet(rx_buffer, 256);
        return 2;
    }

    return 0;
}

/* Find Intel LPSS SPI controller for keyboard */
static PciDevice* find_spi_controller(void) {
    /* Look for Sunrise Point-LP SPI controllers */
    PciDevice* dev = pci_find_device_by_id(PCI_VENDOR_INTEL, PCI_DEVICE_SPT_LP_SPI1);
    if (dev) return dev;

    /* Try alternate device IDs */
    for (u32 i = 0; i < pci_get_device_count(); i++) {
        dev = pci_get_device(i);
        if (dev && dev->vendor_id == PCI_VENDOR_INTEL) {
            /* Check for any LPSS SPI controller */
            if ((dev->device_id >= 0x9D24 && dev->device_id <= 0x9D2A) ||
                (dev->device_id >= 0xA124 && dev->device_id <= 0xA12A)) {
                return dev;
            }
        }
    }

    return NULL;
}

/* Dump buffer for debugging */
static void dump_buffer(const char* label, u8* buf, u32 len) {
    console_printf("  %s:", label);
    for (u32 i = 0; i < len && i < 32; i++) {
        if (i % 16 == 0) console_printf("\n    ");
        console_printf("%02x ", buf[i]);
    }
    console_printf("\n");
}

/*
 * Known GPIO pins for Apple SPI CS on MacBook Pro A1706:
 * Based on Linux applespi driver and ACPI table analysis.
 * Pins are in order of likelihood for MBP 13" 2016/2017.
 */
static const u32 known_cs_pins[] = {
    43,   /* GPP_B19 - most common */
    47,   /* GPP_B23 */
    19,   /* GPP_A19 */
    67,   /* GPP_D19 */
    91,   /* GPP_E19 */
    144,  /* GPP_G0 */
};
#define NUM_KNOWN_PINS (sizeof(known_cs_pins) / sizeof(known_cs_pins[0]))

/* Test if keyboard responds on a given GPIO CS pin */
static int applespi_test_pin(u32 pin) {
    gpio_configure_spi_cs(pin);
    spi_set_cs_gpio(pin);

    /* Small delay for GPIO to stabilize */
    pit_sleep_ms(10);

    /* Send probe packet */
    memset(tx_buffer, 0, sizeof(tx_buffer));
    memset(rx_buffer, 0, sizeof(rx_buffer));
    tx_buffer[0] = APPLE_SPI_PKT_READ;
    tx_buffer[1] = APPLE_SPI_DEV_INFO;

    int ret = spi_transfer_cs(tx_buffer, rx_buffer, 256);
    if (ret != 0) return -1;

    /* Check for meaningful response */
    bool all_zero = true;
    bool all_ff = true;
    for (int i = 0; i < 32; i++) {
        if (rx_buffer[i] != 0x00) all_zero = false;
        if (rx_buffer[i] != 0xFF) all_ff = false;
    }

    return (!all_zero && !all_ff) ? 0 : -1;
}

/* Scan known GPIO pins to find keyboard */
static int applespi_scan_pins(u32* found_pin) {
    console_printf("  Apple SPI: Scanning %u known GPIO pins...\n", (u32)NUM_KNOWN_PINS);

    for (u32 i = 0; i < NUM_KNOWN_PINS; i++) {
        u32 pin = known_cs_pins[i];
        console_printf("    Pin %u: ", pin);

        if (applespi_test_pin(pin) == 0) {
            console_printf("FOUND!\n");
            *found_pin = pin;
            return 0;
        }
        console_printf("no response\n");
    }

    return -1;
}

/* Initialize Apple SPI keyboard */
int applespi_init(void) {
    /* Reset state */
    state.modifiers = 0;
    state.fn_pressed = false;
    state.sequence = 0;
    state.initialized = false;
    buffer_head = 0;
    buffer_tail = 0;

    for (int i = 0; i < 6; i++) {
        state.last_keys[i] = 0;
    }

    console_printf("  Apple SPI: Searching for Intel LPSS SPI controller...\n");

    /* Find SPI controller */
    PciDevice* spi_dev = find_spi_controller();
    if (!spi_dev) {
        console_printf("  Apple SPI: No Intel LPSS SPI found\n");
        return -1;
    }

    console_printf("  Apple SPI: Found SPI at %02x:%02x.%d (VID=%04x DID=%04x)\n",
        spi_dev->bus, spi_dev->device, spi_dev->function,
        spi_dev->vendor_id, spi_dev->device_id);

    /* Initialize GPIO for chip select control */
    console_printf("  Apple SPI: Initializing GPIO for CS control...\n");
    if (gpio_init() != 0) {
        console_printf("  Apple SPI: GPIO init failed (continuing anyway)\n");
    }

    /* Initialize SPI controller first */
    if (spi_init(spi_dev) != 0) {
        console_printf("  Apple SPI: SPI controller init failed\n");
        return -1;
    }

    /*
     * Apple SPI Protocol Notes:
     * - Fixed 256-byte packets
     * - First byte indicates packet type
     * - Uses GPIO for chip select (not automatic SPI CS)
     * - Keyboard data comes as HID reports inside the packet
     */

    /* Try scanning known GPIO pins to find the keyboard */
    u32 found_pin = 0;
    if (applespi_scan_pins(&found_pin) == 0) {
        console_printf("  Apple SPI: Keyboard found on GPIO pin %u!\n", found_pin);
        dump_buffer("RX", rx_buffer, 32);
        state.initialized = true;
        return 0;
    }

    /* No response from any known pin - try default and continue in experimental mode */
    console_printf("  Apple SPI: No response from known pins\n");
    console_printf("  Apple SPI: Use 'gpio <N>' command to try other pins\n");

    /* Set default pin for manual testing */
    gpio_configure_spi_cs(APPLESPI_CS_GPIO_DEFAULT);
    spi_set_cs_gpio(APPLESPI_CS_GPIO_DEFAULT);

    /*
     * Mark as initialized for polling attempts.
     * This allows testing on real hardware where different GPIO pins
     * might need to be tried via the 'gpio' command.
     */
    state.initialized = true;
    console_printf("  Apple SPI: Keyboard in experimental mode (pin %u)\n", APPLESPI_CS_GPIO_DEFAULT);
    return 0;
}

/* Poll for input (handles both keyboard and trackpad) */
void applespi_poll(void) {
    if (!state.initialized) return;

    int result = applespi_read_packet();

    /* If trackpad data was received, update cursor position */
    if (result == 2 && trackpad_ready()) {
        i32 x, y;
        trackpad_get_position(&x, &y);
        console_cursor_move(x, y);
    }
}

/* Check if input available */
bool applespi_available(void) {
    return buffer_head != buffer_tail;
}

/* Get character (blocking) */
char applespi_getchar(void) {
    while (!applespi_available()) {
        applespi_poll();
        /* Use PIT timer for proper ~10ms delay between polls */
        pit_sleep_ms(10);
    }
    return buffer_pop();
}

/* Get character (non-blocking) */
char applespi_trygetchar(void) {
    applespi_poll();
    return buffer_pop();
}

/* Read line */
int applespi_readline(char* buffer, u32 max_len) {
    if (max_len == 0) return 0;

    u32 pos = 0;
    max_len--;

    while (pos < max_len) {
        char c = applespi_getchar();

        if (c == '\n' || c == '\r') {
            buffer[pos] = '\0';
            console_putchar('\n');
            return pos;
        }
        else if (c == '\b' || c == 127) {
            if (pos > 0) {
                pos--;
                console_putchar('\b');
            }
        }
        else if (c >= 32 && c < 127) {
            buffer[pos++] = c;
            console_putchar(c);
        }
        else if (c == 3) {
            buffer[0] = '\0';
            console_puts("^C\n");
            return -1;
        }
    }

    buffer[pos] = '\0';
    return pos;
}

/* Get modifiers */
u8 applespi_get_modifiers(void) {
    return state.modifiers;
}

/* Check Fn key */
bool applespi_fn_pressed(void) {
    return state.fn_pressed;
}
