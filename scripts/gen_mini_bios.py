"""
Generate mini_bios.bin - a tiny 64KB BIOS that bypasses SeaBIOS entirely.

Sequence:
  Reset vector (0xFFFF0) -> setup code (0xF0000) -> protected mode -> kernel at 0x101000

QEMU usage:
  -bios mini_bios.bin  -device loader,file=kernel.elf

The loader device loads the ELF PT_LOAD segments to their physical addresses
before the CPU starts. The mini BIOS then sets up protected mode and jumps
directly to 0x101000 (_start) with EAX = 0x2BADB002 (Multiboot1 magic).
"""

import struct, sys, os

BIOS_SIZE   = 0x10000          # 64 KB
BIOS_MIRROR = 0xF0000          # Where QEMU mirrors this in first 1 MB
bios        = bytearray([0xFF] * BIOS_SIZE)

# ── GDT at offset 0x0100 (physical 0xF0100) ────────────────────────────────
GDT_OFF  = 0x0100
GDT_PHYS = BIOS_MIRROR + GDT_OFF

gdt  = bytearray(8)                                           # null
gdt += bytearray([0xFF,0xFF,0x00,0x00,0x00,0x9A,0xCF,0x00])  # 0x08 code
gdt += bytearray([0xFF,0xFF,0x00,0x00,0x00,0x92,0xCF,0x00])  # 0x10 data
bios[GDT_OFF : GDT_OFF + len(gdt)] = gdt

# GDT descriptor (limit=23, base=GDT_PHYS) at offset 0x0120
GDTD_OFF  = 0x0120
GDTD_PHYS = BIOS_MIRROR + GDTD_OFF
gdtd = struct.pack('<HI', len(gdt) - 1, GDT_PHYS)
bios[GDTD_OFF : GDTD_OFF + 6] = gdtd

# ── 32-bit protected mode code at offset 0x0050 (physical 0xF0050) ─────────
PM_OFF  = 0x0050
PM_PHYS = BIOS_MIRROR + PM_OFF

pm = bytearray()
pm += bytes([0x66,0xB8,0x10,0x00])     # mov ax, 0x10
pm += bytes([0x8E,0xD8])               # mov ds, ax
pm += bytes([0x8E,0xC0])               # mov es, ax
pm += bytes([0x8E,0xD0])               # mov ss, ax
pm += bytes([0x8E,0xE0])               # mov fs, ax
pm += bytes([0x8E,0xE8])               # mov gs, ax
pm += bytes([0xBC,0x00,0x00,0x09,0x00])# mov esp, 0x00090000
pm += bytes([0xB8,0x02,0xB0,0xAD,0x1B])# mov eax, 0x1BADB002 (MB1 magic)
pm += bytes([0x31,0xDB])               # xor ebx, ebx  (no MBI)
pm += bytes([0xB9,0x00,0x10,0x10,0x00])# mov ecx, 0x00101000 (kernel entry)
pm += bytes([0xFF,0xE1])               # jmp ecx

bios[PM_OFF : PM_OFF + len(pm)] = pm

# ── 16-bit real mode setup code at offset 0x0000 (physical 0xF0000) ────────
setup = bytearray()

# DS = CS = 0xF000 so that our GDT descriptor is addressable
setup += bytes([0x8C,0xC8])            # mov ax, cs
setup += bytes([0x8E,0xD8])            # mov ds, ax

setup += bytes([0xFA])                 # cli

# LGDT [GDTD_OFF]: ds:GDTD_OFF = 0xF000:0x0120 = physical 0xF0120
# 66 prefix = 32-bit GDT descriptor (6 bytes: 2 limit + 4 base)
setup += bytes([0x66,0x0F,0x01,0x16,
                GDTD_OFF & 0xFF, (GDTD_OFF >> 8) & 0xFF])

# mov eax, cr0  /  or eax, 1  /  mov cr0, eax
setup += bytes([0x0F,0x20,0xC0])
setup += bytes([0x66,0x83,0xC8,0x01])
setup += bytes([0x0F,0x22,0xC0])

# Far jmp to 32-bit CS=0x08, offset=PM_PHYS
# In 16-bit mode with operand-size override (0x66):
#   opcode = 0xEA, then 4-byte offset, then 2-byte selector
setup += bytes([0x66,0xEA])
setup += struct.pack('<I', PM_PHYS)    # 32-bit absolute
setup += struct.pack('<H', 0x0008)     # CS selector

bios[0 : len(setup)] = setup

# ── Reset vector at offset 0xFFF0 (physical 0xFFFF0) ───────────────────────
# JMP FAR 0xF000:0x0000
bios[0xFFF0] = 0xEA
bios[0xFFF1] = 0x00   # IP = 0x0000
bios[0xFFF2] = 0x00
bios[0xFFF3] = 0x00   # CS = 0xF000
bios[0xFFF4] = 0xF0
bios[0xFFF5] = 0xF4   # HLT (safety)
bios[0xFFF6] = 0xEB
bios[0xFFF7] = 0xFE   # JMP $ (infinite loop, safety)

out = os.path.join(os.path.dirname(__file__), '..', 'build', 'mini_bios.bin')
with open(out, 'wb') as f:
    f.write(bytes(bios))

print(f"Written {BIOS_SIZE} bytes -> {out}")
print(f"GDT phys      0x{GDT_PHYS:08X}")
print(f"GDT desc phys 0x{GDTD_PHYS:08X}")
print(f"pmode32 phys  0x{PM_PHYS:08X}")
print(f"Reset vector  0xFFFF0 -> 0xF0000 -> pmode32 -> kernel at 0x101000")
