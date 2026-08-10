# Contributing to NeuroSched

This document defines the contribution process, technical standards, and governance policies for the **NeuroSched** bare-metal operating system kernel and associated tools.

---

## Developer Certificate of Origin (DCO 1.1)

To ensure all contributions to NeuroSched comply with open-source licensing standards, we enforce the **Developer Certificate of Origin (DCO)** protocol used by the Linux Kernel project.

By contributing to this project, you certify that:

1. The contribution was created in whole or in part by you, and you have the right to submit it under the open-source license indicated in the file; or
2. The contribution is based upon previous work that, to the best of your knowledge, is covered under an appropriate open-source license, and you have the right under that license to submit that work; or
3. The contribution was provided directly to you by a person who certified (1), (2), or (3), and you have not modified it.

Every commit submitted to NeuroSched should include a `Signed-off-by` line in the commit message:

```text
Signed-off-by: Contributor Name <contributor@example.com>
```

---

## Development Environment & Toolchain

### Prerequisites

| Component | Required Version / Spec | Purpose |
| :--- | :--- | :--- |
| **Cross-Compiler** | `i686-elf-gcc` (v10.0+) | Target bare-metal x86 compilation |
| **Assembler** | `i686-elf-as` | Assemble AT&T syntax boot stub (`boot/boot.S`) |
| **Linker** | `i686-elf-ld` | ELF linker with physical address script (`linker.ld`) |
| **Emulator** | `qemu-system-i386` | Target architecture hardware emulation |
| **Node.js** | v18.0+ | Build showcase web application (`website/`) |

---

## Technical Coding Standards

### C Kernel Source Code (`kernel/`)

- **C Standard**: Strict C99 standard (`-std=c99`).
- **Freestanding Constraints**: No dependencies on standard runtime C libraries (`libc`, `math.h`, `stdio.h`).
- **Memory Safety**: Zero dynamic memory allocations (`malloc` free). All data structures and weight matrices must be allocated statically on the stack or in `.rodata`.
- **Compiler Flags**: All C code must compile with zero warnings using `-Wall -Wextra -Werror -ffreestanding -fno-stack-protector -mno-sse -mno-mmx`.

### Assembly Source Code (`boot/`)

- **Syntax**: AT&T assembly syntax in `boot/boot.S`.
- **Register Handoff**: Assembly stubs must preserve Multiboot handoff registers (`EAX` for magic number, `EBX` for Multiboot Information structure pointer).

---

## Pull Request Submission Workflow

1. **Fork the Repository**: Create a personal fork on GitHub at `https://github.com/mantisdarling/NeuroSched`.
2. **Create a Topic Branch**: Use descriptive branch names: `git checkout -b feature/your-feature-name`.
3. **Commit Integrity**: Write concise, professional commit messages detailing technical rationale.
4. **Verification**: Run `bash scripts/boot-test.sh` to verify zero regression in QEMU test output.
5. **Submit Pull Request**: Open a Pull Request targeting `main`.

---

## License

All contributions to NeuroSched are licensed under the terms of the project's [MIT License](LICENSE).
