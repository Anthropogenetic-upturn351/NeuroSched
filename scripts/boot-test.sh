#!/bin/bash
# NeuroSched Boot and Verification Test
LOGFILE="/tmp/serial.log"
rm -f "$LOGFILE"

echo "[boot-test] Launching NeuroSched kernel in QEMU..."
echo "==================== SERIAL LOG OUTPUT ===================="

timeout 20 qemu-system-i386 \
  -kernel /neurosched/build/kernel.elf \
  -serial stdio \
  -display none \
  -no-reboot \
  -m 32M \
  -net none 2>&1

echo "==========================================================="
echo "[boot-test] Simulation finished."
