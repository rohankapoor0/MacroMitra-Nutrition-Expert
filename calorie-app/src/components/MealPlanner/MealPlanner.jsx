import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import MealSection from './MealSection';
import MealPlanQuestionnaire from './MealPlanQuestionnaire';

const MealPlanner = () => {
  const navigate = useNavigate();
  const { 
    mealPlan, 
    mealPlanPreferences,
    generateMealPlanWithPreferences,
    isGeneratingPlan,
    regenerateMealPlan, 
    macroData, 
    profile,
    hasCalculated,
    loggedMeals,
    loggedTotals,
    removeLoggedItem,
    logEntireMealPlan,
    clearLoggedMeals
  } = useUser();

  const [activeTab, setActiveTab] = useState('planned'); // 'planned' | 'logged'
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);

  if (!hasCalculated) {
    return (
      <div className="card-island p-20 text-center">
        <span className="text-6xl mb-8 block" role="img" aria-label="thinking">🧬</span>
        <h3 className="display-lg mb-6">Blueprint Missing.</h3>
        <p className="text-on-surface/50 text-xl max-w-lg mx-auto mb-12 font-medium">
          Our physiological models require your biometric signatures to generate a bespoke nutritional canvas.
        </p>
        <button 
          onClick={() => navigate('/calculator')}
          className="inline-block bg-primary hover:bg-primary-container text-white font-black uppercase tracking-widest py-4 px-12 rounded-full transition-all shadow-xl shadow-green-900/10"
        >
          Initialize Profile →
        </button>
      </div>
    );
  }

  // Independently sum the nutritional values of all selected foods and portions across the day
  const plannedTotals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    (mealPlan || []).forEach(slot => {
      (slot.items || []).forEach(item => {
        calories += item.calories || 0;
        protein += item.protein || 0;
        carbs += item.carbs || 0;
        fat += item.fat || 0;
      });
    });

    return {
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10
    };
  }, [mealPlan]);

  const targetCals = macroData.adjustedCalories || macroData.calories || 2000;
  const targetProt = macroData.proteinG || macroData.protein || 120;
  const targetCarbs = macroData.carbsG || macroData.carbs || 225;
  const targetFat = macroData.fatG || macroData.fat || 67;

  // Active metrics to display in sidebar depending on active view
  const displayCals = activeTab === 'logged' ? loggedTotals.calories : plannedTotals.calories;
  const displayProt = activeTab === 'logged' ? loggedTotals.protein : plannedTotals.protein;
  const displayCarbs = activeTab === 'logged' ? loggedTotals.carbs : plannedTotals.carbs;
  const displayFat = activeTab === 'logged' ? loggedTotals.fat : plannedTotals.fat;

  // Differences from daily targets
  const diffCals = (activeTab === 'logged' ? loggedTotals.calories : plannedTotals.calories) - targetCals;
  const diffProt = Math.round(((activeTab === 'logged' ? loggedTotals.protein : plannedTotals.protein) - targetProt) * 10) / 10;
  const diffCarbs = Math.round(((activeTab === 'logged' ? loggedTotals.carbs : plannedTotals.carbs) - targetCarbs) * 10) / 10;
  const diffFat = Math.round(((activeTab === 'logged' ? loggedTotals.fat : plannedTotals.fat) - targetFat) * 10) / 10;

  const totalLoggedItemsCount = Object.values(loggedMeals || {}).reduce((acc, curr) => acc + (curr?.length || 0), 0);

  const showQuestionnaire = activeTab === 'planned' && (!mealPlanPreferences || isEditingPreferences || mealPlan.length === 0);

  const handlePreferencesSubmit = async (prefs) => {
    await generateMealPlanWithPreferences(prefs);
    setIsEditingPreferences(false);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
      <div className="xl:col-span-8 space-y-10">
        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-outline-variant/10 pb-8">
          <div>
            <span className="label-tier mb-2 block text-primary font-black">Indian Nutrition Engine</span>
            <h2 className="display-lg tracking-tighter">
              {activeTab === 'planned' ? "Smart Meal Blueprint" : "Today's Logged Meals"}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Switcher */}
            <div className="flex bg-surface-container-low p-1 rounded-full border border-outline-variant/10">
              <button
                onClick={() => setActiveTab('planned')}
                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'planned'
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-on-surface/60 hover:text-on-surface'
                }`}
              >
                Suggested Plan
              </button>
              <button
                onClick={() => setActiveTab('logged')}
                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 ${
                  activeTab === 'logged'
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-on-surface/60 hover:text-on-surface'
                }`}
              >
                <span>Logged Meals</span>
                {totalLoggedItemsCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'logged' ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'
                  }`}>
                    {totalLoggedItemsCount}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'planned' ? (
              <div className="flex items-center gap-2">
                {mealPlanPreferences && !showQuestionnaire && (
                  <button 
                    id="edit-preferences-btn"
                    onClick={() => setIsEditingPreferences(true)}
                    className="flex items-center space-x-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface px-4 py-2.5 rounded-full font-bold text-xs transition-all border border-outline-variant/10"
                    title="Change diet, shake, or sugar preferences"
                  >
                    <span>⚙️</span>
                    <span>Edit Preferences</span>
                  </button>
                )}

                <button 
                  id="regenerate-plan-btn"
                  onClick={regenerateMealPlan}
                  disabled={isGeneratingPlan || showQuestionnaire}
                  className={`flex items-center space-x-2 bg-on-surface hover:bg-slate-800 text-white px-5 py-2.5 rounded-full font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-sm ${
                    showQuestionnaire ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span>Regenerate</span>
                  <span>🔄</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => navigate('/database')}
                className="flex items-center space-x-2 bg-primary hover:bg-primary-container text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-md shadow-primary/20"
              >
                <span>+ Search Food</span>
                <span>🔍</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Planned Blueprint */}
        {activeTab === 'planned' && (
          <>
            {showQuestionnaire ? (
              <MealPlanQuestionnaire
                onSubmit={handlePreferencesSubmit}
                initialPreferences={mealPlanPreferences}
                profile={profile}
                onCancel={mealPlan.length > 0 ? () => setIsEditingPreferences(false) : null}
                isGenerating={isGeneratingPlan}
              />
            ) : (
              <div className="space-y-10 animate-in fade-in duration-300">
                {/* Action bar for Planned View */}
                <div className="bg-surface-container-low p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-outline-variant/10">
                  <div className="space-y-1">
                    <p className="text-xs text-on-surface/80 font-bold">
                      💡 Circadian rhythm allocation: 25% Breakfast, 35% Lunch, 30% Dinner, 10% Snacks.
                    </p>
                    <p className="text-[11px] text-on-surface/50 font-medium">
                      Preferences applied: <span className="capitalize font-bold text-primary">{mealPlanPreferences?.dietPreference}</span>{mealPlanPreferences?.dietPreference === 'non-vegetarian' && mealPlanPreferences?.meatPreferences?.length > 0 ? ` (${mealPlanPreferences.meatPreferences.join(', ')})` : ''} • <span className="font-bold">{mealPlanPreferences?.shakePreference === 'yes' ? 'Shakes allowed (≤ 2)' : 'No shakes'}</span> • <span className="font-bold">{mealPlanPreferences?.beveragePreference === 'no' ? 'No caloric drinks' : 'Drinks allowed'}</span> • <span className="font-bold">{mealPlanPreferences?.sugarPreference === 'sugar-free' ? 'Sugar-free' : 'Sugar allowed'}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      logEntireMealPlan();
                      setActiveTab('logged');
                    }}
                    className="px-5 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap"
                  >
                    📥 Log Entire Plan to Today
                  </button>
                </div>

                <div className="space-y-16">
                  {mealPlan.map((section) => (
                    <MealSection key={section.meal} mealData={section} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Today's Logged Meals */}
        {activeTab === 'logged' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((slot) => {
              const items = loggedMeals[slot] || [];
              const slotCals = items.reduce((a, b) => a + (b.calculatedCalories || 0), 0);
              const slotProt = items.reduce((a, b) => a + (b.calculatedProtein || 0), 0);

              return (
                <div key={slot} className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10 space-y-4">
                  <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
                    <div className="flex items-baseline space-x-3">
                      <h3 className="text-lg font-black uppercase tracking-tight text-on-surface">{slot}</h3>
                      <span className="text-xs font-bold text-primary">
                        {slotCals} kcal • {Math.round(slotProt * 10) / 10}g P
                      </span>
                    </div>

                    <button
                      onClick={() => navigate('/database')}
                      className="text-xs font-black uppercase tracking-wider text-primary hover:underline flex items-center space-x-1"
                    >
                      <span>+ Add Food</span>
                    </button>
                  </div>

                  {items.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-on-surface/40 uppercase tracking-widest font-bold">
                        No foods logged for {slot} yet.
                      </p>
                      <button
                        onClick={() => navigate('/database')}
                        className="mt-2 text-xs font-black text-primary hover:underline"
                      >
                        Search Indian food catalogue →
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-outline-variant/5">
                      {items.map((item) => (
                        <div key={item.loggedId} className="py-3 flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <p className="font-black text-sm text-on-surface">{item.name}</p>
                            <span className="text-[11px] text-on-surface/50 font-medium">
                              {item.loggedQuantity} {item.loggedUnit} • {item.serving_basis === '100g' ? 'per 100g basis' : 'serving basis'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <span className="text-sm font-black text-on-surface">{item.calculatedCalories} kcal</span>
                              <span className="text-[10px] block font-bold text-primary">{item.calculatedProtein}g P</span>
                            </div>

                            <button
                              onClick={() => removeLoggedItem(slot, item.loggedId)}
                              className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center text-xs font-bold transition-all"
                              title="Remove item"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {totalLoggedItemsCount > 0 && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={clearLoggedMeals}
                  className="text-xs font-black uppercase tracking-wider text-red-400 hover:text-red-500 transition-colors"
                >
                  Clear All Today's Logged Meals
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Daily Targets & Nutritional Feedback */}
      <div className="xl:col-span-4 space-y-8">
        <div className="sticky top-8">
          <div className="bg-surface-container-low p-8 rounded-3xl space-y-8 shadow-ambient border border-outline-variant/10">
            <div className="flex justify-between items-center">
              <h3 className="title-lg">
                {activeTab === 'logged' ? "Today's Intake" : "Daily Target Goals"}
              </h3>
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                activeTab === 'logged' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-600'
              }`}>
                {activeTab === 'logged' ? 'Actual Logged' : 'Algorithm Blueprint'}
              </span>
            </div>

            {/* Active Preferences Chips */}
            {activeTab === 'planned' && mealPlanPreferences && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface/80 border border-outline-variant/10 flex items-center gap-1">
                  <span>{mealPlanPreferences.dietPreference === 'vegetarian' ? '🌱' : '🍗'}</span>
                  <span className="capitalize">{mealPlanPreferences.dietPreference}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface/80 border border-outline-variant/10 flex items-center gap-1">
                  <span>{mealPlanPreferences.shakePreference === 'yes' ? '🥤' : '🚫'}</span>
                  <span>{mealPlanPreferences.shakePreference === 'yes' ? 'Shakes Allowed' : 'No Shakes'}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface/80 border border-outline-variant/10 flex items-center gap-1">
                  <span>{mealPlanPreferences.sugarPreference === 'sugar-free' ? '🍃' : '🍯'}</span>
                  <span>{mealPlanPreferences.sugarPreference === 'sugar-free' ? 'Sugar-Free' : 'Sugar Allowed'}</span>
                </span>
              </div>
            )}
            
            <div className="space-y-6">
              {/* Calories */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex items-center space-x-2">
                    <span className="label-tier">Calories</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      diffCals >= 0 ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {diffCals >= 0 ? `+${diffCals}` : diffCals} kcal
                    </span>
                  </div>
                  <span className="text-lg font-black">
                    {displayCals} <span className="opacity-30">/ {targetCals} kcal</span>
                  </span>
                </div>
                <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${Math.min((displayCals / targetCals) * 100, 100)}%` }} 
                  />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-on-surface/40">
                  {Math.round((displayCals / targetCals) * 100)}% of daily calorie target
                </span>
              </div>

              {/* Protein */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex items-center space-x-2">
                    <span className="label-tier">Protein</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      diffProt >= 0 ? 'bg-tertiary/10 text-tertiary' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {diffProt >= 0 ? `+${diffProt}` : diffProt}g
                    </span>
                  </div>
                  <span className="text-lg font-black text-primary">
                    {displayProt}g <span className="opacity-30 text-on-surface">/ {targetProt}g</span>
                  </span>
                </div>
                <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-tertiary transition-all duration-500" 
                    style={{ width: `${Math.min((displayProt / targetProt) * 100, 100)}%` }} 
                  />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-on-surface/40">
                  {Math.round((displayProt / targetProt) * 100)}% of daily protein target
                </span>
              </div>

              {/* Carbohydrates */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex items-center space-x-2">
                    <span className="label-tier">Carbs</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      Math.abs(diffCarbs) <= targetCarbs * 0.25 ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {diffCarbs >= 0 ? `+${diffCarbs}` : diffCarbs}g
                    </span>
                  </div>
                  <span className="text-lg font-black">
                    {Math.round(displayCarbs)}g <span className="opacity-30">/ {targetCarbs}g</span>
                  </span>
                </div>
                <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500" 
                    style={{ width: `${Math.min((displayCarbs / targetCarbs) * 100, 100)}%` }} 
                  />
                </div>
              </div>

              {/* Dietary Fats */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex items-center space-x-2">
                    <span className="label-tier">Fat</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      Math.abs(diffFat) <= targetFat * 0.25 ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-500/10 text-slate-600'
                    }`}>
                      {diffFat >= 0 ? `+${diffFat}` : diffFat}g
                    </span>
                  </div>
                  <span className="text-lg font-black">
                    {Math.round(displayFat)}g <span className="opacity-30">/ {targetFat}g</span>
                  </span>
                </div>
                <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-500" 
                    style={{ width: `${Math.min((displayFat / targetFat) * 100, 100)}%` }} 
                  />
                </div>
              </div>

              {/* Adherence Feedback Status */}
              {activeTab === 'planned' && (
                <div className="pt-2 space-y-2">
                  {mealPlan.summary?.shakeServings !== undefined && (
                    <div className="px-3 py-2 bg-surface-container rounded-xl flex items-center justify-between text-[11px] font-bold border border-outline-variant/10">
                      <span className="text-on-surface/70">Protein Shake:</span>
                      <span className={mealPlan.summary.shakeServings === 0 ? "text-primary" : "text-amber-600 font-black"}>
                        {mealPlan.summary.shakeServings === 0 
                          ? "0 scoops (100% Whole Foods)" 
                          : `${mealPlan.summary.shakeServings} serving${mealPlan.summary.shakeServings === 1 ? '' : 's'} (≤ 2 max)`}
                      </span>
                    </div>
                  )}
                  {mealPlan.summary?.allTargetsMet ? (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl flex items-center space-x-2 text-xs font-bold text-primary">
                      <span>🎯</span>
                      <span>Plan optimized: Calories (0–3%) & Protein (0–5%) goals satisfied.</span>
                    </div>
                  ) : mealPlan.summary?.unmetTargets?.length > 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs font-bold text-amber-700 space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span>⚠️</span>
                        <span>Closest Valid Plan:</span>
                      </div>
                      <p className="font-medium text-[11px] opacity-80 leading-snug">
                        {mealPlan.summary.unmetTargets.join(', ')}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <button 
              onClick={() => navigate('/database')}
              className="w-full bg-on-surface hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-sm tracking-tight flex items-center justify-center space-x-2 transition-all"
            >
               <span>🔍</span> <span>Search 1,100+ Indian Dishes</span>
            </button>
          </div>

          {/* Educational Pro Tip Card */}
          <div className="mt-8 bg-gradient-to-br from-primary to-primary-container p-8 rounded-3xl relative overflow-hidden group shadow-lg shadow-green-900/10">
            <div className="relative z-10 space-y-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white text-lg">🍛</div>
              <h4 className="text-white font-black uppercase tracking-widest text-[10px]">MacroMitra Indian Diet Tip</h4>
              <p className="text-white text-xs font-semibold leading-relaxed">
                Pairing dals (lysine-rich) with rotis or rice (methionine-rich) forms a complete amino acid profile, maximizing muscle protein synthesis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanner;
