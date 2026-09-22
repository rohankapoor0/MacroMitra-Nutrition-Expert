import React from 'react';
import FoodSearch from '../components/MealPlanner/FoodSearch';

const Database = () => {
  return (
    <div className="py-12 space-y-12 animate-in fade-in duration-700">
      <section>
        <FoodSearch />
      </section>
    </div>
  );
};

export default Database;
