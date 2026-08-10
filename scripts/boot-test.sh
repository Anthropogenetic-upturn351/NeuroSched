#!/bin/bash
# NeuroSched Boot and Verification Test
LOGFILE="/tmp/serial.log"
rm -f "$LOGFILE"

echo "[boot-test] Launching NeuroSched kernel in QEMU..."

timeout 45 qemu-system-i386 \
  -kernel /neurosched/build/neurosched.elf \
  -serial file:"$LOGFILE" \
  -display none \
  -no-reboot \
  -m 32M \
  -net none 2>/dev/null

echo "[boot-test] Simulation finished."
echo ""
echo "==================== SERIAL LOG OUTPUT ===================="
if [ -f "$LOGFILE" ]; then
    cat "$LOGFILE"
else
    echo "ERROR: Serial log file was not generated."
fi
echo "==========================================================="
