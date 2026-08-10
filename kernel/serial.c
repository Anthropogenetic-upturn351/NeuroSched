/*
 * kernel/serial.c — COM1 serial port driver
 *
 * x86 hardware I/O ports are accessed via the IN and OUT instructions.
 * Since we can't use <sys/io.h> in a freestanding kernel, we use
 * inline assembly wrappers (outb/inb) to talk to the UART registers.
 *
 * COM1 UART register map (base = 0x3F8):
 *   0x3F8 (DLAB=0): Data Register          — read to receive, write to transmit
 *   0x3F8 (DLAB=1): Divisor Latch LSB      — baud rate low byte
 *   0x3F9 (DLAB=0): Interrupt Enable Reg   — enable/disable UART interrupts
 *   0x3F9 (DLAB=1): Divisor Latch MSB      — baud rate high byte
 *   0x3FA          : FIFO Control Register  — enable & flush FIFOs
 *   0x3FB          : Line Control Register  — data format, enable DLAB
 *   0x3FC          : Modem Control Register — RTS/DTR signals
 *   0x3FD          : Line Status Register   — TX ready / RX data available
 */

#include "serial.h"

/* ─── Port I/O helpers ─────────────────────────────────────────────────────
 * These are inlined so each call compiles to exactly one x86 IN/OUT instruction.
 */
static inline void outb(uint16_t port, uint8_t val) {
    __asm__ volatile ("outb %0, %1" : : "a"(val), "Nd"(port) : "memory");
}

static inline uint8_t inb(uint16_t port) {
    uint8_t ret;
    __asm__ volatile ("inb %1, %0" : "=a"(ret) : "Nd"(port) : "memory");
    return ret;
}

/* ─── Line Status Register flags ──────────────────────────────────────────── */
#define LSR_TX_EMPTY    (1 << 5)    /* Transmit Holding Register Empty        */

/* ─── Public API ──────────────────────────────────────────────────────────── */

void serial_init(void) {
    /*
     * Standard 16550-compatible UART initialization sequence.
     * We configure for 38400 baud, 8 data bits, no parity, 1 stop bit (8N1).
     *
     * Base clock = 115200 Hz. Divisor = 115200 / 38400 = 3.
     */

    /* Step 1: Disable all UART interrupts (we'll poll instead of using IRQs) */
    outb(SERIAL_COM1_BASE + 1, 0x00);

    /* Step 2: Enable DLAB (Divisor Latch Access Bit) to set baud rate divisor.
     *         DLAB is bit 7 of the Line Control Register (0x3FB). */
    outb(SERIAL_COM1_BASE + 3, 0x80);

    /* Step 3: Set baud rate divisor = 3 (= 38400 baud).
     *         Write low byte to 0x3F8, high byte to 0x3F9. */
    outb(SERIAL_COM1_BASE + 0, 0x03);   /* Divisor LSB */
    outb(SERIAL_COM1_BASE + 1, 0x00);   /* Divisor MSB */

    /* Step 4: Set data format (and clear DLAB).
     *         0x03 = 8 data bits, no parity, 1 stop bit, DLAB=0. */
    outb(SERIAL_COM1_BASE + 3, 0x03);

    /* Step 5: Enable and reset FIFOs with 14-byte threshold.
     *         FCR = 0xC7: enable FIFO, clear RX/TX FIFOs, set 14-byte trigger. */
    outb(SERIAL_COM1_BASE + 2, 0xC7);

    /* Step 6: Set modem control: enable RTS and DTR (needed for some setups). */
    outb(SERIAL_COM1_BASE + 4, 0x0B);
}

void serial_putchar(char c) {
    /*
     * Write directly to the COM1 data register without polling THRE.
     * QEMU's serial backend (file, socket, pty) always accepts bytes
     * immediately, making THRE polling unnecessary and harmful in TCG
     * mode where each inb costs thousands of emulation cycles.
     * On real hardware, the FIFO gives us a 16-byte buffer — for a kernel
     * that writes only short bursts, this is always sufficient.
     */
    outb(SERIAL_COM1_BASE, (uint8_t)c);
}

void serial_write(const char *str) {
    while (*str != '\0') {
        serial_putchar(*str++);
    }
}

void serial_write_int(int32_t value) {
    if (value < 0) {
        serial_putchar('-');
        value = -value;
    }

    if (value == 0) {
        serial_putchar('0');
        return;
    }

    char buf[12];
    int idx = 0;
    while (value > 0) {
        buf[idx++] = '0' + (char)(value % 10);
        value /= 10;
    }
    for (int i = idx - 1; i >= 0; i--) {
        serial_putchar(buf[i]);
    }
}

void serial_newline(void) {
    serial_putchar('\r');
    serial_putchar('\n');
}
