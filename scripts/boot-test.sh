#!/bin/bash
# NeuroSched boot test — captures serial output reliably
# Uses Unix domain socket with 'wait': QEMU holds the kernel until nc connects,
# so no serial bytes are lost.

rm -f /tmp/s.sock /tmp/serial.log

# Start QEMU: kernel via Multiboot1, serial to Unix socket (waits for client)
qemu-system-i386 \
  -kernel /neurosched/build/kernel.elf \
  -serial unix:/tmp/s.sock,server,wait \
  -display none \
  -no-reboot \
  -m 32M 2>/tmp/q.log &
QPID=$!

# Give QEMU 1s to create and bind the socket
sleep 1

echo "QEMU started (PID $QPID), connecting..."

# Connect and capture up to 400 bytes within 30 seconds
timeout 30 sh -c 'nc -U /tmp/s.sock | head -c 400' > /tmp/serial.log 2>/dev/null || true

kill $QPID 2>/dev/null
wait $QPID 2>/dev/null

echo "=== serial output ==="
cat /tmp/serial.log

BYTES=$(wc -c < /tmp/serial.log 2>/dev/null || echo 0)
echo ""
echo "--- captured $BYTES bytes ---"

echo "=== QEMU log ==="
cat /tmp/q.log 2>/dev/null
