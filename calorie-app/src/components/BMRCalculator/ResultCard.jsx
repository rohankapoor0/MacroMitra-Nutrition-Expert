import React from 'react';
import { useUser } from '../../context/UserContext';

const ResultCard = () => {
  const { bmrData, macroData } = useUser();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/50">
          <p className="label-tier mb-2">BMR</p>
          <p className="text-3xl font-black">{bmrData.bmr.toLocaleString()}</p>
          <p className="text-[10px] text-on-surface/40 font-bold tracking-tight">Basal Metabolism</p>
        </div>
        
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/50">
          <p className="label-tier mb-2">TDEE</p>
          <p className="text-3xl font-black">{bmrData.tdee.toLocaleString()}</p>
          <p className="text-[10px] text-on-surface/40 font-bold tracking-tight">Total Daily Energy</p>
        </div>
        
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/50">
          <p className="label-tier mb-2 text-tertiary">Protein</p>
          <p className="text-3xl font-black">{macroData.proteinG}g</p>
          <p className="text-[10px] text-on-surface/40 font-bold tracking-tight">Daily Amino Target</p>
        </div>
      </div>

      <div className="relative group overflow-hidden rounded-3xl bg-on-surface h-48 flex items-center p-10 shadow-ambient">
        <div className="relative z-10 space-y-2">
          <h3 className="text-white text-3xl font-black tracking-tighter">Fuel for performance.</h3>
          <p className="text-white/60 text-sm max-w-sm">These numbers are your foundation. Use our Meal Planner to turn this data into real food.</p>
        </div>
        <div className="absolute right-[-10%] bottom-[-20%] opacity-20 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
           <span className="text-9xl">🥦</span>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
