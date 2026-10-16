import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BMRCalculator from '../components/BMRCalculator/BMRCalculator';
import ResultCard from '../components/BMRCalculator/ResultCard';
import GoalsDashboard from '../components/NutritionGoals/GoalsDashboard';
import { useUser } from '../context/UserContext';

const Calculator = () => {
  const { hasCalculated, macroData } = useUser();
  const navigate = useNavigate();
  const statsSectionRef = useRef(null);

  const calValue = Math.round(macroData.adjustedCalories || macroData.calories || 2000);
  const protValue = Math.round(macroData.proteinG || macroData.protein || 120);
  const carbsValue = Math.round(macroData.carbsG || macroData.carbs || 225);
  const fatValue = Math.round(macroData.fatG || macroData.fat || 67);

  return (
    <div className="py-12 space-y-12">
      {/* Upper Grid: Profile Inputs & Quick Metrics */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-3/5">
          <BMRCalculator />
        </div>
        <div className="w-full lg:w-2/5">
          {hasCalculated ? (
            <ResultCard />
          ) : (
            <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-xl p-12 text-center h-full flex flex-col justify-center">
              <span className="text-4xl mb-4">📊</span>
              <p className="text-text-muted">Enter your details and click &ldquo;Calculate My Blueprint&rdquo; to see your personalized daily targets.</p>
            </div>
          )}
        </div>
      </div>

      {/* Destination Section: Personalized Nutrition Blueprint & Statistics */}
      {hasCalculated && (
        <section 
          id="nutrition-statistics"
          ref={statsSectionRef}
          aria-label="Personalized Nutrition Statistics"
          className="scroll-mt-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <div className="border-t border-outline-variant/10 pt-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface flex items-center gap-3">
                  <span>🎯</span> Personalized Nutrition Blueprint
                </h2>
                <p className="text-on-surface/60 text-sm font-medium mt-1">
                  Daily targets scientifically calibrated from your biometric profile and fitness goal.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/meals')}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-container text-white text-xs font-black uppercase tracking-widest px-6 py-3.5 rounded-full transition-all shadow-md self-start md:self-auto hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Generate Meal Plan</span>
                <span>→</span>
              </button>
            </div>

            {/* 4 Prominent Nutrition Target Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {/* Calories Target Card */}
              <div 
                id="target-calories-card"
                className="card-island p-6 border-l-4 border-l-primary flex flex-col justify-between"
              >
                <div>
                  <span className="label-tier block mb-1 text-primary">Daily Energy Target</span>
                  <h3 className="text-xs font-bold text-on-surface/50 uppercase tracking-wider">Calories</h3>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-on-surface">
                      {calValue.toLocaleString()}
                    </span>
                    <span className="text-sm font-black text-on-surface/50 uppercase">kcal</span>
                  </div>
                  <p className="text-[11px] font-semibold text-on-surface/40 mt-1">Daily energy budget</p>
                </div>
              </div>

              {/* Protein Target Card */}
              <div 
                id="target-protein-card"
                className="card-island p-6 border-l-4 border-l-tertiary flex flex-col justify-between"
              >
                <div>
                  <span className="label-tier block mb-1 text-tertiary">Daily Amino Target</span>
                  <h3 className="text-xs font-bold text-on-surface/50 uppercase tracking-wider">Protein</h3>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-on-surface">
                      {protValue}
                    </span>
                    <span className="text-sm font-black text-on-surface/50 uppercase">g</span>
                  </div>
                  <p className="text-[11px] font-semibold text-on-surface/40 mt-1">Muscle repair & preservation</p>
                </div>
              </div>

              {/* Carbohydrates Target Card */}
              <div 
                id="target-carbs-card"
                className="card-island p-6 border-l-4 border-l-primary/60 flex flex-col justify-between"
              >
                <div>
                  <span className="label-tier block mb-1 text-primary/70">Glycemic Fuel</span>
                  <h3 className="text-xs font-bold text-on-surface/50 uppercase tracking-wider">Carbohydrates</h3>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-on-surface">
                      {carbsValue}
                    </span>
                    <span className="text-sm font-black text-on-surface/50 uppercase">g</span>
                  </div>
                  <p className="text-[11px] font-semibold text-on-surface/40 mt-1">Primary training fuel</p>
                </div>
              </div>

              {/* Fat Target Card */}
              <div 
                id="target-fat-card"
                className="card-island p-6 border-l-4 border-l-slate-400 flex flex-col justify-between"
              >
                <div>
                  <span className="label-tier block mb-1 text-slate-500">Essential Lipids</span>
                  <h3 className="text-xs font-bold text-on-surface/50 uppercase tracking-wider">Fat</h3>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-on-surface">
                      {fatValue}
                    </span>
                    <span className="text-sm font-black text-on-surface/50 uppercase">g</span>
                  </div>
                  <p className="text-[11px] font-semibold text-on-surface/40 mt-1">Hormonal & cellular balance</p>
                </div>
              </div>
            </div>

            {/* Detailed Macro Blueprint Pie Chart and Target Progress Bars */}
            <GoalsDashboard />
          </div>
        </section>
      )}
    </div>
  );
};

export default Calculator;
