/*
 * AlphaOS - USB HID Keyboard Driver
 *
 * Research Summary:
 * - USB HID Specification 1.11
 * - Boot protocol uses fixed 8-byte reports
 * - Scancodes are USB HID usage codes (not PS/2)
 */

#include "keyboard.h"
#include "usb.h"
#include "xhci.h"
#include "console.h"
#include "pit.h"

/* Global keyboard state */
static KeyboardState keyboard;
static UsbDevice* kb_device = NULL;

/* HID scancode to ASCII lookup table (US layout) */
static const char scancode_ascii[128] = {
    0,   0,   0,   0,  'a', 'b', 'c', 'd',  /* 0x00-0x07 */
   'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',  /* 0x08-0x0F */
   'm', 'n', 'o', 'p', 'q', 'r', 's', 't',  /* 0x10-0x17 */
   'u', 'v', 'w', 'x', 'y', 'z', '1', '2',  /* 0x18-0x1F */
   '3', '4', '5', '6', '7', '8', '9', '0',  /* 0x20-0x27 */
  '\n','\x1b','\b','\t',' ', '-', '=', '[',  /* 0x28-0x2F (Enter,Esc,Bksp,Tab,Space) */
   ']','\\', '#', ';','\'', '`', ',', '.',  /* 0x30-0x37 */
   '/',  0,   0,   0,   0,   0,   0,   0,   /* 0x38-0x3F (CapsLock, F1-F6) */
    0,   0,   0,   0,   0,   0,   0,   0,   /* 0x40-0x47 (F7-F12, PrtSc, ScrLk) */
    0,   0,   0,   0,   0,   0,   0,   0,   /* 0x48-0x4F (Pause, Ins, Home, PgUp, Del, End, PgDn, Right) */
    0,   0,   0,   0,   '/', '*', '-', '+', /* 0x50-0x57 (Left, Down, Up, NumLock, KP/) */
  '\n', '1', '2', '3', '4', '5', '6', '7',  /* 0x58-0x5F (KP Enter, KP 1-7) */
   '8', '9', '0', '.',  0,   0,   0,   0,   /* 0x60-0x67 */
    0,   0,   0,   0,   0,   0,   0,   0,   /* 0x68-0x6F */
    0,   0,   0,   0,   0,   0,   0,   0,   /* 0x70-0x77 */
    0,   0,   0,   0,   0,   0,   0,   0,   /* 0x78-0x7F */
};

/* Shifted scancode to ASCII */
static const char scancode_ascii_shift[128] = {
    0,   0,   0,   0,  'A', 'B', 'C', 'D',  /* 0x00-0x07 */
   'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',  /* 0x08-0x0F */
   'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',  /* 0x10-0x17 */
   'U', 'V', 'W', 'X', 'Y', 'Z', '!', '@',  /* 0x18-0x1F */
   '#', '$', '%', '^', '&', '*', '(', ')',  /* 0x20-0x27 */
  '\n','\x1b','\b','\t',' ', '_', '+', '{',  /* 0x28-0x2F */
   '}', '|', '~', ':', '"', '~', '<', '>',  /* 0x30-0x37 */
   '?',  0,   0,   0,   0,   0,   0,   0,   /* 0x38-0x3F */
    0,   0,   0,   0,   0,   0,   0,   0,   /* 0x40-0x47 */
    0,   0,   0,   0,   0,   0,   0,   0,   /* 0x48-0x4F */
    0,   0,   0,   0,   '/', '*', '-', '+', /* 0x50-0x57 */
  '\n', '1', '2', '3', '4', '5', '6', '7',  /* 0x58-0x5F */
   '8', '9', '0', '.',  0,   0,   0,   0,   /* 0x60-0x67 */
    0,   0,   0,   0,   0,   0,   0,   0,   /* 0x68-0x6F */
    0,   0,   0,   0,   0,   0,   0,   0,   /* 0x70-0x77 */
    0,   0,   0,   0,   0,   0,   0,   0,   /* 0x78-0x7F */
};

/* Convert HID scancode to ASCII character */
static char scancode_to_ascii(u8 scancode, u8 modifiers) {
    if (scancode >= 128) return 0;

    bool shift = (modifiers & (KB_MOD_LSHIFT | KB_MOD_RSHIFT)) != 0;
    char c = shift ? scancode_ascii_shift[scancode] : scancode_ascii[scancode];

    /* Handle Ctrl+key combinations */
    if (modifiers & (KB_MOD_LCTRL | KB_MOD_RCTRL)) {
        if (c >= 'a' && c <= 'z') {
            return c - 'a' + 1;  /* Ctrl+A = 1, Ctrl+C = 3, etc. */
        }
        if (c >= 'A' && c <= 'Z') {
            return c - 'A' + 1;
        }
    }

    return c;
}

/* Add character to input buffer */
static void buffer_push(char c) {
    u32 next = (keyboard.buffer_head + 1) % KB_BUFFER_SIZE;
    if (next != keyboard.buffer_tail) {
        keyboard.buffer[keyboard.buffer_head] = c;
        keyboard.buffer_head = next;
    }
}

/* Get character from input buffer */
static char buffer_pop(void) {
    if (keyboard.buffer_head == keyboard.buffer_tail) {
        return 0;
    }
    char c = keyboard.buffer[keyboard.buffer_tail];
    keyboard.buffer_tail = (keyboard.buffer_tail + 1) % KB_BUFFER_SIZE;
    return c;
}

/* Check if key was just pressed (not in last report) */
static bool is_new_key(u8 scancode, u8* last_keys) {
    for (int i = 0; i < 6; i++) {
        if (last_keys[i] == scancode) {
            return false;
        }
    }
    return true;
}

/* Process a keyboard report */
static void process_report(HidKeyboardReport* report) {
    keyboard.modifiers = report->modifiers;

    /* Check each key in the new report */
    for (int i = 0; i < 6; i++) {
        u8 scancode = report->keys[i];
        if (scancode == 0) continue;

        /* Check if this is a new keypress */
        if (is_new_key(scancode, keyboard.last_keys)) {
            char c = scancode_to_ascii(scancode, report->modifiers);
            if (c != 0) {
                buffer_push(c);
            }
        }
    }

    /* Save current keys for next comparison */
    for (int i = 0; i < 6; i++) {
        keyboard.last_keys[i] = report->keys[i];
    }
}

/* Initialize keyboard driver */
int keyboard_init(void) {
    /* Reset state */
    keyboard.modifiers = 0;
    keyboard.buffer_head = 0;
    keyboard.buffer_tail = 0;
    keyboard.initialized = false;
    for (int i = 0; i < 6; i++) {
        keyboard.last_keys[i] = 0;
    }

    /* Find a keyboard device */
    kb_device = usb_find_keyboard();
    if (!kb_device) {
        console_printf("  Keyboard: No USB keyboard found\n");
        return -1;
    }

    /* Configure the device */
    if (usb_set_configuration(kb_device->slot_id, kb_device->config_value) != 0) {
        console_printf("  Keyboard: Set config failed\n");
        return -1;
    }

    /* Set boot protocol (simpler 8-byte reports) */
    if (usb_hid_set_protocol(kb_device->slot_id, kb_device->interface_num, 0) != 0) {
        console_printf("  Keyboard: Set protocol failed\n");
        /* Non-fatal, some keyboards don't support this */
    }

    /* Set idle rate to 0 (report only on change) */
    usb_hid_set_idle(kb_device->slot_id, kb_device->interface_num, 0, 0);

    keyboard.initialized = true;
    console_printf("  Keyboard: Initialized\n");
    return 0;
}

/* Poll keyboard for new input */
void keyboard_poll(void) {
    if (!keyboard.initialized || !kb_device) return;

    static HidKeyboardReport report __attribute__((aligned(64)));

    /* Get report via control transfer (boot protocol) */
    int ret = xhci_control_transfer(kb_device->slot_id,
        USB_REQ_DIR_IN | USB_REQ_TYPE_CLASS | USB_REQ_RECIP_INTERFACE,
        HID_REQ_GET_REPORT,
        0x0100,  /* Report type 1, Report ID 0 */
        kb_device->interface_num,
        &report,
        sizeof(report));

    if (ret == 0) {
        process_report(&report);
    }
}

/* Check if input is available */
bool keyboard_available(void) {
    return keyboard.buffer_head != keyboard.buffer_tail;
}

/* Get character (blocking) */
char keyboard_getchar(void) {
    while (!keyboard_available()) {
        keyboard_poll();
        /* Use PIT timer for proper ~10ms delay between polls */
        pit_sleep_ms(10);
    }
    return buffer_pop();
}

/* Get character (non-blocking) */
char keyboard_trygetchar(void) {
    keyboard_poll();
    return buffer_pop();
}

/* Read a line of input */
int keyboard_readline(char* buffer, u32 max_len) {
    if (max_len == 0) return 0;

    u32 pos = 0;
    max_len--;  /* Reserve space for null terminator */

    while (pos < max_len) {
        char c = keyboard_getchar();

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
        else if (c == 3) {  /* Ctrl+C */
            buffer[0] = '\0';
            console_puts("^C\n");
            return -1;
        }
    }

    buffer[pos] = '\0';
    return pos;
}

/* Get current modifier state */
u8 keyboard_get_modifiers(void) {
    return keyboard.modifiers;
}

/* Check if shift is pressed */
bool keyboard_shift_pressed(void) {
    return (keyboard.modifiers & (KB_MOD_LSHIFT | KB_MOD_RSHIFT)) != 0;
}

/* Check if ctrl is pressed */
bool keyboard_ctrl_pressed(void) {
    return (keyboard.modifiers & (KB_MOD_LCTRL | KB_MOD_RCTRL)) != 0;
}

/* Check if alt is pressed */
bool keyboard_alt_pressed(void) {
    return (keyboard.modifiers & (KB_MOD_LALT | KB_MOD_RALT)) != 0;
}
