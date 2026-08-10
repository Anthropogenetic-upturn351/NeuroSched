# Security Policy

## Supported Versions

The following table details which versions of **NeuroSched** receive security updates and maintenance:

| Version | Supported | Security Maintenance |
| :--- | :--- | :--- |
| v1.0 (main branch) | :white_check_mark: Yes | Active Maintenance |
| < v1.0 | :x: No | End of Life |

---

## Reporting a Vulnerability

We take the security and integrity of our bare-metal kernel code and web application seriously.

### How to Report
If you discover a security vulnerability, memory safety issue, or speculative execution vulnerability within NeuroSched:

1. **Do NOT open a public GitHub issue.**
2. Send a private vulnerability report detailing the issue to the maintainer via GitHub ([mantisdarling](https://github.com/mantisdarling)).
3. Include:
   - Type of vulnerability (e.g., buffer overflow, register corruption, web XSS)
   - Step-by-step reproduction instructions or proof-of-concept code
   - Potential impact on kernel execution stability or web application security

---

## Security Practices & Architecture

- **Zero-Malloc Memory Safety**: The kernel allocates all process control tables and neural weight matrices statically on the stack or in `.rodata` to prevent heap exploitation.
- **Confidence Fallback Safeguard**: If neural network inference yields out-of-distribution confidence scores (< 0.65f), the kernel safely reverts to Round-Robin execution for 100% stability.
- **Freestanding Isolation**: Zero dependencies on external C runtime libraries (`libc`) eliminate external standard library attack surfaces.
