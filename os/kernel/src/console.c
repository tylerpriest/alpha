/*
 * AlphaOS - Framebuffer Console Implementation
 */

#include "console.h"
#include "font.h"
#include "string.h"
#include <stdarg.h>

/* Global console instance */
static Console console;

/* Initialize console with framebuffer */
int console_init(struct limine_framebuffer* fb) {
    if (!fb || !fb->address) {
        return -1;
    }

    console.framebuffer = (u32*)fb->address;
    console.width = fb->width;
    console.height = fb->height;
    console.pitch = fb->pitch;
    console.pixels_per_row = fb->pitch / 4;

    console.font_width = FONT_WIDTH;
    console.font_height = FONT_HEIGHT;

    console.cols = console.width / console.font_width;
    console.rows = console.height / console.font_height;

    console.cursor_x = 0;
    console.cursor_y = 0;

    console.fg_color = COLOR_ALPHA_FG;
    console.bg_color = COLOR_ALPHA_BG;

    /* Clear screen */
    console_clear();

    return 0;
}

/* Clear the screen */
void console_clear(void) {
    for (u32 y = 0; y < console.height; y++) {
        for (u32 x = 0; x < console.width; x++) {
            console.framebuffer[y * console.pixels_per_row + x] = console.bg_color;
        }
    }
    console.cursor_x = 0;
    console.cursor_y = 0;
}

/* Set text colors */
void console_set_color(u32 fg, u32 bg) {
    console.fg_color = fg;
    console.bg_color = bg;
}

/* Draw a single pixel */
void console_pixel(u32 x, u32 y, u32 color) {
    if (x < console.width && y < console.height) {
        console.framebuffer[y * console.pixels_per_row + x] = color;
    }
}

/* Draw a filled rectangle */
void console_rect(u32 x, u32 y, u32 w, u32 h, u32 color) {
    for (u32 py = y; py < y + h && py < console.height; py++) {
        for (u32 px = x; px < x + w && px < console.width; px++) {
            console.framebuffer[py * console.pixels_per_row + px] = color;
        }
    }
}

/* Draw a horizontal line */
void console_hline(u32 x, u32 y, u32 w, u32 color) {
    if (y >= console.height) return;
    for (u32 px = x; px < x + w && px < console.width; px++) {
        console.framebuffer[y * console.pixels_per_row + px] = color;
    }
}

/* Draw a character at pixel position */
static void draw_char(u32 px, u32 py, char c, u32 fg, u32 bg) {
    const u8* glyph = font_get_glyph(c);

    for (u32 y = 0; y < FONT_HEIGHT; y++) {
        u8 row = glyph[y];
        for (u32 x = 0; x < FONT_WIDTH; x++) {
            u32 color = (row & (0x80 >> x)) ? fg : bg;
            u32 screen_x = px + x;
            u32 screen_y = py + y;
            if (screen_x < console.width && screen_y < console.height) {
                console.framebuffer[screen_y * console.pixels_per_row + screen_x] = color;
            }
        }
    }
}

/* Scroll the screen up by one line */
void console_scroll(void) {
    /* Move all lines up by one */
    usize line_size = console.pitch * console.font_height;
    usize total_size = console.pitch * console.height;

    memmove(console.framebuffer,
            (u8*)console.framebuffer + line_size,
            total_size - line_size);

    /* Clear the last line */
    u32 last_line_y = (console.rows - 1) * console.font_height;
    console_rect(0, last_line_y, console.width, console.font_height, console.bg_color);
}

/* Print a single character */
void console_putchar(char c) {
    if (c == '\n') {
        console.cursor_x = 0;
        console.cursor_y++;
    } else if (c == '\r') {
        console.cursor_x = 0;
    } else if (c == '\t') {
        console.cursor_x = (console.cursor_x + 4) & ~3;
    } else if (c == '\b') {
        if (console.cursor_x > 0) {
            console.cursor_x--;
            u32 px = console.cursor_x * console.font_width;
            u32 py = console.cursor_y * console.font_height;
            draw_char(px, py, ' ', console.fg_color, console.bg_color);
        }
    } else if (c >= 32 && c < 127) {
        u32 px = console.cursor_x * console.font_width;
        u32 py = console.cursor_y * console.font_height;
        draw_char(px, py, c, console.fg_color, console.bg_color);
        console.cursor_x++;
    }

    /* Handle line wrap */
    if (console.cursor_x >= console.cols) {
        console.cursor_x = 0;
        console.cursor_y++;
    }

    /* Handle scroll */
    if (console.cursor_y >= console.rows) {
        console_scroll();
        console.cursor_y = console.rows - 1;
    }
}

/* Print a string */
void console_puts(const char* str) {
    while (*str) {
        console_putchar(*str++);
    }
}

/* Integer to string conversion */
static void itoa(i64 value, char* buf, int base, bool uppercase, bool is_signed) {
    char* p = buf;
    char* p1, *p2;
    u64 ud = value;
    int divisor = base;
    char digits[] = "0123456789abcdef";
    char DIGITS[] = "0123456789ABCDEF";

    if (is_signed && value < 0) {
        *p++ = '-';
        buf++;
        ud = -value;
    }

    do {
        int remainder = ud % divisor;
        *p++ = uppercase ? DIGITS[remainder] : digits[remainder];
    } while (ud /= divisor);

    *p = 0;

    /* Reverse the string */
    p1 = buf;
    p2 = p - 1;
    while (p1 < p2) {
        char tmp = *p1;
        *p1++ = *p2;
        *p2-- = tmp;
    }
}

/* Simplified printf implementation */
void console_printf(const char* fmt, ...) {
    va_list args;
    va_start(args, fmt);

    char buf[32];
    const char* str;

    while (*fmt) {
        if (*fmt != '%') {
            console_putchar(*fmt++);
            continue;
        }

        fmt++; /* Skip '%' */

        /* Handle format specifiers */
        bool is_long = false;
        if (*fmt == 'l') {
            is_long = true;
            fmt++;
        }

        switch (*fmt) {
            case 'd':
            case 'i':
                if (is_long) {
                    itoa(va_arg(args, i64), buf, 10, false, true);
                } else {
                    itoa(va_arg(args, i32), buf, 10, false, true);
                }
                console_puts(buf);
                break;

            case 'u':
                if (is_long) {
                    itoa(va_arg(args, u64), buf, 10, false, false);
                } else {
                    itoa(va_arg(args, u32), buf, 10, false, false);
                }
                console_puts(buf);
                break;

            case 'x':
                if (is_long) {
                    itoa(va_arg(args, u64), buf, 16, false, false);
                } else {
                    itoa(va_arg(args, u32), buf, 16, false, false);
                }
                console_puts(buf);
                break;

            case 'X':
                if (is_long) {
                    itoa(va_arg(args, u64), buf, 16, true, false);
                } else {
                    itoa(va_arg(args, u32), buf, 16, true, false);
                }
                console_puts(buf);
                break;

            case 'p':
                console_puts("0x");
                itoa((u64)va_arg(args, void*), buf, 16, false, false);
                console_puts(buf);
                break;

            case 's':
                str = va_arg(args, const char*);
                if (str) {
                    console_puts(str);
                } else {
                    console_puts("(null)");
                }
                break;

            case 'c':
                console_putchar((char)va_arg(args, int));
                break;

            case '%':
                console_putchar('%');
                break;

            default:
                console_putchar('%');
                console_putchar(*fmt);
                break;
        }

        fmt++;
    }

    va_end(args);
}

/* Get console dimensions */
u32 console_get_width(void) { return console.width; }
u32 console_get_height(void) { return console.height; }
u32 console_get_cols(void) { return console.cols; }
u32 console_get_rows(void) { return console.rows; }

Console* console_get(void) { return &console; }

/* Mouse cursor state */
static struct {
    i32 x, y;           /* Cursor position */
    bool visible;       /* Is cursor showing */
    u32 saved[16*16];   /* Saved pixels under cursor */
    bool saved_valid;   /* Is saved data valid */
} mouse_cursor = {0, 0, false, {0}, false};

/* Simple arrow cursor shape (16x16) */
static const u8 cursor_bitmap[16][16] = {
    {1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
    {1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
    {1,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0},
    {1,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0},
    {1,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0},
    {1,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0},
    {1,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0},
    {1,2,2,2,2,2,2,1,0,0,0,0,0,0,0,0},
    {1,2,2,2,2,2,2,2,1,0,0,0,0,0,0,0},
    {1,2,2,2,2,2,1,1,1,1,0,0,0,0,0,0},
    {1,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0},
    {1,2,2,1,2,2,1,0,0,0,0,0,0,0,0,0},
    {1,2,1,0,1,2,2,1,0,0,0,0,0,0,0,0},
    {1,1,0,0,1,2,2,1,0,0,0,0,0,0,0,0},
    {1,0,0,0,0,1,2,2,1,0,0,0,0,0,0,0},
    {0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0},
};

/* Save pixels under cursor */
static void cursor_save_background(void) {
    if (!mouse_cursor.visible) return;

    i32 cx = mouse_cursor.x;
    i32 cy = mouse_cursor.y;
    int idx = 0;

    for (int dy = 0; dy < 16; dy++) {
        for (int dx = 0; dx < 16; dx++) {
            i32 px = cx + dx;
            i32 py = cy + dy;
            if (px >= 0 && px < (i32)console.width &&
                py >= 0 && py < (i32)console.height) {
                mouse_cursor.saved[idx] = console.framebuffer[py * console.pixels_per_row + px];
            }
            idx++;
        }
    }
    mouse_cursor.saved_valid = true;
}

/* Restore pixels under cursor */
static void cursor_restore_background(void) {
    if (!mouse_cursor.saved_valid) return;

    i32 cx = mouse_cursor.x;
    i32 cy = mouse_cursor.y;
    int idx = 0;

    for (int dy = 0; dy < 16; dy++) {
        for (int dx = 0; dx < 16; dx++) {
            i32 px = cx + dx;
            i32 py = cy + dy;
            if (px >= 0 && px < (i32)console.width &&
                py >= 0 && py < (i32)console.height) {
                console.framebuffer[py * console.pixels_per_row + px] = mouse_cursor.saved[idx];
            }
            idx++;
        }
    }
    mouse_cursor.saved_valid = false;
}

/* Draw cursor at current position */
void console_cursor_draw(void) {
    if (!mouse_cursor.visible) return;

    /* Save background first */
    cursor_save_background();

    i32 cx = mouse_cursor.x;
    i32 cy = mouse_cursor.y;

    for (int dy = 0; dy < 16; dy++) {
        for (int dx = 0; dx < 16; dx++) {
            u8 pixel = cursor_bitmap[dy][dx];
            if (pixel == 0) continue;  /* Transparent */

            i32 px = cx + dx;
            i32 py = cy + dy;

            if (px >= 0 && px < (i32)console.width &&
                py >= 0 && py < (i32)console.height) {
                u32 color = (pixel == 1) ? COLOR_BLACK : COLOR_WHITE;
                console.framebuffer[py * console.pixels_per_row + px] = color;
            }
        }
    }
}

/* Show cursor */
void console_cursor_show(void) {
    mouse_cursor.visible = true;
    console_cursor_draw();
}

/* Hide cursor */
void console_cursor_hide(void) {
    if (mouse_cursor.visible) {
        cursor_restore_background();
    }
    mouse_cursor.visible = false;
}

/* Move cursor to new position */
void console_cursor_move(i32 x, i32 y) {
    /* Restore old position first */
    if (mouse_cursor.visible && mouse_cursor.saved_valid) {
        cursor_restore_background();
    }

    /* Clamp to screen bounds */
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x >= (i32)console.width) x = console.width - 1;
    if (y >= (i32)console.height) y = console.height - 1;

    mouse_cursor.x = x;
    mouse_cursor.y = y;

    /* Redraw at new position */
    if (mouse_cursor.visible) {
        console_cursor_draw();
    }
}
