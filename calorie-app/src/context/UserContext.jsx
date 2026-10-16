/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { calculateBMR } from '../utils/bmr';
import { calculateMacros } from '../utils/macros';
import { generateMealPlan as generatePlanLogic } from '../utils/mealPlanner';
import { useFoodData } from '../hooks/useFoodData';
import { calculateItemNutrition } from '../utils/nutritionCalculator';

const UserContext = createContext();

const DEFAULT_LOGGED_MEALS = {
  Breakfast: [],
  Lunch: [],
  Dinner: [],
  Snacks: []
};

export const calculateDailyTargets = (profile) => {
  const weight = Math.max(20, Math.min(300, parseFloat(profile?.weight) || 70));
  const height = Math.max(50, Math.min(250, parseFloat(profile?.height) || 170));
  const age = Math.max(1, Math.min(120, parseFloat(profile?.age) || 25));
  const sex = profile?.sex === 'female' ? 'female' : 'male';
  const activityLevel = profile?.activityLevel || 'moderate';
  const goal = profile?.goal || 'maintain';
  const dietaryPreference = profile?.dietaryPreference || 'all';
  const restrictions = Array.isArray(profile?.restrictions) ? profile.restrictions : [];

  const bmrRes = calculateBMR({ weight, height, age, sex, activityLevel });
  const macrosRes = calculateMacros({
    weight,
    calorieGoal: bmrRes.tdee,
    goal
  });

  return {
    calories: macrosRes.adjustedCalories,
    protein: macrosRes.proteinG,
    carbs: macrosRes.carbsG,
    fat: macrosRes.fatG,
    bmr: bmrRes.bmr,
    tdee: bmrRes.tdee,
    goal,
    dietaryPreference,
    restrictions,
    // Aliases for seamless component compatibility:
    adjustedCalories: macrosRes.adjustedCalories,
    calorieGoal: macrosRes.adjustedCalories,
    proteinG: macrosRes.proteinG,
    carbsG: macrosRes.carbsG,
    fatG: macrosRes.fatG
  };
};

export const UserProvider = ({ children }) => {
  const { foodData, isLoading: isDataLoading, error: foodDataError } = useFoodData();
  
  const [profile, setProfile] = useLocalStorage('nutriplan_profile', {
    weight: 70,
    height: 170,
    age: 25,
    sex: 'male',
    activityLevel: 'moderate',
    goal: 'maintain',
    dietaryPreference: 'all',
    restrictions: []
  });

  const [hasCalculated, setHasCalculated] = useLocalStorage('nutriplan_has_calculated', false);
  const [mealPlan, setMealPlan] = useState([]);
  const [mealPlanPreferences, setMealPlanPreferences] = useLocalStorage('nutriplan_meal_plan_preferences', null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planIteration, setPlanIteration] = useState(0);
  
  // User meal tracking & custom foods
  const [loggedMeals, setLoggedMeals] = useLocalStorage('nutriplan_logged_meals', DEFAULT_LOGGED_MEALS);
  const [customFoods, setCustomFoods] = useLocalStorage('nutriplan_custom_foods', []);
  const [recentFoods, setRecentFoods] = useLocalStorage('nutriplan_recent_foods', []);

  // Combined food catalogue (standard dataset + user custom foods)
  const allFoods = useMemo(() => {
    if (!customFoods || customFoods.length === 0) return foodData;
    return [...customFoods, ...foodData];
  }, [foodData, customFoods]);

  // Single authoritative source of truth for daily targets
  const dailyTargets = useMemo(() => {
    return calculateDailyTargets(profile);
  }, [profile]);

  const bmrData = useMemo(() => ({
    bmr: dailyTargets.bmr,
    tdee: dailyTargets.tdee,
    calorieGoal: dailyTargets.tdee
  }), [dailyTargets]);

  const macroData = dailyTargets;

  // Generate meal plan using fixed targets, active preferences, and current planIteration
  const generatePlanForTargets = useCallback((iteration = 0, overridePrefs = null) => {
    if (!allFoods || allFoods.length === 0) return [];
    const activePrefs = overridePrefs || mealPlanPreferences || {};
    return generatePlanLogic({
      foodData: allFoods,
      dailyTargets,
      planIndex: iteration,
      dietaryPreference: activePrefs.dietPreference || profile.dietaryPreference || 'all',
      restrictions: profile.restrictions || [],
      mealPlanPreferences: activePrefs
    });
  }, [allFoods, dailyTargets, mealPlanPreferences, profile.dietaryPreference, profile.restrictions]);

  const regenerateMealPlan = useCallback(() => {
    setPlanIteration(prev => {
      const nextIteration = prev + 1;
      const plan = generatePlanForTargets(nextIteration);
      setMealPlan(plan);
      return nextIteration;
    });
  }, [generatePlanForTargets]);

  const generateMealPlanWithPreferences = useCallback(async (newPreferences) => {
    setIsGeneratingPlan(true);
    setMealPlanPreferences(newPreferences);
    // Give UI a smooth tick for realistic progress feedback
    await new Promise(resolve => setTimeout(resolve, 350));
    setPlanIteration(0);
    const plan = generatePlanForTargets(0, newPreferences);
    setMealPlan(plan);
    setIsGeneratingPlan(false);
    return plan;
  }, [generatePlanForTargets, setMealPlanPreferences]);

  // Auto-generate plan ONLY when preferences are already set, profile is calculated, and targets change deliberately
  useEffect(() => {
    if (hasCalculated && allFoods.length > 0 && mealPlan.length === 0 && mealPlanPreferences !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      const plan = generatePlanForTargets(0);
      setMealPlan(plan);
    }
  }, [hasCalculated, allFoods.length, mealPlan.length, mealPlanPreferences, generatePlanForTargets]);

  // Daily logged totals calculation
  const loggedTotals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let fiber = 0;

    Object.values(loggedMeals || {}).forEach(mealItems => {
      if (Array.isArray(mealItems)) {
        mealItems.forEach(item => {
          calories += item.calculatedCalories || 0;
          protein += item.calculatedProtein || 0;
          carbs += item.calculatedCarbs || 0;
          fat += item.calculatedFat || 0;
          fiber += item.calculatedFiber || 0;
        });
      }
    });

    return {
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      fiber: Math.round(fiber * 10) / 10
    };
  }, [loggedMeals]);

  // Logging API
  const logFoodItem = useCallback(({ mealType, food, quantity, unit }) => {
    const validMealType = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].includes(mealType) ? mealType : 'Snacks';
    const numQty = parseFloat(quantity) || 1;
    const isPer100g = food.serving_basis === '100g';
    const resolvedUnit = unit || (isPer100g ? 'g' : food.serving_unit || 'serving');

    const calculated = calculateItemNutrition(food, numQty, resolvedUnit);

    const loggedEntry = {
      loggedId: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      foodId: food.id,
      name: food.displayName || food.name,
      category: food.category,
      source: food.source,
      serving_basis: food.serving_basis,
      serving_unit: food.serving_unit,
      loggedQuantity: numQty,
      loggedUnit: resolvedUnit,
      multiplier: calculated.multiplier,
      baseCalories: food.base_calories ?? (food.portionMultiplier ? food.calories / food.portionMultiplier : food.calories),
      baseProtein: food.base_protein ?? (food.portionMultiplier ? food.protein / food.portionMultiplier : food.protein),
      baseCarbs: food.base_carbs ?? (food.portionMultiplier ? (food.carbs || 0) / food.portionMultiplier : (food.carbs || 0)),
      baseFat: food.base_fat ?? (food.portionMultiplier ? (food.fat || 0) / food.portionMultiplier : (food.fat || 0)),
      baseFiber: food.base_fiber ?? (food.portionMultiplier ? (food.fiber || 0) / food.portionMultiplier : (food.fiber || 0)),
      calculatedCalories: calculated.calories,
      calculatedProtein: calculated.protein,
      calculatedCarbs: calculated.carbs,
      calculatedFat: calculated.fat,
      calculatedFiber: calculated.fiber,
      loggedAt: new Date().toISOString()
    };

    setLoggedMeals(prev => {
      const currentSlot = prev[validMealType] || [];
      return {
        ...prev,
        [validMealType]: [loggedEntry, ...currentSlot]
      };
    });

    // Update recent foods list (deduped, max 12 items)
    setRecentFoods(prev => {
      const filtered = (prev || []).filter(f => f.id !== food.id);
      return [food, ...filtered].slice(0, 12);
    });

    return loggedEntry;
  }, [setLoggedMeals, setRecentFoods]);

  const removeLoggedItem = useCallback((mealType, loggedId) => {
    setLoggedMeals(prev => {
      const slot = prev[mealType] || [];
      return {
        ...prev,
        [mealType]: slot.filter(item => item.loggedId !== loggedId)
      };
    });
  }, [setLoggedMeals]);

  const updateLoggedQuantity = useCallback((mealType, loggedId, newQuantity) => {
    const numQty = parseFloat(newQuantity);
    if (isNaN(numQty) || numQty <= 0) return;

    setLoggedMeals(prev => {
      const slot = prev[mealType] || [];
      return {
        ...prev,
        [mealType]: slot.map(item => {
          if (item.loggedId !== loggedId) return item;
          const calculated = calculateItemNutrition(item, numQty, item.loggedUnit);

          return {
            ...item,
            loggedQuantity: numQty,
            multiplier: calculated.multiplier,
            calculatedCalories: calculated.calories,
            calculatedProtein: calculated.protein,
            calculatedCarbs: calculated.carbs,
            calculatedFat: calculated.fat,
            calculatedFiber: calculated.fiber
          };
        })
      };
    });
  }, [setLoggedMeals]);

  const clearLoggedMeals = useCallback(() => {
    setLoggedMeals(DEFAULT_LOGGED_MEALS);
  }, [setLoggedMeals]);

  const logEntireMealPlan = useCallback(() => {
    if (!mealPlan || mealPlan.length === 0) return;
    mealPlan.forEach(slot => {
      const mealType = slot.meal;
      (slot.items || []).forEach(item => {
        const isPer100g = item.serving_basis === '100g';
        const qty = isPer100g
          ? (item.portionGrams || (item.portionMultiplier ? item.portionMultiplier * 100 : 100))
          : (item.portionMultiplier || item.portionServings || 1);
        const unit = isPer100g ? 'g' : (item.serving_unit || 'serving');
        logFoodItem({
          mealType,
          food: item,
          quantity: qty,
          unit
        });
      });
    });
  }, [mealPlan, logFoodItem]);

  const addCustomFood = useCallback((newFood) => {
    const foodRecord = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: newFood.name,
      aliases: [newFood.name],
      category: newFood.category || 'Custom Foods',
      serving_basis: newFood.serving_basis || '100g',
      serving_unit: newFood.serving_unit || (newFood.serving_basis === '100g' ? '100g' : 'serving'),
      serving_size_g: newFood.serving_basis === '100g' ? 100 : null,
      calories: parseFloat(newFood.calories) || 0,
      protein: parseFloat(newFood.protein) || 0,
      carbs: parseFloat(newFood.carbs) || 0,
      fat: parseFloat(newFood.fat) || 0,
      fiber: newFood.fiber !== undefined && newFood.fiber !== '' ? parseFloat(newFood.fiber) : null,
      sugar: newFood.sugar !== undefined && newFood.sugar !== '' ? parseFloat(newFood.sugar) : null,
      source: 'user_custom',
      isSide: false,
      isMain: true,
      isHighProtein: (parseFloat(newFood.protein) || 0) >= 10,
      isAllowedCurry: false
    };

    setCustomFoods(prev => [foodRecord, ...(prev || [])]);
    return foodRecord;
  }, [setCustomFoods]);

  const value = {
    profile,
    setProfile,
    hasCalculated,
    setHasCalculated,
    dailyTargets,
    bmrData,
    macroData,
    mealPlan,
    mealPlanPreferences,
    setMealPlanPreferences,
    generateMealPlanWithPreferences,
    isGeneratingPlan,
    regenerateMealPlan,
    isDataLoading,
    foodDataError,
    foodData: allFoods,
    rawFoodData: foodData,
    // Logging extensions
    loggedMeals,
    loggedTotals,
    logFoodItem,
    removeLoggedItem,
    updateLoggedQuantity,
    clearLoggedMeals,
    logEntireMealPlan,
    // Custom & Recent foods
    customFoods,
    addCustomFood,
    recentFoods
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
