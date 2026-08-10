import React, { useRef, useEffect } from 'react';

export default function NeuralCanvas({ currentConfidence, isRunning, activeProcess }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Define 5->8->1 neural architecture layout
    const inputNodes = [
      { label: 'waitTicks', y: 40 },
      { label: 'remainingBurst', y: 90 },
      { label: 'priority', y: 140 },
      { label: 'ioBound', y: 190 },
      { label: 'ioYieldCount', y: 240 }
    ];

    const hiddenNodes = Array.from({ length: 8 }, (_, i) => ({
      y: 25 + i * 34
    }));

    const outputNode = { label: 'score', y: 140 };

    const inputX = 60;
    const hiddenX = 220;
    const outputX = 380;

    let particleOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Layer 1 Connections (Input -> Hidden)
      inputNodes.forEach((inp) => {
        hiddenNodes.forEach((hid) => {
          ctx.beginPath();
          ctx.moveTo(inputX, inp.y);
          ctx.lineTo(hiddenX, hid.y);
          ctx.strokeStyle = isRunning ? 'rgba(255, 90, 0, 0.15)' : 'rgba(51, 51, 51, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      });

      // Draw Layer 2 Connections (Hidden -> Output)
      hiddenNodes.forEach((hid) => {
        ctx.beginPath();
        ctx.moveTo(hiddenX, hid.y);
        ctx.lineTo(outputX, outputNode.y);
        ctx.strokeStyle = isRunning ? 'rgba(255, 90, 0, 0.25)' : 'rgba(51, 51, 51, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw Glowing Particles moving along synapses if running
      if (isRunning) {
        particleOffset = (particleOffset + 0.02) % 1;

        inputNodes.forEach((inp) => {
          hiddenNodes.forEach((hid) => {
            const px = inputX + (hiddenX - inputX) * particleOffset;
            const py = inp.y + (hid.y - inp.y) * particleOffset;

            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#FF5A00';
            ctx.shadowColor = '#FF5A00';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
          });
        });
      }

      // Draw Input Nodes
      inputNodes.forEach((inp) => {
        ctx.beginPath();
        ctx.arc(inputX, inp.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#1B1B1B';
        ctx.strokeStyle = '#FF5A00';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#888888';
        ctx.fillText(inp.label, inputX - 52, inp.y + 3);
      });

      // Draw Hidden Nodes
      hiddenNodes.forEach((hid) => {
        ctx.beginPath();
        ctx.arc(hiddenX, hid.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = isRunning ? '#FF5A00' : '#1B1B1B';
        ctx.strokeStyle = '#FF5A00';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
      });

      // Draw Output Node
      const isFallback = currentConfidence < 0.65;
      ctx.beginPath();
      ctx.arc(outputX, outputNode.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = isFallback ? '#FFD600' : '#10B981';
      ctx.strokeStyle = isFallback ? '#FFD600' : '#10B981';
      ctx.shadowColor = isFallback ? '#FFD600' : '#10B981';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#EAEAEA';
      ctx.fillText(`score: ${(currentConfidence * 100).toFixed(0)}%`, outputX + 16, outputNode.y + 3);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, currentConfidence]);

  return (
    <div className="w-full flex justify-center py-2 bg-[#111111] border border-[#333333]">
      <canvas
        ref={canvasRef}
        width={480}
        height={280}
        className="max-w-full"
      />
    </div>
  );
}
