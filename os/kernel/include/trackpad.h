/*
 * AlphaOS - Apple Trackpad Driver
 *
 * Research Summary:
 * - Linux bcm5974.c and applespi.c drivers
 * - Force Touch trackpad on MacBook Pro A1706
 * - Uses same SPI bus as keyboard (APP000D)
 *
 * Key facts:
 * - Packet type 0x31 for touch data
 * - Coordinates: X 0-4095, Y 0-2700
 * - Up to 5 simultaneous fingers
 * - Force Touch pressure 0-255
 */

#ifndef _TRACKPAD_H
#define _TRACKPAD_H

#include "types.h"

/* Trackpad coordinate ranges */
#define TRACKPAD_X_MIN      0
#define TRACKPAD_X_MAX      4095
#define TRACKPAD_Y_MIN      0
#define TRACKPAD_Y_MAX      2700

/* Force Touch threshold for click */
#define TRACKPAD_FORCE_CLICK_THRESHOLD  180

/* Maximum tracked fingers */
#define TRACKPAD_MAX_FINGERS  5

/* Trackpad packet header (from Apple SPI protocol) */
typedef struct {
    u8  type;           /* 0x31 = trackpad data */
    u8  device;         /* Device identifier */
    u16 length;         /* Payload length */
    u16 timestamp;      /* Packet timestamp */
    u8  fingers;        /* Number of active fingers */
    u8  button;         /* Physical click state */
} __attribute__((packed)) TrackpadHeader;

/* Per-finger touch data */
typedef struct {
    u16 x;              /* X position (0-4095) */
    u16 y;              /* Y position (0-2700) */
    u8  pressure;       /* Touch pressure (0-255) */
    u8  size;           /* Contact area size */
    u8  id;             /* Finger tracking ID */
    u8  flags;          /* Touch state flags */
} __attribute__((packed)) FingerData;

/* Trackpad event for consumers */
typedef struct {
    i32 x, y;           /* Screen position */
    i32 dx, dy;         /* Delta movement */
    bool button1;       /* Left/primary click */
    bool button2;       /* Right/secondary click */
    u8  pressure;       /* Force Touch pressure */
    u8  fingers;        /* Number of fingers */
} TrackpadEvent;

/* Trackpad state */
typedef struct {
    i32 x, y;           /* Current position (screen coords) */
    i32 last_x, last_y; /* Previous position */
    bool moving;        /* Finger on trackpad */
    bool button;        /* Physical/force click */
    u8  pressure;       /* Force Touch pressure */
    u8  fingers;        /* Number of fingers */
    u32 screen_width;   /* Screen width for scaling */
    u32 screen_height;  /* Screen height for scaling */
    bool initialized;
} TrackpadState;

/* Initialize trackpad driver */
int trackpad_init(u32 screen_width, u32 screen_height);

/* Poll for trackpad events */
bool trackpad_poll(TrackpadEvent* event);

/* Process a raw trackpad packet from Apple SPI */
void trackpad_process_packet(u8* data, u32 len);

/* Get current trackpad state */
TrackpadState* trackpad_get_state(void);

/* Check if trackpad is initialized */
bool trackpad_ready(void);

/* Get cursor position */
void trackpad_get_position(i32* x, i32* y);

/* Check if button is pressed */
bool trackpad_button_pressed(void);

#endif /* _TRACKPAD_H */
