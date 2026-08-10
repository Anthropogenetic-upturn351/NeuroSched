import React from 'react';
import { HelpCircle, Sliders, Terminal, Play, FileText, CheckCircle2 } from 'lucide-react';

export default function HowToUse() {
  const steps = [
    {
      num: '01',
      title: 'Select Audience Mode',
      desc: 'Toggle between System Architect (deep bare-metal C & assembly details) and Beginner ELIF5 mode for easy-to-understand explanations.',
      icon: HelpCircle
    },
    {
      num: '02',
      title: 'Run OS Scheduler Simulation',
      desc: 'Click "Start Simulation" in the Gantt timeline. Adjust playback speed (1x, 2x, 5x) and tweak the Confidence Threshold slider (0.50–0.90).',
      icon: Play
    },
    {
      num: '03',
      title: 'Execute In-Browser Serial Commands',
      desc: 'Type commands in the COM1 Serial Terminal shell (boot, run rr, run nn, stats, weights) to simulate kernel I/O telemetry streaming.',
      icon: Terminal
    },
    {
      num: '04',
      title: 'Inspect Code & Export PDF Report',
      desc: 'Browse syntactically highlighted C and assembly kernel code, copy local build commands, or export an official PDF benchmark report.',
      icon: FileText
    }
  ];

  return (
    <section id="howtouse" className="py-16 px-4 lg:px-8 border-b border-[#333333] bg-[#0B0B0D]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs text-[#FF5A00] uppercase tracking-wider font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Interactive User Guide</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#EAEAEA]">
            How to Use NeuroSched
          </h2>
          <p className="text-xs text-[#888888] max-w-2xl">
            A quick step-by-step guide to exploring the live scheduler simulator, interactive serial shell, and kernel benchmarks.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.num} className="carbon-card p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-[#FF5A00]">{s.num}</span>
                    <Icon className="w-4 h-4 text-[#FF5A00]" />
                  </div>
                  <h3 className="font-mono font-bold text-sm text-[#EAEAEA]">{s.title}</h3>
                  <p className="text-xs text-[#888888] leading-relaxed">{s.desc}</p>
                </div>
                <div className="pt-2 border-t border-[#26262A] flex items-center gap-1.5 text-[#10B981] font-mono text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready to Explore</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
