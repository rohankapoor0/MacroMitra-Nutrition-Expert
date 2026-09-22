import React from 'react';

const MealCard = ({ item, mealType, time }) => {
  const getPlaceholderImage = (name) => {
    const term = name.split(' ')[0].toLowerCase();
    return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop&q=80&sig=${term}`;
  };

  const isMain = item.role === 'Main';
  const roleLabel = item.role || 'Item';

  return (
    <div className={`bg-surface-container-lowest rounded-3xl p-6 flex flex-col md:flex-row gap-6 shadow-ambient transition-all duration-300 border ${isMain ? 'border-primary/20 bg-primary/5' : 'border-outline-variant/10'}`}>
      <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden shadow-card flex-shrink-0">
        <img 
          src={getPlaceholderImage(item.name)} 
          alt={item.name} 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-1 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`label-tier ${isMain ? 'text-primary' : 'text-on-surface/40'}`}>
                {roleLabel}
              </span>
              {item.isHighProtein && (
                <span className="bg-primary/10 text-primary text-[8px] font-black uppercase px-2 py-0.5 rounded-full">High Protein</span>
              )}
            </div>
            <h4 className={`text-lg font-black tracking-tight ${isMain ? 'text-on-surface' : 'text-on-surface/80'}`}>
              {item.name}
            </h4>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-on-surface">{Math.round(item.calories)}</span>
            <span className="label-tier block opacity-50">kcal</span>
          </div>
        </div>

        <div className="flex gap-4 pt-2 border-t border-outline-variant/5">
          <div className="flex items-baseline space-x-1">
            <span className="text-sm font-black text-on-surface">{Math.round(item.protein)}g</span>
            <span className="text-[10px] font-bold text-on-surface/40 uppercase">P</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-sm font-black text-on-surface">{Math.round(item.carbs)}g</span>
            <span className="text-[10px] font-bold text-on-surface/40 uppercase">C</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-sm font-black text-on-surface">{Math.round(item.fat)}g</span>
            <span className="text-[10px] font-bold text-on-surface/40 uppercase">F</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealCard;
