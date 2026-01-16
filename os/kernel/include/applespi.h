/*
 * AlphaOS - Apple SPI Keyboard/Trackpad Driver
 *
 * For MacBook Pro A1706 internal keyboard
 * Based on reverse-engineered Apple SPI protocol
 */

#ifndef _APPLESPI_H
#define _APPLESPI_H

#include "types.h"

/* Apple SPI packet types */
#define APPLE_SPI_PKT_KEYBOARD    0x20
#define APPLE_SPI_PKT_TRACKPAD    0x28
#define APPLE_SPI_PKT_WRITE       0x40
#define APPLE_SPI_PKT_READ        0x80

/* Apple SPI device types */
#define APPLE_SPI_DEV_KEYBOARD    1
#define APPLE_SPI_DEV_TRACKPAD    2
#define APPLE_SPI_DEV_INFO        0xD0

/* Message types */
#define APPLE_MSG_TYPE_KEYBOARD   0x0110
#define APPLE_MSG_TYPE_CAPS       0x0151
#define APPLE_MSG_TYPE_MODIFIER   0x0120

/* Apple SPI packet header */
typedef struct {
    u8  type;
    u8  device;
    u16 length;
    u8  flags;
    u8  reserved1;
    u16 seq;
    u8  reserved2[8];
} __attribute__((packed)) AppleSpiHeader;

/* Apple keyboard report */
typedef struct {
    u8  unknown1;
    u8  modifiers;      /* Same as USB HID modifiers */
    u8  unknown2;
    u8  keys[6];        /* Up to 6 simultaneous keys */
    u8  fn_pressed;     /* Fn key state */
    u8  unknown3[3];
} __attribute__((packed)) AppleKeyboardReport;

/* Full Apple SPI keyboard message */
typedef struct {
    AppleSpiHeader header;
    u16 msg_type;
    u8  device_id;
    u8  msg_length;
    AppleKeyboardReport report;
    u16 crc;
} __attribute__((packed)) AppleSpiKeyboardMsg;

/* Apple SPI state */
typedef struct {
    u8 modifiers;
    u8 last_keys[6];
    bool fn_pressed;
    u16 sequence;
    bool initialized;
} AppleSpiState;

/* Initialize Apple SPI keyboard */
int applespi_init(void);

/* Poll for keyboard input */
void applespi_poll(void);

/* Check if input available */
bool applespi_available(void);

/* Get next character (blocking) */
char applespi_getchar(void);

/* Get next character (non-blocking) */
char applespi_trygetchar(void);

/* Read line of input */
int applespi_readline(char* buffer, u32 max_len);

/* Get modifier state */
u8 applespi_get_modifiers(void);

/* Check Fn key */
bool applespi_fn_pressed(void);

#endif /* _APPLESPI_H */
