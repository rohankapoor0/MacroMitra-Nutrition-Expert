import React from 'react';
import { useUser } from '../../context/UserContext';
import MacroPieChart from './MacroPieChart';

const GoalsDashboard = () => {
  const { macroData } = useUser();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="card-island p-10 flex flex-col items-center justify-center">
        <h3 className="label-tier mb-12 self-start">Macro Blueprint</h3>
        <MacroPieChart 
          protein={macroData.proteinG} 
          carbs={macroData.carbsG} 
          fat={macroData.fatG} 
          totalCalories={macroData.adjustedCalories}
        />
      </div>

      <div className="card-island p-10 space-y-12">
        <h3 className="label-tier">Detailed Targets</h3>
        
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-sm font-black uppercase tracking-widest text-on-surface/80">Protein Needs</span>
              <span className="text-xl font-black">{macroData.proteinG}g</span>
            </div>
            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
              <div className="h-full bg-tertiary w-full" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-sm font-black uppercase tracking-widest text-on-surface/80">Carbohydrates</span>
              <span className="text-xl font-black">{macroData.carbsG}g</span>
            </div>
            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
              <div className="h-full bg-primary w-2/3" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-sm font-black uppercase tracking-widest text-on-surface/80">Dietary Fats</span>
              <span className="text-xl font-black">{macroData.fatG}g</span>
            </div>
            <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
              <div className="h-full bg-slate-400 w-1/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsDashboard;
