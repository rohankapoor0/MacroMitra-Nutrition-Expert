import React from 'react';

const MacroPieChart = ({ protein, carbs, fat, totalCalories }) => {
  // Calculate total kcal for the split
  const proteinKcal = protein * 4;
  const carbsKcal = carbs * 4;
  const fatKcal = fat * 9;
  const total = proteinKcal + carbsKcal + fatKcal;

  // Percentages for the conic gradient
  const p1 = (carbsKcal / total) * 100;
  const p2 = (fatKcal / total) * 100;
  const p3 = (proteinKcal / total) * 100;

  // Colors from mockup
  const proteinColor = '#a72d51'; // tertiary
  const carbsColor = '#006b2c';   // primary
  const fatColor = '#94a3b8';     // muted/slate

  const gradient = `conic-gradient(
    ${carbsColor} 0% ${p1}%, 
    ${fatColor} ${p1}% ${p1 + p2}%, 
    ${proteinColor} ${p1 + p2}% 100%
  )`;

  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative w-64 h-64 rounded-full shadow-ambient flex items-center justify-center overflow-hidden transition-transform duration-500 hover:scale-[1.02]"
        style={{ background: gradient }}
      >
        {/* Donut hole with white background for a clean look */}
        <div className="absolute inset-0 m-auto w-[85%] h-[85%] bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
          <span className="text-4xl font-black text-on-surface tracking-tighter">{totalCalories.toLocaleString()}</span>
          <span className="label-tier mt-1 opacity-60">Total KCAL</span>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-8">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: carbsColor }} />
          <span className="text-xs font-black uppercase tracking-widest text-on-surface/60">Carbs {Math.round(p1)}%</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: fatColor }} />
          <span className="text-xs font-black uppercase tracking-widest text-on-surface/60">Fats {Math.round(p2)}%</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: proteinColor }} />
          <span className="text-xs font-black uppercase tracking-widest text-on-surface/60">Protein {Math.round(p3)}%</span>
        </div>
      </div>
    </div>
  );
};

export default MacroPieChart;
