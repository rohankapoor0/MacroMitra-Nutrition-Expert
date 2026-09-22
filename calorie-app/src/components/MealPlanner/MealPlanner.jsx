import React from 'react';
import { useUser } from '../../context/UserContext';
import MealSection from './MealSection';

const MealPlanner = () => {
  const { mealPlan, regenerateMealPlan, macroData, hasCalculated } = useUser();

  if (!hasCalculated) {
    return (
      <div className="card-island p-20 text-center">
        <span className="text-6xl mb-8 block" role="img" aria-label="thinking">🧬</span>
        <h3 className="display-lg mb-6">Blueprint Missing.</h3>
        <p className="text-on-surface/50 text-xl max-w-lg mx-auto mb-12 font-medium">
          Our physiological models require your biometric signatures to generate a bespoke nutritional canvas.
        </p>
        <a href="/calculator" className="inline-block bg-primary hover:bg-primary-container text-white font-black uppercase tracking-widest py-4 px-12 rounded-full transition-all shadow-xl shadow-green-900/10">
          Initialize Profile →
        </a>
      </div>
    );
  }

  const totalCals = mealPlan.reduce((acc, curr) => acc + curr.totalCalories, 0);
  const totalProt = mealPlan.reduce((acc, curr) => acc + curr.totalProtein, 0);
  const totalCarbs = mealPlan.reduce((acc, curr) => acc + curr.items.reduce((a, c) => a + c.carbs, 0), 0);
  const totalFat = mealPlan.reduce((acc, curr) => acc + curr.items.reduce((a, c) => a + c.fat, 0), 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
      <div className="xl:col-span-8 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <span className="label-tier mb-2 block text-primary font-black">Today's Canvas</span>
            <h2 className="display-lg tracking-tighter">Daily Targets</h2>
          </div>
          <button 
            onClick={regenerateMealPlan}
            className="flex items-center space-x-3 bg-on-surface text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform shadow-ambient active:scale-95"
          >
            <span>Regenerate Plan</span>
            <span className="text-lg">🔄</span>
          </button>
        </div>

        <div className="space-y-16">
          {mealPlan.map((section) => (
            <MealSection key={section.meal} mealData={section} />
          ))}
        </div>
      </div>

      <div className="xl:col-span-4 space-y-8">
        <div className="sticky top-8">
          <div className="bg-surface-container-low p-10 rounded-3xl space-y-10 shadow-ambient border border-outline-variant/10">
            <h3 className="title-lg">Daily Progress</h3>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="label-tier">Calories</span>
                  <span className="text-lg font-black">{totalCals} <span className="opacity-30">/ {macroData.adjustedCalories}</span></span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${Math.min((totalCals / macroData.adjustedCalories) * 100, 100)}%` }} 
                  />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-on-surface/40">
                  {Math.round((totalCals / macroData.adjustedCalories) * 100)}% of target met
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="label-tier">Protein</span>
                  <span className="text-lg font-black">{totalProt}g <span className="opacity-30">/ {macroData.proteinG}g</span></span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-tertiary" 
                    style={{ width: `${Math.min((totalProt / macroData.proteinG) * 100, 100)}%` }} 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="label-tier">Carbs</span>
                  <span className="text-lg font-black">{Math.round(totalCarbs)}g <span className="opacity-30">/ {macroData.carbsG}g</span></span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: `${Math.min((totalCarbs / macroData.carbsG) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            </div>

            <button className="w-full bg-on-surface text-white py-4 rounded-xl font-bold text-sm tracking-tight flex items-center justify-center space-x-2">
               <span>📊</span> <span>Full Nutritional Report</span>
            </button>
          </div>

          <div className="mt-8 bg-primary p-10 rounded-3xl relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">💡</div>
              <h4 className="text-white font-black uppercase tracking-widest text-[10px]">Pro Tip</h4>
              <p className="text-white text-sm font-medium leading-relaxed">
                Increasing your protein intake by 10g during snacks can help reduce cravings during the evening.
              </p>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] text-8xl opacity-10 transform -rotate-12 group-hover:scale-110 transition-transform">
               🍏
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanner;
