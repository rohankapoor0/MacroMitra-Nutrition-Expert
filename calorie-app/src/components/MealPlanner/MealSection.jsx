import React from 'react';
import MealCard from './MealCard';

const MealSection = ({ mealData }) => {
  const mealTimes = {
    "Breakfast": "08:30 AM",
    "Lunch": "01:00 PM",
    "Dinner": "07:30 PM",
    "Snacks": "Anytime"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-baseline space-x-2">
         <span className="label-tier text-on-surface/30">Menu for</span>
         <h3 className="text-xl font-black text-on-surface group-hover:text-primary transition-colors uppercase tracking-tighter">
           {mealData.meal}
         </h3>
      </div>
      
      <div className="space-y-6">
        {mealData.items.map((item, idx) => (
          <MealCard 
            key={`${mealData.meal}-${idx}`} 
            item={item} 
            mealType={mealData.meal}
            time={mealTimes[mealData.meal]}
          />
        ))}
        {mealData.items.length === 0 && (
          <div className="bg-surface-container-low p-10 rounded-3xl border border-dashed border-outline-variant text-center">
            <p className="text-sm font-black uppercase tracking-widest text-on-surface/20">No items available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealSection;
