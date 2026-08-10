import React, { useState } from 'react';
import { Grid, Eye } from 'lucide-react';

export default function WeightHeatmap() {
  const [hoveredWeight, setHoveredWeight] = useState(null);

  /* 5 inputs x 8 hidden neurons weight matrix W1 */
  const features = ['wait_ticks', 'remaining_burst', 'priority', 'io_bound', 'io_yield_count'];
  const neurons = ['H0', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7'];

  const W1 = [
    [ 0.42, -0.18,  0.85,  0.33, -0.09,  0.61, -0.27,  0.74],
    [-0.65,  0.91, -0.12,  0.44,  0.58, -0.36,  0.82, -0.15],
    [ 0.31,  0.22,  0.67, -0.54,  0.19,  0.88, -0.41,  0.05],
    [-0.08,  0.77,  0.49,  0.16, -0.62,  0.29,  0.53, -0.84],
    [ 0.93, -0.34,  0.07,  0.71,  0.25, -0.19,  0.64,  0.48]
  ];

  const getColor = (val) => {
    if (val > 0) {
      const alpha = Math.min(Math.abs(val), 1);
      return `rgba(255, 90, 0, ${0.2 + alpha * 0.8})`;
    } else {
      const alpha = Math.min(Math.abs(val), 1);
      return `rgba(16, 185, 129, ${0.2 + alpha * 0.8})`;
    }
  };

  return (
    <div className="carbon-card p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[#333333] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-xs text-[#FF5A00] font-bold">
            <Grid className="w-4 h-4" />
            <span>5x8 NEURAL WEIGHT MATRIX (W1 HEATMAP)</span>
          </div>
          <h3 className="font-mono font-bold text-lg text-[#EAEAEA]">Synaptic Weight Heatmap & Feature Sensitivity</h3>
        </div>
        <div className="font-mono text-xs text-[#888888]">
          Hover cells to view weight value & impact
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-xs text-center border-collapse">
          <thead>
            <tr>
              <th className="p-2 border border-[#333333] bg-[#111111] text-[#888888] text-left">Input Feature</th>
              {neurons.map(n => (
                <th key={n} className="p-2 border border-[#333333] bg-[#111111] text-[#FF5A00] font-bold">{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {W1.map((row, i) => (
              <tr key={i}>
                <td className="p-2 border border-[#333333] bg-[#111111] text-left text-[#EAEAEA] font-bold">
                  {features[i]}
                </td>
                {row.map((val, j) => (
                  <td
                    key={j}
                    onMouseEnter={() => setHoveredWeight({ feat: features[i], neuron: neurons[j], val })}
                    onMouseLeave={() => setHoveredWeight(null)}
                    className="p-3 border border-[#333333] font-bold cursor-pointer transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: getColor(val), color: val > 0 ? '#000000' : '#EAEAEA' }}
                  >
                    {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover Info Tooltip Panel */}
      <div className="bg-[#111111] border border-[#333333] p-4 flex items-center justify-between font-mono text-xs">
        {hoveredWeight ? (
          <div className="flex items-center gap-3">
            <Eye className="w-4 h-4 text-[#FF5A00]" />
            <div>
              <span className="text-[#888888]">Synapse: </span>
              <strong className="text-[#FF5A00]">{hoveredWeight.feat}</strong> → <strong className="text-[#EAEAEA]">{hoveredWeight.neuron}</strong>
              <span className="text-[#888888] ml-4">Weight: </span>
              <strong className="text-[#EAEAEA]">{hoveredWeight.val > 0 ? `+${hoveredWeight.val}` : hoveredWeight.val}</strong>
            </div>
          </div>
        ) : (
          <div className="text-[#888888] flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#888888]" />
            <span>Hover any cell above to inspect synapse connection strength.</span>
          </div>
        )}

        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#FF5A00] inline-block" /> Positive Weight</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#10B981] inline-block" /> Negative Weight</span>
        </div>
      </div>
    </div>
  );
}
