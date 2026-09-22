import React, { useState } from 'react';
import { useFoodData } from '../../hooks/useFoodData';

const FoodSearch = () => {
  const { foodData, isLoading } = useFoodData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = foodData.filter(food => 
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-outline-variant/10 pb-10">
        <div>
          <span className="label-tier mb-2 block text-primary">Resource Library</span>
          <h2 className="display-lg tracking-tighter">Food Database</h2>
        </div>
        <div className="w-full md:w-96 relative">
          <input 
            type="text" 
            placeholder="Search 100+ items..." 
            className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20">🔍</span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="label-tier">Synchronizing Data...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-12 px-6 py-2 label-tier opacity-40 hidden md:grid">
            <div className="col-span-6">Food Item</div>
            <div className="col-span-2 text-right">Calories</div>
            <div className="col-span-2 text-right">Protein</div>
            <div className="col-span-2 text-right">Fat</div>
          </div>
          
          <div className="divide-y divide-outline-variant/5">
            {filteredData.slice(0, 50).map((food) => (
              <div 
                key={food.name} 
                className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 py-6 px-6 hover:bg-surface-container-low rounded-2xl transition-all group"
              >
                <div className="col-span-1 md:col-span-6 flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${food.isHighProtein ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                    {food.isSide ? '🥗' : '🍱'}
                  </div>
                  <div>
                    <p className="font-black text-on-surface group-hover:text-primary transition-colors">{food.name}</p>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">
                      {food.isSide ? 'Healthy Side' : 'Main Dish'}
                    </span>
                  </div>
                </div>
                
                <div className="col-span-1 md:col-span-2 text-right">
                  <span className="text-xl font-black text-on-surface">{Math.round(food.calories)}</span>
                  <span className="text-[10px] ml-1 font-bold opacity-30 uppercase">kcal</span>
                </div>
                
                <div className="col-span-1 md:col-span-2 text-right">
                  <span className={`text-xl font-black ${food.isHighProtein ? 'text-primary' : 'text-on-surface'}`}>
                    {Math.round(food.protein)}g
                  </span>
                  <span className="text-[10px] ml-1 font-bold opacity-30 uppercase">P</span>
                </div>

                <div className="col-span-1 md:col-span-2 text-right opacity-40">
                  <span className="text-lg font-bold">{Math.round(food.fat)}g</span>
                  <span className="text-[10px] ml-1 font-bold uppercase text-right">F</span>
                </div>
              </div>
            ))}
            
            {filteredData.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-on-surface/40 font-medium">No results matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodSearch;
