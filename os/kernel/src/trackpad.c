/*
 * AlphaOS - Apple Trackpad Driver Implementation
 *
 * Research Summary:
 * - Linux bcm5974.c: Force Touch trackpad support
 * - Linux applespi.c: SPI protocol for MacBook 2016+
 * - Packet format based on kernel driver analysis
 *
 * The trackpad shares the same Apple SPI bus as the keyboard.
 * Trackpad packets have type 0x31 and contain multi-touch data.
 */

#include "trackpad.h"
#include "console.h"
#include "string.h"

/* Global trackpad state */
static TrackpadState state;

/* Initialize trackpad driver */
int trackpad_init(u32 screen_width, u32 screen_height) {
    console_printf("  Trackpad: Initializing...\n");

    memset(&state, 0, sizeof(state));

    state.screen_width = screen_width;
    state.screen_height = screen_height;
    state.x = screen_width / 2;   /* Start cursor in center */
    state.y = screen_height / 2;
    state.last_x = state.x;
    state.last_y = state.y;
    state.moving = false;
    state.button = false;
    state.pressure = 0;
    state.fingers = 0;
    state.initialized = true;

    console_printf("  Trackpad: Screen %ux%u, cursor at (%d, %d)\n",
        screen_width, screen_height, state.x, state.y);
    console_printf("  Trackpad: Ready (shares Apple SPI with keyboard)\n");

    return 0;
}

/* Scale trackpad coordinates to screen coordinates */
static i32 scale_x(u16 trackpad_x) {
    /* Clamp to valid range */
    if (trackpad_x > TRACKPAD_X_MAX) trackpad_x = TRACKPAD_X_MAX;

    /* Scale to screen width */
    return (i32)((u32)trackpad_x * state.screen_width / (TRACKPAD_X_MAX + 1));
}

static i32 scale_y(u16 trackpad_y) {
    /* Clamp to valid range */
    if (trackpad_y > TRACKPAD_Y_MAX) trackpad_y = TRACKPAD_Y_MAX;

    /* Scale to screen height */
    return (i32)((u32)trackpad_y * state.screen_height / (TRACKPAD_Y_MAX + 1));
}

/* Process a raw trackpad packet from Apple SPI */
void trackpad_process_packet(u8* data, u32 len) {
    if (!state.initialized) return;
    if (len < sizeof(TrackpadHeader)) return;

    TrackpadHeader* hdr = (TrackpadHeader*)data;

    /* Check packet type (0x31 = trackpad touch data) */
    if (hdr->type != 0x31) return;

    /* Update finger count */
    state.fingers = hdr->fingers;

    /* Physical button state */
    bool physical_click = (hdr->button & 0x01) != 0;

    if (hdr->fingers > 0) {
        /* Get primary finger data */
        if (len < sizeof(TrackpadHeader) + sizeof(FingerData)) return;

        FingerData* finger = (FingerData*)(data + sizeof(TrackpadHeader));

        /* Scale to screen coordinates */
        i32 new_x = scale_x(finger->x);
        i32 new_y = scale_y(finger->y);

        /* Save last position for delta calculation */
        state.last_x = state.x;
        state.last_y = state.y;

        /* Update current position */
        state.x = new_x;
        state.y = new_y;

        /* Track pressure for Force Touch */
        state.pressure = finger->pressure;

        /* Mark as actively moving */
        state.moving = true;

        /* Force Touch click (pressure > threshold) or physical click */
        state.button = physical_click ||
                       (state.pressure > TRACKPAD_FORCE_CLICK_THRESHOLD);
    } else {
        /* No fingers - stop moving */
        state.moving = false;
        state.pressure = 0;
        state.button = physical_click;  /* Physical click still works */
    }
}

/* Poll for trackpad events */
bool trackpad_poll(TrackpadEvent* event) {
    if (!state.initialized || !event) return false;

    /* Fill event structure */
    event->x = state.x;
    event->y = state.y;

    /* Calculate delta from last position */
    if (state.moving) {
        event->dx = state.x - state.last_x;
        event->dy = state.y - state.last_y;
    } else {
        event->dx = 0;
        event->dy = 0;
    }

    /* Button states */
    event->button1 = state.button;

    /* Two-finger tap for right click (future: gesture recognition) */
    event->button2 = (state.fingers >= 2 && state.button);

    event->pressure = state.pressure;
    event->fingers = state.fingers;

    /* Return true if there's any activity */
    return state.moving || state.button;
}

/* Get current trackpad state */
TrackpadState* trackpad_get_state(void) {
    return &state;
}

/* Check if trackpad is initialized */
bool trackpad_ready(void) {
    return state.initialized;
}

/* Get cursor position */
void trackpad_get_position(i32* x, i32* y) {
    if (x) *x = state.x;
    if (y) *y = state.y;
}

/* Check if button is pressed */
bool trackpad_button_pressed(void) {
    return state.button;
}
