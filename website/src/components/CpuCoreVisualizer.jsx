import React from 'react';
import { Cpu, Zap, Activity } from 'lucide-react';

export default function CpuCoreVisualizer() {
  const cores = [
    { id: 0, name: 'Core 0 (Scheduler Master)', load: 88, status: 'EXECUTING', process: 'P1 [CPU Hog]' },
    { id: 1, name: 'Core 1 (NN Inference FPU)', load: 64, status: 'INFERRING', process: '5->8->1 MLP' },
    { id: 2, name: 'Core 2 (I/O Dispatcher)', load: 32, status: 'WAITING', process: 'P2 [Interactive]' },
    { id: 3, name: 'Core 3 (COM1 UART Streamer)', load: 45, status: 'STREAMING', process: 'Telemetry Log' }
  ];

  return (
    <div className="carbon-card p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[#333333] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-xs text-[#FF5A00] font-bold">
            <Cpu className="w-4 h-4" />
            <span>X86 HARDWARE CPU DIE VISUALIZER</span>
          </div>
          <h3 className="font-mono font-bold text-lg text-[#EAEAEA]">Core Dispatches & Register Pipeline</h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-3 py-1.5 font-bold">
          <Zap className="w-3.5 h-3.5" />
          <span>x87 FPU ACTIVE</span>
        </div>
      </div>

      {/* 4-Core Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cores.map(c => (
          <div key={c.id} className="bg-[#111111] border border-[#333333] p-4 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[#EAEAEA] font-bold">{c.name}</span>
              <span className="text-[#FF5A00] font-mono text-[10px] font-bold">{c.status}</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-mono text-[11px] text-[#888888]">
                <span>Active Process</span>
                <span className="text-[#EAEAEA]">{c.process}</span>
              </div>
              <div className="w-full bg-[#1B1B1B] h-2 border border-[#333333] relative">
                <div 
                  className="bg-[#FF5A00] h-full transition-all duration-500 shadow-[0_0_10px_rgba(255,90,0,0.5)]"
                  style={{ width: `${c.load}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between font-mono text-[10px] text-[#888888] pt-1">
              <span>Core Load: {c.load}%</span>
              <span>Freq: 3.20 GHz</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
