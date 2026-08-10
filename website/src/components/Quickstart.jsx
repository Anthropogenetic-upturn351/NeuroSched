import React, { useState } from 'react';
import { Terminal, Copy, Check, Cpu, Play, Brain } from 'lucide-react';

export default function Quickstart() {
  const [copiedMake, setCopiedMake] = useState(false);
  const [copiedBoot, setCopiedBoot] = useState(false);
  const [copiedTrain, setCopiedTrain] = useState(false);

  const makeCommand = "make clean && make";
  const bootCommand = "bash scripts/boot-test.sh";
  const trainCommand = "python scripts/train.py --epochs 500";

  const copyToClipboard = (text, setFn) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  return (
    <section id="quickstart" className="py-16 px-4 lg:px-8 border-b border-[#333333] bg-[#111111]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs text-[#FF5A00] uppercase tracking-wider font-semibold">
            <Terminal className="w-3.5 h-3.5" />
            <span>Developer Quickstart & Execution Bench</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#EAEAEA]">
            Run & Train NeuroSched Locally
          </h2>
          <p className="text-xs text-[#888888] max-w-2xl">
            Commands to cross-compile the bare-metal kernel, execute headless QEMU benchmarks, and train custom neural model weights.
          </p>
        </div>

        {/* 3 Core Commands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Command 1: Build Kernel */}
          <div className="carbon-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono font-bold text-sm text-[#EAEAEA]">1. Compile Kernel Binary</h3>
                <Cpu className="w-4 h-4 text-[#FF5A00]" />
              </div>
              <div className="bg-[#111111] border border-[#333333] p-3 font-mono text-xs text-[#FF5A00]">
                <code>{makeCommand}</code>
              </div>
              <p className="text-xs text-[#888888]">
                Compiles 32-bit x86 ELF binary (`build/kernel.elf`) and generates bootable GRUB ISO image (`build/neurosched.iso`).
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(makeCommand, setCopiedMake)}
              className="flex items-center justify-center gap-2 bg-[#1B1B1B] hover:bg-[#252525] border border-[#333333] py-2.5 font-mono text-xs text-[#EAEAEA] transition-all w-full mt-2"
            >
              {copiedMake ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#FF5A00]" />}
              <span>{copiedMake ? 'COPIED MAKE COMMAND' : 'COPY MAKE COMMAND'}</span>
            </button>
          </div>

          {/* Command 2: Execute QEMU Benchmark */}
          <div className="carbon-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono font-bold text-sm text-[#EAEAEA]">2. Run QEMU Simulation</h3>
                <Play className="w-4 h-4 text-[#FF5A00]" />
              </div>
              <div className="bg-[#111111] border border-[#333333] p-3 font-mono text-xs text-[#FF5A00]">
                <code>{bootCommand}</code>
              </div>
              <p className="text-xs text-[#888888]">
                Boots kernel headless inside QEMU, runs Round-Robin vs Neural scheduler, and streams COM1 serial telemetry.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(bootCommand, setCopiedBoot)}
              className="flex items-center justify-center gap-2 bg-[#1B1B1B] hover:bg-[#252525] border border-[#333333] py-2.5 font-mono text-xs text-[#EAEAEA] transition-all w-full mt-2"
            >
              {copiedBoot ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#FF5A00]" />}
              <span>{copiedBoot ? 'COPIED BOOT COMMAND' : 'COPY BOOT COMMAND'}</span>
            </button>
          </div>

          {/* Command 3: Train Neural Network */}
          <div className="carbon-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono font-bold text-sm text-[#EAEAEA]">3. Train MLP Model</h3>
                <Brain className="w-4 h-4 text-[#FF5A00]" />
              </div>
              <div className="bg-[#111111] border border-[#333333] p-3 font-mono text-xs text-[#FF5A00]">
                <code>{trainCommand}</code>
              </div>
              <p className="text-xs text-[#888888]">
                Trains 5→8→1 MLP using pure NumPy SGD, exports optimized weight matrices to `include/nn_weights.h`.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(trainCommand, setCopiedTrain)}
              className="flex items-center justify-center gap-2 bg-[#1B1B1B] hover:bg-[#252525] border border-[#333333] py-2.5 font-mono text-xs text-[#EAEAEA] transition-all w-full mt-2"
            >
              {copiedTrain ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#FF5A00]" />}
              <span>{copiedTrain ? 'COPIED TRAIN COMMAND' : 'COPY TRAIN COMMAND'}</span>
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
