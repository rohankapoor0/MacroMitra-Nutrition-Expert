import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import PropTypes from 'prop-types';

const BMRCalculator = () => {
  const { profile, setProfile, setHasCalculated } = useUser();
  const nav = useNavigate();
  
  const [formData, setFormData] = useState(profile);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Security/Quality: Strict validation & clamping
    const validatedData = {
      ...formData,
      age: Math.max(1, Math.min(120, formData.age)),
      weight: Math.max(20, Math.min(300, formData.weight)),
      height: Math.max(50, Math.min(250, formData.height)),
    };

    setProfile(validatedData);
    setHasCalculated(true);
    nav('/meals');
  };

  const activityOptions = [
    { value: 'sedentary', label: 'Sedentary' },
    { value: 'light', label: 'Light' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'active', label: 'Active' },
    { value: 'veryActive', label: 'Very Active' },
  ];

  const goalOptions = [
    { value: 'lose', label: 'Cut' },
    { value: 'maintain', label: 'Maintain' },
    { value: 'gain', label: 'Bulk' },
  ];

  const inputClasses = "w-full bg-surface-container-low border-none rounded-xl px-5 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium outline-none transition-shadow";
  const btnGroupClasses = "flex flex-wrap gap-2";
  const toggleBtnClasses = (active) => `px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-primary text-white shadow-lg' : 'bg-surface-container-low text-on-surface/60 hover:bg-slate-200 focus:ring-2 focus:ring-primary/10'}`;

  return (
    <div className="card-island p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary" aria-hidden="true">📊</div>
        <h2 className="title-lg">Biometric Profile</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8" aria-labelledby="form-title">
        <span id="form-title" className="sr-only">BMR and Macro Calculator Form</span>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="age" className="label-tier px-1">Age</label>
            <input 
              id="age"
              type="number" 
              value={formData.age} 
              onChange={(e) => setFormData({...formData, age: parseFloat(e.target.value)})}
              className={inputClasses}
              required
              min="1"
              max="120"
              aria-required="true"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="sex" className="label-tier px-1">Gender</label>
            <select 
              id="sex"
              value={formData.sex}
              onChange={(e) => setFormData({...formData, sex: e.target.value})}
              className={inputClasses}
              aria-required="true"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="weight" className="label-tier px-1">Weight (kg)</label>
            <input 
              id="weight"
              type="number" 
              value={formData.weight} 
              onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value)})}
              className={inputClasses}
              required
              min="20"
              max="300"
              aria-required="true"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="height" className="label-tier px-1">Height (cm)</label>
            <input 
              id="height"
              type="number" 
              value={formData.height} 
              onChange={(e) => setFormData({...formData, height: parseFloat(e.target.value)})}
              className={inputClasses}
              required
              min="50"
              max="250"
              aria-required="true"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label htmlFor="activityLevel" className="label-tier px-1">Activity Level</label>
          <select 
            id="activityLevel"
            value={formData.activityLevel}
            onChange={(e) => setFormData({...formData, activityLevel: e.target.value})}
            className={inputClasses}
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

        <button 
          type="submit" 
          className="w-full bg-gradient-to-r from-primary to-primary-container hover:scale-[1.02] text-white font-black uppercase tracking-widest py-5 rounded-full transition-all shadow-xl shadow-green-900/10 mt-4 active:scale-95 focus:ring-4 focus:ring-primary/20 outline-none"
        >
          Calculate My Blueprint
        </button>
      </form>
    </div>
  );
};

// PropTypes for documentation and static quality analysis
BMRCalculator.propTypes = {
  // Navigation and Context handled internally, but ready for future prop injection
};

export default BMRCalculator;
