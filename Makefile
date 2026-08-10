# NeuroSched Makefile
#
# Build system for the NeuroSched x86 kernel.
#
# Targets:
#   all       — Build kernel ELF and bootable ISO (default)
#   kernel    — Build only the kernel ELF binary
#   iso       — Build the GRUB-bootable ISO image
#   run       — Launch QEMU with the ISO (serial → stdout)
#   run-log   — Launch QEMU, save serial telemetry to telemetry.csv
#   train     — Train the NN on telemetry.csv and regenerate nn_weights.h
#   clean     — Remove all build artifacts
#   help      — Show this message
#
# Prerequisites (must be on PATH):
#   i686-elf-gcc, i686-elf-as, i686-elf-ld  — cross-compiler toolchain
#   grub-mkrescue                             — create bootable ISO
#   qemu-system-i386                          — x86 emulator for testing
#   python3                                   — for training script
#
# Quick start on Windows with lordmilko/i686-elf-tools:
#   1. Extract i686-elf-tools-windows.zip to tools\i686-elf\
#   2. Run: set PATH=%CD%\tools\i686-elf\bin;%PATH%
#   3. Run: make

# ─── Toolchain ────────────────────────────────────────────────────────────────
CROSS   := i686-elf
CC      := $(CROSS)-gcc
AS      := $(CROSS)-as
LD      := $(CROSS)-ld

PYTHON  := python
QEMU    := qemu-system-i386
MKRESCUE := grub-mkrescue

# ─── Flags ────────────────────────────────────────────────────────────────────
#
# -ffreestanding  : No OS-provided C library or startup files
# -O2             : Optimize (improves code size and performance)
# -Wall -Wextra   : Strict warnings — clean code matters
# -fno-stack-protector : Stack canaries require OS runtime support (not available)
# -mno-sse -mno-mmx    : No SSE/MMX — we haven't saved/restored that state
#                        (we do enable the x87 FPU, but that's handled separately)
# -nostdlib       : Don't link against standard C library
# -I              : Include path for nn_weights.h
#
CFLAGS  := -ffreestanding -O2 -Wall -Wextra -fno-stack-protector \
           -mno-sse -mno-mmx -std=c99 \
           -Iinclude

ASFLAGS :=
LDFLAGS := -T linker.ld -nostdlib

# ─── Source Files ─────────────────────────────────────────────────────────────
BOOT_OBJ  := build/boot.o
KERNEL_OBJS := build/kernel.o  \
               build/vga.o     \
               build/serial.o  \
               build/scheduler.o \
               build/nn_infer.o

ALL_OBJS  := $(BOOT_OBJ) $(KERNEL_OBJS)

# ─── Output Files ─────────────────────────────────────────────────────────────
KERNEL_ELF  := build/kernel.elf
KERNEL_BIN  := iso/boot/kernel.bin
ISO_IMAGE   := build/neurosched.iso

# ─── Phony Targets ────────────────────────────────────────────────────────────
.PHONY: all kernel iso run run-log train clean help

all: iso

# ─── Build Targets ────────────────────────────────────────────────────────────

# Create build directory
build:
	mkdir -p build

# Assemble the boot stub (GNU AS)
$(BOOT_OBJ): boot/boot.S | build
	$(AS) $(ASFLAGS) -o $@ $<

# Compile kernel C files
build/kernel.o: kernel/kernel.c kernel/vga.h kernel/serial.h \
                kernel/scheduler.h kernel/process.h | build
	$(CC) $(CFLAGS) -c -o $@ $<

build/vga.o: kernel/vga.c kernel/vga.h | build
	$(CC) $(CFLAGS) -c -o $@ $<

build/serial.o: kernel/serial.c kernel/serial.h | build
	$(CC) $(CFLAGS) -c -o $@ $<

build/scheduler.o: kernel/scheduler.c kernel/scheduler.h kernel/process.h \
                   kernel/nn_infer.h include/nn_weights.h | build
	$(CC) $(CFLAGS) -c -o $@ $<

build/nn_infer.o: kernel/nn_infer.c kernel/nn_infer.h kernel/process.h \
                  include/nn_weights.h | build
	$(CC) $(CFLAGS) -c -o $@ $<

# Link all objects into the kernel ELF
$(KERNEL_ELF): $(ALL_OBJS)
	$(LD) $(LDFLAGS) -o $@ $^
	@echo "Kernel ELF: $@ ($(shell $(CROSS)-size $@ | tail -1 | awk '{print $$4}') bytes BSS)"

# Verify Multiboot2 header with grub-file (optional but helpful)
kernel: $(KERNEL_ELF)
	@echo "[VERIFY] Checking ELF for Multiboot2 compliance..."
	@grub-file --is-x86-multiboot2 $(KERNEL_ELF) && echo "[OK] Multiboot2 header valid" \
	    || echo "[WARN] grub-file not available or header check failed — manual QEMU test needed"
	cp $(KERNEL_ELF) $(KERNEL_BIN)

# Build GRUB-bootable ISO
iso: kernel
	$(MKRESCUE) -o $(ISO_IMAGE) iso
	@echo "[OK] ISO: $(ISO_IMAGE)"
	@echo "[OK] Run with: make run"

# ─── QEMU Targets ─────────────────────────────────────────────────────────────

# Run kernel in QEMU — serial output to terminal
# -nographic: no VGA window; -serial stdio: COM1 to stdout
# Use Ctrl-A then X to exit QEMU in nographic mode.
#
# NOTE: Use 'make run-vga' to see VGA output in a window instead.
run: $(ISO_IMAGE)
	$(QEMU) \
	    -cdrom $(ISO_IMAGE) \
	    -serial stdio \
	    -m 32M \
	    -no-reboot \
	    -no-shutdown

# Run with VGA window (default) + serial to file
run-vga: $(ISO_IMAGE)
	$(QEMU) \
	    -cdrom $(ISO_IMAGE) \
	    -serial stdio \
	    -m 32M \
	    -no-reboot

# Run and save serial telemetry to file for training
run-log: $(ISO_IMAGE)
	@echo "Running kernel, saving telemetry to telemetry.csv ..."
	$(QEMU) \
	    -cdrom $(ISO_IMAGE) \
	    -serial file:telemetry.csv \
	    -m 32M \
	    -no-reboot \
	    -no-shutdown \
	    -display none
	@echo "Telemetry saved to telemetry.csv"
	@echo "Row count: $$(grep -c ',' telemetry.csv 2>/dev/null || echo 'unknown')"

# ─── Training Target ──────────────────────────────────────────────────────────

train:
	@echo "Training NN on telemetry data..."
	$(PYTHON) scripts/train.py --data telemetry.csv --epochs 500 --lr 0.01
	@echo "Weights exported to include/nn_weights.h"
	@echo "Rebuilding kernel with new weights..."
	$(MAKE) clean
	$(MAKE) all

train-synthetic:
	@echo "Training NN on synthetic data (no telemetry CSV needed)..."
	$(PYTHON) scripts/train.py --epochs 500 --lr 0.01
	@echo "Weights exported to include/nn_weights.h"

# ─── Clean ────────────────────────────────────────────────────────────────────
clean:
	rm -rf build/
	rm -f iso/boot/kernel.bin
	@echo "Build artifacts removed."

# ─── Help ─────────────────────────────────────────────────────────────────────
help:
	@echo "NeuroSched Build System"
	@echo ""
	@echo "Targets:"
	@echo "  make          — Build everything (kernel + ISO)"
	@echo "  make kernel   — Build kernel ELF only"
	@echo "  make iso      — Build bootable ISO (default target)"
	@echo "  make run      — Run in QEMU (serial to terminal)"
	@echo "  make run-vga  — Run in QEMU with VGA window"
	@echo "  make run-log  — Run and save telemetry to telemetry.csv"
	@echo "  make train    — Train NN on telemetry.csv, rebuild"
	@echo "  make train-synthetic — Train on synthetic data (no CSV needed)"
	@echo "  make clean    — Remove build artifacts"
	@echo ""
	@echo "Full workflow:"
	@echo "  1. make run-log      (boot kernel, capture telemetry)"
	@echo "  2. make train        (train NN, rebuild with new weights)"
	@echo "  3. make run          (boot kernel with neural scheduler)"
