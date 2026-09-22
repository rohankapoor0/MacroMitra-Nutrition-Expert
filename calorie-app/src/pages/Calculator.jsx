import React from 'react';
import BMRCalculator from '../components/BMRCalculator/BMRCalculator';
import ResultCard from '../components/BMRCalculator/ResultCard';
import GoalsDashboard from '../components/NutritionGoals/GoalsDashboard';
import { useUser } from '../context/UserContext';

const Calculator = () => {
  const { hasCalculated } = useUser();

  return (
    <div className="py-12 space-y-12">
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
              <p className="text-text-muted">Enter your details to see your calorie and protein targets here.</p>
            </div>
          )}
        </div>
      </div>

      {hasCalculated && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <span>🎯</span> Your Nutrition Dashboard
          </h2>
          <GoalsDashboard />
        </section>
      )}
    </div>
  );
};

export default Calculator;
