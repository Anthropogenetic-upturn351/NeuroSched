/*
 * boot/boot.S — NeuroSched x86 boot stub (GNU AS, AT&T syntax)
 *
 * Responsibilities:
 *   1. Embed a valid Multiboot2 header so GRUB can identify and load this kernel.
 *   2. Set up a 16 KiB stack in the .bss section (no stack before this point).
 *   3. Enable the x87 FPU so kernel C code can use 'float' for NN inference.
 *   4. Call kernel_main(multiboot2_magic, mbi_pointer).
 *   5. Halt forever if kernel_main unexpectedly returns.
 *
 * CPU state on entry (guaranteed by Multiboot2 spec):
 *   - 32-bit protected mode
 *   - Interrupts disabled
 *   - EAX = 0x36D76289  (Multiboot2 bootloader magic)
 *   - EBX = physical address of Multiboot2 Information Structure (MBI)
 *   - Paging disabled, A20 line enabled
 */

/* ─── Multiboot2 Header Constants ───────────────────────────────────────────
 * Spec reference: https://www.gnu.org/software/grub/manual/multiboot2/multiboot.html
 *
 * MAGIC    : The 32-bit magic number that identifies a Multiboot2 header.
 * ARCH     : 0 = 32-bit i386 protected mode (the only architecture we target).
 * HDR_LEN  : Total byte length of our header (magic + arch + length + checksum + end_tag).
 * CHECKSUM : Must satisfy (magic + arch + header_length + checksum) ≡ 0 (mod 2^32).
 */
/* ─── Multiboot2 Header Constants (as .equ — GNU AS assembler directives) ──
 * Using .equ instead of #define so GNU AS resolves these without needing
 * the C preprocessor. If you assemble via 'i686-elf-gcc -c' (which runs cpp),
 * #define would also work — but plain 'i686-elf-as' does not run cpp.
 */
.equ MB2_MAGIC,     0xE85250D6
.equ MB2_ARCH,      0
.equ MB2_HDR_LEN,   24          /* 4+4+4+4 bytes + 8-byte end tag */
/* Checksum: (magic + arch + len + checksum) must equal 0 mod 2^32      */
.equ MB2_CHECKSUM,  (0 - MB2_MAGIC - MB2_ARCH - MB2_HDR_LEN)

/* ─── Multiboot1 constants (for QEMU -kernel direct loading) ────────────────
 * QEMU's built-in -kernel loader uses Multiboot1 for ELF kernels, so
 * we embed both headers. GRUB uses the Multiboot2 header; QEMU uses this one.
 */
.equ MB1_MAGIC,     0x1BADB002
.equ MB1_FLAGS,     0x00000000
.equ MB1_CHECKSUM,  (0 - MB1_MAGIC - MB1_FLAGS)

/* ─── Stack size ─────────────────────────────────────────────────────────── */
.equ STACK_SIZE,    16384       /* 16 KiB; plenty for our simple kernel      */

/* ─── Multiboot2 header section ─────────────────────────────────────────────
 * Must reside within the first 32 KiB of the binary image and be 8-byte aligned.
 * We place it in its own named section ".multiboot2" and force it to the
 * very beginning of the binary via the linker script.
 */
    .section .multiboot2, "a"       /* "a" = allocatable, mapped into memory */
    .align 8

multiboot2_header:
    .long   MB2_MAGIC               /* Magic number                          */
    .long   MB2_ARCH                /* Architecture: i386 32-bit             */
    .long   MB2_HDR_LEN             /* Header total length in bytes          */
    .long   MB2_CHECKSUM            /* Checksum (see formula above)          */

    /* End tag — mandatory terminator; type=0, flags=0, size=8 */
    .word   0                       /* Tag type: end                         */
    .word   0                       /* Tag flags: required                   */
    .long   8                       /* Tag size: 8 bytes                     */

/* ─── Multiboot1 header (for QEMU -kernel direct loading) ───────────────────
 * Placed in the same section, 4-byte aligned as required by Multiboot1 spec.
 * Must appear within first 8 KiB of the loaded kernel image.
 */
    .section .multiboot2, "a"
    .align 4
multiboot1_header:
    .long   MB1_MAGIC               /* Multiboot1 magic                      */
    .long   MB1_FLAGS               /* Flags: no special features             */
    .long   MB1_CHECKSUM            /* Checksum: -(magic+flags) mod 2^32      */

/* ─── BSS: kernel stack ──────────────────────────────────────────────────── */
    .section .bss, "aw", @nobits
    .align 16                       /* System V ABI requires 16-byte alignment */

stack_bottom:
    .skip STACK_SIZE
stack_top:                          /* ESP will point here (stack grows down) */

/* ─── Text: kernel entry point ───────────────────────────────────────────── */
    .section .text
    .global _start
    .type   _start, @function

_start:
    /* Preserve Multiboot handoff registers before probe clobbers them */
    movl    %eax, %esi          /* ESI = Multiboot magic                     */
    movl    %ebx, %edi          /* EDI = MBI pointer                         */

    /*
     * RAW BOOT PROBE: write to both COM1 (0x3F8) and QEMU debug port (0xE9).
     * Port 0xE9 always prints to QEMU stderr with no -serial config needed.
     * If 'S' appears on stderr, _start is executing.
     * If 'S' appears on serial file, COM1 is wired correctly.
     */
    movw    $0xE9, %dx
    movb    $0x53, %al          /* 'S' — start probe                         */
    outb    %al, %dx

    movw    $0x3F8, %dx         /* COM1 Data Register                        */
    movb    $0x53, %al
    outb    %al, %dx

    movw    $0xE9, %dx
    movb    $0x0A, %al          /* newline on debug port                     */
    outb    %al, %dx

    /* Restore Multiboot registers for kernel_main */
    movl    %esi, %eax
    movl    %edi, %ebx

    /* Step 1: Set up the stack.
     * Load the top of our BSS-allocated stack into ESP.
     * The stack grows downward, so we point ESP at stack_top.
     */
    movl    $stack_top, %esp

    /* Step 2: Enable the x87 FPU.
     * By default the FPU may be disabled (CR0.EM=1 means emulate, which
     * causes #NM on any FP instruction). We clear EM, set MP (monitor
     * coprocessor), clear TS (task-switched flag), and initialize the FPU.
     *
     * This is safe here because:
     *  - Our kernel is single-tasking (simulation loop, no preemptive scheduling).
     *  - No FPU state context-switching is needed.
     *  - We need float arithmetic for neural network inference.
     */
    movl    %cr0, %eax
    andl    $~(1 << 2), %eax        /* Clear EM (bit 2): hardware FPU, no emulation */
    orl     $(1 << 1), %eax         /* Set  MP (bit 1): monitor coprocessor         */
    andl    $~(1 << 3), %eax        /* Clear TS (bit 3): no task-switch FPU fault   */
    movl    %eax, %cr0
    fninit                          /* Initialize FPU control/status/tag words      */

    /* Step 3: Push Multiboot2 arguments for kernel_main.
     * C calling convention (cdecl): push right-to-left.
     * kernel_main(uint32_t magic, void *mbi_addr)
     *   → push EBX (mbi_addr) second, EAX (magic) first from the perspective
     *     of push order: push last arg first.
     */
    pushl   %ebx                    /* arg2: Multiboot2 Information Structure ptr */
    pushl   %eax                    /* arg1: Multiboot2 magic value               */

    /* Step 4: Call the C kernel entry point. */
    call    kernel_main

    /* Step 5: If kernel_main ever returns (it shouldn't), halt the CPU.
     * cli: disable interrupts so no ISR can wake us.
     * hlt: stop the CPU until the next interrupt (which will never come).
     * The loop catches spurious NMIs that bypass cli.
     */
    cli
.halt_loop:
    hlt
    jmp     .halt_loop

    .size _start, . - _start
