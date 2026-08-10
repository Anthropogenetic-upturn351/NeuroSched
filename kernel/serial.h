/*
 * kernel/serial.h — COM1 serial port driver interface
 *
 * Used for structured telemetry logging: every scheduling decision is written
 * as a CSV row to COM1, which QEMU can redirect to a file or stdout.
 * This gives us a clean dataset for Python-side MLP training.
 */

#ifndef SERIAL_H
#define SERIAL_H

#include <stdint.h>

/* COM1 I/O base port address */
#define SERIAL_COM1_BASE    0x3F8

/* Initialize COM1 at 38400 baud, 8N1 (8 data bits, no parity, 1 stop bit) */
void serial_init(void);

/* Write a single byte to COM1 (blocking poll until TX buffer is empty) */
void serial_putchar(char c);

/* Write a null-terminated string to COM1 */
void serial_write(const char *str);

/* Write a decimal integer as ASCII text to COM1 */
void serial_write_int(int32_t value);

/* Write a newline (\r\n) to COM1 */
void serial_newline(void);

#endif /* SERIAL_H */
