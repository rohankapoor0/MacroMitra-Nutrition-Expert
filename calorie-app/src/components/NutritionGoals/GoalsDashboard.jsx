import React from 'react';
import { useUser } from '../../context/UserContext';
import MacroPieChart from './MacroPieChart';

const GoalsDashboard = () => {
  const { macroData, loggedTotals } = useUser();

  const hasLogged = loggedTotals && loggedTotals.calories > 0;

  return (
    <div className="space-y-8">
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

        <div className="card-island p-10 space-y-10">
          <div className="flex justify-between items-center">
            <h3 className="label-tier">Detailed Targets</h3>
            {hasLogged && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full">
                Active Tracking
              </span>
            )}
          </div>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-black uppercase tracking-widest text-on-surface/80">Protein Needs</span>
                <span className="text-xl font-black">
                  {hasLogged ? `${loggedTotals.protein}g / ` : ''}{macroData.proteinG}g
                </span>
              </div>
              <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                <div 
                  className="h-full bg-tertiary transition-all duration-500" 
                  style={{ width: `${hasLogged ? Math.min((loggedTotals.protein / macroData.proteinG) * 100, 100) : 100}%` }}
                />
              </div>
              {hasLogged && (
                <span className="text-[10px] text-on-surface/40 font-bold uppercase">
                  {Math.round((loggedTotals.protein / macroData.proteinG) * 100)}% met today
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-black uppercase tracking-widest text-on-surface/80">Carbohydrates</span>
                <span className="text-xl font-black">
                  {hasLogged ? `${loggedTotals.carbs}g / ` : ''}{macroData.carbsG}g
                </span>
              </div>
              <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${hasLogged ? Math.min((loggedTotals.carbs / macroData.carbsG) * 100, 100) : 66}%` }}
                />
              </div>
              {hasLogged && (
                <span className="text-[10px] text-on-surface/40 font-bold uppercase">
                  {Math.round((loggedTotals.carbs / macroData.carbsG) * 100)}% met today
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-black uppercase tracking-widest text-on-surface/80">Dietary Fats</span>
                <span className="text-xl font-black">
                  {hasLogged ? `${loggedTotals.fat}g / ` : ''}{macroData.fatG}g
                </span>
              </div>
              <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-400 transition-all duration-500" 
                  style={{ width: `${hasLogged ? Math.min((loggedTotals.fat / macroData.fatG) * 100, 100) : 33}%` }}
                />
              </div>
              {hasLogged && (
                <span className="text-[10px] text-on-surface/40 font-bold uppercase">
                  {Math.round((loggedTotals.fat / macroData.fatG) * 100)}% met today
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsDashboard;
