/*
 * AlphaOS - USB HID Keyboard Driver
 */

#ifndef _KEYBOARD_H
#define _KEYBOARD_H

#include "types.h"

/* Modifier key flags */
#define KB_MOD_LCTRL   (1 << 0)
#define KB_MOD_LSHIFT  (1 << 1)
#define KB_MOD_LALT    (1 << 2)
#define KB_MOD_LGUI    (1 << 3)
#define KB_MOD_RCTRL   (1 << 4)
#define KB_MOD_RSHIFT  (1 << 5)
#define KB_MOD_RALT    (1 << 6)
#define KB_MOD_RGUI    (1 << 7)

/* Special key codes (returned when ASCII would be 0) */
#define KEY_NONE       0
#define KEY_F1         0x80
#define KEY_F2         0x81
#define KEY_F3         0x82
#define KEY_F4         0x83
#define KEY_F5         0x84
#define KEY_F6         0x85
#define KEY_F7         0x86
#define KEY_F8         0x87
#define KEY_F9         0x88
#define KEY_F10        0x89
#define KEY_F11        0x8A
#define KEY_F12        0x8B
#define KEY_UP         0x90
#define KEY_DOWN       0x91
#define KEY_LEFT       0x92
#define KEY_RIGHT      0x93
#define KEY_HOME       0x94
#define KEY_END        0x95
#define KEY_PAGEUP     0x96
#define KEY_PAGEDOWN   0x97
#define KEY_INSERT     0x98
#define KEY_DELETE     0x99

/* Keyboard input buffer size */
#define KB_BUFFER_SIZE 64

/* HID Boot Protocol Keyboard Report */
typedef struct {
    u8 modifiers;
    u8 reserved;
    u8 keys[6];
} __attribute__((packed)) HidKeyboardReport;

/* Keyboard state */
typedef struct {
    u8 modifiers;
    u8 last_keys[6];
    char buffer[KB_BUFFER_SIZE];
    u32 buffer_head;
    u32 buffer_tail;
    bool initialized;
} KeyboardState;

/* Initialize keyboard driver */
int keyboard_init(void);

/* Poll keyboard for new input */
void keyboard_poll(void);

/* Check if a key is available */
bool keyboard_available(void);

/* Get next character (blocking) */
char keyboard_getchar(void);

/* Get next character (non-blocking, returns 0 if none) */
char keyboard_trygetchar(void);

/* Read a line of input */
int keyboard_readline(char* buffer, u32 max_len);

/* Get current modifier state */
u8 keyboard_get_modifiers(void);

/* Check if shift is pressed */
bool keyboard_shift_pressed(void);

/* Check if ctrl is pressed */
bool keyboard_ctrl_pressed(void);

/* Check if alt is pressed */
bool keyboard_alt_pressed(void);

#endif /* _KEYBOARD_H */
