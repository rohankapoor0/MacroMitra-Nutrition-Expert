import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { calculateBMR } from '../utils/bmr';
import { calculateMacros } from '../utils/macros';
import { generateMealPlan as generatePlanLogic } from '../utils/mealPlanner';
import { useFoodData } from '../hooks/useFoodData';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { foodData, isLoading: isDataLoading } = useFoodData();
  
  const [profile, setProfile] = useLocalStorage('nutriplan_profile', {
    weight: 70,
    height: 170,
    age: 25,
    sex: 'male',
    activityLevel: 'moderate',
    goal: 'maintain'
  });

  const [hasCalculated, setHasCalculated] = useLocalStorage('nutriplan_has_calculated', false);
  const [mealPlan, setMealPlan] = useState([]);

  const bmrData = useMemo(() => {
    return calculateBMR(profile);
  }, [profile]);

  const macroData = useMemo(() => {
    return calculateMacros({
      weight: profile.weight,
      calorieGoal: bmrData.calorieGoal,
      goal: profile.goal
    });
  }, [profile.weight, bmrData.calorieGoal, profile.goal]);

  const regenerateMealPlan = () => {
    if (!foodData || foodData.length === 0) return;
    const plan = generatePlanLogic({
      foodData,
      calorieGoal: macroData.adjustedCalories,
      proteinGoal: macroData.proteinG
    });
    setMealPlan(plan);
  };

  // Auto-generate plan if data is loaded and we have calculated but no plan yet
  useEffect(() => {
    if (hasCalculated && foodData.length > 0 && mealPlan.length === 0) {
      regenerateMealPlan();
    }
  }, [hasCalculated, foodData, mealPlan.length]);

  const value = {
    profile,
    setProfile,
    hasCalculated,
    setHasCalculated,
    bmrData,
    macroData,
    mealPlan,
    regenerateMealPlan,
    isDataLoading,
    foodData
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
