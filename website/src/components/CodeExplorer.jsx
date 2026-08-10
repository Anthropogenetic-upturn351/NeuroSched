import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
import { kernelCodeSnippets } from '../data/codeSnippets';

export default function CodeExplorer() {
  const [activeTab, setActiveTab] = useState('bootStub');
  const [copied, setCopied] = useState(false);

  const tabs = [
    { id: 'bootStub', label: 'boot/boot.S (Assembly Stub)' },
    { id: 'nnInference', label: 'kernel/nn_infer.c (C Engine)' },
    { id: 'schedulerLogic', label: 'kernel/scheduler.c (Fallback)' },
    { id: 'trainerScript', label: 'scripts/train.py (Trainer)' }
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(kernelCodeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="code" className="py-16 px-4 lg:px-8 border-b border-[#333333] bg-[#111111]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs text-[#FF5A00] uppercase tracking-wider font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              <span>Source Code Explorer</span>
            </div>
            <h2 className="text-3xl font-extrabold text-[#EAEAEA]">
              Freestanding C & AT&T Assembly Code
            </h2>
            <p className="text-xs text-[#888888]">
              Inspect actual code implementation directly from the repository.
            </p>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-[#1B1B1B] hover:bg-[#252525] border border-[#333333] px-4 py-2 font-mono text-xs text-[#EAEAEA] transition-all self-start md:self-auto"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#FF5A00]" />}
            <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY CODE'}</span>
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 border-b border-[#333333] pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 font-mono text-xs transition-all ${
                activeTab === t.id
                  ? 'bg-[#FF5A00] text-black font-bold shadow-[0_0_15px_rgba(255,90,0,0.3)]'
                  : 'bg-[#1B1B1B] text-[#888888] hover:text-[#EAEAEA] border border-[#333333]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Code Display Container */}
        <div className="carbon-card p-4 overflow-x-auto font-mono text-xs leading-relaxed bg-[#111111] text-[#EAEAEA]">
          <pre className="whitespace-pre">
            <code>{kernelCodeSnippets[activeTab]}</code>
          </pre>
        </div>

      </div>
    </section>
  );
}
