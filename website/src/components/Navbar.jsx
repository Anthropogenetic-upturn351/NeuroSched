import React from 'react';
import { Cpu, Terminal, Github, ExternalLink, Activity } from 'lucide-react';

export default function Navbar({ currentMode, toggleMode }) {
  return (
    <header className="sticky top-0 z-50 bg-[#111111]/90 backdrop-blur-md border-b border-[#333333] px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1B1B1B] border border-[#FF5A00] flex items-center justify-center text-[#FF5A00] font-mono font-bold text-lg shadow-[0_0_15px_rgba(255,90,0,0.25)]">
            NS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold tracking-wider text-[#EAEAEA] text-base">NEUROSCHED</span>
              <span className="bg-[#FF5A00]/10 border border-[#FF5A00]/40 text-[#FF5A00] font-mono text-[10px] px-1.5 py-0.5 font-semibold uppercase">
                v1.0 OS
              </span>
            </div>
            <p className="text-[11px] text-[#888888] font-mono">x86 Neural Kernel Scheduler</p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 font-mono text-xs text-[#888888]">
          <a href="#howtouse" className="hover:text-[#FF5A00] transition-colors">
            How to Use
          </a>
          <a href="#simulator" className="hover:text-[#FF5A00] transition-colors flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#FF5A00]" />
            <span>Simulator</span>
          </a>
          <a href="#architecture" className="hover:text-[#FF5A00] transition-colors flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#FF5A00]" />
            <span>Architecture</span>
          </a>
          <a href="#code" className="hover:text-[#FF5A00] transition-colors flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#FF5A00]" />
            <span>Code</span>
          </a>
          <a href="#benchmarks" className="hover:text-[#FF5A00] transition-colors">
            Benchmarks
          </a>
        </nav>

        {/* Audience Mode Switcher & CTA */}
        <div className="flex items-center gap-3">
          
          {/* Mode Switcher Pill */}
          <button
            onClick={toggleMode}
            className="flex items-center gap-2 bg-[#1B1B1B] border border-[#333333] hover:border-[#FF5A00] px-3 py-1.5 font-mono text-xs text-[#EAEAEA] transition-all"
            title="Switch explanation depth"
          >
            <span className="text-[10px] text-[#888888] uppercase tracking-wider">Mode:</span>
            <span className="font-bold text-[#FF5A00]">
              {currentMode === 'architect' ? 'System Architect' : 'Beginner (ELIF5)'}
            </span>
          </button>

          {/* GitHub Repo Action */}
          <a
            href="https://github.com/mantisdarling/NeuroSched"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 bg-[#FF5A00] hover:bg-[#E04F00] text-black font-mono font-bold text-xs px-3.5 py-1.5 transition-all shadow-[0_0_20px_rgba(255,90,0,0.3)]"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>

      </div>
    </header>
  );
}
