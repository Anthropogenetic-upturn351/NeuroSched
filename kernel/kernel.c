/*
 * kernel/kernel.c — NeuroSched kernel entry point
 *
 * This is the first C function called after the boot stub sets up the stack
 * and FPU. It orchestrates the full demo:
 *
 *   1. Verify Multiboot2 magic (sanity check)
 *   2. Initialize hardware drivers (VGA, serial)
 *   3. Print boot banner
 *   4. Run Phase 2: round-robin simulation with telemetry logging
 *   5. Run Phase 4: neural network scheduler simulation
 *   6. Run Phase 5: print side-by-side comparison table
 *   7. Halt
 *
 * The Multiboot2 spec guarantees that on entry:
 *   EAX = 0x36D76289  (Multiboot2 bootloader magic, passed from boot.S)
 *   EBX = MBI address (passed from boot.S)
 */

#include "vga.h"
#include "serial.h"
#include "scheduler.h"
#include "process.h"
#include <stdint.h>

/* Multiboot2 bootloader magic value (passed by GRUB) */
#define MULTIBOOT2_BOOTLOADER_MAGIC     0x36D76289U
/* Multiboot1 bootloader magic value (passed by QEMU -kernel) */
#define MULTIBOOT1_BOOTLOADER_MAGIC     0x2BADB002U

/*
 * kernel_main — C kernel entry point.
 *
 * Parameters come from boot.S via the x86 cdecl calling convention:
 *   magic    : Value of EAX on entry (should be MULTIBOOT2_BOOTLOADER_MAGIC)
 *   mbi_addr : Physical address of the Multiboot2 Information Structure
 *              (we don't parse the MBI in this version, but receive it correctly)
 */
void kernel_main(uint32_t magic, void *mbi_addr) {
    /* Silence unused-variable warning (mbi_addr not parsed in this version) */
    (void)mbi_addr;

    /* Init serial first so boot is visible even if VGA hangs */
    serial_init();
    serial_write("# NeuroSched v1.0 booting...\n");

    terminal_init();    /* Clear VGA screen, reset cursor */

    /* ── Step 2: Boot banner ──────────────────────────────────────────────── */
    terminal_hline(VGA_ATTR_HEADER);
    terminal_write_colored("  NeuroSched v1.0 — Neural-Network-Driven OS Scheduler\n",
                           VGA_ATTR_HEADER);
    terminal_write_colored("  x86 Multiboot2 Kernel | Built with i686-elf-gcc\n",
                           VGA_ATTR_HEADER);
    terminal_hline(VGA_ATTR_HEADER);

    /* ── Step 3: Verify boot magic ────────────────────────────────────────── */
    if (magic != MULTIBOOT2_BOOTLOADER_MAGIC &&
        magic != MULTIBOOT1_BOOTLOADER_MAGIC) {
        serial_write("# FATAL: invalid boot magic\n");
        terminal_write_colored("[FATAL] Invalid Multiboot magic: 0x", VGA_ATTR_ERROR);
        /* Print hex representation of magic */
        uint32_t m = magic;
        char hex[9];
        hex[8] = '\0';
        for (int i = 7; i >= 0; i--) {
            uint8_t nibble = (uint8_t)(m & 0xF);
            hex[i] = (char)(nibble < 10 ? '0' + nibble : 'A' + nibble - 10);
            m >>= 4;
        }
        terminal_write(hex);
        terminal_write_colored("\n[FATAL] Was this loaded by a Multiboot bootloader?\n",
                               VGA_ATTR_ERROR);
        while (1) { __asm__ volatile ("hlt"); }
    }

    terminal_write_colored("[OK] Multiboot2 boot verified\n", VGA_ATTR_SUCCESS);
    terminal_write_colored("[OK] VGA terminal initialized (80x25 text mode)\n",
                           VGA_ATTR_SUCCESS);
    terminal_write_colored("[OK] COM1 serial initialized (38400 baud, 8N1)\n",
                           VGA_ATTR_SUCCESS);
    terminal_write_colored("[OK] x87 FPU enabled (CR0.EM=0, MP=1)\n",
                           VGA_ATTR_SUCCESS);
    terminal_write("\n");

    /* ── Step 4: Initialize the synthetic workload ───────────────────────── */
    process_t workload_rr[WORKLOAD_SIZE];
    process_t workload_nn[WORKLOAD_SIZE];

    int n_procs = init_workload(workload_rr);
    init_workload(workload_nn);  /* Fresh copy for NN sim */

    terminal_write_colored("[INFO] Workload: ", VGA_ATTR_INFO);
    terminal_write_int(n_procs);
    terminal_write_colored(" synthetic processes initialized\n\n", VGA_ATTR_INFO);

    /* ── Step 5: Phase 2 — Round-Robin Simulation with CSV Telemetry ─────── */
    terminal_write_colored(">>> Phase 1: Round-Robin Simulation (logging CSV to COM1)\n",
                           VGA_ATTR_INFO);
    serial_write("# NeuroSched Round-Robin Telemetry Log");
    serial_newline();
    serial_write("# Format: pid,wait_ticks,remaining_burst,priority,io_bound,io_yield_count,score");
    serial_newline();

    sched_metrics_t rr_metrics = {0};
    run_round_robin(workload_rr, n_procs, /*log_csv=*/1, &rr_metrics);

    terminal_write_colored("[OK] Round-robin complete. Ticks: ", VGA_ATTR_SUCCESS);
    terminal_write_int((int32_t)rr_metrics.total_ticks);
    terminal_write_colored("\n\n", VGA_ATTR_SUCCESS);

    /* ── Step 6: Phase 4 — Neural Network Scheduler Simulation ──────────── */
    terminal_write_colored(">>> Phase 2: Neural Network Scheduler Simulation\n",
                           VGA_ATTR_NEURAL);
    terminal_write_colored("    (Yellow lines = NN fell back to round-robin)\n\n",
                           VGA_ATTR_INFO);
    serial_write("# Phase 2: Neural Network Scheduler Simulation starting...\n");

    sched_metrics_t nn_metrics = {0};
    run_neural_scheduler(workload_nn, n_procs, &nn_metrics);

    terminal_write_colored("\n[OK] Neural scheduler complete. Ticks: ", VGA_ATTR_SUCCESS);
    terminal_write_int((int32_t)nn_metrics.total_ticks);
    terminal_write_colored("\n", VGA_ATTR_SUCCESS);
    serial_write("# Neural scheduler complete. Ticks: ");
    serial_write_int((int32_t)nn_metrics.total_ticks);
    serial_newline();

    /* ── Step 7: Phase 5 — Print Comparison Table ────────────────────────── */
    print_comparison(&rr_metrics, &nn_metrics);


    terminal_write("\n");
    terminal_write_colored("  NeuroSched simulation complete. Halting CPU.\n",
                           VGA_ATTR_INFO);
    terminal_write_colored("  (See COM1 serial output for full CSV telemetry log)\n",
                           VGA_ATTR_INFO);
    terminal_hline(VGA_ATTR_HEADER);

    /* ── Step 8: Halt ─────────────────────────────────────────────────────── */
    while (1) {
        __asm__ volatile ("hlt");
    }
}
