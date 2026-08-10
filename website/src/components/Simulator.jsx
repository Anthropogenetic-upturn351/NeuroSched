import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sliders, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import NeuralCanvas from './NeuralCanvas';

export default function Simulator() {
  const [isRunning, setIsRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [threshold, setThreshold] = useState(0.65);
  const [speed, setSpeed] = useState(1);
  const [fallbackCount, setFallbackCount] = useState(0);

  // Initial 10 process workload matching kernel.c
  const initialProcesses = [
    { id: 1, name: 'P1 (CPU Hog)', burst: 10, remaining: 10, prio: 4, io: false },
    { id: 2, name: 'P2 (Interactive)', burst: 3, remaining: 3, prio: 5, io: true },
    { id: 3, name: 'P3 (Background)', burst: 12, remaining: 12, prio: 1, io: false },
    { id: 4, name: 'P4 (Balanced)', burst: 6, remaining: 6, prio: 3, io: true },
    { id: 5, name: 'P5 (Realtime)', burst: 8, remaining: 8, prio: 5, io: false },
    { id: 6, name: 'P6 (Batch)', burst: 11, remaining: 11, prio: 2, io: false },
    { id: 7, name: 'P7 (Interactive)', burst: 2, remaining: 2, prio: 4, io: true },
    { id: 8, name: 'P8 (Compute)', burst: 5, remaining: 5, prio: 3, io: false },
    { id: 9, name: 'P9 (Low Prio IO)', burst: 4, remaining: 4, prio: 2, io: true },
    { id: 10, name: 'P10 (System)', burst: 3, remaining: 3, prio: 4, io: true }
  ];

  const [rrProcs, setRrProcs] = useState(initialProcesses);
  const [nnProcs, setNnProcs] = useState(initialProcesses);
  const [activeProcess, setActiveProcess] = useState(1);
  const [currentConf, setCurrentConf] = useState(0.82);

  // Reset simulator
  const handleReset = () => {
    setIsRunning(false);
    setTick(0);
    setFallbackCount(0);
    setRrProcs(initialProcesses);
    setNnProcs(initialProcesses);
    setActiveProcess(1);
    setCurrentConf(0.82);
  };

  // Simulation Tick Loop
  useEffect(() => {
    if (!isRunning) return;

    const intervalTime = 500 / speed;
    const timer = setInterval(() => {
      setTick((prevTick) => {
        if (prevTick >= 64) {
          setIsRunning(false);
          return 64;
        }

        // Simulate NN confidence score calculation for active process
        const simulatedConf = 0.45 + Math.random() * 0.45;
        setCurrentConf(simulatedConf);

        if (simulatedConf < threshold) {
          setFallbackCount((prev) => prev + 1);
        }

        // Cycle active process
        const activeIdx = (prevTick % 10) + 1;
        setActiveProcess(activeIdx);

        // Update process remaining burst
        setNnProcs((prev) =>
          prev.map((p) =>
            p.id === activeIdx && p.remaining > 0
              ? { ...p, remaining: p.remaining - 1 }
              : p
          )
        );

        return prevTick + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isRunning, speed, threshold]);

  return (
    <section id="simulator" className="py-16 px-4 lg:px-8 border-b border-[#333333] bg-[#111111]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs text-[#FF5A00] uppercase tracking-wider font-semibold">
              <Activity className="w-3.5 h-3.5" />
              <span>Interactive Control Center</span>
            </div>
            <h2 className="text-3xl font-extrabold text-[#EAEAEA]">
              Live OS Scheduler & Neural Canvas Visualizer
            </h2>
            <p className="text-xs text-[#888888] max-w-2xl">
              Watch 10 processes execute under Round-Robin vs Neural Network scheduling. Drag the confidence slider to trigger real-time fallbacks.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-3 bg-[#1B1B1B] p-2 border border-[#333333]">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-2 bg-[#FF5A00] hover:bg-[#E04F00] text-black font-mono font-bold text-xs px-4 py-2 transition-all shadow-[0_0_15px_rgba(255,90,0,0.3)]"
            >
              {isRunning ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black" />}
              <span>{isRunning ? 'PAUSE' : 'PLAY SIMULATION'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2 bg-[#111111] hover:bg-[#252525] border border-[#333333] text-[#EAEAEA] transition-all"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5 pl-2 border-l border-[#333333] font-mono text-xs text-[#888888]">
              <span>Speed:</span>
              {[1, 2, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 font-bold ${
                    speed === s ? 'bg-[#FF5A00] text-black' : 'hover:text-[#EAEAEA]'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Gauges HUD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#1B1B1B] border border-[#333333] p-4">
            <div className="font-mono text-xs text-[#888888] uppercase">Current Tick</div>
            <div className="font-mono text-3xl font-bold text-[#EAEAEA] mt-1">{tick} / 64</div>
          </div>

          <div className="bg-[#1B1B1B] border border-[#333333] p-4">
            <div className="font-mono text-xs text-[#888888] uppercase">Round-Robin Wait</div>
            <div className="font-mono text-3xl font-bold text-[#EAEAEA] mt-1">34.40t</div>
          </div>

          <div className="bg-[#1B1B1B] border border-[#333333] p-4">
            <div className="font-mono text-xs text-[#888888] uppercase">Neural Wait</div>
            <div className="font-mono text-3xl font-bold text-[#FF5A00] mt-1">28.60t</div>
            <div className="font-mono text-[10px] text-[#10B981] font-semibold mt-0.5">⚡ -16.8% Wait Time</div>
          </div>

          <div className="bg-[#1B1B1B] border border-[#333333] p-4">
            <div className="font-mono text-xs text-[#888888] uppercase">Fallbacks Triggered</div>
            <div className="font-mono text-3xl font-bold text-[#FFD600] mt-1">{fallbackCount}</div>
          </div>
        </div>

        {/* Interactive Threshold Slider Panel */}
        <div className="bg-[#1B1B1B] border border-[#333333] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#EAEAEA]">
              <Sliders className="w-4 h-4 text-[#FF5A00]" />
              <span>CONFIDENCE FALLBACK THRESHOLD (NN_CONF_THRESH)</span>
            </div>
            <div className="font-mono text-sm font-bold text-[#FF5A00]">
              {(threshold * 100).toFixed(0)}%
            </div>
          </div>

          <input
            type="range"
            min="0.50"
            max="0.90"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full h-2 bg-[#111111] accent-[#FF5A00] cursor-pointer"
          />

          <div className="flex justify-between font-mono text-[11px] text-[#888888]">
            <span>0.50 (Aggressive Model Trust)</span>
            <span>0.65 (Kernel Default)</span>
            <span>0.90 (Conservative Fallback)</span>
          </div>
        </div>

        {/* Dual Layout: Neural Synapse Canvas & Gantt Track */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Neural Synapse Canvas Visualizer */}
          <div className="lg:col-span-5 linear-card p-4 space-y-3">
            <div className="flex items-center justify-between font-mono text-xs text-[#EAEAEA] pb-2 border-b border-[#28282C]">
              <span>MLP Forward Pass (5 → 8 → 1)</span>
              <span className="text-[#FF5A00]">60fps Canvas</span>
            </div>
            
            <NeuralCanvas
              currentConfidence={currentConf}
              isRunning={isRunning}
              activeProcess={activeProcess}
            />

            {currentConf < threshold && (
              <div className="flex items-center gap-2 bg-[#FFD600]/10 border border-[#FFD600]/40 p-2.5 text-[#FFD600] font-mono text-xs animate-pulse">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>[FALLBACK] Conf {(currentConf * 100).toFixed(0)}% &lt; {(threshold * 100).toFixed(0)}%, using Round-Robin</span>
              </div>
            )}
          </div>

          {/* Process Timeline Bars */}
          <div className="lg:col-span-7 linear-card p-6 space-y-4">
            <div className="font-mono text-xs text-[#EAEAEA] font-bold pb-2 border-b border-[#28282C] flex justify-between">
              <span>Workload Execution State</span>
              <span className="text-[#888888]">10 Processes</span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {nnProcs.map((proc) => {
                const percent = ((proc.burst - proc.remaining) / proc.burst) * 100;
                const isActive = proc.id === activeProcess;
                return (
                  <div key={proc.id} className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className={isActive ? 'text-[#FF5A00] font-bold' : 'text-[#EAEAEA]'}>
                        {proc.name}
                      </span>
                      <span className="text-[#888888]">
                        rem: {proc.remaining}/{proc.burst}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-[#0E0E10] border border-[#28282C] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isActive ? 'bg-[#FF5A00]' : 'bg-[#10B981]'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
