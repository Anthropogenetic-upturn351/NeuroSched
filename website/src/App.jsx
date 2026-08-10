import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AudienceToggle from './components/AudienceToggle';
import Simulator from './components/Simulator';
import Architecture from './components/Architecture';
import CodeExplorer from './components/CodeExplorer';
import Benchmarks from './components/Benchmarks';
import Quickstart from './components/Quickstart';
import Footer from './components/Footer';

export default function App() {
  const [currentMode, setCurrentMode] = useState('architect');

  const toggleMode = () => {
    setCurrentMode((prev) => (prev === 'architect' ? 'beginner' : 'architect'));
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#EAEAEA] selection:bg-[#FF5A00] selection:text-black">
      <Navbar currentMode={currentMode} toggleMode={toggleMode} />
      <Hero currentMode={currentMode} />
      <AudienceToggle currentMode={currentMode} setMode={setCurrentMode} />
      <Simulator />
      <Architecture currentMode={currentMode} />
      <CodeExplorer />
      <Benchmarks />
      <Quickstart />
      <Footer />
    </div>
  );
}
