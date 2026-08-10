import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AudienceToggle from './components/AudienceToggle';
import HowToUse from './components/HowToUse';
import Simulator from './components/Simulator';
import Architecture from './components/Architecture';
import CodeExplorer from './components/CodeExplorer';
import SerialTerminal from './components/SerialTerminal';
import WeightHeatmap from './components/WeightHeatmap';
import MultiAlgoComparison from './components/MultiAlgoComparison';
import Benchmarks from './components/Benchmarks';
import Quickstart from './components/Quickstart';
import Footer from './components/Footer';

export default function App() {
  const [currentMode, setCurrentMode] = useState('architect');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleMode = () => {
    setCurrentMode((prev) => (prev === 'architect' ? 'beginner' : 'architect'));
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-[#EAEAEA] selection:bg-[#FF5A00] selection:text-black">
      <Navbar currentMode={currentMode} toggleMode={toggleMode} />
      <Hero currentMode={currentMode} />
      <AudienceToggle currentMode={currentMode} setMode={setCurrentMode} />
      <HowToUse />
      <Simulator />
      
      {/* Interactive Shell & Neural Inspector Section */}
      <section className="py-16 px-4 lg:px-8 border-b border-[#333333] bg-[#0B0B0D]">
        <div className="max-w-7xl mx-auto space-y-10">
          <SerialTerminal />
          <WeightHeatmap />
          <MultiAlgoComparison />
        </div>
      </section>

      <Architecture currentMode={currentMode} />
      <CodeExplorer />
      <Benchmarks />
      <Quickstart />
      <Footer />
    </div>
  );
}
