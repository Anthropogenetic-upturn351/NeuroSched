/*
 * linker.ld — NeuroSched bare-metal linker script for i686-elf target
 *
 * Purpose:
 *   Controls the memory layout of the kernel ELF binary. Critical requirements:
 *   1. The Multiboot2 header must appear within the first 32 KiB of the file.
 *   2. The kernel loads at 1 MiB (0x100000) — safely above BIOS/IVT memory.
 *   3. Sections must be ordered: multiboot header → code → read-only data → data → BSS.
 *
 * Physical memory map (simplified):
 *   0x00000 – 0x9FFFF  : Conventional RAM (some reserved by BIOS, IVT, EBDA)
 *   0xA0000 – 0xBFFFF  : Video memory (VGA frame buffer at 0xB8000)
 *   0xC0000 – 0xFFFFF  : BIOS ROMs / option ROMs
 *   0x100000            : ← Kernel loaded here (1 MiB mark, safe for protected mode)
 */

/* Output format: 32-bit ELF for i386 (matches i686-elf cross-compiler output) */
OUTPUT_FORMAT(elf32-i386)

/* The assembler entry point symbol defined in boot/boot.S */
ENTRY(_start)

SECTIONS {
    /*
     * Start placing sections at 1 MiB (0x100000).
     * This is the standard location for kernels loaded by Multiboot-compliant
     * bootloaders — it sits safely above all the BIOS-reserved memory below 1 MiB.
     */
    . = 1M;

    /*
     * .multiboot2 — Multiboot2 header block.
     * MUST be the very first thing in the binary. GRUB scans the first 32 KiB
     * of the loaded image for the Multiboot2 magic number (0xE85250D6).
     * We give this section its own segment so the linker places it first.
     */
    .multiboot2 : {
        KEEP(*(.multiboot2))    /* KEEP prevents --gc-sections from removing it */
    }

    /*
     * .text — Executable code.
     * Aligned to 4 KiB page boundary (good practice, required if paging is enabled).
     */
    . = ALIGN(4096);
    .text : {
        *(.text .text.*)        /* All code from all object files */
    }

    /*
     * .rodata — Read-only data (string literals, const arrays, NN weight tables).
     * The neural network weights (nn_weights.h) are static const floats and
     * will land here. Placed right after .text.
     */
    . = ALIGN(4096);
    .rodata : {
        *(.rodata .rodata.*)
    }

    /*
     * .data — Initialized read-write global/static data.
     */
    . = ALIGN(4096);
    .data : {
        *(.data .data.*)
    }

    /*
     * .bss — Uninitialized data (zero-filled at load time by the bootloader).
     * This includes our kernel stack (allocated in boot/boot.S via .skip).
     * The bootloader zeroes .bss before transferring control to _start.
     */
    . = ALIGN(4096);
    .bss : {
        *(COMMON)               /* Common symbols (uninitialized globals)    */
        *(.bss .bss.*)          /* BSS section data from all object files    */
    }

    /*
     * Record the end of the kernel image for potential future use
     * (e.g., heap allocation starting point).
     */
    kernel_end = .;
}
