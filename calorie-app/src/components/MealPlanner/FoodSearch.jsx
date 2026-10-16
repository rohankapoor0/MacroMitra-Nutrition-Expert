import React, { useState, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import { calculateItemNutrition } from '../../utils/nutritionCalculator';

const CATEGORIES = [
  'All',
  'High Protein',
  'Main Dishes',
  'Dals & Legumes',
  'Breads',
  'Rice Dishes',
  'Fruits & Vegetables',
  'Dairy & Eggs',
  'Breakfast',
  'Non-Veg',
  'Snacks',
  'Beverages',
  'Desserts'
];

export const NUTRIENT_FILTERS = [
  { id: 'high_protein', label: '⚡ High Protein (>10g)' },
  { id: 'low_calorie', label: '🔥 Low Calorie (≤100 kcal)' },
  { id: 'low_carb', label: '🌾 Low Carb (≤15g)' }
];

export const getNutrientPer100g = (food, metric) => {
  if (!food) return null;
  const metric100 = food[`${metric}_per_100g`];
  if (metric100 !== null && metric100 !== undefined && !isNaN(metric100)) {
    return Number(metric100);
  }
  if (food.serving_basis === '100g') {
    const val = food[metric];
    if (val !== null && val !== undefined && !isNaN(val)) {
      return Number(val);
    }
  }
  if (food.serving_basis === 'serving' && food.serving_size_g && food.serving_size_g > 0) {
    const val = food[metric];
    if (val !== null && val !== undefined && !isNaN(val)) {
      return (Number(val) / food.serving_size_g) * 100.0;
    }
  }
  return null;
};

export const passesNutrientFilter = (food, filterId) => {
  if (filterId === 'high_protein') {
    const p = getNutrientPer100g(food, 'protein');
    // High Protein: more than 10 g protein per 100 g.
    return p !== null && p > 10;
  }
  if (filterId === 'low_calorie') {
    const c = getNutrientPer100g(food, 'calories');
    // Low Calorie: 100 kcal or less per 100 g.
    return c !== null && c <= 100;
  }
  if (filterId === 'low_carb') {
    const carbs = getNutrientPer100g(food, 'carbs');
    // Low Carb: 15 g or less carbohydrates per 100 g.
    return carbs !== null && carbs <= 15;
  }
  return true;
};

export const matchesNutrients = (food, selectedNutrientIds) => {
  if (!selectedNutrientIds || selectedNutrientIds.length === 0) return true;
  return selectedNutrientIds.every(id => passesNutrientFilter(food, id));
};

const matchesCategory = (food, targetCategory) => {
  if (targetCategory === 'All') return true;
  
  if (targetCategory === 'High Protein') {
    const p = getNutrientPer100g(food, 'protein');
    return Boolean(food.isHighProtein || (p !== null && p > 10));
  }

  const foodCat = (food.category || '').toLowerCase().trim();
  const origCat = (food.original_category || '').toLowerCase().trim();
  const target = targetCategory.toLowerCase().trim();

  if (foodCat === target || origCat === target) return true;

  const categoryAliases = {
    'main dishes': ['main dish', 'main dishes', 'veg', 'vegetable dishes', 'pasta mixed dishes'],
    'dals & legumes': ['dals & legumes', 'lentils', 'legumes and legume products', 'dal', 'sambar', 'rasam'],
    'breads': ['breads', 'bread', 'rolls and buns', 'yeast breads', 'flatbread', 'roti', 'naan'],
    'rice dishes': ['rice dishes', 'rice mixed dishes', 'rice', 'biryani', 'pulao'],
    'breakfast': ['breakfast', 'cereal', 'porridge', 'idli', 'dosa', 'upma', 'poha'],
    'non-veg': ['non-veg', 'meat mixed dishes', 'pork products', 'seafood mixed dishes', 'poultry', 'chicken', 'fish', 'meat'],
    'snacks': ['snacks', 'snack', 'fast foods', 'potato chips', 'tortilla, corn, other chips', 'fried vegetables', 'samosa', 'pakora'],
    'beverages': ['beverages', 'beverage', 'drinks', 'fruit drinks', 'other fruit juice', 'vegetable juice', 'liquor and cocktails', 'tea', 'chai', 'coffee', 'lassi'],
    'desserts': ['desserts', 'dessert', 'sweets', 'ice cream and frozen dairy desserts', 'pudding', 'jams, syrups, toppings', 'halwa', 'kheer'],
    'fruits & vegetables': ['fruits & vegetables', 'fruits and fruit juices', 'vegetables and vegetable products', 'apples', 'grapes', 'pears', 'strawberries', 'dried fruits', 'mango and papaya', 'onions', 'tomatoes', 'white potatoes, baked or boiled'],
    'dairy & eggs': ['dairy & eggs', 'dairy and egg products', 'flavored milk, reduced fat', 'flavored milk, whole', 'yogurt', 'kefir', 'cheese', 'paneer']
  };

  const aliases = categoryAliases[target] || [target];
  return aliases.some(a => foodCat.includes(a) || origCat.includes(a));
};

const FoodSearch = () => {
  const { 
    foodData, 
    isDataLoading, 
    logFoodItem, 
    recentFoods, 
    addCustomFood,
    loggedTotals 
  } = useUser();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedNutrients, setSelectedNutrients] = useState([]);
  const [selectedSource, setSelectedSource] = useState('All');
  const [proteinSort, setProteinSort] = useState('none'); // 'none' | 'desc' | 'asc'
  const [visibleCount, setVisibleCount] = useState(60);

  // Modal / Drawer state for logging
  const [selectedFoodForLogging, setSelectedFoodForLogging] = useState(null);
  const [selectedMealSlot, setSelectedMealSlot] = useState('Lunch');
  const [portionAmount, setPortionAmount] = useState(100);
  const [logSuccessToast, setLogSuccessToast] = useState(null);

  // Custom food modal state
  const [showCustomFoodModal, setShowCustomFoodModal] = useState(false);
  const [customFoodForm, setCustomFoodForm] = useState({
    name: '',
    category: 'Main Dishes',
    serving_basis: '100g',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: ''
  });

  // Check if any filter is active
  const isAnyFilterActive = useMemo(() => {
    return (
      searchTerm.trim() !== '' ||
      selectedCategory !== 'All' ||
      selectedNutrients.length > 0 ||
      selectedSource !== 'All' ||
      proteinSort !== 'none'
    );
  }, [searchTerm, selectedCategory, selectedNutrients, selectedSource, proteinSort]);

  // Reset all filters and sorting
  const handleClearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedNutrients([]);
    setSelectedSource('All');
    setProteinSort('none');
    setVisibleCount(60);
  };

  // Toggle individual nutrient filter chip
  const handleToggleNutrient = (nutrientId) => {
    setSelectedNutrients(prev => 
      prev.includes(nutrientId)
        ? prev.filter(id => id !== nutrientId)
        : [...prev, nutrientId]
    );
    setVisibleCount(60);
  };

  // Toggle Protein Sorting: none -> desc -> asc -> none
  const handleToggleProteinSort = () => {
    setProteinSort(current => {
      if (current === 'none') return 'desc';
      if (current === 'desc') return 'asc';
      return 'none';
    });
    setVisibleCount(60);
  };

  // Filtered dataset combining Category, Nutrient, Source, and Search query
  const filteredData = useMemo(() => {
    if (!foodData) return [];
    const term = searchTerm.trim().toLowerCase();

    return foodData.filter(food => {
      // 1. Category Filter
      if (!matchesCategory(food, selectedCategory)) {
        return false;
      }

      // 2. Nutrient Filter (AND logic over selected nutrient filters)
      if (!matchesNutrients(food, selectedNutrients)) {
        return false;
      }

      // 3. Source Filter
      if (selectedSource !== 'All' && food.source !== selectedSource) {
        return false;
      }

      // 4. Search Term (matches Name, Aliases, or Category)
      if (!term) return true;

      const nameMatch = food.name.toLowerCase().includes(term);
      if (nameMatch) return true;

      if (food.aliases && Array.isArray(food.aliases)) {
        const aliasMatch = food.aliases.some(a => a.toLowerCase().includes(term));
        if (aliasMatch) return true;
      }

      const catMatch = food.category && food.category.toLowerCase().includes(term);
      if (catMatch) return true;

      const origCatMatch = food.original_category && food.original_category.toLowerCase().includes(term);
      if (origCatMatch) return true;

      return false;
    });
  }, [foodData, searchTerm, selectedCategory, selectedNutrients, selectedSource]);

  // Sorted dataset using consistent nutritional basis (grams of protein per 100g)
  const sortedData = useMemo(() => {
    if (proteinSort === 'none') return filteredData;

    return [...filteredData].sort((a, b) => {
      const protA = getNutrientPer100g(a, 'protein');
      const protB = getNutrientPer100g(b, 'protein');

      const isNullA = protA === null || protA === undefined || isNaN(protA);
      const isNullB = protB === null || protB === undefined || isNaN(protB);

      // Unknown protein values are kept separate from known zero protein and placed at the end
      if (isNullA && isNullB) return 0;
      if (isNullA) return 1;
      if (isNullB) return -1;

      if (proteinSort === 'desc') {
        return protB - protA;
      } else {
        return protA - protB;
      }
    });
  }, [filteredData, proteinSort]);

  const handleOpenLoggingModal = (food) => {
    setSelectedFoodForLogging(food);
    const defaultQty = food.serving_basis === '100g' ? 100 : 1;
    setPortionAmount(defaultQty);
  };

  const handleConfirmLog = () => {
    if (!selectedFoodForLogging) return;

    const logged = logFoodItem({
      mealType: selectedMealSlot,
      food: selectedFoodForLogging,
      quantity: portionAmount,
      unit: selectedFoodForLogging.serving_basis === '100g' ? 'g' : (selectedFoodForLogging.serving_unit || 'serving')
    });

    setLogSuccessToast(`Logged ${logged.name} (${logged.loggedQuantity}${logged.loggedUnit}) to ${selectedMealSlot}!`);
    setTimeout(() => setLogSuccessToast(null), 3500);
    setSelectedFoodForLogging(null);
  };

  const handleCreateCustomFood = (e) => {
    e.preventDefault();
    if (!customFoodForm.name || !customFoodForm.calories) return;

    const created = addCustomFood(customFoodForm);
    setShowCustomFoodModal(false);
    setCustomFoodForm({
      name: '',
      category: 'Main Dishes',
      serving_basis: '100g',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      fiber: ''
    });
    setLogSuccessToast(`Added custom food "${created.name}" to your catalogue!`);
    setTimeout(() => setLogSuccessToast(null), 3500);
  };

  // Preview calculations for the modal using single source of truth
  const modalCalculations = useMemo(() => {
    if (!selectedFoodForLogging) return null;
    const qty = parseFloat(portionAmount) || 0;
    const isPer100g = selectedFoodForLogging.serving_basis === '100g';
    const unit = isPer100g ? 'g' : (selectedFoodForLogging.serving_unit || 'serving');
    const nut = calculateItemNutrition(selectedFoodForLogging, qty, unit);

    return {
      cals: nut.calories,
      p: nut.protein,
      c: nut.carbs,
      f: nut.fat,
      fiber: nut.fiber !== null && nut.fiber !== undefined ? nut.fiber : null
    };
  }, [selectedFoodForLogging, portionAmount]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      {/* Toast Notification */}
      {logSuccessToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-primary text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-bottom duration-300">
          <span className="text-xl">✅</span>
          <span className="font-bold text-sm tracking-tight">{logSuccessToast}</span>
        </div>
      )}

      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-outline-variant/10 pb-8">
        <div>
          <span className="label-tier mb-2 block text-primary font-bold">1,350+ Authenticated Foods & Indian Dishes</span>
          <h2 className="display-lg tracking-tighter">Food Database & Logger</h2>
          <p className="text-on-surface/50 text-sm mt-1">
            Search comprehensive nutritional profiles powered by MacroMitra Core, Anuvaad INDB, and Everyday Foods.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="w-full md:w-96 relative">
            <input 
              type="text" 
              placeholder="Search dishes, Hindi names, chai, biryani, apple..." 
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-2xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium outline-none"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setVisibleCount(60);
              }}
            />
            {searchTerm ? (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-xs opacity-40 hover:opacity-100"
              >
                ✕
              </button>
            ) : (
              <span className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20">🔍</span>
            )}
          </div>

          <button
            onClick={() => setShowCustomFoodModal(true)}
            className="w-full sm:w-auto px-5 py-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 rounded-2xl text-xs font-black uppercase tracking-wider text-on-surface transition-all flex items-center justify-center space-x-2"
          >
            <span>➕</span>
            <span>Custom Food</span>
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Category Filter</span>
          {isAnyFilterActive && (
            <button
              onClick={handleClearAllFilters}
              className="text-xs font-black text-red-500 hover:text-red-600 transition-colors flex items-center space-x-1"
            >
              <span>✕ Reset All Filters</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setVisibleCount(60);
              }}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                  : 'bg-surface-container-low text-on-surface/60 hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Nutrient Filters & Sort by Protein Toolbar */}
      <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Nutrient Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto scrollbar-none">
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 mr-1 whitespace-nowrap">Nutrient:</span>
          {NUTRIENT_FILTERS.map(f => {
            const isActive = selectedNutrients.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => handleToggleNutrient(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-on-surface text-white shadow-sm ring-2 ring-primary/40'
                    : 'bg-surface-container-low text-on-surface/60 hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span>{f.label}</span>
                {isActive && <span className="text-[10px] opacity-70">✕</span>}
              </button>
            );
          })}
          {selectedNutrients.length > 0 && (
            <button
              onClick={() => setSelectedNutrients([])}
              className="text-xs font-bold text-red-500 hover:text-red-600 px-2 py-1 transition-colors whitespace-nowrap"
              title="Clear all nutrient filters"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Action Controls: Sort by Protein & Source Filter */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          {/* Functional Sort by Protein Button */}
          <button
            onClick={handleToggleProteinSort}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 ${
              proteinSort === 'desc'
                ? 'bg-primary text-white shadow-md shadow-primary/20 ring-2 ring-primary/30'
                : proteinSort === 'asc'
                ? 'bg-primary text-white shadow-md shadow-primary/20 ring-2 ring-primary/30'
                : 'bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/20'
            }`}
            title="Sort foods by protein density (g per 100g)"
          >
            <span>🥩</span>
            <span>
              {proteinSort === 'desc' 
                ? 'Protein: High to Low ⬇️' 
                : proteinSort === 'asc' 
                ? 'Protein: Low to High ⬆️' 
                : 'Sort by Protein'}
            </span>
          </button>

          {/* Source Filter Dropdown */}
          <div className="flex items-center space-x-1 bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2">
            <span className="text-xs text-on-surface/40 font-bold">Source:</span>
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setVisibleCount(60);
              }}
              className="bg-transparent border-none text-xs font-bold text-on-surface outline-none cursor-pointer"
            >
              <option value="All">All Sources ({foodData.length})</option>
              <option value="macro_mitra_core">MacroMitra Core (Portion-Based)</option>
              <option value="existing_health_100g">Curated Health 100g</option>
              <option value="kaggle_indb_100g">Anuvaad INDB Dataset (100g)</option>
              <option value="kaggle_everyday_150">Everyday Foods 150 (100g)</option>
              <option value="user_custom">Custom Foods</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header / Summary */}
      <div className="flex flex-wrap items-center justify-between text-xs text-on-surface/50 px-2">
        <div className="flex items-center space-x-3">
          <span>Found <strong>{sortedData.length}</strong> matching foods</span>
          {proteinSort !== 'none' && (
            <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
              Sorted by Protein ({proteinSort === 'desc' ? 'Highest First' : 'Lowest First'})
            </span>
          )}
          {selectedCategory !== 'All' && (
            <span className="bg-surface-container-low text-on-surface/70 px-2.5 py-0.5 rounded-full font-bold">
              Category: {selectedCategory}
            </span>
          )}
          {selectedNutrients.length > 0 && (
            <span className="bg-surface-container-low text-on-surface/70 px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1.5">
              <span>Nutrients ({selectedNutrients.length}): {selectedNutrients.map(id => NUTRIENT_FILTERS.find(f => f.id === id)?.label.replace(/[⚡🔥🌾]\s*/, '')).join(' + ')}</span>
              <button 
                onClick={() => setSelectedNutrients([])} 
                className="hover:text-red-500 font-bold ml-1 text-xs"
                title="Clear nutrient filters"
              >
                ✕
              </button>
            </span>
          )}
          {selectedSource !== 'All' && (
            <span className="bg-surface-container-low text-on-surface/70 px-2.5 py-0.5 rounded-full font-bold">
              Source: {selectedSource}
            </span>
          )}
        </div>

        {loggedTotals.calories > 0 && (
          <div className="flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
            <span>Today Logged: {loggedTotals.calories} kcal ({loggedTotals.protein}g P)</span>
          </div>
        )}
      </div>

      {/* Recent Foods Quick Tray */}
      {recentFoods && recentFoods.length > 0 && !isAnyFilterActive && (
        <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-xs font-black uppercase tracking-widest text-primary">⚡ Recently Logged</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {recentFoods.slice(0, 8).map(food => (
              <button
                key={food.id || food.name}
                onClick={() => handleOpenLoggingModal(food)}
                className="flex items-center space-x-2 bg-surface-container-low hover:bg-surface-container px-3 py-2 rounded-xl text-left transition-all border border-outline-variant/10 group flex-shrink-0"
              >
                <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                  {food.name.length > 22 ? food.name.slice(0, 22) + '...' : food.name}
                </span>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {Math.round(food.calories)} kcal
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isDataLoading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="label-tier">Synchronizing 1,350+ Nutrition Records...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-12 px-6 py-2 label-tier opacity-40 hidden md:grid">
            <div className="col-span-5">Food Item & Aliases</div>
            <div className="col-span-2">Basis & Category</div>
            <div className="col-span-1 text-right">Calories</div>
            <div className="col-span-1 text-right">
              <span className={proteinSort !== 'none' ? 'text-primary font-black' : ''}>
                Protein {proteinSort === 'desc' ? '↓' : proteinSort === 'asc' ? '↑' : ''}
              </span>
            </div>
            <div className="col-span-1 text-right">Carbs</div>
            <div className="col-span-1 text-right">Fat</div>
            <div className="col-span-1 text-center">Action</div>
          </div>
          
          {/* Table Rows */}
          <div className="divide-y divide-outline-variant/5">
            {sortedData.slice(0, visibleCount).map((food) => {
              const isPer100g = food.serving_basis === '100g';
              const isKaggleA = food.source === 'kaggle_indb_100g';
              const isKaggleB = food.source === 'kaggle_everyday_150';
              const isCore = food.source === 'macro_mitra_core';

              return (
                <div 
                  key={food.id || food.name} 
                  className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 py-5 px-6 hover:bg-surface-container-low rounded-2xl transition-all group"
                >
                  {/* Name and Aliases */}
                  <div className="col-span-1 md:col-span-5 flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5 ${
                      food.isHighProtein ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {food.category === 'Beverages' ? '☕' : 
                       food.category === 'Desserts' ? '🍮' : 
                       food.category === 'Breads' ? '🫓' : 
                       food.category === 'Non-Veg' ? '🍗' : 
                       food.category === 'Rice Dishes' ? '🍚' : 
                       food.category === 'Fruits & Vegetables' ? '🍎' :
                       food.category === 'Dairy & Eggs' ? '🥛' :
                       food.category === 'Dals & Legumes' ? '🍲' : '🍱'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-on-surface group-hover:text-primary transition-colors text-sm">
                          {food.name}
                        </p>
                        {food.isHighProtein && (
                          <span className="bg-primary/10 text-primary text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                            High Protein
                          </span>
                        )}
                      </div>

                      {/* Alternate Spellings / Aliases */}
                      {food.aliases && food.aliases.length > 1 && (
                        <p className="text-[11px] text-on-surface/40 leading-snug">
                          <span className="font-semibold text-on-surface/50">AKA: </span>
                          {food.aliases
                            .filter(a => a.toLowerCase() !== food.name.toLowerCase())
                            .slice(0, 3)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Basis & Category */}
                  <div className="col-span-1 md:col-span-2 space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        isPer100g ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {isPer100g ? 'Per 100g' : (food.serving_unit || 'Per Serving')}
                      </span>
                      <span className="text-[9px] opacity-40 uppercase font-bold">
                        {isCore ? 'Core' : isKaggleA ? 'INDB' : isKaggleB ? 'Everyday' : 'Health'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface/60 font-medium">{food.category || 'Dishes'}</p>
                  </div>

                  {/* Calories */}
                  <div className="col-span-1 md:col-span-1 text-right">
                    <span className="text-base font-black text-on-surface">{Math.round(food.calories)}</span>
                    <span className="text-[9px] ml-0.5 font-bold opacity-30 uppercase">kcal</span>
                  </div>
                  
                  {/* Protein */}
                  <div className="col-span-1 md:col-span-1 text-right">
                    <span className={`text-base font-black ${
                      food.isHighProtein || proteinSort !== 'none' ? 'text-primary' : 'text-on-surface'
                    }`}>
                      {Math.round(food.protein * 10) / 10}g
                    </span>
                    <span className="text-[9px] ml-0.5 font-bold opacity-30 uppercase">P</span>
                    {food.serving_basis === 'serving' && food.protein_per_100g && (
                      <span className="text-[9px] block text-on-surface/40 font-semibold" title="Calculated protein per 100g">
                        ~{food.protein_per_100g}g/100g
                      </span>
                    )}
                  </div>

                  {/* Carbs */}
                  <div className="col-span-1 md:col-span-1 text-right opacity-70">
                    <span className="text-sm font-bold">{Math.round((food.carbs || 0) * 10) / 10}g</span>
                    <span className="text-[9px] ml-0.5 font-bold uppercase">C</span>
                  </div>

                  {/* Fat */}
                  <div className="col-span-1 md:col-span-1 text-right opacity-70">
                    <span className="text-sm font-bold">{Math.round((food.fat || 0) * 10) / 10}g</span>
                    <span className="text-[9px] ml-0.5 font-bold uppercase">F</span>
                  </div>

                  {/* Action Button */}
                  <div className="col-span-1 md:col-span-1 flex justify-center">
                    <button
                      onClick={() => handleOpenLoggingModal(food)}
                      className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-tight transition-all active:scale-95 shadow-sm"
                      title="Log this food to your daily meals"
                    >
                      + Log
                    </button>
                  </div>
                </div>
              );
            })}
            
            {sortedData.length === 0 && (
              <div className="py-20 text-center space-y-4">
                <span className="text-4xl block">🔍</span>
                <p className="text-on-surface/70 font-bold text-base">No foods found matching your criteria</p>
                <p className="text-xs text-on-surface/50 max-w-md mx-auto">
                  Active filters: Search="{searchTerm || 'none'}", Category="{selectedCategory}", Nutrients="{selectedNutrients.length > 0 ? selectedNutrients.join('+') : 'none'}", Source="{selectedSource}".
                </p>
                <button
                  onClick={handleClearAllFilters}
                  className="bg-primary text-white font-black uppercase tracking-wider text-xs px-6 py-3 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>

          {/* Load More Button */}
          {sortedData.length > visibleCount && (
            <div className="py-6 text-center">
              <button
                onClick={() => setVisibleCount(prev => prev + 60)}
                className="bg-surface-container-low hover:bg-surface-container text-on-surface px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all"
              >
                Load More Foods ({sortedData.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Log Food Modal */}
      {selectedFoodForLogging && modalCalculations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div>
                <span className="label-tier text-primary">Log to Meal</span>
                <h3 className="text-xl font-black text-on-surface mt-1">{selectedFoodForLogging.name}</h3>
                <span className="text-xs text-on-surface/50">
                  {selectedFoodForLogging.serving_basis === '100g' ? 'Standard 100g Reference' : `Per ${selectedFoodForLogging.serving_unit || 'Serving'}`}
                </span>
              </div>
              <button 
                onClick={() => setSelectedFoodForLogging(null)}
                className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-sm font-bold opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>

            {/* Meal Slot Picker */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-on-surface/60">Choose Meal Slot</label>
              <div className="grid grid-cols-4 gap-2">
                {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedMealSlot(slot)}
                    className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      selectedMealSlot === slot
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-surface-container-low text-on-surface/60 hover:text-on-surface'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-wider text-on-surface/60">
                  Quantity ({selectedFoodForLogging.serving_basis === '100g' ? 'Grams' : 'Servings'})
                </label>
                <span className="text-xs font-bold text-primary">
                  {portionAmount} {selectedFoodForLogging.serving_basis === '100g' ? 'g' : (selectedFoodForLogging.serving_unit || 'serving')}
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2">
                {selectedFoodForLogging.serving_basis === '100g' ? (
                  [50, 100, 150, 200, 250].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPortionAmount(val)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        portionAmount === val
                          ? 'bg-on-surface text-white'
                          : 'bg-surface-container-low text-on-surface/70 hover:bg-surface-container'
                      }`}
                    >
                      {val}g
                    </button>
                  ))
                ) : (
                  [0.5, 1, 1.5, 2, 3].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPortionAmount(val)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        portionAmount === val
                          ? 'bg-on-surface text-white'
                          : 'bg-surface-container-low text-on-surface/70 hover:bg-surface-container'
                      }`}
                    >
                      {val}x
                    </button>
                  ))
                )}
              </div>

              {/* Precise Input */}
              <input
                type="number"
                min="1"
                step={selectedFoodForLogging.serving_basis === '100g' ? '5' : '0.25'}
                value={portionAmount}
                onChange={(e) => setPortionAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Calculated Nutrition Preview Card */}
            <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 block mb-3">
                Calculated Nutritional Yield
              </span>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <span className="text-xl font-black text-on-surface">{modalCalculations.cals}</span>
                  <span className="text-[10px] block font-bold text-on-surface/40 uppercase">kcal</span>
                </div>
                <div>
                  <span className="text-xl font-black text-primary">{modalCalculations.p}g</span>
                  <span className="text-[10px] block font-bold text-primary/60 uppercase">Protein</span>
                </div>
                <div>
                  <span className="text-xl font-black text-on-surface">{modalCalculations.c}g</span>
                  <span className="text-[10px] block font-bold text-on-surface/40 uppercase">Carbs</span>
                </div>
                <div>
                  <span className="text-xl font-black text-on-surface">{modalCalculations.f}g</span>
                  <span className="text-[10px] block font-bold text-on-surface/40 uppercase">Fat</span>
                </div>
              </div>
            </div>

            {/* Confirm Actions */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setSelectedFoodForLogging(null)}
                className="flex-1 py-4 bg-surface-container-low hover:bg-surface-container text-on-surface font-black uppercase tracking-widest text-xs rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLog}
                className="flex-1 py-4 bg-primary hover:bg-primary-container text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                Log Food →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Food Modal */}
      {showCustomFoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form 
            onSubmit={handleCreateCustomFood}
            className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="label-tier text-primary">Custom Nutrition</span>
                <h3 className="text-xl font-black text-on-surface mt-1">Add Your Food Item</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowCustomFoodModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-sm font-bold opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-on-surface/60 block mb-1">
                  Food Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masala Oats, Mom's Paneer Bhurji"
                  value={customFoodForm.name}
                  onChange={(e) => setCustomFoodForm({ ...customFoodForm, name: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-bold text-on-surface outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-on-surface/60 block mb-1">
                    Category
                  </label>
                  <select
                    value={customFoodForm.category}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, category: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-bold text-on-surface outline-none"
                  >
                    {CATEGORIES.filter(c => c !== 'All' && c !== 'High Protein').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-on-surface/60 block mb-1">
                    Serving Basis
                  </label>
                  <select
                    value={customFoodForm.serving_basis}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, serving_basis: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-bold text-on-surface outline-none"
                  >
                    <option value="100g">Per 100g</option>
                    <option value="serving">Per 1 Serving / Portion</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface/60 block mb-1">
                    Calories (kcal) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="200"
                    value={customFoodForm.calories}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, calories: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-bold text-on-surface outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface/60 block mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="10"
                    value={customFoodForm.protein}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, protein: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-bold text-on-surface outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface/60 block mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="25"
                    value={customFoodForm.carbs}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, carbs: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-bold text-on-surface outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface/60 block mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="5"
                    value={customFoodForm.fat}
                    onChange={(e) => setCustomFoodForm({ ...customFoodForm, fat: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-bold text-on-surface outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomFoodModal(false)}
                className="flex-1 py-4 bg-surface-container-low hover:bg-surface-container text-on-surface font-black uppercase tracking-widest text-xs rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-primary hover:bg-primary-container text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-primary/20"
              >
                Save Food
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FoodSearch;
