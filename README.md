# NeuroSched

[![Live Showcase](https://img.shields.io/badge/Live-Showcase%20App-FF5A00?style=for-the-badge&logo=vercel)](https://neurosched.vercel.app)

**A minimal x86 operating system where a trained neural network replaces the traditional process scheduler.**

NeuroSched boots via GRUB/Multiboot2 on real x86 hardware (and QEMU), runs a synthetic multi-process workload under two scheduling strategies — round-robin and a neural-network-driven scheduler — and prints a live side-by-side comparison of scheduling metrics directly to the VGA text buffer.

---

## What Makes NeuroSched Different

Most OS/ML projects either (a) implement a standard toy OS and call it done, or (b) train a fancy model with no real system integration. NeuroSched does both — and adds a third dimension:

**Confidence Fallback** — the unique original feature in this project. When the neural network's prediction confidence (the sigmoid output value) falls below a configurable threshold (default: 0.65), the kernel:
1. Logs a yellow-colored `[FALLBACK]` message to the VGA display
2. Falls back to round-robin for that tick
3. Tracks the total fallback count across the simulation

This is explicitly engineered for robustness. A scheduler that blindly trusts a model on out-of-distribution inputs is dangerous; one that admits uncertainty is safe.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     NeuroSched Boot Flow                │
│                                                         │
│  GRUB (Multiboot2)                                      │
│       │                                                 │
│       ▼                                                 │
│  boot/boot.S (_start)                                   │
│    • Embeds Multiboot2 header (magic 0xE85250D6)        │
│    • Sets up 16 KiB stack in .bss                       │
│    • Enables x87 FPU (CR0 tweak + finit)                │
│    • Calls kernel_main(magic, mbi_addr)                 │
│       │                                                 │
│       ▼                                                 │
│  kernel/kernel.c (kernel_main)                          │
│    • Verifies Multiboot2 magic                          │
│    • Initializes VGA terminal (0xB8000) + COM1 serial   │
│    • Prints boot banner                                 │
│       │                                                 │
│       ├──► Phase 1: Round-Robin Simulation              │
│       │      • scheduler.c: run_round_robin()           │
│       │      • Logs CSV telemetry to COM1 serial        │
│       │                                                 │
│       ├──► Phase 2: Neural Scheduler Simulation         │
│       │      • nn_infer.c: nn_select_process()          │
│       │        - 5 features → 8 hidden (ReLU)           │
│       │          → 1 output (Sigmoid) → score ∈ (0,1)  │
│       │      • If score < 0.65: FALLBACK to RR          │
│       │      • Yellow [FALLBACK] messages on VGA        │
│       │                                                 │
│       └──► Phase 3: Print Comparison Table on VGA       │
│              • Avg wait time, turnaround, throughput    │
│              • Neural vs Round-Robin, side-by-side      │
└─────────────────────────────────────────────────────────┘

Host-side (Python, runs before kernel build):
┌─────────────────────────────────────────────────────────┐
│  scripts/train.py                                       │
│    • Reads COM1 telemetry CSV (or synthetic data)       │
│    • Trains 5→8→1 MLP with SGD + momentum (numpy only)  │
│    • Exports weights to include/nn_weights.h            │
│    • Kernel is rebuilt with baked-in trained weights    │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

```
NeuroSched/
├── boot/
│   └── boot.S           # Multiboot2 header + assembly entry point
├── kernel/
│   ├── kernel.c         # kernel_main — orchestrates everything
│   ├── vga.c / vga.h    # VGA 0xB8000 text-mode driver (80×25, 16 colors)
│   ├── serial.c / serial.h  # COM1 UART driver (telemetry CSV output)
│   ├── process.h        # Process Control Block definition
│   ├── scheduler.c / scheduler.h  # Both schedulers + comparison printer
│   └── nn_infer.c / nn_infer.h   # MLP forward pass inference engine
├── include/
│   └── nn_weights.h     # Auto-generated trained weights (C header)
├── scripts/
│   └── train.py         # MLP trainer (numpy only, no PyTorch)
├── iso/
│   └── boot/
│       ├── kernel.bin   # Kernel binary (built, gitignored)
│       └── grub/
│           └── grub.cfg # GRUB2 boot menu
├── linker.ld            # Bare-metal ELF linker script (loads at 1 MiB)
├── Makefile             # Full build pipeline
└── README.md            # This file
```

---

## Prerequisites

### Cross-Compiler (Required)

A native host compiler (MSVC, GCC on Windows, macOS GCC) **cannot** build a freestanding x86 kernel — it targets the host OS and links against OS libraries. You need an `i686-elf` cross-compiler.

**On Windows** (using lordmilko's pre-built toolchain):
```powershell
# Download i686-elf-tools-windows.zip from:
# https://github.com/lordmilko/i686-elf-tools/releases
Expand-Archive i686-elf-tools-windows.zip -DestinationPath tools\i686-elf
$env:PATH = "$(pwd)\tools\i686-elf\bin;$env:PATH"
i686-elf-gcc --version   # Verify
```

**On Ubuntu/Debian**:
```bash
sudo apt install gcc-i686-linux-gnu binutils-i686-linux-gnu
# Note: apt uses i686-linux-gnu-gcc, not i686-elf-gcc
# Update CC/AS/LD in Makefile if using this variant
```

**Via MSYS2**:
```bash
pacman -S mingw-w64-i686-cross-gcc grub qemu
```

### Other Tools

| Tool | Purpose | Install |
|------|---------|---------|
| `grub-mkrescue` | Build bootable ISO | `apt install grub2-common` or MSYS2 |
| `qemu-system-i386` | Run and test | `apt install qemu-system-x86` or [qemu.org](https://www.qemu.org/download/) |
| `make` | Build system | `apt install make` or `choco install make` |
| `python3 + numpy` | Training script | `pip install numpy` |

---

## Building and Running

### Step 1: Build the kernel

```bash
make
```

This compiles all C sources and the boot assembly with `i686-elf-gcc`, links them with the custom linker script at physical address 1 MiB, and wraps the result in a GRUB-bootable ISO.

### Step 2: Run in QEMU

```bash
make run
```

QEMU launches with:
- The bootable ISO as a virtual CD-ROM
- COM1 serial output redirected to your terminal (scheduling telemetry appears here)
- VGA output in a window (scheduling decisions and comparison table)

Press `Ctrl-A` then `X` to exit QEMU.

### Step 3: Capture Telemetry and Train the NN

After the kernel runs, the round-robin telemetry CSV is available in `telemetry.csv`:

```bash
make run-log       # Runs QEMU, saves COM1 serial to telemetry.csv
make train         # Trains the MLP, exports nn_weights.h, rebuilds kernel
make run           # Run again with the trained neural scheduler
```

Or train on synthetic data (no QEMU needed):
```bash
python scripts/train.py --epochs 500
make
```

---

## Neural Network Details

**Model**: 2-layer MLP with 57 parameters (228 bytes of weights in `.rodata`)

```
Input (5 features)  →  Hidden (8 neurons, ReLU)  →  Output (1 score, Sigmoid)
```

**Input features** (per candidate process):
| # | Feature | Rationale |
|---|---------|-----------|
| 0 | `wait_ticks` (normalized) | Starvation prevention — higher priority if waiting long |
| 1 | `remaining_burst` (normalized) | Shorter-job preference (SJF signal) |
| 2 | `priority` (normalized) | Static scheduling class |
| 3 | `io_bound` (0 or 1) | I/O-heavy processes benefit from early scheduling |
| 4 | `io_yield_count` (normalized) | History of voluntary yields |

**Training**:
- Algorithm: Mini-batch SGD with momentum (β=0.9), implemented from scratch in numpy
- Loss: Mean Squared Error on computed "ideal" scheduling scores
- Target scores blend: 40% priority + 40% wait time + 20% short-job preference
- Training set: kernel telemetry from round-robin simulation (or synthetic data)

**Inference in kernel**:
- Float arithmetic using the x87 FPU (enabled at boot via CR0 manipulation)
- Custom `sigmoid()` implementation using Taylor series (no libm dependency)
- Custom `relu()` as a simple `max(0, x)` comparison
- Zero dynamic memory allocation — all buffers on the stack

---

## Confidence Fallback (Design Decision)

**The confidence fallback is our explicit unique feature**, chosen over:
- In-kernel text-mode chart (implementation complexity without clear research value)
- Live comparison mode (we do this too — but fallback is the structural differentiator)

**How it works**:
1. The NN scores each ready process → sigmoid output ∈ (0, 1)
2. The highest score is the "confidence" for this decision
3. If confidence < `NN_CONF_THRESH` (0.65), the kernel:
   - Chooses the round-robin next process instead
   - Prints yellow `[FALLBACK] NN conf=XX% < thresh, using RR` to VGA
   - Increments a fallback counter
4. The comparison table shows total fallback count alongside other metrics

**Why this matters**: It demonstrates that the system is designed for real robustness rather than demo-only success. A scheduler that gracefully admits uncertainty is more trustworthy than one that always picks the model's top choice regardless of confidence.

**Tuning the threshold**: `NN_CONF_THRESH` is defined in `include/nn_weights.h`. Lower values (e.g., 0.5) cause fewer fallbacks; higher values (e.g., 0.8) cause more conservative fallback behavior.

---

## Sample Output

When running in QEMU, the VGA display shows:

```
--------------------------------------------------------------------------------
  NeuroSched v1.0 — Neural-Network-Driven OS Scheduler
  x86 Multiboot2 Kernel | Built with i686-elf-gcc
--------------------------------------------------------------------------------
[OK] Multiboot2 boot verified
[OK] VGA terminal initialized (80x25 text mode)
[OK] COM1 serial initialized (38400 baud, 8N1)
[OK] x87 FPU enabled (CR0.EM=0, MP=1)

[INFO] Workload: 10 synthetic processes initialized

>>> Phase 1: Round-Robin Simulation (logging CSV to COM1)
[OK] Round-robin complete. Ticks: 395

>>> Phase 2: Neural Network Scheduler Simulation
    (Yellow lines = NN fell back to round-robin)

[FALLBACK] NN conf=48% < thresh, using RR
[FALLBACK] NN conf=52% < thresh, using RR

[OK] Neural scheduler complete. Ticks: 372

--------------------------------------------------------------------------------
  NEUROSCHED: Scheduling Algorithm Comparison
--------------------------------------------------------------------------------
  Metric               Round-Robin    Neural+Fallback
--------------------------------------------------------------------------------
  Avg Wait Time:       142.30 ticks   128.70 ticks
  Avg Turnaround:      181.80 ticks   167.20 ticks
  Total Ticks:         395            372
  Throughput(/100t):   2.53           2.68
  NN Fallbacks:        --             2 times
--------------------------------------------------------------------------------
  RESULT: Neural scheduler achieved lower avg wait time!
--------------------------------------------------------------------------------

  NeuroSched simulation complete. Halting CPU.
  (See COM1 serial output for full CSV telemetry log)
```

*(Actual numbers will vary with your trained weights.)*

---

## Design Trade-offs

### What We Simplified
1. **No real preemptive context switching**: NeuroSched simulates a multi-process workload rather than implementing full preemption with TSS, IDT/PIC timer interrupts, and per-process kernel stacks. Adding real preemption would require ~500 more lines of assembly and would obscure the core ML-scheduling concept.

2. **Single-tasking FPU use**: We enable the x87 FPU at boot but don't implement FPU state save/restore (FNSAVE/FRSTOR) on context switch. Safe here because our scheduler loop runs in a single context. A real preemptive kernel would need lazy FPU switching.

3. **Deterministic workload**: The synthetic process workload is hard-coded, not loaded from an external process table. This ensures reproducibility for training/comparison but doesn't model real-world process arrival patterns.

### What We Did Well
- The NN inference code is completely dependency-free and kernel-safe
- The confidence fallback is a genuinely useful engineering pattern
- The training pipeline is end-to-end: kernel logs → Python trains → header baked back in
- Every line is commented for interview explainability

### Future Improvements (given more time)
1. Real preemptive scheduling with PIT timer interrupts and proper context switching
2. Reinforcement learning instead of supervised: reward based on observed wait time reduction
3. Weight quantization (INT8) for platforms where FPU is unavailable
4. More diverse training workload (multiple workload profiles, varying arrival distributions)
5. In-kernel VGA chart showing scheduling decisions as a horizontal timeline

---

## References Used (concepts only, no code copied)

- **OSDev.wiki Multiboot2 Bare Bones** — Boot sequence, Multiboot2 header format, linker script structure
- **MIT xv6** — Process state machine design (READY/RUNNING/TERMINATED), PCB concept
- **TinyAgent (coladog/tinyagent)** — Architectural pattern: train externally in Python, export C header, run freestanding inference
- **lordmilko/i686-elf-tools** — Pre-built Windows cross-compiler toolchain

---

## License

MIT — see LICENSE file.

Built as an original implementation for learning purposes. Every file written from scratch after studying concepts from the references above.
