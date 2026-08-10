/*
 * kernel/vga.h — VGA text-mode terminal driver interface
 *
 * Provides a simple abstraction over the VGA text buffer at 0xB8000.
 * Supports 80×25 character display, 16 foreground colors, 8 background colors,
 * and cursor position tracking.
 */

#ifndef VGA_H
#define VGA_H

#include <stdint.h>
#include <stddef.h>

/* ─── VGA Text Mode Constants ─────────────────────────────────────────────── */

#define VGA_WIDTH       80
#define VGA_HEIGHT      25
#define VGA_BASE_ADDR   0xB8000     /* Physical address of VGA text buffer    */

/*
 * VGA hardware text colors.
 * The attribute byte combines:
 *   bits [3:0] = foreground color (16 colors with intensity bit)
 *   bits [6:4] = background color (8 colors)
 *   bit  [7]   = blink / high-intensity background (mode-dependent)
 */
typedef enum {
    VGA_COLOR_BLACK         = 0,
    VGA_COLOR_BLUE          = 1,
    VGA_COLOR_GREEN         = 2,
    VGA_COLOR_CYAN          = 3,
    VGA_COLOR_RED           = 4,
    VGA_COLOR_MAGENTA       = 5,
    VGA_COLOR_BROWN         = 6,
    VGA_COLOR_LIGHT_GREY    = 7,
    VGA_COLOR_DARK_GREY     = 8,
    VGA_COLOR_LIGHT_BLUE    = 9,
    VGA_COLOR_LIGHT_GREEN   = 10,
    VGA_COLOR_LIGHT_CYAN    = 11,
    VGA_COLOR_LIGHT_RED     = 12,
    VGA_COLOR_LIGHT_MAGENTA = 13,
    VGA_COLOR_LIGHT_BROWN   = 14,   /* Often rendered as yellow */
    VGA_COLOR_WHITE         = 15,
} vga_color_t;

/* Predefined color pairs for common log levels */
#define VGA_ATTR_NORMAL     ((VGA_COLOR_BLACK << 4) | VGA_COLOR_LIGHT_GREY)
#define VGA_ATTR_SUCCESS    ((VGA_COLOR_BLACK << 4) | VGA_COLOR_LIGHT_GREEN)
#define VGA_ATTR_WARN       ((VGA_COLOR_BLACK << 4) | VGA_COLOR_LIGHT_BROWN)
#define VGA_ATTR_ERROR      ((VGA_COLOR_BLACK << 4) | VGA_COLOR_LIGHT_RED)
#define VGA_ATTR_INFO       ((VGA_COLOR_BLACK << 4) | VGA_COLOR_LIGHT_CYAN)
#define VGA_ATTR_NEURAL     ((VGA_COLOR_BLACK << 4) | VGA_COLOR_LIGHT_MAGENTA)
#define VGA_ATTR_HEADER     ((VGA_COLOR_BLUE  << 4) | VGA_COLOR_WHITE)

/* ─── Public API ──────────────────────────────────────────────────────────── */

/* Initialize the VGA terminal: clear screen, reset cursor to (0,0). */
void terminal_init(void);

/* Set the current text attribute byte (color for subsequent writes). */
void terminal_setcolor(uint8_t attr);

/* Write a single character at the current cursor position (advances cursor). */
void terminal_putchar(char c);

/* Write a null-terminated string at the current cursor position. */
void terminal_write(const char *str);

/* Write a string with a specific color attribute (saves/restores current attr). */
void terminal_write_colored(const char *str, uint8_t attr);

/* Write a decimal integer as text. */
void terminal_write_int(int32_t value);

/* Write a fixed-point decimal: prints value/100 with 2 decimal places.
 * Used for float-like output without printf (e.g., "12.34" from 1234). */
void terminal_write_fixed(int32_t hundredths);

/* Move the cursor to a specific row/column. */
void terminal_setcursor(uint8_t row, uint8_t col);

/* Get current cursor row. */
uint8_t terminal_row(void);

/* Draw a horizontal line of '─' characters across the full width. */
void terminal_hline(uint8_t attr);

/* Scroll the terminal up by one line (used when cursor reaches bottom). */
void terminal_scroll(void);

#endif /* VGA_H */
