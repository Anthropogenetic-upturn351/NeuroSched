import React, { useState, useEffect } from 'react';
import { Terminal, Shield, ArrowRight, Play, Cpu, CheckCircle2 } from 'lucide-react';

export default function Hero({ currentMode }) {
  const [terminalStep, setTerminalStep] = useState(0);

  const bootLogs = [
    "[OK] Multiboot2 boot verified (Magic: 0x36D76289)",
    "[OK] VGA terminal initialized (80x25 text mode @ 0xB8000)",
    "[OK] COM1 serial port configured (38400 baud, 8N1 @ 0x3F8)",
    "[OK] x87 FPU enabled (CR0.EM=0, CR0.MP=1)",
    "[INFO] Workload: 10 synthetic processes loaded",
    ">>> Phase 1: Round-Robin Simulation complete (64 ticks)",
    ">>> Phase 2: Neural Scheduler Simulation complete (64 ticks)",
    "[RESULT] Neural scheduler achieved 16.8% lower avg wait time!",
    ">>> NeuroSched v1.0 complete. Halting CPU."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTerminalStep((prev) => (prev < bootLogs.length ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(timer);
  }, [bootLogs.length]);

  return (
    <section className="relative pt-12 pb-20 px-4 lg:px-8 border-b border-[#333333] bg-[#111111] overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#FF5A00]/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#FF5A00]/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Headline and Badges */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 bg-[#1B1B1B] border border-[#333333] px-3 py-1 font-mono text-xs text-[#888888]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[#EAEAEA]">100% Verified Bare-Metal Kernel</span>
            <span className="text-[#FF5A00] font-bold">| x86 Multiboot2</span>
          </div>

          {/* Kinetic Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#EAEAEA] leading-[1.1]">
            An x86 OS Driven by an <br />
            <span className="text-[#FF5A00] orange-glow-text">Embedded Neural Net</span> <br />
            Process Scheduler.
          </h1>

          {/* Description based on selected mode */}
          <p className="text-base sm:text-lg text-[#888888] leading-relaxed max-w-2xl">
            {currentMode === 'architect' ? (
              <>
                Replaces 50-year-old Round-Robin algorithms with a freestanding C neural network engine (5→8→1 MLP). 
                Features zero dynamic memory allocations (<code className="text-[#FF5A00] font-mono">malloc</code>), x87 FPU hardware acceleration, 
                and a strict <strong className="text-[#EAEAEA]">Confidence Fallback Mechanism</strong> for kernel stability.
              </>
            ) : (
              <>
                What if an Operating System could learn and predict which program needs the CPU next? 
                NeuroSched is a custom x86 kernel that trains a artificial intelligence model to schedule software 
                processes, reducing waiting times by <strong className="text-[#FF5A00]">16.8%</strong> compared to traditional algorithms.
              </>
            )}
          </p>

          {/* Key Stat Cards */}
          <div className="grid grid-cols-3 gap-4 pt-2 max-w-xl">
            <div className="bg-[#1B1B1B] border border-[#333333] p-3.5">
              <div className="font-mono text-2xl font-bold text-[#FF5A00]">-16.8%</div>
              <div className="font-mono text-[11px] text-[#888888] uppercase mt-0.5">Avg Wait Time</div>
            </div>
            <div className="bg-[#1B1B1B] border border-[#333333] p-3.5">
              <div className="font-mono text-2xl font-bold text-[#EAEAEA]">0 Bytes</div>
              <div className="font-mono text-[11px] text-[#888888] uppercase mt-0.5">Stdlib Heap Use</div>
            </div>
            <div className="bg-[#1B1B1B] border border-[#333333] p-3.5">
              <div className="font-mono text-2xl font-bold text-[#10B981]">100%</div>
              <div className="font-mono text-[11px] text-[#888888] uppercase mt-0.5">Safety Fallback</div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#simulator"
              className="inline-flex items-center gap-2 bg-[#FF5A00] hover:bg-[#E04F00] text-black font-mono font-bold text-sm px-6 py-3.5 transition-all shadow-[0_0_25px_rgba(255,90,0,0.3)]"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Launch Live Simulator</span>
            </a>
            <a
              href="#architecture"
              className="inline-flex items-center gap-2 bg-[#1B1B1B] hover:bg-[#252525] border border-[#333333] text-[#EAEAEA] font-mono text-sm px-6 py-3.5 transition-all"
            >
              <Cpu className="w-4 h-4 text-[#FF5A00]" />
              <span>Explore Kernel Spec</span>
            </a>
          </div>

        </div>

        {/* Right Column: Monolith Boot Trace Terminal */}
        <div className="lg:col-span-5">
          <div className="carbon-card">
            
            {/* Terminal Window Header */}
            <div className="bg-[#111111] border-b border-[#333333] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#FF5A00]/80" />
                <div className="w-3 h-3 bg-[#FFD600]/80" />
                <div className="w-3 h-3 bg-[#10B981]/80" />
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs text-[#888888]">
                <Terminal className="w-3.5 h-3.5 text-[#FF5A00]" />
                <span>COM1 Serial Console Trace</span>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-4 font-mono text-xs space-y-2 min-h-[300px] bg-[#111111] overflow-x-auto">
              <div className="text-[#888888]"># QEMU i386 target initialization...</div>
              
              {bootLogs.slice(0, terminalStep).map((log, idx) => {
                let colorClass = "text-[#EAEAEA]";
                if (log.includes("[OK]")) colorClass = "text-[#10B981]";
                if (log.includes("[RESULT]")) colorClass = "text-[#FF5A00] font-bold";
                if (log.includes("[INFO]")) colorClass = "text-[#888888]";
                if (log.includes(">>>")) colorClass = "text-[#FFD600]";
                return (
                  <div key={idx} className={colorClass}>
                    {log}
                  </div>
                );
              })}

              {terminalStep < bootLogs.length && (
                <div className="inline-block w-2 h-4 bg-[#FF5A00] animate-pulse" />
              )}
            </div>

            {/* Terminal Footer */}
            <div className="border-t border-[#333333] px-4 py-2.5 bg-[#1B1B1B] flex items-center justify-between text-[11px] font-mono text-[#888888]">
              <span>Status: RUNNING</span>
              <button 
                onClick={() => setTerminalStep(0)} 
                className="text-[#FF5A00] hover:underline"
              >
                [Replay Trace]
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
