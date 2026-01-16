# GUI Specification

> **Topic:** Basic graphical user interface with terminal window

## Job To Be Done

Provide a minimal graphical interface with a terminal window, cursor, and basic window management - enough to make the system feel like a real OS while keeping Claude Code as the primary interface.

## Requirements

### Window Compositor
1. **Double-buffered framebuffer** (prevent tearing)
2. **Window rendering** with borders/titles
3. **Z-ordering** (window stacking)
4. **Window movement** (drag title bar)
5. **Window focus** (click to activate)

### Cursor
1. **Hardware cursor** or software rendering
2. **Trackpad/mouse input** mapping
3. **Cursor themes** (arrow, text, wait)
4. **Click detection**

### Terminal Window
1. **Scrollback buffer**
2. **Text selection** (future)
3. **Color support** (ANSI codes)
4. **Resizable** (future)

### Status Bar
1. **System info** (CPU, memory)
2. **Network status**
3. **AI status** (local/connected)
4. **Clock** (when RTC available)

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                    Framebuffer                         │
│                   (2560 x 1600)                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Status Bar                    CPU: 5% | MEM: 45% │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌────────────────────────────────────────────┐       │
│  │ Terminal - AlphaOS                    [_][X]│       │
│  ├────────────────────────────────────────────┤       │
│  │                                            │       │
│  │ Welcome to AlphaOS v0.6.0                  │       │
│  │ Type your request in natural language.     │       │
│  │                                            │       │
│  │ Claude> _                                  │       │
│  │                                            │       │
│  │                                            │       │
│  │                                            │       │
│  └────────────────────────────────────────────┘       │
│                                                   🖱️   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Window System

### Window Structure
```c
typedef struct Window {
    int x, y;               // Position
    int width, height;      // Size
    char title[64];         // Title bar text
    bool focused;           // Has focus
    bool visible;           // Is visible
    bool movable;           // Can be dragged
    bool closable;          // Has close button

    u32* buffer;            // Window content buffer
    int buffer_width;
    int buffer_height;

    // Callbacks
    void (*on_draw)(struct Window* w);
    void (*on_key)(struct Window* w, int key);
    void (*on_mouse)(struct Window* w, int x, int y, int buttons);
    void (*on_close)(struct Window* w);

    struct Window* next;    // Linked list
} Window;
```

### Compositor Functions
```c
// Window management
Window* window_create(int x, int y, int w, int h, const char* title);
void window_destroy(Window* w);
void window_show(Window* w);
void window_hide(Window* w);
void window_focus(Window* w);
void window_move(Window* w, int x, int y);

// Rendering
void compositor_init(void);
void compositor_add_window(Window* w);
void compositor_remove_window(Window* w);
void compositor_render(void);        // Composite all windows
void compositor_flip(void);          // Swap buffers

// Input routing
void compositor_mouse_event(int x, int y, int buttons);
void compositor_key_event(int key);
```

## Cursor

### Cursor Rendering
```c
typedef struct {
    int x, y;                // Current position
    int hot_x, hot_y;        // Hotspot offset
    const u32* bitmap;       // Cursor image (32x32 RGBA)
    int width, height;
    CursorType type;         // arrow, text, wait, etc.
} Cursor;

typedef enum {
    CURSOR_ARROW,
    CURSOR_TEXT,
    CURSOR_WAIT,
    CURSOR_HAND,
} CursorType;

void cursor_init(void);
void cursor_move(int dx, int dy);    // Relative movement
void cursor_set_position(int x, int y);
void cursor_set_type(CursorType type);
void cursor_draw(u32* framebuffer);
```

### Trackpad Input
```c
// From trackpad driver
typedef struct {
    int x, y;           // Absolute position (scaled to screen)
    int dx, dy;         // Relative movement
    bool button1;       // Click
    bool button2;       // Two-finger click
} TrackpadEvent;

void trackpad_poll(TrackpadEvent* event);
```

## Terminal Widget

### Terminal Structure
```c
typedef struct {
    Window* window;

    // Text buffer
    char* buffer;           // Character buffer
    u8* colors;             // Color attributes
    int cols, rows;         // Size in characters
    int cursor_x, cursor_y; // Cursor position

    // Scrollback
    char* scrollback;
    int scrollback_lines;
    int scroll_offset;

    // Input
    char input_line[1024];
    int input_pos;
    void (*on_input)(const char* line);
} Terminal;

Terminal* terminal_create(int x, int y, int w, int h);
void terminal_putchar(Terminal* t, char c);
void terminal_puts(Terminal* t, const char* s);
void terminal_printf(Terminal* t, const char* fmt, ...);
void terminal_clear(Terminal* t);
void terminal_scroll(Terminal* t, int lines);
void terminal_set_color(Terminal* t, u8 fg, u8 bg);
```

## Status Bar

### Status Bar Contents
```c
typedef struct {
    // System info
    int cpu_percent;
    int mem_percent;
    u64 mem_used;
    u64 mem_total;

    // Network
    bool network_connected;
    char ip_address[16];

    // AI status
    bool claude_connected;
    bool local_llm_loaded;

    // Time
    int hours, minutes, seconds;
} StatusBarInfo;

void statusbar_init(void);
void statusbar_update(StatusBarInfo* info);
void statusbar_draw(u32* framebuffer);
```

## Input Handling

### Event Loop
```c
void gui_event_loop(void) {
    while (1) {
        // Poll input devices
        TrackpadEvent tp;
        if (trackpad_poll(&tp)) {
            cursor_move(tp.dx, tp.dy);
            compositor_mouse_event(cursor.x, cursor.y,
                                   tp.button1 | (tp.button2 << 1));
        }

        int key;
        if (keyboard_poll(&key)) {
            compositor_key_event(key);
        }

        // Update status bar
        statusbar_update(&current_status);

        // Render
        compositor_render();
        compositor_flip();

        // Small delay to prevent CPU spin
        timer_sleep_ms(16);  // ~60 FPS
    }
}
```

## Font Rendering

### TrueType Option (Complex)
```c
// Use stb_truetype.h for TrueType rendering
#include "stb_truetype.h"

typedef struct {
    stbtt_fontinfo info;
    u8* font_data;
    float scale;
} Font;

Font* font_load(const char* path, int size_px);
void font_render_char(Font* f, char c, u32* buffer, int x, int y);
void font_render_string(Font* f, const char* s, u32* buffer, int x, int y);
```

### Bitmap Option (Simple)
```c
// Use pre-rendered bitmap font (current approach)
// Scale up 8x16 font by 2x for HiDPI: 16x32 effective
#define FONT_SCALE 2
#define CHAR_WIDTH (8 * FONT_SCALE)
#define CHAR_HEIGHT (16 * FONT_SCALE)
```

## Acceptance Criteria

- [ ] Double-buffered rendering (no tearing)
- [ ] Terminal window displays and scrolls
- [ ] Mouse cursor visible and moves with trackpad
- [ ] Window can be dragged by title bar
- [ ] Status bar shows system info
- [ ] Text input works in terminal
- [ ] Keyboard events reach focused window
- [ ] Click selects window focus
- [ ] Basic ANSI color support in terminal

## Dependencies

- Framebuffer (done - GOP)
- Trackpad driver (needed)
- Keyboard driver (partial)
- Timer (needed for animation)
- Heap allocator (done)

## Files to Create

```
userspace/gui/
├── compositor.c    # Window compositor
├── compositor.h
├── window.c        # Window management
├── window.h
├── cursor.c        # Cursor rendering
├── cursor.h
├── terminal.c      # Terminal widget
├── terminal.h
├── statusbar.c     # Status bar
├── statusbar.h
├── font.c          # Font rendering
├── font.h
├── themes/
│   ├── cursor.h    # Cursor bitmaps
│   └── colors.h    # Color schemes
└── main.c          # GUI entry point
```

## Future Enhancements

1. **Multiple terminals** - Tabs or tiling
2. **File browser** - Visual file management
3. **Text editor** - Basic editing window
4. **Image viewer** - Display screenshots
5. **Animations** - Window open/close effects
6. **Transparency** - Window alpha blending
