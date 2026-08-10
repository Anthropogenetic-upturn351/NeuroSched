import React from 'react';
import { HelpCircle, Code2, Zap, ShieldCheck } from 'lucide-react';

export default function AudienceToggle({ currentMode, setMode }) {
  return (
    <section className="py-8 px-4 lg:px-8 bg-[#1B1B1B]/40 border-b border-[#333333]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Toggle Description */}
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-mono text-[#FF5A00] font-semibold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            <span>Interactive Audience Mode</span>
          </div>
          <h2 className="text-xl font-bold text-[#EAEAEA]">
            Tailor the Experience to Your Background
          </h2>
          <p className="text-xs text-[#888888]">
            Switch modes anytime to view explanations in non-technical terms or deep OS kernel implementation specs.
          </p>
        </div>

        {/* Tactile Brutalist Toggle Buttons */}
        <div className="flex items-center bg-[#111111] p-1 border border-[#333333]">
          <button
            onClick={() => setMode('beginner')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs transition-all ${
              currentMode === 'beginner'
                ? 'bg-[#FF5A00] text-black font-bold shadow-[0_0_15px_rgba(255,90,0,0.3)]'
                : 'text-[#888888] hover:text-[#EAEAEA]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Beginner (ELIF5)</span>
          </button>

          <button
            onClick={() => setMode('architect')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs transition-all ${
              currentMode === 'architect'
                ? 'bg-[#FF5A00] text-black font-bold shadow-[0_0_15px_rgba(255,90,0,0.3)]'
                : 'text-[#888888] hover:text-[#EAEAEA]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>System Architect</span>
          </button>
        </div>

      </div>
    </section>
  );
}
