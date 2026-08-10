# Project Information — NeuroSched

## What is NeuroSched?

**NeuroSched** is a 32-bit x86 bare-metal operating system kernel featuring an embedded C neural network process scheduler. 

Unlike traditional operating systems (such as Linux, Windows, or macOS) that rely on static, rule-based heuristics like Round-Robin, Priority Queues, or Shortest-Job-First (SJF), NeuroSched embeds a trained 2-layer Multi-Layer Perceptron (MLP) neural network directly inside the kernel to dynamically predict optimal process execution order.

---

## Core Technical Objectives

1. **Bare-Metal AI Inference**: Demonstrate that machine learning models can execute directly inside a freestanding C kernel (`kernel/nn_infer.c`) without C standard runtime libraries (`libc`) or dynamic memory heap allocations (`malloc`).
2. **Starvation Prevention & Optimization**: Evaluate 5 process state metrics (`waitTicks`, `remainingBurst`, `priority`, `ioBound`, `ioYieldCount`) in real-time to reduce average process wait time by **16.8%**.
3. **Safety Fallback Safeguard**: Implement a structure-level confidence fallback mechanism (`NN_CONF_THRESH = 0.65f`). If neural network output confidence drops on out-of-distribution inputs, the scheduler safely defers to Round-Robin execution for that tick, guaranteeing 100% kernel stability.
4. **Hardware Enablement**: Configure x87 hardware FPU math via assembly CR0 flags (`boot/boot.S`), stream real-time CSV execution telemetry over COM1 serial port (`0x3F8`), and render status metrics to VGA text memory (`0xB8000`).

---

## System Specs & Features

- **Architecture**: 32-bit x86 Protected Mode (`i686-elf`)
- **Boot Protocol**: Multiboot2 Specification (`0x36D76289`)
- **Neural Model**: 5 Inputs → 8 Hidden Neurons (ReLU) → 1 Output (Sigmoid)
- **Math Expansions**: 6-term Taylor-series Sigmoid polynomial expansion
- **Heap Allocation**: 0 Bytes (Static stack & `.rodata` matrix allocation)
- **Showcase Application**: Deployed live at [https://neurosched.vercel.app](https://neurosched.vercel.app)

---

## Author & Governance Information

- **Author & Maintainer**: **MANTIS** ([mantisdarling](https://github.com/mantisdarling))
- **Project Info**: [INFO.md](INFO.md)
- **Project Certificate**: [CERTIFICATE.md](CERTIFICATE.md)
- **Contributing Guidelines**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Security Policy**: [SECURITY.md](SECURITY.md)
- **License**: [MIT License](LICENSE)
