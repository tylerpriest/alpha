/*
 * AlphaOS - Kernel Main Entry Point
 *
 * An AI-native operating system for MacBook Pro A1706
 */

#include "limine.h"
#include "types.h"
#include "console.h"
#include "heap.h"
#include "idt.h"
#include "pit.h"
#include "acpi.h"
#include "gpio.h"
#include "spi.h"
#include "fpu.h"
#include "ai.h"
#include "pci.h"
#include "xhci.h"
#include "usb.h"
#include "keyboard.h"
#include "applespi.h"
#include "trackpad.h"
#include "cdcecm.h"
#include "ethernet.h"
#include "ip.h"
#include "arp.h"
#include "udp.h"
#include "tcp.h"
#include "dhcp.h"
#include "dns.h"

/* Keyboard input source */
#define KB_SOURCE_NONE     0
#define KB_SOURCE_APPLESPI 1
#define KB_SOURCE_USB      2

static int keyboard_source = KB_SOURCE_NONE;

/* Set the base revision to 2 (required for newer Limine features) */
__attribute__((used, section(".requests")))
static volatile uint64_t limine_base_revision[3] = {0xf9562b2d5c95a6c8, 0x6a7b384944536bdc, 2};

/* Request framebuffer from bootloader */
__attribute__((used, section(".requests")))
static volatile struct limine_framebuffer_request framebuffer_request = {
    .id = LIMINE_FRAMEBUFFER_REQUEST,
    .revision = 0
};

/* Request bootloader info */
__attribute__((used, section(".requests")))
static volatile struct limine_bootloader_info_request bootloader_info_request = {
    .id = LIMINE_BOOTLOADER_INFO_REQUEST,
    .revision = 0
};

/* Request memory map */
__attribute__((used, section(".requests")))
static volatile struct limine_memmap_request memmap_request = {
    .id = LIMINE_MEMMAP_REQUEST,
    .revision = 0
};

/* Request boot time */
__attribute__((used, section(".requests")))
static volatile struct limine_boot_time_request boot_time_request = {
    .id = LIMINE_BOOT_TIME_REQUEST,
    .revision = 0
};

/* Request modules (for loading AI model) */
__attribute__((used, section(".requests")))
static volatile struct limine_module_request module_request = {
    .id = LIMINE_MODULE_REQUEST,
    .revision = 0
};

/* Halt and catch fire */
static void NORETURN hcf(void) {
    cli();
    for (;;) {
        hlt();
    }
}

/* Calculate total usable memory */
static u64 calculate_memory(void) {
    u64 total = 0;

    if (memmap_request.response == NULL) {
        return 0;
    }

    for (u64 i = 0; i < memmap_request.response->entry_count; i++) {
        struct limine_memmap_entry* entry = memmap_request.response->entries[i];
        if (entry->type == LIMINE_MEMMAP_USABLE) {
            total += entry->length;
        }
    }

    return total;
}

/* Initialize heap from memory map */
static int init_heap(void) {
    if (memmap_request.response == NULL) {
        return -1;
    }

    /* Find a suitable usable memory region for heap (at least 1MB) */
    for (u64 i = 0; i < memmap_request.response->entry_count; i++) {
        struct limine_memmap_entry* entry = memmap_request.response->entries[i];
        if (entry->type == LIMINE_MEMMAP_USABLE && entry->length >= 1024 * 1024) {
            /* Use up to 4MB for heap, leave rest for other uses */
            usize heap_size = entry->length;
            if (heap_size > 4 * 1024 * 1024) {
                heap_size = 4 * 1024 * 1024;
            }
            heap_init((void*)entry->base, heap_size);
            return 0;
        }
    }

    return -1;
}

/* Draw the AlphaOS logo */
static void draw_logo(void) {
    console_set_color(COLOR_ALPHA_ACC, COLOR_ALPHA_BG);

    console_puts("\n");
    console_puts("     ___    __      __          ____  _____\n");
    console_puts("    /   |  / /___  / /_  ____ _/ __ \\/ ___/\n");
    console_puts("   / /| | / / __ \\/ __ \\/ __ `/ / / /\\__ \\ \n");
    console_puts("  / ___ |/ / /_/ / / / / /_/ / /_/ /___/ / \n");
    console_puts(" /_/  |_/_/ .___/_/ /_/\\__,_/\\____//____/  \n");
    console_puts("         /_/                               \n");

    console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);
}

/* Draw a separator line */
static void draw_separator(void) {
    console_set_color(COLOR_DARK_GRAY, COLOR_ALPHA_BG);
    for (u32 i = 0; i < console_get_cols(); i++) {
        console_putchar('-');
    }
    console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);
}

/* Print OK status */
static void print_ok(const char* msg) {
    console_set_color(COLOR_ALPHA_OK, COLOR_ALPHA_BG);
    console_puts("  [OK] ");
    console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);
    console_puts(msg);
    console_putchar('\n');
}

/* Print FAIL status */
static void print_fail(const char* msg) {
    console_set_color(COLOR_ALPHA_ERR, COLOR_ALPHA_BG);
    console_puts("  [FAIL] ");
    console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);
    console_puts(msg);
    console_putchar('\n');
}

/* Print INFO status */
static void print_info(const char* msg) {
    console_set_color(COLOR_ALPHA_ACC, COLOR_ALPHA_BG);
    console_puts("  [..] ");
    console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);
    console_puts(msg);
    console_putchar('\n');
}

/* Print system information */
static void print_system_info(void) {
    /* Bootloader info */
    if (bootloader_info_request.response != NULL) {
        console_printf("  Bootloader: %s %s\n",
            bootloader_info_request.response->name,
            bootloader_info_request.response->version);
    }

    /* Framebuffer info */
    if (framebuffer_request.response != NULL &&
        framebuffer_request.response->framebuffer_count > 0) {
        struct limine_framebuffer* fb = framebuffer_request.response->framebuffers[0];
        console_printf("  Display: %lux%lu @ %dbpp\n",
            fb->width, fb->height, fb->bpp);
    }

    /* Memory info */
    u64 mem_bytes = calculate_memory();
    u64 mem_mb = mem_bytes / (1024 * 1024);
    console_printf("  Memory: %lu MB available\n", mem_mb);

    /* Console info */
    console_printf("  Console: %lu cols x %lu rows\n",
        (u64)console_get_cols(), (u64)console_get_rows());

    /* Keyboard info */
    const char* kb_str = keyboard_source == KB_SOURCE_APPLESPI ? "Internal (Apple SPI)" :
                         keyboard_source == KB_SOURCE_USB ? "External (USB)" : "None";
    console_printf("  Keyboard: %s\n", kb_str);
}

/* Find a module by filename (e.g., "model.bin") */
static struct limine_file* find_module(const char* filename) {
    if (module_request.response == NULL) {
        return NULL;
    }

    usize name_len = 0;
    while (filename[name_len]) name_len++;

    for (u64 i = 0; i < module_request.response->module_count; i++) {
        struct limine_file* mod = module_request.response->modules[i];
        if (mod->path) {
            /* Find the filename part (after last /) */
            const char* path_filename = mod->path;
            for (const char* p = mod->path; *p; p++) {
                if (*p == '/') path_filename = p + 1;
            }

            /* Compare filenames */
            bool match = true;
            for (usize j = 0; j <= name_len; j++) {
                if (filename[j] != path_filename[j]) {
                    match = false;
                    break;
                }
            }
            if (match) return mod;
        }
    }
    return NULL;
}

/* Initialize hardware */
static bool init_hardware(void) {
    console_puts("\n");

    /* Initialize heap first (needed for dynamic allocation) */
    if (init_heap() == 0) {
        print_ok("Heap initialized");
    } else {
        print_fail("Heap initialization failed");
    }

    /* Initialize FPU/SSE (needed for AI/LLM inference) */
    if (fpu_init() == 0) {
        print_ok("FPU/SSE initialized");
    } else {
        print_fail("FPU initialization failed");
    }

    /* Find AI model module (loaded by bootloader) */
    void* model_data = NULL;
    u64 model_size = 0;
    struct limine_file* model_module = find_module("model.bin");
    if (model_module) {
        model_data = model_module->address;
        model_size = model_module->size;
        console_printf("  Found model: %s (%lu KB)\n",
                       model_module->path, model_size / 1024);
    }

    /* Find tokenizer module */
    void* tokenizer_data = NULL;
    u64 tokenizer_size = 0;
    struct limine_file* tokenizer_module = find_module("tokenizer.bin");
    if (tokenizer_module) {
        tokenizer_data = tokenizer_module->address;
        tokenizer_size = tokenizer_module->size;
        console_printf("  Found tokenizer: %s (%lu KB)\n",
                       tokenizer_module->path, tokenizer_size / 1024);
    }

    /* Initialize AI subsystem with model and tokenizer data */
    if (ai_init(model_data, model_size, tokenizer_data, tokenizer_size) == 0) {
        print_ok("AI engine initialized");
    } else {
        print_fail("AI initialization failed");
    }

    /* Initialize ACPI (needed for Apple SPI device discovery) */
    if (acpi_init() == 0) {
        print_ok("ACPI initialized");
        /* Dump tables for debugging */
        acpi_dump_tables();
    } else {
        print_fail("ACPI initialization failed");
    }

    /* Initialize PCI */
    pci_init();

    /* Check if Apple SPI keyboard exists via ACPI */
    u64 spi_base = 0;
    u32 gpio_pin = 0;
    bool have_apple_spi = (acpi_find_apple_spi(&spi_base, &gpio_pin) == 0);

    if (have_apple_spi) {
        print_info("ACPI: Apple keyboard device (APP000D) found");
    } else {
        print_info("ACPI: Apple keyboard device not found");
    }

    /* Try Apple SPI keyboard first (internal MacBook keyboard) */
    print_info("Detecting internal keyboard (Apple SPI)...");
    if (applespi_init() == 0) {
        print_ok("Internal keyboard ready (Apple SPI)");
        keyboard_source = KB_SOURCE_APPLESPI;

        /* Initialize trackpad (shares SPI with keyboard) */
        struct limine_framebuffer* fb = framebuffer_request.response->framebuffers[0];
        if (trackpad_init(fb->width, fb->height) == 0) {
            print_ok("Internal trackpad ready (Apple SPI)");
            /* Show cursor in center of screen */
            console_cursor_move(fb->width / 2, fb->height / 2);
            console_cursor_show();
        }
    } else {
        print_fail("Internal keyboard not found");
    }

    /* Initialize USB controller (for keyboard fallback and USB Ethernet) */
    PciDevice* xhci_dev = pci_find_device(PCI_CLASS_SERIAL_BUS, PCI_SUBCLASS_USB, PCI_PROGIF_XHCI);
    if (xhci_dev) {
        if (xhci_init(xhci_dev) == 0) {
            print_ok("xHCI controller initialized");

            usb_init();
            usb_enumerate();

            /* Try USB keyboard if no Apple SPI keyboard */
            if (keyboard_source == KB_SOURCE_NONE) {
                print_info("Trying USB keyboard...");
                if (keyboard_init() == 0) {
                    print_ok("USB keyboard ready");
                    keyboard_source = KB_SOURCE_USB;
                }
            }

            /* Try to initialize USB Ethernet (CDC-ECM) */
            if (cdcecm_probe() == 0) {
                print_ok("USB Ethernet adapter ready");
            }
        }
    }

    /* Initialize network stack */
    ip_init();
    arp_init();
    udp_init();
    tcp_init();
    dhcp_init();
    dns_init();

    /* Try DHCP if we have a network interface */
    if (eth_get_device() && eth_get_device()->link_up) {
        print_info("Starting DHCP configuration...");
        if (dhcp_configure(10000) == 0) {
            print_ok("Network configured via DHCP");
        } else {
            print_fail("DHCP configuration failed");
        }
    }

    if (keyboard_source == KB_SOURCE_NONE) {
        print_fail("No keyboard found");
        return false;
    }

    return true;
}

/* Unified keyboard getchar */
static char kb_getchar(void) {
    if (keyboard_source == KB_SOURCE_APPLESPI) {
        return applespi_getchar();
    } else if (keyboard_source == KB_SOURCE_USB) {
        return keyboard_getchar();
    }
    return 0;
}

/* Unified keyboard readline */
static int kb_readline(char* buffer, u32 max_len) {
    if (keyboard_source == KB_SOURCE_APPLESPI) {
        return applespi_readline(buffer, max_len);
    } else if (keyboard_source == KB_SOURCE_USB) {
        return keyboard_readline(buffer, max_len);
    }
    return -1;
}

/* String comparison helper */
static bool str_eq(const char* a, const char* b) {
    while (*a && *b) {
        if (*a != *b) return false;
        a++;
        b++;
    }
    return *a == *b;
}

static bool str_starts_with(const char* str, const char* prefix) {
    while (*prefix) {
        if (*str != *prefix) return false;
        str++;
        prefix++;
    }
    return true;
}

/* Simple string to integer */
static int simple_atoi(const char* str) {
    int result = 0;
    while (*str >= '0' && *str <= '9') {
        result = result * 10 + (*str - '0');
        str++;
    }
    return result;
}

/* Simple command processor */
static void process_command(const char* cmd) {
    if (cmd[0] == '\0') {
        return;
    }

    if (str_eq(cmd, "help")) {
        console_puts("\n");
        console_set_color(COLOR_ALPHA_ACC, COLOR_ALPHA_BG);
        console_puts("  System Commands:\n");
        console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);
        console_puts("    help     - Show this help\n");
        console_puts("    info     - Show system information\n");
        console_puts("    clear    - Clear the screen\n");
        console_puts("    echo <x> - Echo back text\n");
        console_puts("    pci      - List PCI devices\n");
        console_puts("    acpi     - Show ACPI tables\n");
        console_puts("    heap     - Show heap statistics\n");
        console_puts("    gpio <n> - Set SPI CS GPIO pin and test\n");
        console_puts("    ai       - Show AI status\n");
        console_puts("    reboot   - Reboot the system\n");
        console_puts("\n");
        console_set_color(COLOR_ALPHA_ACC, COLOR_ALPHA_BG);
        console_puts("  Or just talk to me! ");
        console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);
        console_puts("Try: hello, what are you, help me\n");
        console_puts("\n");
    }
    else if (str_eq(cmd, "info")) {
        console_puts("\n");
        print_system_info();
        console_puts("\n");
    }
    else if (str_eq(cmd, "clear")) {
        console_clear();
        draw_logo();
        console_puts("\n");
    }
    else if (str_starts_with(cmd, "echo ")) {
        console_puts("  ");
        console_puts(&cmd[5]);
        console_puts("\n\n");
    }
    else if (str_eq(cmd, "pci")) {
        console_puts("\n");
        console_set_color(COLOR_ALPHA_ACC, COLOR_ALPHA_BG);
        console_puts("  PCI Devices:\n");
        console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);
        for (u32 i = 0; i < pci_get_device_count(); i++) {
            PciDevice* dev = pci_get_device(i);
            console_printf("    %02x:%02x.%d %04x:%04x class %02x:%02x\n",
                dev->bus, dev->device, dev->function,
                dev->vendor_id, dev->device_id,
                dev->class_code, dev->subclass);
        }
        console_puts("\n");
    }
    else if (str_eq(cmd, "acpi")) {
        console_puts("\n");
        acpi_dump_tables();
        console_puts("\n");
    }
    else if (str_eq(cmd, "heap")) {
        console_puts("\n");
        console_set_color(COLOR_ALPHA_ACC, COLOR_ALPHA_BG);
        console_puts("  Heap Statistics:\n");
        console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);
        console_printf("    Used: %lu KB\n", heap_used() / 1024);
        console_printf("    Free: %lu KB\n", heap_free() / 1024);
        console_puts("\n");
    }
    else if (str_starts_with(cmd, "gpio ")) {
        console_puts("\n");
        int pin = simple_atoi(&cmd[5]);
        console_printf("  Setting SPI CS GPIO to pin %d\n", pin);

        /* Configure GPIO for CS */
        gpio_configure_spi_cs((u32)pin);
        spi_set_cs_gpio((u32)pin);

        /* Try a test SPI transfer */
        console_puts("  Testing SPI transfer with new CS pin...\n");

        /* Reinitialize Apple SPI with new GPIO */
        if (applespi_init() == 0) {
            console_set_color(COLOR_ALPHA_OK, COLOR_ALPHA_BG);
            console_puts("  Keyboard initialized!\n");
            console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);
            keyboard_source = KB_SOURCE_APPLESPI;
        } else {
            console_set_color(COLOR_ALPHA_ERR, COLOR_ALPHA_BG);
            console_puts("  Keyboard not responding on this pin\n");
            console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);
        }
        console_puts("\n");
    }
    else if (str_eq(cmd, "reboot")) {
        console_puts("\n  Rebooting...\n");
        /* Triple fault to reboot */
        asm volatile("int $0x00");
    }
    else if (str_eq(cmd, "ai")) {
        console_puts("\n");
        console_set_color(COLOR_ALPHA_ACC, COLOR_ALPHA_BG);
        console_puts("  AI Status:\n");
        console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);
        console_printf("    Ready: %s\n", ai_ready() ? "yes" : "no");
        console_printf("    Status: %s\n", ai_status());
        console_printf("    %s\n", ai_model_info());
        console_puts("\n");
    }
    else {
        /* Route through AI for conversational response */
        if (ai_ready()) {
            static char ai_response[1024];
            console_puts("\n");
            console_set_color(COLOR_ALPHA_ACC, COLOR_ALPHA_BG);
            console_puts("  Alpha> ");
            console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);

            if (ai_generate(cmd, ai_response, sizeof(ai_response)) == 0) {
                console_puts(ai_response);
            } else {
                console_puts("I'm having trouble processing that request.");
            }
            console_puts("\n\n");
        } else {
            console_set_color(COLOR_ALPHA_ERR, COLOR_ALPHA_BG);
            console_printf("  Unknown command: %s\n", cmd);
            console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);
            console_puts("  Type 'help' for available commands.\n\n");
        }
    }
}

/* Main command loop */
static void NORETURN command_loop(void) {
    char cmd_buffer[256];

    console_puts("\n");
    console_set_color(COLOR_DARK_GRAY, COLOR_ALPHA_BG);
    console_puts("  Talk to me or type 'help' for commands.\n");
    console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);
    console_puts("\n");

    for (;;) {
        /* Print prompt */
        console_set_color(COLOR_ALPHA_ACC, COLOR_ALPHA_BG);
        console_puts("  alpha> ");
        console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);

        /* Read command */
        int len = kb_readline(cmd_buffer, sizeof(cmd_buffer));
        if (len >= 0) {
            process_command(cmd_buffer);
        }
    }
}

/* Kernel entry point */
void _start(void) {
    /* Ensure the bootloader supports our base revision */
    if (limine_base_revision[2] != 0) {
        hcf();
    }

    /* Ensure we have a framebuffer */
    if (framebuffer_request.response == NULL ||
        framebuffer_request.response->framebuffer_count < 1) {
        hcf();
    }

    /* Get the first framebuffer */
    struct limine_framebuffer* fb = framebuffer_request.response->framebuffers[0];

    /* Initialize console */
    if (console_init(fb) != 0) {
        hcf();
    }

    /* Initialize IDT (required for interrupt handling) */
    idt_init();

    /* Initialize PIT timer (100Hz system tick) */
    pit_init();

    /* Draw logo and welcome message */
    draw_logo();
    console_puts("\n");
    draw_separator();
    console_puts("\n");

    console_puts("  ");
    console_set_color(COLOR_ALPHA_ACC, COLOR_ALPHA_BG);
    console_puts("AI-Native Operating System");
    console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);
    console_puts(" for MacBook Pro A1706\n");
    console_puts("  Version 0.5.0 (AI-Native Interface)\n");
    console_puts("\n");

    draw_separator();
    console_puts("\n");

    /* Print initial status */
    print_ok("Kernel loaded successfully");
    print_ok("Framebuffer initialized");

    /* Print system info */
    console_puts("\n");
    console_printf("  Bootloader: %s %s\n",
        bootloader_info_request.response ? bootloader_info_request.response->name : "Unknown",
        bootloader_info_request.response ? bootloader_info_request.response->version : "");

    u64 mem_mb = calculate_memory() / (1024 * 1024);
    console_printf("  Memory: %lu MB available\n", mem_mb);

    /* Initialize hardware (PCI, Apple SPI, USB) */
    bool has_keyboard = init_hardware();

    /* Enable interrupts now that hardware is configured */
    sti();

    console_puts("\n");
    draw_separator();

    if (has_keyboard) {
        /* Enter command loop */
        command_loop();
    } else {
        /* No keyboard - show message and halt */
        console_puts("\n\n");
        console_set_color(COLOR_ALPHA_ACC, COLOR_ALPHA_BG);
        console_puts("  No Keyboard Detected:\n");
        console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);
        console_puts("  - Internal keyboard requires Apple SPI driver\n");
        console_puts("  - Try connecting an external USB keyboard\n");
        console_puts("\n");

        console_set_color(COLOR_DARK_GRAY, COLOR_ALPHA_BG);
        console_puts("  The future of computing starts here.\n");
        console_puts("  AI is not a feature. AI is the system.\n");
        console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);

        console_puts("\n");
        draw_separator();
        console_puts("\n\n");

        console_set_color(COLOR_ALPHA_ACC, COLOR_ALPHA_BG);
        console_puts("  alpha> ");
        console_set_color(COLOR_DARK_GRAY, COLOR_ALPHA_BG);
        console_puts("(no keyboard - system halted)\n");
        console_set_color(COLOR_ALPHA_FG, COLOR_ALPHA_BG);

        hcf();
    }
}
