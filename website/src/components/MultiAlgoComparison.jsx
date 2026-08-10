import React, { useState } from 'react';
import { Award, Zap, Trophy, ShieldCheck } from 'lucide-react';

export default function MultiAlgoComparison() {
  const [selectedAlgo, setSelectedAlgo] = useState('nn');

  const algorithms = [
    { id: 'rr', name: 'Round-Robin (Baseline)', wait: 34.40, turnaround: 40.80, starvations: 4, winner: false },
    { id: 'prio', name: 'Static Priority', wait: 32.10, turnaround: 38.50, starvations: 6, winner: false },
    { id: 'sjf', name: 'Shortest-Job-First', wait: 30.50, turnaround: 36.20, starvations: 2, winner: false },
    { id: 'nn', name: 'NeuroSched (MLP + Fallback)', wait: 28.60, turnaround: 35.00, starvations: 0, winner: true }
  ];

  return (
    <div className="carbon-card p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[#333333] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-xs text-[#FF5A00] font-bold">
            <Trophy className="w-4 h-4" />
            <span>4-WAY ALGORITHM SCHEDULING BENCHMARK</span>
          </div>
          <h3 className="font-mono font-bold text-lg text-[#EAEAEA]">Multi-Algorithm Execution Benchmark</h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-3 py-1.5 font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>NN WINNER (-16.8%)</span>
        </div>
      </div>

      {/* Algorithm Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {algorithms.map((a) => (
          <div
            key={a.id}
            onClick={() => setSelectedAlgo(a.id)}
            className={`p-4 border transition-all cursor-pointer space-y-3 ${
              selectedAlgo === a.id || a.winner
                ? 'bg-[#1B1B1B] border-[#FF5A00] shadow-[0_0_20px_rgba(255,90,0,0.2)]'
                : 'bg-[#111111] border-[#333333] hover:border-[#666666]'
            }`}
          >
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[#EAEAEA] font-bold">{a.name}</span>
              {a.winner && <span className="bg-[#FF5A00] text-black font-bold text-[10px] px-1.5 py-0.5">WINNER</span>}
            </div>

            <div className="space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[#888888]">Avg Wait:</span>
                <span className={a.winner ? 'text-[#FF5A00] font-bold' : 'text-[#EAEAEA]'}>{a.wait} ticks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Turnaround:</span>
                <span className="text-[#EAEAEA]">{a.turnaround} ticks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Starvations:</span>
                <span className={a.starvations === 0 ? 'text-[#10B981] font-bold' : 'text-[#FFD600]'}>{a.starvations}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
