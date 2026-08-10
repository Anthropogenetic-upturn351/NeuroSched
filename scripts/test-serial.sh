#!/bin/bash
# Boot test: 5-minute timeout to allow for SeaBIOS + TCG slowness
# -net none = skip iPXE, -nographic = serial to stdout
rm -f /tmp/q.log

echo "[boot-test] Starting QEMU - this may take several minutes in TCG mode..."

timeout 300 qemu-system-i386 \
  -kernel /neurosched/build/kernel.elf \
  -nographic \
  -no-reboot \
  -m 32M \
  -net none 2>/tmp/q.log

RC=$?
echo ""
echo "--- QEMU exit code: $RC ---"
echo "--- QEMU log ---"
cat /tmp/q.log
