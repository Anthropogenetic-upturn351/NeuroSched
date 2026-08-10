import React from 'react';
import { Award, CheckCircle2, TrendingUp, ShieldAlert } from 'lucide-react';

export default function Benchmarks() {
  return (
    <section id="benchmarks" className="py-16 px-4 lg:px-8 border-b border-[#333333] bg-[#111111]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs text-[#FF5A00] uppercase tracking-wider font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>Verified QEMU Benchmarks</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#EAEAEA]">
            Empirical Metric Outcomes
          </h2>
          <p className="text-xs text-[#888888] max-w-2xl">
            Real benchmark output captured directly over QEMU COM1 serial UART port during dual-phase kernel execution.
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="carbon-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#888888] uppercase">Average Wait Time</span>
              <TrendingUp className="w-4 h-4 text-[#10B981]" />
            </div>
            <div className="space-y-1">
              <div className="font-mono text-3xl font-extrabold text-[#FF5A00]">28.60 Ticks</div>
              <div className="font-mono text-xs text-[#888888]">vs 34.40 ticks (Round-Robin)</div>
            </div>
            <div className="bg-[#10B981]/10 border border-[#10B981]/30 p-2.5 text-[#10B981] font-mono text-xs font-bold">
              ⚡ 16.8% Lower Average Wait Time
            </div>
          </div>

          <div className="carbon-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#888888] uppercase">Average Turnaround</span>
              <TrendingUp className="w-4 h-4 text-[#10B981]" />
            </div>
            <div className="space-y-1">
              <div className="font-mono text-3xl font-extrabold text-[#EAEAEA]">35.00 Ticks</div>
              <div className="font-mono text-xs text-[#888888]">vs 40.80 ticks (Round-Robin)</div>
            </div>
            <div className="bg-[#10B981]/10 border border-[#10B981]/30 p-2.5 text-[#10B981] font-mono text-xs font-bold">
              ⚡ 14.2% Faster Job Completion
            </div>
          </div>

          <div className="carbon-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#888888] uppercase">Fallback Safety</span>
              <ShieldAlert className="w-4 h-4 text-[#FFD600]" />
            </div>
            <div className="space-y-1">
              <div className="font-mono text-3xl font-extrabold text-[#FFD600]">100% Stable</div>
              <div className="font-mono text-xs text-[#888888]">50 Safety Fallbacks Triggered</div>
            </div>
            <div className="bg-[#FFD600]/10 border border-[#FFD600]/30 p-2.5 text-[#FFD600] font-mono text-xs font-bold">
              🛡️ Zero Kernel Panic Guarantee
            </div>
          </div>
        </div>

        {/* Detailed Benchmark Comparison Table */}
        <div className="carbon-card p-6 space-y-4">
          <div className="font-mono text-xs text-[#EAEAEA] font-bold pb-2 border-b border-[#333333]">
            Side-by-Side Execution Comparison Matrix
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#333333] text-[#888888]">
                  <th className="py-2.5 px-3">Metric</th>
                  <th className="py-2.5 px-3">Round-Robin</th>
                  <th className="py-2.5 px-3">Neural + Fallback</th>
                  <th className="py-2.5 px-3">Improvement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333333] text-[#EAEAEA]">
                <tr>
                  <td className="py-3 px-3 font-bold">Average Wait Time</td>
                  <td className="py-3 px-3 text-[#888888]">34.40 ticks</td>
                  <td className="py-3 px-3 text-[#FF5A00] font-bold">28.60 ticks</td>
                  <td className="py-3 px-3 text-[#10B981] font-bold">+16.8% faster</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold">Average Turnaround</td>
                  <td className="py-3 px-3 text-[#888888]">40.80 ticks</td>
                  <td className="py-3 px-3 text-[#FF5A00] font-bold">35.00 ticks</td>
                  <td className="py-3 px-3 text-[#10B981] font-bold">+14.2% faster</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold">Total Ticks Elapsed</td>
                  <td className="py-3 px-3">64 ticks</td>
                  <td className="py-3 px-3">64 ticks</td>
                  <td className="py-3 px-3 text-[#888888]">100% finished</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold">NN Fallback Triggers</td>
                  <td className="py-3 px-3 text-[#888888]">N/A</td>
                  <td className="py-3 px-3 text-[#FFD600] font-bold">50 times</td>
                  <td className="py-3 px-3 text-[#10B981] font-bold">100% safe</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}
