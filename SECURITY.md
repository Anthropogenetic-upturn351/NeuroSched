# Security Policy & Vulnerability Disclosure

This document outlines the security architecture, threat model, and vulnerability reporting procedures for the **NeuroSched** bare-metal operating system kernel and web showcase application.

---

## Supported Versions

Security maintenance and vulnerability patches are actively provided for the following release targets:

| Target Component | Version | Security Support Status |
| :--- | :--- | :--- |
| **NeuroSched Core Kernel** | v1.0 (main branch) | :white_check_mark: Active Maintenance |
| **Showcase Web Application** | v1.0 (`website/`) | :white_check_mark: Active Maintenance |
| Legacy Build Variants | < v1.0 | :x: Unsupported |

---

## Threat Model & Security Architecture

NeuroSched operates in x86 32-bit protected mode (Ring 0). The kernel enforces the following architectural security controls:

### 1. Static Memory Bounds (Zero-Heap Architecture)
The kernel eliminates dynamic heap memory allocation (`malloc`/`free`) entirely. All Process Control Blocks (PCB) and neural weight matrices (`W1`, `W2`) are allocated statically within fixed memory boundaries in `.rodata` and stack memory, eliminating heap overflow attack vectors.

### 2. Confidence Fallback Protection
To mitigate adversarial input manipulation or out-of-distribution neural prediction failures, the scheduler evaluates model output confidence against `NN_CONF_THRESH` (0.65f). Predictions below this threshold trigger an immediate fallback to deterministic Round-Robin execution, preventing kernel instability.

### 3. Freestanding Runtime Isolation
By executing without standard runtime library dependencies (`libc`), the kernel avoids external C library attack vectors.

---

## Reporting a Vulnerability

We request responsible disclosure for any security vulnerabilities or architectural flaws.

### Disclosure Process

1. **Private Notification**: Do not disclose security vulnerabilities publicly via GitHub Issues.
2. **Contact Channel**: Send a private vulnerability advisory directly to the project maintainer via GitHub ([mantisdarling](https://github.com/mantisdarling)).
3. **Advisory Content**:
   - Technical description of the vulnerability or memory flaw.
   - Proof-of-concept execution logs, register dumps, or reproduction steps.
   - Potential impact assessment.

### Response Timeline

- **Acknowledgement**: Within 48 hours of initial report.
- **Triage & Impact Assessment**: Within 5 business days.
- **Patch Release & Security Advisory**: Target patch release within 30 days of vulnerability validation.
