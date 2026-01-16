/*
 * AlphaOS - Framebuffer Console
 */

#ifndef _CONSOLE_H
#define _CONSOLE_H

#include "types.h"
#include "limine.h"

/* Colors (ARGB format) */
#define COLOR_BLACK       0xFF000000
#define COLOR_WHITE       0xFFFFFFFF
#define COLOR_RED         0xFFFF0000
#define COLOR_GREEN       0xFF00FF00
#define COLOR_BLUE        0xFF0000FF
#define COLOR_CYAN        0xFF00FFFF
#define COLOR_MAGENTA     0xFFFF00FF
#define COLOR_YELLOW      0xFFFFFF00
#define COLOR_GRAY        0xFF808080
#define COLOR_DARK_GRAY   0xFF404040
#define COLOR_LIGHT_GRAY  0xFFC0C0C0

/* AlphaOS brand colors */
#define COLOR_ALPHA_BG    0xFF1a1a2e  /* Dark blue-gray background */
#define COLOR_ALPHA_FG    0xFFe8e8e8  /* Light gray text */
#define COLOR_ALPHA_ACC   0xFF00d4ff  /* Cyan accent */
#define COLOR_ALPHA_WARN  0xFFffaa00  /* Orange warning */
#define COLOR_ALPHA_ERR   0xFFff4444  /* Red error */
#define COLOR_ALPHA_OK    0xFF44ff44  /* Green success */

/* Console structure */
typedef struct {
    u32* framebuffer;
    u32 width;
    u32 height;
    u32 pitch;           /* Bytes per row */
    u32 pixels_per_row;  /* Pixels per row (pitch/4) */

    /* Text cursor position (in characters) */
    u32 cursor_x;
    u32 cursor_y;

    /* Text dimensions (in characters) */
    u32 cols;
    u32 rows;

    /* Colors */
    u32 fg_color;
    u32 bg_color;

    /* Font dimensions */
    u32 font_width;
    u32 font_height;
} Console;

/* Initialize console with framebuffer from bootloader */
int console_init(struct limine_framebuffer* fb);

/* Clear the entire screen */
void console_clear(void);

/* Set text colors */
void console_set_color(u32 fg, u32 bg);

/* Print a single character */
void console_putchar(char c);

/* Print a string */
void console_puts(const char* str);

/* Print formatted output (simplified printf) */
void console_printf(const char* fmt, ...);

/* Scroll the screen up by one line */
void console_scroll(void);

/* Draw a single pixel */
void console_pixel(u32 x, u32 y, u32 color);

/* Draw a filled rectangle */
void console_rect(u32 x, u32 y, u32 w, u32 h, u32 color);

/* Draw a horizontal line */
void console_hline(u32 x, u32 y, u32 w, u32 color);

/* Get console dimensions */
u32 console_get_width(void);
u32 console_get_height(void);
u32 console_get_cols(void);
u32 console_get_rows(void);

/* Get global console instance */
Console* console_get(void);

/* Mouse cursor rendering */
void console_cursor_show(void);
void console_cursor_hide(void);
void console_cursor_move(i32 x, i32 y);
void console_cursor_draw(void);

#endif /* _CONSOLE_H */
