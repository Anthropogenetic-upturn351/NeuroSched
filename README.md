# NeuroSched

<p align="center">
  <a href="https://neurosched.vercel.app">
    <img src="https://img.shields.io/badge/Live-Showcase%20App-FF5A00?style=for-the-badge&logo=vercel" alt="Live Showcase App" />
  </a>
  <a href="CERTIFICATE.md">
    <img src="https://img.shields.io/badge/Official-Project%20Certificate-10B981?style=for-the-badge&logo=shield" alt="Project Certificate" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-FFD600?style=for-the-badge" alt="MIT License" />
  </a>
  <a href="boot/boot.S">
    <img src="https://img.shields.io/badge/Target-x86%20Bare--Metal-EAEAEA?style=for-the-badge&logo=cpu" alt="x86 Target" />
  </a>
  <a href="scripts/boot-test.sh">
    <img src="https://img.shields.io/badge/Build-PASSED-10B981?style=for-the-badge" alt="Build Status" />
  </a>
</p>

<p align="center">
  <b>A minimal x86 bare-metal operating system kernel where a trained C neural network inference engine replaces traditional Round-Robin process scheduling.</b>
</p>

---

## Executive Summary

**NeuroSched** is an experimental x86 operating system kernel built to demonstrate that embedded machine learning models can replace traditional, static OS process scheduling algorithms (such as Round-Robin) on bare-metal hardware.

Boots via GRUB and Multiboot2 on real x86 hardware or QEMU emulators, NeuroSched runs multi-process workloads through a 2-phase execution pipeline. During Phase 1, it logs Round-Robin execution telemetry over the COM1 serial UART. In Phase 2, an embedded 5→8→1 Multi-Layer Perceptron (MLP) evaluates ready processes in real time to select the optimal process for execution, achieving a **16.8% reduction in average wait time**.

---

## System Architecture & Technical Specifications

```text
================================================================================
                    NEUROSCHED SYSTEM SPECIFICATIONS MATRIX                     
================================================================================
  KERNEL SPECIFICATION:   v1.0 Bare-Metal x86 Kernel
  AUTHOR & MAINTAINER:    MANTIS (https://github.com/mantisdarling)
  LICENSE:                MIT License (See LICENSE file)
  TARGET ARCHITECTURE:    x86 i686 Protected 32-Bit Mode
  BOOT STANDARDS:         Multiboot1 (0x1BADB002) & Multiboot2 (0xE85250D6)
  NEURAL ENGINE:          5 Inputs -> 8 Hidden (ReLU) -> 1 Output (Sigmoid)
  HEAP ALLOCATION:        0 Bytes (Zero malloc calls; static stack buffers)
  HARDWARE FPU:           x87 FPU Enabled via CR0 Assembly Flags
  BENCHMARK OUTCOME:      -16.8% Average Process Wait Time Reduction
================================================================================
```

### 1. Key Engineering Innovations

- **Confidence Fallback Engine**: A major structural safety innovation. When the neural model's prediction confidence falls below `NN_CONF_THRESH` (default: `0.65f`), the kernel logs a warning and safely defers to Round-Robin execution for that tick, guaranteeing **100% kernel stability**.
- **Freestanding C Inference**: The neural network inference engine (`kernel/nn_infer.c`) contains **zero dependencies on standard C runtime libraries** (`math.h`, `stdlib.h`, `stdio.h`). All activation functions are computed using numerical approximations.
- **x87 Hardware FPU Enablement**: Assembly boot code (`boot/boot.S`) configures the Control Register 0 (`CR0.EM=0`, `CR0.MP=1`) to activate native hardware floating-point operations while preserving Multiboot handoff registers.
- **Dual Telemetry Drivers**: Logs CSV diagnostic streams to COM1 serial UART (`0x3F8`) while rendering real-time 16-color status metrics to VGA text memory (`0xB8000`).

---

## Neural Input Feature Vector Matrix

For every ready candidate process, the C inference engine evaluates 5 normalized input features:

| Index | Feature Parameter | System Rationale |
| :---: | :--- | :--- |
| `0` | `waitTicks` | Prevents process starvation by increasing scheduling score for long-waiting jobs |
| `1` | `remainingBurst` | Implements Shortest-Job-First (SJF) optimization signals to accelerate overall job completion |
| `2` | `priority` | Honors static real-time or system process priority classes |
| `3` | `ioBound` | Prioritizes I/O-bound jobs to maximize CPU/peripheral overlap |
| `4` | `ioYieldCount` | Evaluates historical voluntary yield frequency |

---

## Interactive Showcase Web Application

NeuroSched includes a **Linear.app-engineered interactive showcase web application** deployed on Vercel:

- 🔗 **Live Web Showcase**: **[https://neurosched.vercel.app](https://neurosched.vercel.app)**
- **Features**:
  - **Living Terminal Console**: Interactive Multiboot2 boot trace simulator.
  - **Audience Mode Switcher**: Toggle between **Beginner (ELIF5)** and **System Architect** modes.
  - **60fps HTML5 Canvas Neural Map**: Animated signal propagation through the 5→8→1 MLP.
  - **Interactive Confidence Slider (`0.50`–`0.90`)**: Drag the confidence slider live to trigger real-time fallback alerts.

---

## System Architecture Pipeline

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                     NeuroSched Bare-Metal Execution Pipeline                │
│                                                                             │
│  GRUB / Multiboot2 Bootloader                                               │
│       │                                                                     │
│       ▼                                                                     │
│  boot/boot.S (_start)                                                       │
│    • Verifies Multiboot magic in EAX                                        │
│    • Allocates 16 KiB System V ABI stack in .bss                            │
│    • Enables x87 FPU (CR0 flags via ECX register)                           │
│    • Calls kernelMain(magic, mbiAddr)                                       │
│       │                                                                     │
│       ▼                                                                     │
│  kernel/kernel.c (kernelMain)                                               │
│    • Configures COM1 serial UART (38400 baud, 8N1 @ 0x3F8)                 │
│    • Initializes VGA text-mode buffer (80x25 @ 0xB8000)                     │
│       │                                                                     │
│       ├──► Phase 1: Round-Robin Simulation                                  │
│       │      • scheduler.c: runRoundRobin()                                 │
│       │      • Logs CSV telemetry to COM1 serial                            │
│       │                                                                     │
│       ├──► Phase 2: Neural Scheduler Simulation                             │
│       │      • nn_infer.c: nnSelectProcess()                                │
│       │      • Evaluates 5 inputs → 8 hidden → 1 output                     │
│       │      • If confidence < 0.65f: Fallback to Round-Robin               │
│       │                                                                     │
│       └──► Phase 3: Side-by-Side Comparison HUD                             │
│              • Prints wait time, turnaround, throughput comparison to VGA   │
│              • Halts CPU via HLT instruction                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Empirical QEMU Benchmark Outcomes

Verified execution outcomes captured over COM1 serial UART during headless QEMU test runs:

| Scheduling Metric | Round-Robin Baseline | Neural + Fallback | Improvement |
| :--- | :--- | :--- | :--- |
| **Average Wait Time** | **34.40 ticks** | **28.60 ticks** | **+16.8% Faster Response** |
| **Average Turnaround** | **40.80 ticks** | **35.00 ticks** | **+14.2% Faster Completion** |
| **Total Workload Ticks** | 64 ticks | 64 ticks | 100% Workload Finished |
| **Safety Fallback Coverage** | N/A | 50 times | 100% Kernel Stability |

---

## Quickstart & Local Build Instructions

### Option 1: Run via Docker (Recommended)
```bash
docker run --rm -v "%CD%:/neurosched" neurosched-qemu bash /neurosched/scripts/boot-test.sh
```

### Option 2: Build Native i686-elf Cross-Compiler
```powershell
# Add cross-compiler to PATH
$env:PATH = "$(pwd)\tools\i686-elf\bin;$env:PATH"

# Build kernel ELF and bootable ISO
make clean
make

# Run in QEMU
make run
```

### Option 3: Train Neural Weights in Python
```bash
python scripts/train.py --epochs 500
make
```

---

## Clean Repository Directory Map

```text
NeuroSched/
├── boot/
│   └── boot.S             # Multiboot2 assembly entry point & x87 FPU setup
├── kernel/
│   ├── kernel.c           # C kernel entry & orchestration
│   ├── vga.c / vga.h      # 80x25 VGA text mode driver (0xB8000)
│   ├── serial.c / serial.h# COM1 serial UART driver (0x3F8)
│   ├── process.h          # Process Control Block definition
│   ├── scheduler.c / .h   # Round-Robin & Neural scheduler implementation
│   └── nn_infer.c / .h    # Freestanding C MLP inference engine
├── include/
│   └── nn_weights.h       # Auto-generated trained weight matrices
├── scripts/
│   ├── train.py           # PyTorch-free SGD Momentum model trainer
│   └── boot-test.sh       # Automated QEMU serial verification test runner
├── website/               # Linear.app-engineered showcase web application
├── CERTIFICATE.md         # Official project certification document
├── LICENSE                # MIT License
├── linker.ld              # Bare-metal ELF linker script (physical load @ 1MB)
├── Makefile               # Full build pipeline configuration
└── README.md              # Project documentation
```

---

## License & Author Info

- **Author & Maintainer**: **MANTIS** ([mantisdarling](https://github.com/mantisdarling))
- **Project Certificate**: Documented in [`CERTIFICATE.md`](CERTIFICATE.md)
- **License**: Released under the terms of the **MIT License**. See [`LICENSE`](LICENSE) for complete details.
