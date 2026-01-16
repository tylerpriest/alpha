# Trackpad Specification

> **Topic:** Apple Force Touch Trackpad via SPI

## Job To Be Done

Enable cursor movement and clicking using the MacBook Pro's built-in Force Touch trackpad, which communicates over the same Apple SPI bus as the keyboard.

## Hardware Overview

### MacBook Pro A1706 Trackpad
- **Interface:** SPI (shared with keyboard)
- **Protocol:** Apple proprietary multi-touch
- **Features:** Multi-touch, Force Touch (pressure), haptic feedback
- **Resolution:** ~1200 DPI effective
- **Size:** ~130mm x 80mm

### SPI Configuration
- Same SPI controller as keyboard (APP000D)
- Different device ID in protocol
- Shared CS (Chip Select) pin

## Protocol Analysis (from Linux driver)

### Packet Format
```c
// Trackpad packet header
typedef struct {
    u8  type;           // 0x31 = trackpad data
    u8  device;         // Device identifier
    u16 length;         // Payload length
    u16 timestamp;      // Packet timestamp
    u8  fingers;        // Number of active fingers
    u8  button;         // Physical click state
} __attribute__((packed)) TrackpadHeader;

// Per-finger data
typedef struct {
    u16 x;              // X position (0-4095)
    u16 y;              // Y position (0-2700)
    u8  pressure;       // Touch pressure (0-255)
    u8  size;           // Contact size
    u8  id;             // Finger tracking ID
    u8  flags;          // Touch state flags
} __attribute__((packed)) FingerData;
```

### Packet Types
| Type | Description |
|------|-------------|
| 0x31 | Trackpad touch data |
| 0x32 | Button state change |
| 0x50 | Force Touch pressure |
| 0x60 | Haptic feedback ack |

### Coordinate System
```
┌────────────────────────────────────┐
│ (0,0)              (4095,0)        │
│                                    │
│          Trackpad Surface          │
│                                    │
│ (0,2700)           (4095,2700)     │
└────────────────────────────────────┘

Screen mapping:
  screen_x = trackpad_x * screen_width / 4096
  screen_y = trackpad_y * screen_height / 2700
```

## Driver Architecture

```
┌─────────────────────────────────────────────┐
│              Applications                    │
├─────────────────────────────────────────────┤
│           Input Subsystem                    │
│    mouse_move() mouse_click()               │
├─────────────────────────────────────────────┤
│          Trackpad Driver                     │
│  - Packet parsing                           │
│  - Gesture recognition                      │
│  - Coordinate scaling                       │
├─────────────────────────────────────────────┤
│            Apple SPI                         │
│  - Shared with keyboard                     │
│  - Device multiplexing                      │
├─────────────────────────────────────────────┤
│           SPI Controller                     │
└─────────────────────────────────────────────┘
```

## Implementation

### Initialization
```c
int trackpad_init(void) {
    // SPI already initialized by keyboard driver

    // Enable trackpad in Apple SPI protocol
    u8 enable_cmd[] = {0x53, 0x01, 0x00, 0x00};
    spi_transfer(enable_cmd, NULL, sizeof(enable_cmd));

    // Configure report rate
    u8 rate_cmd[] = {0x53, 0x02, 0x00, 60};  // 60 Hz
    spi_transfer(rate_cmd, NULL, sizeof(rate_cmd));

    return 0;
}
```

### Packet Processing
```c
typedef struct {
    i32 x, y;           // Current position (screen coords)
    i32 dx, dy;         // Delta since last poll
    bool button;        // Click state
    bool moving;        // Finger on trackpad
    u8 pressure;        // Force Touch pressure
} TrackpadState;

static TrackpadState trackpad_state;

void trackpad_process_packet(u8* data, int len) {
    TrackpadHeader* hdr = (TrackpadHeader*)data;

    if (hdr->type != 0x31) return;  // Not trackpad data

    // Get primary finger (finger 0)
    if (hdr->fingers > 0) {
        FingerData* f = (FingerData*)(data + sizeof(TrackpadHeader));

        // Scale to screen coordinates
        int new_x = f->x * screen_width / 4096;
        int new_y = f->y * screen_height / 2700;

        // Calculate delta
        if (trackpad_state.moving) {
            trackpad_state.dx = new_x - trackpad_state.x;
            trackpad_state.dy = new_y - trackpad_state.y;
        } else {
            trackpad_state.dx = 0;
            trackpad_state.dy = 0;
        }

        trackpad_state.x = new_x;
        trackpad_state.y = new_y;
        trackpad_state.moving = true;
        trackpad_state.pressure = f->pressure;
    } else {
        trackpad_state.moving = false;
        trackpad_state.dx = 0;
        trackpad_state.dy = 0;
    }

    // Physical click or Force Touch click
    trackpad_state.button = (hdr->button & 0x01) ||
                           (trackpad_state.pressure > 180);
}
```

### Polling Interface
```c
bool trackpad_poll(TrackpadEvent* event) {
    // Check if new data available
    u8 buffer[256];
    int len = applespi_recv(buffer, sizeof(buffer), DEVICE_TRACKPAD);

    if (len > 0) {
        trackpad_process_packet(buffer, len);

        event->x = trackpad_state.x;
        event->y = trackpad_state.y;
        event->dx = trackpad_state.dx;
        event->dy = trackpad_state.dy;
        event->button1 = trackpad_state.button;
        event->button2 = false;  // Two-finger click TODO

        return true;
    }

    return false;
}
```

## Gesture Recognition (Future)

### Basic Gestures
| Gesture | Detection | Action |
|---------|-----------|--------|
| Single tap | 1 finger, quick touch | Left click |
| Two-finger tap | 2 fingers, quick touch | Right click |
| Two-finger scroll | 2 fingers, vertical drag | Scroll |
| Pinch | 2 fingers, distance change | Zoom |

### Gesture State Machine
```c
typedef enum {
    GESTURE_NONE,
    GESTURE_TAP,
    GESTURE_DRAG,
    GESTURE_SCROLL,
    GESTURE_PINCH,
} GestureType;

typedef struct {
    GestureType type;
    int start_x, start_y;
    int fingers;
    u64 start_time;
} GestureState;
```

## Acceptance Criteria

- [ ] Trackpad detected via Apple SPI
- [ ] Single finger movement tracks cursor
- [ ] Physical click detected
- [ ] Force Touch click detected
- [ ] Cursor moves smoothly across screen
- [ ] Two-finger tap for right-click (optional)
- [ ] Two-finger scroll (optional)

## Dependencies

- Apple SPI driver (applespi.c) - partial
- SPI controller (spi.c) - partial
- GPIO for CS pin (gpio.c) - partial
- Console/GUI for cursor display

## Files to Create/Modify

- `drivers/input/trackpad.c` - Trackpad driver
- `drivers/input/trackpad.h` - Trackpad interface
- `kernel/src/applespi.c` - Add trackpad packet handling
- `kernel/include/applespi.h` - Device type enum

## Alternative: USB Mouse

If trackpad proves too complex, USB mouse is a fallback:

```c
// USB HID mouse is standardized
// Much simpler than Apple trackpad
int usb_mouse_init(UsbDevice* dev);
bool usb_mouse_poll(MouseEvent* event);
```

USB mouse works with existing xHCI infrastructure.
