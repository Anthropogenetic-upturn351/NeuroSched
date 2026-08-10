/*
 * kernel/vga.c — VGA text-mode terminal driver implementation
 *
 * This driver provides direct memory-mapped I/O to the VGA text buffer at
 * physical address 0xB8000. No OS calls, no libc — just pointer arithmetic
 * and memory writes. Every function here is purposefully simple so it can
 * be understood at a glance during a code review.
 *
 * VGA text buffer layout:
 *   Each cell = 2 bytes: [ASCII byte] [attribute byte]
 *   Buffer index for (row, col): (row * VGA_WIDTH + col) * 2
 *   Attribute byte: bits[3:0] = fg color, bits[6:4] = bg color
 */

#include "vga.h"

/* ─── Module State ────────────────────────────────────────────────────────── */

/* Direct pointer to the VGA text buffer. Volatile: hardware can read it. */
static volatile uint16_t *const vga_buffer = (volatile uint16_t *)VGA_BASE_ADDR;

static uint8_t  term_row;       /* Current cursor row    [0, VGA_HEIGHT-1] */
static uint8_t  term_col;       /* Current cursor column [0, VGA_WIDTH-1]  */
static uint8_t  term_attr;      /* Current text attribute byte             */

/* ─── Internal helpers ────────────────────────────────────────────────────── */

/*
 * vga_entry — Combine a character and attribute into a 16-bit VGA cell value.
 * Bit layout: [15:8] = attribute, [7:0] = character.
 */
static inline uint16_t vga_entry(unsigned char c, uint8_t attr) {
    return (uint16_t)((uint16_t)attr << 8) | (uint16_t)c;
}

/*
 * vga_put_at — Write a character cell at an absolute (row, col) position.
 * Does NOT update the cursor.
 */
static inline void vga_put_at(char c, uint8_t attr, uint8_t row, uint8_t col) {
    vga_buffer[(uint32_t)row * VGA_WIDTH + (uint32_t)col] = vga_entry((unsigned char)c, attr);
}

/* ─── Public API Implementation ───────────────────────────────────────────── */

void terminal_init(void) {
    term_row  = 0;
    term_col  = 0;
    term_attr = VGA_ATTR_NORMAL;

    /* Clear the entire VGA buffer with space characters and normal attributes */
    for (uint8_t r = 0; r < VGA_HEIGHT; r++) {
        for (uint8_t c = 0; c < VGA_WIDTH; c++) {
            vga_put_at(' ', VGA_ATTR_NORMAL, r, c);
        }
    }
}

void terminal_setcolor(uint8_t attr) {
    term_attr = attr;
}

void terminal_scroll(void) {
    /*
     * Scroll up by one line: copy each row's content up one position,
     * then clear the last row with spaces.
     */
    for (uint8_t r = 0; r < VGA_HEIGHT - 1; r++) {
        for (uint8_t c = 0; c < VGA_WIDTH; c++) {
            vga_buffer[(uint32_t)r * VGA_WIDTH + c] =
                vga_buffer[(uint32_t)(r + 1) * VGA_WIDTH + c];
        }
    }
    /* Clear the last row */
    for (uint8_t c = 0; c < VGA_WIDTH; c++) {
        vga_put_at(' ', VGA_ATTR_NORMAL, VGA_HEIGHT - 1, c);
    }
    /* Keep cursor at the start of the last row after scroll */
    term_row = VGA_HEIGHT - 1;
    term_col = 0;
}

void terminal_putchar(char c) {
    if (c == '\n') {
        /* Newline: move to next row, reset column */
        term_col = 0;
        if (++term_row >= VGA_HEIGHT) {
            terminal_scroll();
        }
        return;
    }

    if (c == '\r') {
        term_col = 0;
        return;
    }

    /* Write the character at the current cursor position */
    vga_put_at(c, term_attr, term_row, term_col);

    /* Advance cursor; wrap to next line if we've hit the right edge */
    if (++term_col >= VGA_WIDTH) {
        term_col = 0;
        if (++term_row >= VGA_HEIGHT) {
            terminal_scroll();
        }
    }
}

void terminal_write(const char *str) {
    while (*str != '\0') {
        terminal_putchar(*str++);
    }
}

void terminal_write_colored(const char *str, uint8_t attr) {
    uint8_t saved = term_attr;
    term_attr = attr;
    terminal_write(str);
    term_attr = saved;
}

void terminal_write_int(int32_t value) {
    /* Handle negative numbers */
    if (value < 0) {
        terminal_putchar('-');
        value = -value;
    }

    if (value == 0) {
        terminal_putchar('0');
        return;
    }

    /* Extract digits into a small buffer (max 10 digits for int32) */
    char buf[12];
    int idx = 0;
    while (value > 0) {
        buf[idx++] = '0' + (char)(value % 10);
        value /= 10;
    }

    /* Digits are in reverse order — print them in reverse */
    for (int i = idx - 1; i >= 0; i--) {
        terminal_putchar(buf[i]);
    }
}

void terminal_write_fixed(int32_t hundredths) {
    /*
     * Print a value that represents hundredths as "X.YY".
     * Example: 1234 → "12.34", 507 → "5.07", 100 → "1.00"
     */
    int32_t whole   = hundredths / 100;
    int32_t frac    = hundredths % 100;
    if (frac < 0) frac = -frac;

    terminal_write_int(whole);
    terminal_putchar('.');
    if (frac < 10) terminal_putchar('0');   /* Leading zero for tenths place */
    terminal_write_int(frac);
}

void terminal_setcursor(uint8_t row, uint8_t col) {
    if (row < VGA_HEIGHT) term_row = row;
    if (col < VGA_WIDTH)  term_col = col;
}

uint8_t terminal_row(void) {
    return term_row;
}

void terminal_hline(uint8_t attr) {
    uint8_t saved = term_attr;
    term_attr = attr;
    for (int i = 0; i < VGA_WIDTH; i++) {
        terminal_putchar('-');
    }
    term_attr = saved;
    /* hline already advances to a new row via the VGA_WIDTH column wrap */
}
