import React from 'react';
import MealPlanner from '../components/MealPlanner/MealPlanner';

const Meals = () => {
  return (
    <div className="py-12 space-y-12 animate-in fade-in duration-700">
      <section>
        <MealPlanner />
      </section>
    </div>
  );
};

export default Meals;
