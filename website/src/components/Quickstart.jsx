import React, { useState } from 'react';
import { Terminal, Copy, Check, ExternalLink, Globe } from 'lucide-react';

export default function Quickstart() {
  const [copiedDocker, setCopiedDocker] = useState(false);
  const [copiedMake, setCopiedMake] = useState(false);

  const dockerCommand = `docker run --rm -v "%CD%:/neurosched" neurosched-qemu bash /neurosched/scripts/boot-test.sh`;
  const makeCommand = `make clean && make`;

  const copyToClipboard = (text, setFn) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  return (
    <section id="quickstart" className="py-16 px-4 lg:px-8 border-b border-[#333333] bg-[#111111]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs text-[#FF5A00] uppercase tracking-wider font-semibold">
            <Terminal className="w-3.5 h-3.5" />
            <span>Local Build & Vercel Deployment</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#EAEAEA]">
            Run Locally or Deploy on Vercel
          </h2>
          <p className="text-xs text-[#888888] max-w-2xl">
            Execute the kernel headless inside QEMU locally or deploy this web showcase directly to Vercel.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Local QEMU Docker Command */}
          <div className="carbon-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono font-bold text-sm text-[#EAEAEA]">1. Docker QEMU Test</h3>
                <Terminal className="w-4 h-4 text-[#FF5A00]" />
              </div>
              <div className="bg-[#111111] border border-[#333333] p-3 font-mono text-xs text-[#EAEAEA] overflow-x-auto relative">
                <code>{dockerCommand}</code>
              </div>
              <p className="text-xs text-[#888888]">
                Executes kernel boot sequence and streams COM1 telemetry directly to your terminal.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(dockerCommand, setCopiedDocker)}
              className="flex items-center justify-center gap-2 bg-[#1B1B1B] hover:bg-[#252525] border border-[#333333] py-2 font-mono text-xs text-[#EAEAEA] transition-all w-full mt-2"
            >
              {copiedDocker ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#FF5A00]" />}
              <span>{copiedDocker ? 'COPIED DOCKER COMMAND' : 'COPY DOCKER COMMAND'}</span>
            </button>
          </div>

          {/* Local Makefile Command */}
          <div className="carbon-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono font-bold text-sm text-[#EAEAEA]">2. Local Cross-Compile</h3>
                <Terminal className="w-4 h-4 text-[#FF5A00]" />
              </div>
              <div className="bg-[#111111] border border-[#333333] p-3 font-mono text-xs text-[#EAEAEA] overflow-x-auto">
                <code>{makeCommand}</code>
              </div>
              <p className="text-xs text-[#888888]">
                Compiles bare-metal i686 ELF kernel binary and creates bootable GRUB ISO image.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(makeCommand, setCopiedMake)}
              className="flex items-center justify-center gap-2 bg-[#1B1B1B] hover:bg-[#252525] border border-[#333333] py-2 font-mono text-xs text-[#EAEAEA] transition-all w-full mt-2"
            >
              {copiedMake ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#FF5A00]" />}
              <span>{copiedMake ? 'COPIED MAKE COMMAND' : 'COPY MAKE COMMAND'}</span>
            </button>
          </div>

          {/* Vercel Deployment Instructions */}
          <div className="carbon-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono font-bold text-sm text-[#EAEAEA]">3. Deploy to Vercel</h3>
                <Globe className="w-4 h-4 text-[#FF5A00]" />
              </div>
              <div className="space-y-2 text-xs text-[#888888] font-mono bg-[#111111] border border-[#333333] p-3">
                <div>1. Connect GitHub repository</div>
                <div>2. Set Root Directory: <code className="text-[#FF5A00]">website</code></div>
                <div>3. Click Deploy!</div>
              </div>
              <p className="text-xs text-[#888888]">
                Deploys static SPA showcase on Vercel edge network with automatic Vite detection.
              </p>
            </div>
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#FF5A00] hover:bg-[#E04F00] text-black font-mono font-bold text-xs py-2 transition-all w-full mt-2"
            >
              <span>Deploy to Vercel Now</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}
