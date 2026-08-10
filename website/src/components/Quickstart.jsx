import React from 'react';
import { Terminal, Copy, ExternalLink, Globe } from 'lucide-react';

export default function Quickstart() {
  return (
    <section className="py-16 px-4 lg:px-8 border-b border-[#333333] bg-[#111111]">
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
            Steps to run the kernel in QEMU locally or deploy this web showcase to Vercel for free.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Local QEMU Docker Command */}
          <div className="carbon-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-mono font-bold text-sm text-[#EAEAEA]">1. Run Kernel in Docker QEMU</h3>
              <Terminal className="w-4 h-4 text-[#FF5A00]" />
            </div>
            <div className="bg-[#111111] border border-[#333333] p-3 font-mono text-xs text-[#EAEAEA] overflow-x-auto">
              docker run --rm -v "%CD%:/neurosched" neurosched-qemu bash /neurosched/scripts/boot-test.sh
            </div>
            <p className="text-xs text-[#888888]">
              Executes the kernel headless inside QEMU and streams COM1 telemetry directly to your terminal.
            </p>
          </div>

          {/* Vercel Deployment Instructions */}
          <div className="carbon-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-mono font-bold text-sm text-[#EAEAEA]">2. Deploy Website to Vercel</h3>
              <Globe className="w-4 h-4 text-[#FF5A00]" />
            </div>
            <div className="space-y-2 text-xs text-[#888888] font-mono">
              <div>1. Connect your GitHub repository on Vercel.com</div>
              <div>2. Set Root Directory to: <code className="text-[#FF5A00]">website</code></div>
              <div>3. Click Deploy! (Auto-detects Vite build)</div>
            </div>
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#FF5A00] hover:bg-[#E04F00] text-black font-mono font-bold text-xs px-4 py-2 transition-all"
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
