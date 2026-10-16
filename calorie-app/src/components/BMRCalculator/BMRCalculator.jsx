import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import PropTypes from 'prop-types';

/**
 * Smoothly scrolls to the nutrition statistics section.
 * - Respects prefers-reduced-motion accessibility preference by switching to instant scroll.
 * - Handles asynchronous rendering with graceful animation-frame and retry polling.
 * - Uses stable element ID with scroll-margin to prevent obscuring by sticky navigation.
 */
export const scrollToNutritionSection = (sectionId = 'nutrition-statistics') => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const attemptScroll = (retries = 8) => {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'start'
      });
    } else if (retries > 0) {
      setTimeout(() => attemptScroll(retries - 1), 35);
    }
  };

  requestAnimationFrame(() => attemptScroll());
};

const BMRCalculator = ({ onCalculated = null }) => {
  const { profile, setProfile, setHasCalculated } = useUser();
  
  const [formData, setFormData] = useState(profile);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        ...profile
      }));
    }
  }, [profile]);

  const validateInputs = () => {
    const errs = {};
    const ageVal = Number(formData.age);
    const weightVal = Number(formData.weight);
    const heightVal = Number(formData.height);

    if (formData.age === '' || formData.age === null || formData.age === undefined || isNaN(ageVal) || ageVal < 1 || ageVal > 120) {
      errs.age = 'Please enter a valid age between 1 and 120 years.';
    }
    if (formData.weight === '' || formData.weight === null || formData.weight === undefined || isNaN(weightVal) || weightVal < 20 || weightVal > 300) {
      errs.weight = 'Please enter a valid weight between 20 kg and 300 kg.';
    }
    if (formData.height === '' || formData.height === null || formData.height === undefined || isNaN(heightVal) || heightVal < 50 || heightVal > 250) {
      errs.height = 'Please enter a valid height between 50 cm and 250 cm.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 1. Validate the user's profile inputs. If invalid, show feedback and do not scroll.
    if (!validateInputs()) {
      return;
    }

    // 2. Prepare validated numbers
    const validatedData = {
      ...formData,
      age: Math.max(1, Math.min(120, Number(formData.age))),
      weight: Math.max(20, Math.min(300, Number(formData.weight))),
      height: Math.max(50, Math.min(250, Number(formData.height))),
    };

    setErrors({});

    // 3. Calculate personalized daily nutrition targets using existing calculation logic
    setProfile(validatedData);
    setHasCalculated(true);

    if (onCalculated) {
      onCalculated(validatedData);
    }

    // 4. Smoothly scroll the current page to the nutrition statistics section
    // (Do not navigate to Meal Plans or automatically generate meal plan)
    scrollToNutritionSection('nutrition-statistics');
  };

  const activityOptions = [
    { value: 'sedentary', label: 'Sedentary (desk job, little exercise)' },
    { value: 'light', label: 'Light (light exercise 1–3 days/week)' },
    { value: 'moderate', label: 'Moderate (moderate exercise 3–5 days/week)' },
    { value: 'active', label: 'Active (hard exercise 6–7 days/week)' },
    { value: 'veryActive', label: 'Very Active (physical job or 2x training)' },
  ];

  const goalOptions = [
    { value: 'lose', label: 'Fat Loss (Cut)' },
    { value: 'maintain', label: 'Maintenance' },
    { value: 'gain', label: 'Muscle Gain (Bulk)' },
  ];

  const dietOptions = [
    { value: 'all', label: 'All Foods' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
  ];

  const inputClasses = (hasError) =>
    `w-full bg-surface-container-low rounded-xl px-5 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium outline-none transition-shadow ${
      hasError ? 'border-2 border-red-500/80 bg-red-500/5' : 'border border-transparent'
    }`;
  const btnGroupClasses = "flex flex-wrap gap-2";
  const toggleBtnClasses = (active) => `px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-primary text-white shadow-lg' : 'bg-surface-container-low text-on-surface/60 hover:bg-slate-200 focus:ring-2 focus:ring-primary/10'}`;

  return (
    <div className="card-island p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary" aria-hidden="true">📊</div>
        <h2 className="title-lg">Biometric Profile</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8" aria-labelledby="form-title" noValidate>
        <span id="form-title" className="sr-only">BMR and Macro Calculator Form</span>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label htmlFor="age" className="label-tier px-1">Age</label>
            <input 
              id="age"
              type="number" 
              value={formData.age ?? ''} 
              onChange={(e) => setFormData({...formData, age: e.target.value})}
              className={inputClasses(Boolean(errors.age))}
              required
              min="1"
              max="120"
              aria-required="true"
              aria-invalid={Boolean(errors.age)}
            />
            {errors.age && (
              <p className="text-red-500 text-xs font-semibold px-1 mt-1" role="alert">
                {errors.age}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="sex" className="label-tier px-1">Gender</label>
            <select 
              id="sex"
              value={formData.sex}
              onChange={(e) => setFormData({...formData, sex: e.target.value})}
              className={inputClasses(false)}
              aria-required="true"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="weight" className="label-tier px-1">Weight (kg)</label>
            <input 
              id="weight"
              type="number" 
              step="0.5"
              value={formData.weight ?? ''} 
              onChange={(e) => setFormData({...formData, weight: e.target.value})}
              className={inputClasses(Boolean(errors.weight))}
              required
              min="20"
              max="300"
              aria-required="true"
              aria-invalid={Boolean(errors.weight)}
            />
            {errors.weight && (
              <p className="text-red-500 text-xs font-semibold px-1 mt-1" role="alert">
                {errors.weight}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="height" className="label-tier px-1">Height (cm)</label>
            <input 
              id="height"
              type="number" 
              step="0.5"
              value={formData.height ?? ''} 
              onChange={(e) => setFormData({...formData, height: e.target.value})}
              className={inputClasses(Boolean(errors.height))}
              required
              min="50"
              max="250"
              aria-required="true"
              aria-invalid={Boolean(errors.height)}
            />
            {errors.height && (
              <p className="text-red-500 text-xs font-semibold px-1 mt-1" role="alert">
                {errors.height}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <label htmlFor="activityLevel" className="label-tier px-1">Activity Level</label>
          <select 
            id="activityLevel"
            value={formData.activityLevel}
            onChange={(e) => setFormData({...formData, activityLevel: e.target.value})}
            className={inputClasses(false)}
            aria-required="true"
          >
            {activityOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <span className="label-tier px-1 block" id="goal-label">Primary Goal</span>
          <div className={btnGroupClasses} role="radiogroup" aria-labelledby="goal-label">
            {goalOptions.map((opt) => (
              <button 
                key={opt.value}
                type="button" 
                onClick={() => setFormData({...formData, goal: opt.value})}
                className={toggleBtnClasses(formData.goal === opt.value)}
                aria-pressed={formData.goal === opt.value}
                role="radio"
                aria-checked={formData.goal === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <span className="label-tier px-1 block" id="diet-label">Dietary Preference</span>
          <div className={btnGroupClasses} role="radiogroup" aria-labelledby="diet-label">
            {dietOptions.map((opt) => (
              <button 
                key={opt.value}
                type="button" 
                onClick={() => setFormData({...formData, dietaryPreference: opt.value})}
                className={toggleBtnClasses((formData.dietaryPreference || 'all') === opt.value)}
                aria-pressed={(formData.dietaryPreference || 'all') === opt.value}
                role="radio"
                aria-checked={(formData.dietaryPreference || 'all') === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button 
          id="calculate-blueprint-btn"
          type="submit" 
          className="w-full bg-gradient-to-r from-primary to-primary-container hover:scale-[1.02] text-white font-black uppercase tracking-widest py-5 rounded-full transition-all shadow-xl shadow-green-900/10 mt-4 active:scale-95 focus:ring-4 focus:ring-primary/20 outline-none cursor-pointer"
        >
          Calculate My Blueprint
        </button>
      </form>
    </div>
  );
};

BMRCalculator.propTypes = {
  onCalculated: PropTypes.func,
};

export default BMRCalculator;
