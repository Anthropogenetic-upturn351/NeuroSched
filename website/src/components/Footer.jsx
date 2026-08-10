import React from 'react';
import { Github, ExternalLink, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-10 px-4 lg:px-8 bg-[#111111] border-t border-[#333333]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#888888]">
        
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#1B1B1B] border border-[#FF5A00] flex items-center justify-center text-[#FF5A00] font-bold text-[10px]">
            NS
          </div>
          <span>NeuroSched v1.0 — x86 Neural Network OS Kernel</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/mantisdarling/NeuroSched"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#FF5A00] transition-colors flex items-center gap-1"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Repo</span>
          </a>
          <span className="text-[#333333]">|</span>
          <a
            href="https://github.com/mantisdarling/NeuroSched/blob/main/CERTIFICATE.md"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#FF5A00] transition-colors flex items-center gap-1 text-[#FF5A00] font-bold"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Project Certificate</span>
          </a>
          <span className="text-[#333333]">|</span>
          <a
            href="https://github.com/mantisdarling/NeuroSched/blob/main/INFO.md"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#FF5A00] transition-colors"
          >
            Project Info
          </a>
          <span className="text-[#333333]">|</span>
          <a
            href="https://github.com/mantisdarling/NeuroSched/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#FF5A00] transition-colors"
          >
            Contributing
          </a>
          <span className="text-[#333333]">|</span>
          <a
            href="https://github.com/mantisdarling/NeuroSched/blob/main/SECURITY.md"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#FF5A00] transition-colors"
          >
            Security Policy
          </a>
          <span className="text-[#333333]">|</span>
          <a
            href="https://github.com/mantisdarling/NeuroSched/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#FF5A00] transition-colors"
          >
            MIT License
          </a>
        </div>

      </div>
    </footer>
  );
}
