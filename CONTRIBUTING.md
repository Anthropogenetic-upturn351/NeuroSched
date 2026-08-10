# Contributing to NeuroSched

Thank you for your interest in contributing to **NeuroSched**! This document provides guidelines and instructions for contributing code, documentation, and enhancements to the bare-metal kernel and showcase web application.

---

## Code of Conduct

We are committed to providing a welcoming, respectful, and professional environment for all contributors. Please ensure all interactions remain constructive and respectful.

---

## How to Contribute

### 1. Reporting Issues
- Search existing GitHub Issues before opening a new issue.
- Provide a clear title, detailed reproduction steps, system specifications, and relevant terminal/serial outputs.

### 2. Submitting Pull Requests
- Fork the repository: `https://github.com/mantisdarling/NeuroSched`
- Create a feature branch: `git checkout -b feature/your-feature-name`
- Ensure all C kernel code compiles cleanly with `i686-elf-gcc` using strict flags (`-Wall -Wextra -Werror`).
- Ensure the showcase web app builds cleanly with `npm run build` inside `website/`.
- Submit a Pull Request targeting the `main` branch with a clear description of changes.

---

## Development Environment Setup

### Kernel Toolchain (x86 Bare-Metal)
- **Cross-Compiler**: `i686-elf-gcc`, `i686-elf-as`, `i686-elf-ld`
- **Emulator**: `qemu-system-i386`
- **Container Environment**: Docker (using `neurosched-qemu` runner)

```bash
# Build kernel ELF and ISO locally
make clean && make

# Run automated QEMU serial verification test
bash scripts/boot-test.sh
```

### Web Application (`website/`)
- **Node.js**: v18+ & `npm`
- **Build Tool**: Vite 5 + React 18

```bash
cd website
npm install
npm run build
```

---

## Coding Standards

- **Kernel C Code**: Strict C99 standard (`-std=c99`). Zero dynamic memory allocation (`malloc` free). Zero dependencies on standard runtime libraries (`libc`, `math.h`).
- **Assembly Stub**: AT&T syntax in `boot/boot.S`. Must preserve Multiboot handoff registers (`EAX`, `EBX`).
- **Web App**: Clean React 18 functional components with standard formatting.

---

## License

By contributing to NeuroSched, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
