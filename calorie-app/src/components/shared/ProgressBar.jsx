import React from 'react';

const ProgressBar = ({ progress, color = 'bg-primary' }) => {
  return (
    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
      <div 
        className={`${color} h-full transition-all duration-1000 ease-out`} 
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
};

export default ProgressBar;
