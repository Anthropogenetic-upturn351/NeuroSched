import React, { useState } from 'react';
import { BarChart3, TrendingUp, Cpu, Clock } from 'lucide-react';

export default function BenchmarkChart() {
  const [activeMetric, setActiveMetric] = useState('wait');

  const metrics = [
    { id: 'wait', label: 'Average Wait Time (Ticks)', rr: 34.40, nn: 28.60, unit: 'ticks', delta: '-16.8%' },
    { id: 'turnaround', label: 'Average Turnaround (Ticks)', rr: 40.80, nn: 35.00, unit: 'ticks', delta: '-14.2%' },
    { id: 'throughput', label: 'Workload Execution Speed', rr: 1.0, nn: 1.2, unit: 'x speed', delta: '+20.0%' }
  ];

  const current = metrics.find(m => m.id === activeMetric);
  const maxVal = Math.max(current.rr, current.nn) * 1.25;

  return (
    <div className="carbon-card p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#333333] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-xs text-[#FF5A00] font-bold">
            <BarChart3 className="w-4 h-4" />
            <span>TICK-BY-TICK METRIC COMPARISON</span>
          </div>
          <h3 className="font-mono font-bold text-lg text-[#EAEAEA]">Round-Robin vs Neural Scheduler</h3>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex gap-2">
          {metrics.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveMetric(m.id)}
              className={`px-3 py-1.5 font-mono text-xs transition-all ${
                activeMetric === m.id
                  ? 'bg-[#FF5A00] text-black font-bold'
                  : 'bg-[#111111] text-[#888888] hover:text-[#EAEAEA] border border-[#333333]'
              }`}
            >
              {m.id === 'wait' ? 'Wait Time' : m.id === 'turnaround' ? 'Turnaround' : 'Throughput'}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Bar Comparison */}
      <div className="space-y-6 pt-2">
        <div className="space-y-2">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-[#888888]">Round-Robin Baseline</span>
            <span className="text-[#EAEAEA] font-bold">{current.rr} {current.unit}</span>
          </div>
          <div className="w-full bg-[#111111] h-8 border border-[#333333] relative overflow-hidden">
            <div 
              className="bg-[#333333] h-full transition-all duration-700 flex items-center justify-end pr-3 font-mono text-xs text-[#EAEAEA]"
              style={{ width: `${(current.rr / maxVal) * 100}%` }}
            >
              Baseline
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-[#FF5A00] font-bold">Neural Scheduler + Fallback</span>
            <span className="text-[#FF5A00] font-bold">{current.nn} {current.unit}</span>
          </div>
          <div className="w-full bg-[#111111] h-8 border border-[#333333] relative overflow-hidden">
            <div 
              className="bg-[#FF5A00] h-full transition-all duration-700 flex items-center justify-end pr-3 font-mono text-xs text-black font-bold shadow-[0_0_20px_rgba(255,90,0,0.4)]"
              style={{ width: `${(current.nn / maxVal) * 100}%` }}
            >
              Neural Optimum
            </div>
          </div>
        </div>
      </div>

      {/* Delta Badge */}
      <div className="bg-[#10B981]/10 border border-[#10B981]/30 p-3 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2 text-[#10B981] font-bold">
          <TrendingUp className="w-4 h-4" />
          <span>Performance Delta Improvement</span>
        </div>
        <span className="text-[#10B981] font-extrabold text-sm">{current.delta}</span>
      </div>
    </div>
  );
}
