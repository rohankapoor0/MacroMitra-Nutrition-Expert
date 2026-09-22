import React from 'react';
import ProgressBar from './ProgressBar';

const MacroCard = ({ icon, label, value, unit, progress, color }) => {
  return (
    <div className="bg-surface-slate p-6 rounded-xl shadow-card border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        <span className="text-text-muted text-sm font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline space-x-1 mb-4">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-text-muted text-sm">{unit}</span>
      </div>
      <ProgressBar progress={progress} color={color} />
    </div>
  );
};

export default MacroCard;
