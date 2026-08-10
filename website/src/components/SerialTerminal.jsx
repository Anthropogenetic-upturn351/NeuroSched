import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Play, CornerDownLeft, Trash2 } from 'lucide-react';

export default function SerialTerminal() {
  const [inputVal, setInputVal] = useState('');
  const [logs, setLogs] = useState([
    'NeuroSched v1.0 COM1 Serial UART Shell',
    'Type "help" for available kernel commands.',
    ''
  ]);
  const terminalBoxRef = useRef(null);

  useEffect(() => {
    if (terminalBoxRef.current) {
      terminalBoxRef.current.scrollTop = terminalBoxRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCommand = (e) => {
    e.preventDefault();
    const cmd = inputVal.replace(/[^\w\s]/gi, '').trim().toLowerCase();
    if (!cmd) return;

    let response = [];
    if (cmd === 'help') {
      response = [
        'Available NeuroSched Kernel Commands:',
        '  help       - Display command reference menu',
        '  boot       - Simulate Multiboot2 boot sequence',
        '  run rr     - Execute Round-Robin process scheduler pass',
        '  run nn     - Execute Neural Network scheduler pass with fallback checks',
        '  stats      - Display empirical QEMU performance metrics comparison',
        '  weights    - Dump 5->8->1 neural weight matrix parameters',
        '  clear      - Clear serial console history'
      ];
    } else if (cmd === 'boot') {
      response = [
        '[BOOT] Multiboot2 handoff verified (EAX=0x36D76289)',
        '[BOOT] Setting up 16 KiB System V ABI kernel stack',
        '[BOOT] Enabling x87 FPU via CR0 flags (EM=0, MP=1)',
        '[BOOT] COM1 UART (38400 8N1 @ 0x3F8) & VGA (80x25 @ 0xB8000) online',
        '[BOOT] NeuroSched kernel ready.'
      ];
    } else if (cmd === 'run rr') {
      response = [
        '[RR] Executing Round-Robin simulation over 10 processes...',
        '[RR] Quantum: 1 tick | Total Ticks: 64',
        '[RR] Avg Wait Time: 34.40 ticks | Avg Turnaround: 40.80 ticks',
        '[RR] Simulation complete.'
      ];
    } else if (cmd === 'run nn') {
      response = [
        '[NN] Executing Neural Network scheduler simulation...',
        '[NN] Model: 5 inputs -> 8 hidden (ReLU) -> 1 output (Sigmoid)',
        '[NN] Evaluating process scores tick-by-tick...',
        '[WARN] Confidence 0.58f < 0.65f on tick 14 -> Triggered Fallback to Round-Robin',
        '[NN] Total Ticks: 64 | Fallbacks Triggered: 50 times',
        '[NN] Avg Wait Time: 28.60 ticks (16.8% Wait Reduction!)'
      ];
    } else if (cmd === 'stats') {
      response = [
        '===========================================================',
        '  NEUROSCHED: Scheduling Algorithm Comparison',
        '===========================================================',
        '  Metric               Round-Robin    Neural+Fallback',
        '-----------------------------------------------------------',
        '  Avg Wait Time:      34.40 ticks      28.60 ticks',
        '  Avg Turnaround:     40.80 ticks      35.00 ticks',
        '  Total Ticks:        64             64',
        '  NN Fallbacks:       --             50 times',
        '===========================================================',
        '  RESULT: Neural scheduler achieved 16.8% lower wait time!'
      ];
    } else if (cmd === 'weights') {
      response = [
        '[WEIGHTS] 5->8->1 MLP Parameter Matrix (57 Floats Total)',
        'W1 Layer 1 [5x8]:',
        '  [+0.42, -0.18, +0.85, +0.33, -0.09, +0.61, -0.27, +0.74]',
        '  [ -0.65, +0.91, -0.12, +0.44, +0.58, -0.36, +0.82, -0.15]',
        '  [+0.31, +0.22, +0.67, -0.54, +0.19, +0.88, -0.41, +0.05]',
        '  [ -0.08, +0.77, +0.49, +0.16, -0.62, +0.29, +0.53, -0.84]',
        '  [+0.93, -0.34, +0.07, +0.71, +0.25, -0.19, +0.64, +0.48]',
        'W2 Layer 2 [8x1]:',
        '  [+1.12, -0.84, +0.95, +0.47, -0.63, +1.28, -0.39, +0.76]'
      ];
    } else if (cmd === 'clear') {
      setLogs([]);
      setInputVal('');
      return;
    } else {
      response = [
        `Unknown command: "${cmd}". Type "help" for a list of available commands.`
      ];
    }

    setLogs((prev) => [...prev, `neuro> ${inputVal}`, ...response, '']);
    setInputVal('');
  };

  return (
    <div className="carbon-card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#333333] pb-3">
        <div className="flex items-center gap-2 font-mono text-xs text-[#FF5A00] font-bold">
          <Terminal className="w-4 h-4" />
          <span>IN-BROWSER COM1 SERIAL UART TERMINAL SHELL</span>
        </div>
        <button
          onClick={() => setLogs([])}
          className="text-[#888888] hover:text-[#FF5A00] transition-colors p-1"
          title="Clear Console"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Terminal Screen */}
      <div ref={terminalBoxRef} className="bg-[#0B0B0D] border border-[#333333] p-4 font-mono text-xs h-64 overflow-y-auto space-y-1 text-[#EAEAEA]">
        {logs.map((line, idx) => (
          <div 
            key={idx} 
            className={
              line.startsWith('neuro>') 
                ? 'text-[#FF5A00] font-bold' 
                : line.startsWith('[WARN]') 
                ? 'text-[#FFD600]' 
                : line.startsWith('[RESULT]') || line.includes('16.8%') 
                ? 'text-[#10B981] font-bold' 
                : 'text-[#888888]'
            }
          >
            {line}
          </div>
        ))}
      </div>

      {/* Interactive Command Input Form */}
      <form onSubmit={handleCommand} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#FF5A00] font-bold">
            neuro&gt;
          </span>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type 'help', 'boot', 'run nn', or 'stats'..."
            className="w-full bg-[#111111] border border-[#333333] pl-16 pr-4 py-2 font-mono text-xs text-[#EAEAEA] focus:border-[#FF5A00] focus:outline-none transition-colors"
          />
        </div>
        <button
          type="submit"
          className="bg-[#FF5A00] hover:bg-[#E04F00] text-black font-mono font-bold text-xs px-4 py-2 flex items-center gap-1 transition-all"
        >
          <span>SEND</span>
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
