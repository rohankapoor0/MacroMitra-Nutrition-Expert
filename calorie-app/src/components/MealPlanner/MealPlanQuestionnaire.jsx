import React, { useState } from 'react';

const MealPlanQuestionnaire = ({ 
  onSubmit, 
  initialPreferences = null, 
  profile = null, 
  onCancel = null,
  isGenerating = false 
}) => {
  // Sensible default for diet only if consistent with existing profile
  const getInitialDiet = () => {
    if (initialPreferences?.dietPreference) return initialPreferences.dietPreference;
    if (profile?.dietPreference === 'vegetarian' || profile?.dietPreference === 'vegan') return 'vegetarian';
    if (profile?.dietPreference === 'non-vegetarian') return 'non-vegetarian';
    return null;
  };

  const [dietPreference, setDietPreference] = useState(getInitialDiet());
  const [meatPreferences, setMeatPreferences] = useState(
    Array.isArray(initialPreferences?.meatPreferences)
      ? initialPreferences.meatPreferences
      : []
  );
  const [shakePreference, setShakePreference] = useState(initialPreferences?.shakePreference || null);
  const [beveragePreference, setBeveragePreference] = useState(initialPreferences?.beveragePreference || null);
  const [sugarPreference, setSugarPreference] = useState(initialPreferences?.sugarPreference || null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const isMeatComplete = dietPreference !== 'non-vegetarian' || (Array.isArray(meatPreferences) && meatPreferences.length > 0);
  const isComplete = dietPreference !== null &&
    isMeatComplete &&
    shakePreference !== null &&
    beveragePreference !== null &&
    sugarPreference !== null;

  const handleSelectDiet = (diet) => {
    setDietPreference(diet);
    if (diet === 'vegetarian') {
      setMeatPreferences([]);
    }
  };

  const handleToggleMeat = (meatKey) => {
    setMeatPreferences(prev => {
      const current = Array.isArray(prev) ? prev : [];
      if (current.includes(meatKey)) {
        return current.filter(k => k !== meatKey);
      } else {
        return [...current, meatKey];
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    if (!isComplete) return;

    onSubmit({
      dietPreference,
      meatPreferences: dietPreference === 'vegetarian' ? [] : meatPreferences,
      shakePreference,
      beveragePreference,
      sugarPreference
    });
  };

  if (isGenerating) {
    return (
      <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-12 text-center space-y-6 shadow-ambient max-w-2xl mx-auto my-8">
        <div className="relative w-20 h-20 mx-auto">
          <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl" role="img" aria-label="utensils">
            🥗
          </span>
        </div>
        <div className="space-y-2">
          <h3 className="display-sm text-on-surface">Formulating Meal Blueprint...</h3>
          <p className="text-sm text-on-surface/60 max-w-md mx-auto">
            Filtering verified Indian food records, enforcing protein ceilings, and optimizing your macro ratio.
          </p>
        </div>
        <div className="flex justify-center items-center gap-2 pt-2 text-xs font-bold text-primary">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
          <span>Analyzing 1,100+ Indian dishes for your preferences</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 sm:p-10 shadow-ambient max-w-3xl mx-auto my-6 space-y-8 animate-in fade-in duration-300">
      {/* Questionnaire Header */}
      <div className="border-b border-outline-variant/10 pb-6 space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-xl">📋</span>
          <span className="label-tier text-primary font-black uppercase tracking-wider text-xs">
            Personalized Nutrition Blueprint
          </span>
        </div>
        <h2 className="display-lg text-on-surface tracking-tight">
          Meal Plan Preferences
        </h2>
        <p className="text-sm text-on-surface/60 max-w-xl">
          Quickly customize your daily menu before we generate your meal plan. These preferences strictly control food selection and macro balancing.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Question 1: Diet Preference */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-black uppercase tracking-wider text-on-surface flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
              <span>What's your diet preference?</span>
            </label>
            {attemptedSubmit && !dietPreference && (
              <span className="text-xs font-bold text-red-500">Selection required</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Vegetarian Card */}
            <button
              type="button"
              id="diet-opt-vegetarian"
              onClick={() => handleSelectDiet('vegetarian')}
              className={`p-4 rounded-2xl text-left border transition-all flex items-start justify-between group ${
                dietPreference === 'vegetarian'
                  ? 'bg-primary/5 border-primary shadow-sm'
                  : 'bg-surface-container-lowest border-outline-variant/10 hover:border-outline-variant/30'
              }`}
            >
              <div className="space-y-1 pr-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🌱</span>
                  <span className="font-black text-sm text-on-surface">Vegetarian</span>
                </div>
                <p className="text-xs text-on-surface/60 leading-relaxed font-medium">
                  Exclude meat, poultry, fish, and other non-vegetarian ingredients.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                dietPreference === 'vegetarian'
                  ? 'border-primary bg-primary text-white'
                  : 'border-outline-variant/40 group-hover:border-outline-variant'
              }`}>
                {dietPreference === 'vegetarian' && <span className="text-[10px] font-black">✓</span>}
              </div>
            </button>

            {/* Non-Vegetarian Card */}
            <button
              type="button"
              id="diet-opt-non-vegetarian"
              onClick={() => handleSelectDiet('non-vegetarian')}
              className={`p-4 rounded-2xl text-left border transition-all flex items-start justify-between group ${
                dietPreference === 'non-vegetarian'
                  ? 'bg-primary/5 border-primary shadow-sm'
                  : 'bg-surface-container-lowest border-outline-variant/10 hover:border-outline-variant/30'
              }`}
            >
              <div className="space-y-1 pr-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🍗</span>
                  <span className="font-black text-sm text-on-surface">Non-vegetarian</span>
                </div>
                <p className="text-xs text-on-surface/60 leading-relaxed font-medium">
                  Allow both vegetarian and non-vegetarian foods (chicken, eggs, fish).
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                dietPreference === 'non-vegetarian'
                  ? 'border-primary bg-primary text-white'
                  : 'border-outline-variant/40 group-hover:border-outline-variant'
              }`}>
                {dietPreference === 'non-vegetarian' && <span className="text-[10px] font-black">✓</span>}
              </div>
            </button>
          </div>

          {/* Conditional Follow-up Question: Non-Vegetarian Meat Preferences */}
          {dietPreference === 'non-vegetarian' && (
            <div className="mt-4 p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black uppercase tracking-wider text-on-surface flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1b</span>
                  <span>Which non-vegetarian foods do you eat?</span>
                </label>
                {attemptedSubmit && meatPreferences.length === 0 && (
                  <span className="text-xs font-bold text-red-500">Selection required</span>
                )}
              </div>
              <p className="text-xs text-on-surface/60 font-medium">
                Select one or multiple options. Only selected food types will be included in your plan (vegetarian accompaniments remain included).
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {[
                  { key: 'eggs', label: 'Eggs', icon: '🥚', desc: 'Whole eggs, egg whites, bhurji' },
                  { key: 'chicken', label: 'Chicken', icon: '🍗', desc: 'Chicken curry, breast, tikka' },
                  { key: 'fish', label: 'Fish', icon: '🐟', desc: 'Fish curry, moilee, salmon, seafood' },
                  { key: 'mutton', label: 'Mutton', icon: '🥩', desc: 'Mutton curry, lamb, roghan josh' },
                  { key: 'other_meat', label: 'Other meat', icon: '🥓', desc: 'Pork, beef, and other meats' },
                ].map(opt => {
                  const isSelected = meatPreferences.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      id={`meat-opt-${opt.key}`}
                      onClick={() => handleToggleMeat(opt.key)}
                      className={`p-3 rounded-xl text-left border transition-all flex items-start justify-between group ${
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-sm'
                          : 'bg-surface-container-low border-outline-variant/15 hover:border-outline-variant/30'
                      }`}
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm">{opt.icon}</span>
                          <span className="font-bold text-xs text-on-surface">{opt.label}</span>
                        </div>
                        <p className="text-[11px] text-on-surface/50 leading-tight font-medium">
                          {opt.desc}
                        </p>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary text-white'
                          : 'border-outline-variant/40 group-hover:border-outline-variant'
                      }`}>
                        {isSelected && <span className="text-[10px] font-black">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Question 2: Protein Shakes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-black uppercase tracking-wider text-on-surface flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
              <span>Do you want protein shakes?</span>
            </label>
            {attemptedSubmit && !shakePreference && (
              <span className="text-xs font-bold text-red-500">Selection required</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Yes Card */}
            <button
              type="button"
              id="shake-opt-yes"
              onClick={() => setShakePreference('yes')}
              className={`p-4 rounded-2xl text-left border transition-all flex items-start justify-between group ${
                shakePreference === 'yes'
                  ? 'bg-primary/5 border-primary shadow-sm'
                  : 'bg-surface-container-lowest border-outline-variant/10 hover:border-outline-variant/30'
              }`}
            >
              <div className="space-y-1 pr-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🥤</span>
                  <span className="font-black text-sm text-on-surface">Yes, include protein shakes if needed</span>
                </div>
                <p className="text-xs text-on-surface/60 leading-relaxed font-medium">
                  Allow 0, 1, or at most 2 servings/day. Whole foods prioritized first.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                shakePreference === 'yes'
                  ? 'border-primary bg-primary text-white'
                  : 'border-outline-variant/40 group-hover:border-outline-variant'
              }`}>
                {shakePreference === 'yes' && <span className="text-[10px] font-black">✓</span>}
              </div>
            </button>

            {/* No Card */}
            <button
              type="button"
              id="shake-opt-no"
              onClick={() => setShakePreference('no')}
              className={`p-4 rounded-2xl text-left border transition-all flex items-start justify-between group ${
                shakePreference === 'no'
                  ? 'bg-primary/5 border-primary shadow-sm'
                  : 'bg-surface-container-lowest border-outline-variant/10 hover:border-outline-variant/30'
              }`}
            >
              <div className="space-y-1 pr-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🚫</span>
                  <span className="font-black text-sm text-on-surface">No protein shakes</span>
                </div>
                <p className="text-xs text-on-surface/60 leading-relaxed font-medium">
                  Strictly whole foods. Exclude all protein shakes and supplement drinks.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                shakePreference === 'no'
                  ? 'border-primary bg-primary text-white'
                  : 'border-outline-variant/40 group-hover:border-outline-variant'
              }`}>
                {shakePreference === 'no' && <span className="text-[10px] font-black">✓</span>}
              </div>
            </button>
          </div>
        </div>

        {/* Question 3: Caloric Beverage Preference */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-black uppercase tracking-wider text-on-surface flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
              <span>Include caloric beverages in my meal plan?</span>
            </label>
            {attemptedSubmit && !beveragePreference && (
              <span className="text-xs font-bold text-red-500">Selection required</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Yes Beverages Card */}
            <button
              type="button"
              id="beverage-opt-yes"
              onClick={() => setBeveragePreference('yes')}
              className={`p-4 rounded-2xl text-left border transition-all flex items-start justify-between group ${
                beveragePreference === 'yes'
                  ? 'bg-primary/5 border-primary shadow-sm'
                  : 'bg-surface-container-lowest border-outline-variant/10 hover:border-outline-variant/30'
              }`}
            >
              <div className="space-y-1 pr-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🥤</span>
                  <span className="font-black text-sm text-on-surface">Yes, include beverages</span>
                </div>
                <p className="text-xs text-on-surface/60 leading-relaxed font-medium">
                  Allow suitable caloric beverages in moderation (milk, smoothies, fresh juices) when fitting your nutritional targets.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                beveragePreference === 'yes'
                  ? 'border-primary bg-primary text-white'
                  : 'border-outline-variant/40 group-hover:border-outline-variant'
              }`}>
                {beveragePreference === 'yes' && <span className="text-[10px] font-black">✓</span>}
              </div>
            </button>

            {/* No Caloric Beverages Card */}
            <button
              type="button"
              id="beverage-opt-no"
              onClick={() => setBeveragePreference('no')}
              className={`p-4 rounded-2xl text-left border transition-all flex items-start justify-between group ${
                beveragePreference === 'no'
                  ? 'bg-primary/5 border-primary shadow-sm'
                  : 'bg-surface-container-lowest border-outline-variant/10 hover:border-outline-variant/30'
              }`}
            >
              <div className="space-y-1 pr-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">💧</span>
                  <span className="font-black text-sm text-on-surface">No caloric beverages</span>
                </div>
                <p className="text-xs text-on-surface/60 leading-relaxed font-medium">
                  Exclude caloric drinks (milkshakes, fruit juices, sugary drinks, smoothies). Plain water and zero-calorie drinks remain allowed.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                beveragePreference === 'no'
                  ? 'border-primary bg-primary text-white'
                  : 'border-outline-variant/40 group-hover:border-outline-variant'
              }`}>
                {beveragePreference === 'no' && <span className="text-[10px] font-black">✓</span>}
              </div>
            </button>
          </div>
        </div>

        {/* Question 4: Sugar Preference */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-black uppercase tracking-wider text-on-surface flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
              <span>What's your sugar preference?</span>
            </label>
            {attemptedSubmit && !sugarPreference && (
              <span className="text-xs font-bold text-red-500">Selection required</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sugar-Free Card */}
            <button
              type="button"
              id="sugar-opt-free"
              onClick={() => setSugarPreference('sugar-free')}
              className={`p-4 rounded-2xl text-left border transition-all flex items-start justify-between group ${
                sugarPreference === 'sugar-free'
                  ? 'bg-primary/5 border-primary shadow-sm'
                  : 'bg-surface-container-lowest border-outline-variant/10 hover:border-outline-variant/30'
              }`}
            >
              <div className="space-y-1 pr-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🍃</span>
                  <span className="font-black text-sm text-on-surface">Sugar-free / minimize added sugar</span>
                </div>
                <p className="text-xs text-on-surface/60 leading-relaxed font-medium">
                  Avoid added sugar, sweets, and sweetened drinks. Fresh fruit and plain dairy are preserved.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                sugarPreference === 'sugar-free'
                  ? 'border-primary bg-primary text-white'
                  : 'border-outline-variant/40 group-hover:border-outline-variant'
              }`}>
                {sugarPreference === 'sugar-free' && <span className="text-[10px] font-black">✓</span>}
              </div>
            </button>

            {/* Sugar Okay Card */}
            <button
              type="button"
              id="sugar-opt-okay"
              onClick={() => setSugarPreference('sugar-okay')}
              className={`p-4 rounded-2xl text-left border transition-all flex items-start justify-between group ${
                sugarPreference === 'sugar-okay'
                  ? 'bg-primary/5 border-primary shadow-sm'
                  : 'bg-surface-container-lowest border-outline-variant/10 hover:border-outline-variant/30'
              }`}
            >
              <div className="space-y-1 pr-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🍯</span>
                  <span className="font-black text-sm text-on-surface">Sugar is okay, including desserts</span>
                </div>
                <p className="text-xs text-on-surface/60 leading-relaxed font-medium">
                  Allow desserts and sweetened foods in moderation while keeping macro goals on track.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                sugarPreference === 'sugar-okay'
                  ? 'border-primary bg-primary text-white'
                  : 'border-outline-variant/40 group-hover:border-outline-variant'
              }`}>
                {sugarPreference === 'sugar-okay' && <span className="text-[10px] font-black">✓</span>}
              </div>
            </button>
          </div>
        </div>

        {/* Validation Warning Notice */}
        {attemptedSubmit && !isComplete && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center space-x-2 text-xs font-bold text-red-600 animate-shake">
            <span>⚠️</span>
            <span>
              {dietPreference === 'non-vegetarian' && meatPreferences.length === 0
                ? 'Please select at least one non-vegetarian food type (e.g. Eggs, Chicken).'
                : 'Please answer all preference questions before generating your meal plan.'}
            </span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-outline-variant/10">
          <p className="text-xs text-on-surface/50 font-medium">
            🎯 Nutrition targets remain fixed based on your biometric profile.
          </p>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full text-xs font-black uppercase tracking-wider text-on-surface/60 hover:text-on-surface hover:bg-surface-container transition-all"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              id="generate-meal-plan-btn"
              disabled={isGenerating}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 shadow-lg ${
                isComplete
                  ? 'bg-primary hover:bg-primary-container text-white shadow-primary/20 active:scale-95 cursor-pointer'
                  : 'bg-primary/50 text-white/80 cursor-not-allowed opacity-75'
              }`}
            >
              <span>{initialPreferences ? 'Update & Regenerate Plan' : 'Generate Meal Plan'}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MealPlanQuestionnaire;
