import React from 'react';
import { Cpu, ShieldCheck, Layers, ArrowRight, Binary } from 'lucide-react';

export default function Architecture({ currentMode }) {
  const steps = [
    { title: 'Multiboot2 Entry', desc: 'boot.S preserves EAX magic (0x36D76289) and EBX MBI pointer in ESI/EDI.' },
    { title: 'BSS Stack & FPU', desc: 'Sets 16 KiB BSS stack. Enables x87 FPU via CR0 manipulation with zero clobber.' },
    { title: 'Driver Init', desc: 'Initializes COM1 serial port (38400 baud) & VGA 80x25 color text buffer at 0xB8000.' },
    { title: 'Round-Robin Pass', desc: 'Executes Phase 1 workload simulation, logging telemetry CSV over COM1 port I/O.' },
    { title: 'Neural Inference', desc: 'Evaluates 5 features per process through 5->8->1 MLP using Taylor-series Sigmoid.' },
    { title: 'Comparison Table', desc: 'Renders side-by-side metric comparison to VGA & serial, then halts CPU via HLT.' }
  ];

  return (
    <section id="architecture" className="py-16 px-4 lg:px-8 border-b border-[#333333] bg-[#111111]">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs text-[#FF5A00] uppercase tracking-wider font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Kernel Pipeline & Architecture</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#EAEAEA]">
            Bare-Metal x86 System Specs
          </h2>
          <p className="text-xs text-[#888888] max-w-2xl">
            {currentMode === 'architect'
              ? 'Complete execution path from Multiboot2 entry point through freestanding C neural inference.'
              : 'How the operating system starts up, sets up its memory, and runs the AI scheduler step-by-step.'}
          </p>
        </div>

        {/* Boot Sequence Pipeline Flowchart */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((s, idx) => (
            <div key={idx} className="carbon-card-interactive p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-[#FF5A00]">
                  STEP 0{idx + 1}
                </span>
                <Layers className="w-4 h-4 text-[#888888]" />
              </div>
              <h3 className="font-mono font-bold text-sm text-[#EAEAEA]">{s.title}</h3>
              <p className="text-xs text-[#888888] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Architecture Spec Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-[#1B1B1B] border border-[#333333] p-6 space-y-3">
            <div className="flex items-center gap-2 text-[#FF5A00]">
              <Binary className="w-5 h-5" />
              <h3 className="font-mono font-bold text-sm text-[#EAEAEA]">Zero-Malloc Guarantee</h3>
            </div>
            <p className="text-xs text-[#888888] leading-relaxed">
              Standard C runtime libraries require an OS memory heap. NeuroSched allocates all neural matrices and process tables statically on the stack or in <code className="text-[#FF5A00]">.rodata</code>.
            </p>
          </div>

          <div className="bg-[#1B1B1B] border border-[#333333] p-6 space-y-3">
            <div className="flex items-center gap-2 text-[#FF5A00]">
              <Cpu className="w-5 h-5" />
              <h3 className="font-mono font-bold text-sm text-[#EAEAEA]">x87 Hardware FPU</h3>
            </div>
            <p className="text-xs text-[#888888] leading-relaxed">
              Enables native x87 floating-point arithmetic at boot time via assembly manipulation of CR0 register flags (<code className="text-[#FF5A00]">EM=0</code>, <code className="text-[#FF5A00]">MP=1</code>).
            </p>
          </div>

          <div className="bg-[#1B1B1B] border border-[#333333] p-6 space-y-3">
            <div className="flex items-center gap-2 text-[#FF5A00]">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-mono font-bold text-sm text-[#EAEAEA]">Confidence Fallback</h3>
            </div>
            <p className="text-xs text-[#888888] leading-relaxed">
              Structure-level safety: when NN output falls below <code className="text-[#FF5A00]">0.65f</code>, the kernel logs a warning and falls back to Round-Robin for 100% stability.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
