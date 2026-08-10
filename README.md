# NeuroSched

A minimal x86 bare-metal operating system kernel featuring an embedded C neural network process scheduler.

---

## Overview

NeuroSched is a freestanding 32-bit x86 operating system kernel designed to evaluate artificial intelligence models for process scheduling at the hardware level. The kernel boots via Multiboot2, executes multi-process workloads under Round-Robin and neural scheduling algorithms, and logs empirical metrics over COM1 serial and VGA text memory.

---

## System Architecture

NeuroSched executes in 32-bit protected mode without external C runtime libraries (`libc`) or dynamic memory management (`malloc`).

- **Bootloader Handoff**: `boot/boot.S` receives control from Multiboot2 bootloaders, configures a 16 KiB System V ABI stack, enables hardware x87 FPU state via CR0 flags, and calls `kernelMain`.
- **Hardware Drivers**: Custom I/O port drivers initialize the COM1 serial UART (38,400 baud, 8N1) at port `0x3F8` and the 80x25 VGA text buffer at physical address `0xB8000`.
- **Process Management**: A fixed-size Process Control Block (PCB) table manages process states (`READY`, `RUNNING`, `TERMINATED`).
- **Telemetry Streaming**: Real-time process telemetry CSV logs are streamed directly over serial port I/O.

---

## Neural Inference Engine

The scheduling model is a 2-layer Multi-Layer Perceptron (MLP) implemented in pure freestanding C (`kernel/nn_infer.c`).

### Feature Vector Parameters

For each scheduling cycle, candidate processes are scored using 5 normalized inputs:

| Parameter | Feature Name | Description |
| :--- | :--- | :--- |
| Feature 0 | `waitTicks` | Process waiting duration (starvation prevention) |
| Feature 1 | `remainingBurst` | Remaining execution burst time (Shortest-Job-First signal) |
| Feature 2 | `priority` | Static scheduling class priority (1 to 5) |
| Feature 3 | `ioBound` | Binary flag indicating I/O device dependency |
| Feature 4 | `ioYieldCount` | Historical voluntary yield frequency |

### Mathematical Approximations

To eliminate standard C math library dependencies:
- **Sigmoid Activation**: Computed via a 6-term Taylor-series polynomial expansion.
- **ReLU Activation**: Evaluated using zero-bound scalar comparison `max(0, x)`.
- **Memory Footprint**: Weight matrices (`W1`, `W2`) are compiled statically into `.rodata` (57 total float parameters).

---

## Confidence Fallback Architecture

To prevent kernel failure on out-of-distribution inputs, NeuroSched implements a confidence fallback mechanism:
1. The neural engine scores each process and computes the confidence value (sigmoid output).
2. If prediction confidence drops below `NN_CONF_THRESH` (0.65f), the kernel logs a warning.
3. The scheduler safely reverts to Round-Robin execution for that tick.

---

## Performance Benchmarks

Empirical performance comparison captured during headless QEMU serial telemetry runs:

| Scheduling Metric | Round-Robin Baseline | Neural Scheduler + Fallback | Delta Improvement |
| :--- | :--- | :--- | :--- |
| Average Wait Time | 34.40 ticks | 28.60 ticks | -16.8% |
| Average Turnaround Time | 40.80 ticks | 35.00 ticks | -14.2% |
| Workload Completion | 64 ticks | 64 ticks | 100% Complete |
| Safety Fallbacks | N/A | 50 triggers | 100% Stable |

---

## Interactive Web Showcase

A web-based interactive simulation and visualization application is available at:
[https://neurosched.vercel.app](https://neurosched.vercel.app)

---

## Building and Running

### Prerequisites

- Cross-Compiler: `i686-elf-gcc`, `i686-elf-as`, `i686-elf-ld`
- Emulator: `qemu-system-i386`
- Container Environment: Docker (optional)

### Command Reference

- Run via Docker QEMU runner:
  ```bash
  docker run --rm -v "%CD%:/neurosched" neurosched-qemu bash /neurosched/scripts/boot-test.sh
  ```

- Build kernel ELF and ISO locally:
  ```bash
  make clean && make
  ```

- Train model weights:
  ```bash
  python scripts/train.py --epochs 500
  ```

---

## Directory Structure

```
NeuroSched/
├── boot/
│   └── boot.S             # Assembly bootloader stub and FPU initialization
├── kernel/
│   ├── kernel.c           # Kernel entry point and orchestration
│   ├── vga.c / vga.h      # VGA text mode driver (0xB8000)
│   ├── serial.c / serial.h# COM1 serial UART driver (0x3F8)
│   ├── process.h          # Process Control Block schema
│   ├── scheduler.c / .h   # Round-Robin and Neural scheduling algorithms
│   └── nn_infer.c / .h    # Freestanding C neural inference engine
├── include/
│   └── nn_weights.h       # Trained model weight matrices
├── scripts/
│   ├── train.py           # Model training script
│   └── boot-test.sh       # QEMU execution test script
├── website/               # Showcase web application
├── CERTIFICATE.md         # Official project certificate
├── LICENSE                # MIT License terms
├── linker.ld              # Linker script for 1 MB physical load address
└── Makefile               # Kernel build automation
```

---

## License and Author Information

- Author: **MANTIS** ([mantisdarling](https://github.com/mantisdarling))
- Certificate: [CERTIFICATE.md](CERTIFICATE.md)
- License: [MIT License](LICENSE)
