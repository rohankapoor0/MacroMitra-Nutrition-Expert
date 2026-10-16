import {
  generateMealPlan,
  isFoodAllowed,
  scoreDailyPlan,
  isProteinShake,
  countShakeServings,
  validateMealPlan,
  isRawIngredient,
  detectMeatType,
  DEFAULT_TOLERANCES,
  isCaloricBeverage,
  normalizeDishName,
  getFoodKeys,
  areFoodsDuplicate,
  calculateProteinDistribution,
  DEFAULT_PROTEIN_DISTRIBUTION,
  isBreakfastAppropriate,
  isLunchDinnerMainAppropriate,
  isLunchDinnerStapleAppropriate,
  isLunchDinnerSideAppropriate,
  isSnackAppropriate,
  classifyMealRole,
  classifyEligibleMeals,
  isFoodEligibleForMeal,
  MEAL_ROLES,
  MEAL_SLOTS
} from '../mealPlanner';
import { calculateDailyTargets } from '../../context/UserContext';
import catalogueData from '../../../public/data/merged_food_catalogue.json';

const foods = catalogueData.foods;

const mockFoodData = [
  { id: 'f-1', name: 'Oats with Milk', calories: 300, protein: 10, carbs: 50, fat: 5, category: 'Breakfast', isMain: true, isSide: false, isHighProtein: false },
  { id: 'f-2', name: 'Chicken Breast Curry', calories: 250, protein: 35, carbs: 5, fat: 8, category: 'Non-Veg', isMain: true, isSide: false, isHighProtein: true },
  { id: 'f-3', name: 'Greek Yogurt Bowl', calories: 150, protein: 18, carbs: 10, fat: 3, category: 'Dairy & Eggs', isMain: false, isSide: true, isHighProtein: true },
  { id: 'f-4', name: 'Whole Wheat Roti', calories: 85, protein: 3, carbs: 18, fat: 0.5, category: 'Breads', isMain: false, isSide: true, isHighProtein: false },
  { id: 'f-5', name: 'Palak Paneer', calories: 210, protein: 14, carbs: 9, fat: 14, category: 'Dairy & Eggs', isMain: true, isSide: false, isHighProtein: true },
  { id: 'f-6', name: 'Boiled Egg', calories: 75, protein: 6.5, carbs: 0.5, fat: 5, category: 'Dairy & Eggs', isMain: false, isSide: true, isHighProtein: true },
  { id: 'f-7', name: 'Dal Tadka', calories: 150, protein: 8, carbs: 20, fat: 4, category: 'Dals & Legumes', isMain: true, isSide: false, isHighProtein: false },
  { id: 'f-8', name: 'Apple, raw', calories: 60, protein: 0.5, carbs: 15, fat: 0.2, category: 'Fruits & Vegetables', isMain: false, isSide: true, isHighProtein: false },
  { id: 'f-9', name: 'Steamed Basmati Rice', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, category: 'Rice Dishes', isMain: false, isSide: true, isHighProtein: false },
  { id: 'f-10', name: 'Roasted Chana', calories: 180, protein: 9, carbs: 28, fat: 3, category: 'Snacks', isMain: false, isSide: true, isHighProtein: true },
];

describe('generateMealPlan - Structure and Targets Optimization', () => {
  it('returns an empty array if no food data is provided', () => {
    const result = generateMealPlan({ foodData: [], calorieGoal: 2000, proteinGoal: 150 });
    expect(result).toEqual([]);
  });

  it('generates a 4-slot meal plan with correct meal names', () => {
    const result = generateMealPlan({ foodData: mockFoodData, calorieGoal: 2000, proteinGoal: 100 });
    expect(result).toHaveLength(4);
    expect(result.map(m => m.meal)).toEqual(['Breakfast', 'Lunch', 'Dinner', 'Snacks']);
  });

  it('ensures each main meal has at least one item when candidates exist', () => {
    const result = generateMealPlan({ foodData: mockFoodData, calorieGoal: 2000, proteinGoal: 100 });
    result.slice(0, 3).forEach(meal => {
      expect(meal.items.length).toBeGreaterThan(0);
    });
  });

  it('optimizes daily plan to meet or slightly exceed calorie and protein targets', () => {
    const targets = {
      calories: 2000,
      protein: 126,
      carbs: 225,
      fat: 67
    };

    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: targets,
      dietaryPreference: 'all'
    });

    const summary = plan.summary;
    expect(summary).toBeDefined();

    // Calories: should meet or slightly exceed target (ideally 0-3% above)
    expect(summary.actualCalories).toBeGreaterThanOrEqual(targets.calories);
    expect(summary.actualCalories).toBeLessThanOrEqual(targets.calories * 1.05);

    // Protein: should meet or exceed protein target (ideally 0-5% above)
    expect(summary.actualProtein).toBeGreaterThanOrEqual(targets.protein);
    expect(summary.actualProtein).toBeLessThanOrEqual(targets.protein * 1.15);

    // Carbohydrates and fat remain within reasonable tolerances
    expect(Math.abs(summary.diffCarbs)).toBeLessThanOrEqual(targets.carbs * DEFAULT_TOLERANCES.carbsToleranceRatio);
    expect(Math.abs(summary.diffFat)).toBeLessThanOrEqual(targets.fat * DEFAULT_TOLERANCES.fatToleranceRatio);
  });
});

describe('Regenerate Meal Plan - Target Stability and Variety', () => {
  const profile = {
    weight: 70,
    height: 170,
    age: 25,
    sex: 'male',
    activityLevel: 'moderate',
    goal: 'maintain',
    dietaryPreference: 'all'
  };

  it('keeps underlying nutrition targets strictly stable when regenerating', () => {
    const initialTargets = calculateDailyTargets(profile);

    // Generate plan 0
    const plan0 = generateMealPlan({
      foodData: foods,
      dailyTargets: initialTargets,
      planIndex: 0
    });

    // Regenerate plan 1 (same targets)
    const plan1 = generateMealPlan({
      foodData: foods,
      dailyTargets: initialTargets,
      planIndex: 1
    });

    // Targets must be 100% identical
    expect(plan0.summary.targetCalories).toBe(plan1.summary.targetCalories);
    expect(plan0.summary.targetProtein).toBe(plan1.summary.targetProtein);
    expect(plan0.summary.targetCarbs).toBe(plan1.summary.targetCarbs);
    expect(plan0.summary.targetFat).toBe(plan1.summary.targetFat);
  });

  it('generates a different suitable food combination across regenerations without target drift', () => {
    const targets = calculateDailyTargets(profile);

    const planA = generateMealPlan({ foodData: foods, dailyTargets: targets, planIndex: 0 });
    const planB = generateMealPlan({ foodData: foods, dailyTargets: targets, planIndex: 1 });
    const planC = generateMealPlan({ foodData: foods, dailyTargets: targets, planIndex: 2 });

    const itemsA = planA.flatMap(m => m.items).map(i => i.name);
    const itemsB = planB.flatMap(m => m.items).map(i => i.name);

    // Variety check: food combination is distinct
    const differentFoods = itemsA.some(name => !itemsB.includes(name));
    expect(differentFoods).toBe(true);

    // Repeated regeneration never causes target drift
    [planA, planB, planC].forEach(plan => {
      expect(plan.summary.targetCalories).toBe(targets.calories);
      expect(plan.summary.targetProtein).toBe(targets.protein);
      expect(plan.summary.targetCarbs).toBe(targets.carbs);
      expect(plan.summary.targetFat).toBe(targets.fat);
      // Actual planned values meet target without drifting into infinity or zero
      expect(plan.summary.actualCalories).toBeGreaterThanOrEqual(targets.calories);
      expect(plan.summary.actualCalories).toBeLessThanOrEqual(targets.calories * 1.06);
    });
  });

  it('deliberately recalculates targets when profile inputs change, keeping targets stable otherwise', () => {
    const profile1 = { weight: 70, height: 170, age: 25, sex: 'male', activityLevel: 'moderate', goal: 'maintain' };
    const targets1 = calculateDailyTargets(profile1);

    const profile2 = { ...profile1, weight: 85 }; // Weight increased by 15kg
    const targets2 = calculateDailyTargets(profile2);

    expect(targets2.calories).toBeGreaterThan(targets1.calories);
    expect(targets2.protein).toBeGreaterThan(targets1.protein);

    // If profile inputs are unchanged, targets remain identical
    const targets1Recheck = calculateDailyTargets(profile1);
    expect(targets1Recheck).toEqual(targets1);
  });
});

describe('Dietary Restrictions & Filter Compliance', () => {
  it('excludes non-vegetarian foods when dietary preference is vegetarian', () => {
    const nonVegFood = { name: 'Chicken Tikka', category: 'Non-Veg', calories: 250, protein: 30 };
    const vegFood = { name: 'Dal Tadka', category: 'Dals & Legumes', calories: 150, protein: 8 };

    expect(isFoodAllowed(nonVegFood, 'vegetarian')).toBe(false);
    expect(isFoodAllowed(vegFood, 'vegetarian')).toBe(true);

    // Full plan generation for vegetarian
    const targets = { calories: 1800, protein: 100, carbs: 200, fat: 55 };
    const vegPlan = generateMealPlan({
      foodData: foods,
      dailyTargets: targets,
      dietaryPreference: 'vegetarian'
    });

    const allItems = vegPlan.flatMap(m => m.items);
    allItems.forEach(item => {
      expect(item.category).not.toBe('Non-Veg');
      expect(item.name.toLowerCase()).not.toContain('chicken');
      expect(item.name.toLowerCase()).not.toContain('mutton');
      expect(item.name.toLowerCase()).not.toContain('fish');
    });
  });

  it('excludes both non-vegetarian and dairy foods when dietary preference is vegan', () => {
    const paneerFood = { name: 'Palak Paneer', category: 'Dairy & Eggs', calories: 210, protein: 14 };
    const tofuFood = { name: 'Tofu Bhurji', category: 'Main Dishes', calories: 180, protein: 16 };

    expect(isFoodAllowed(paneerFood, 'vegan')).toBe(false);
    expect(isFoodAllowed(tofuFood, 'vegan')).toBe(true);
  });

  it('strictly excludes ingredients matching user allergy or restriction keywords', () => {
    const peanutFood = { name: 'Peanut Chikki', category: 'Snacks', calories: 200, protein: 6 };
    expect(isFoodAllowed(peanutFood, 'all', ['peanut'])).toBe(false);
    expect(isFoodAllowed(peanutFood, 'all', ['gluten'])).toBe(true);
  });

  it('explicitly identifies unmet targets when the food database cannot satisfy extreme constraints', () => {
    // Insane protein goal (350g) with tiny calorie budget (1200 kcal)
    const impossibleTargets = {
      calories: 1200,
      protein: 350,
      carbs: 50,
      fat: 20
    };

    const plan = generateMealPlan({
      foodData: mockFoodData,
      dailyTargets: impossibleTargets,
      dietaryPreference: 'vegan'
    });

    expect(plan.summary.allTargetsMet).toBe(false);
    expect(plan.summary.unmetTargets.length).toBeGreaterThan(0);
  });
});

describe('Portion Scaling and Independent Daily Totals Verification', () => {
  it('correctly matches the sum of individual meals with the plan summary totals', () => {
    const targets = { calories: 2100, protein: 130, carbs: 235, fat: 70 };
    const plan = generateMealPlan({ foodData: foods, dailyTargets: targets });

    let sumCals = 0;
    let sumProt = 0;
    let sumCarbs = 0;
    let sumFat = 0;

    plan.forEach(slot => {
      let slotCals = 0;
      let slotProt = 0;
      let slotCarbs = 0;
      let slotFat = 0;

      slot.items.forEach(it => {
        slotCals += it.calories;
        slotProt += it.protein;
        slotCarbs += it.carbs;
        slotFat += it.fat;
      });

      expect(slot.totalCalories).toBe(Math.round(slotCals));
      expect(slot.totalProtein).toBe(Math.round(slotProt * 10) / 10);
      expect(slot.totalCarbs).toBe(Math.round(slotCarbs * 10) / 10);
      expect(slot.totalFat).toBe(Math.round(slotFat * 10) / 10);

      sumCals += slot.totalCalories;
      sumProt += slot.totalProtein;
      sumCarbs += slot.totalCarbs;
      sumFat += slot.totalFat;
    });

    expect(plan.summary.actualCalories).toBe(Math.round(sumCals));
    expect(plan.summary.actualProtein).toBeCloseTo(sumProt, 1);
  });
});

describe('Protein Shake Limits & Whole-Food Prioritization', () => {
  it('strictly limits protein shake servings to a maximum of 2 across the entire day', () => {
    // High protein target for an active user
    const targets = { calories: 2300, protein: 165, carbs: 230, fat: 75 };
    
    // Test across several plans / iterations
    for (let i = 0; i < 5; i++) {
      const plan = generateMealPlan({
        foodData: foods,
        dailyTargets: targets,
        dietaryPreference: 'vegetarian',
        planIndex: i
      });

      const totalShakes = countShakeServings(plan);
      expect(totalShakes).toBeLessThanOrEqual(2.0);
      expect(plan.summary.shakeServings).toBeLessThanOrEqual(2.0);
      expect(plan.summary.shakeLimitMet).toBe(true);
    }
  });

  it('prefers 0 or 1 serving of protein shake when whole foods can meet the targets', () => {
    // Moderate protein target easily achievable with whole foods (paneer, dals, curd, sprouts)
    const targets = { calories: 2000, protein: 110, carbs: 230, fat: 65 };

    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: targets,
      dietaryPreference: 'vegetarian',
      planIndex: 0
    });

    const totalShakes = countShakeServings(plan);
    // Should prefer 0 or at most 1 serving, never 2
    expect(totalShakes).toBeLessThanOrEqual(1.0);
    expect(plan.summary.actualProtein).toBeGreaterThanOrEqual(targets.protein);
  });

  it('consistently enforces the 2-serving limit across repeated regenerations', () => {
    const targets = { calories: 2200, protein: 150, carbs: 220, fat: 70 };

    for (let iteration = 0; iteration < 8; iteration++) {
      const plan = generateMealPlan({
        foodData: foods,
        dailyTargets: targets,
        dietaryPreference: 'all',
        planIndex: iteration
      });

      const shakes = countShakeServings(plan);
      expect(shakes).toBeLessThanOrEqual(2.0);
    }
  });

  it('implements tiered penalty in scoreDailyPlan to discourage unnecessary shakes', () => {
    const totals = { calories: 2000, protein: 130, carbs: 225, fat: 65 };
    const targets = { calories: 2000, protein: 130, carbs: 225, fat: 65 };

    const score0 = scoreDailyPlan(totals, targets, DEFAULT_TOLERANCES, 0);
    const score1 = scoreDailyPlan(totals, targets, DEFAULT_TOLERANCES, 1.0);
    const score2 = scoreDailyPlan(totals, targets, DEFAULT_TOLERANCES, 2.0);
    const scoreOver2 = scoreDailyPlan(totals, targets, DEFAULT_TOLERANCES, 2.5);

    // 0 shakes should have lower penalty than 1 shake
    expect(score0).toBeLessThan(score1);
    // 1 shake should have lower penalty than 2 shakes
    expect(score1).toBeLessThan(score2);
    // > 2 shakes violates hard constraint with a massive penalty
    expect(scoreOver2).toBeGreaterThan(100000);
  });
});

describe('Vegetarian Nutrition Verification & Data-Quality Audits', () => {
  it('correctly audits Vegetable Pulao: realistic protein per serving, not inflated to 20g', () => {
    // Find vegetable pulao / vegetable rice in catalogue
    const pulaoDishes = foods.filter(f => 
      f.name.toLowerCase().includes('vegetable pulao') || 
      f.name.toLowerCase().includes('veg pulao')
    );

    expect(pulaoDishes.length).toBeGreaterThan(0);
    pulaoDishes.forEach(dish => {
      // Vegetable pulao is rice & mixed veggies: protein per 100g must be realistic (~2.5 - 5g/100g)
      expect(dish.protein).toBeLessThanOrEqual(7.0);
      // It must NOT falsely claim 20g protein
      expect(dish.protein).not.toBe(20);
    });
  });

  it('rejects unverified or suspiciously inflated vegetarian rice records in isFoodAllowed', () => {
    // Mock suspicious pulao claiming 20g protein without protein source
    const fakePulao = {
      name: 'Suspicious Vegetable Pulao',
      category: 'Rice Dishes',
      calories: 200,
      protein: 20.0,
      carbs: 25,
      fat: 2,
      is_verified: false
    };

    expect(isFoodAllowed(fakePulao, 'vegetarian')).toBe(false);
  });

  it('treats missing protein as unknown and rejects the item', () => {
    const missingProtein = { name: 'Unknown Food', category: 'Main Dishes', calories: 200, protein: null };
    const undefinedProtein = { name: 'Unknown Food 2', category: 'Main Dishes', calories: 200, protein: undefined };
    const nanProtein = { name: 'Unknown Food 3', category: 'Main Dishes', calories: 200, protein: NaN };

    expect(isFoodAllowed(missingProtein)).toBe(false);
    expect(isFoodAllowed(undefinedProtein)).toBe(false);
    expect(isFoodAllowed(nanProtein)).toBe(false);
  });

  it('rejects foods with severe Atwater energy discrepancies', () => {
    // Claiming 30 kcal total, but 15g protein + 10g carbs = 100 kcal
    const inconsistentFood = {
      name: 'Corrupted Soup Record',
      category: 'Main Dishes',
      calories: 30,
      protein: 15,
      carbs: 10,
      fat: 1
    };

    expect(isFoodAllowed(inconsistentFood)).toBe(false);
  });

  it('strictly excludes Keema and other meats from vegetarian plans even if previously misclassified', () => {
    const keemaFood = { name: 'Keema', category: 'Non-Veg', calories: 250, protein: 20 };
    expect(isFoodAllowed(keemaFood, 'vegetarian')).toBe(false);
  });

  it('successfully satisfies vegetarian targets using verified whole foods', () => {
    const targets = { calories: 2100, protein: 120, carbs: 230, fat: 65 };
    const vegPlan = generateMealPlan({
      foodData: foods,
      dailyTargets: targets,
      dietaryPreference: 'vegetarian'
    });

    const items = vegPlan.flatMap(m => m.items);
    // All items must be vegetarian
    items.forEach(item => {
      expect(item.category).not.toBe('Non-Veg');
      expect(item.name.toLowerCase()).not.toContain('chicken');
      expect(item.name.toLowerCase()).not.toContain('mutton');
      expect(item.name.toLowerCase()).not.toContain('fish');
      expect(item.name.toLowerCase()).not.toContain('egg');
    });

    // Check that genuine whole-food protein sources are present (paneer, dals, curd, chana, etc.)
    const wholeFoodProteins = items.filter(i => 
      !isProteinShake(i) && 
      (i.protein >= 6 || ['paneer', 'dal', 'yogurt', 'curd', 'chana', 'soya', 'tofu', 'sprouts'].some(k => i.name.toLowerCase().includes(k)))
    );
    expect(wholeFoodProteins.length).toBeGreaterThan(0);

    // Shake servings must be <= 2
    expect(countShakeServings(vegPlan)).toBeLessThanOrEqual(2.0);
  });
});

describe('Meal Plan Preference Questions & Constraints Enforcement', () => {
  const standardTargets = { calories: 2000, protein: 120, carbs: 225, fat: 67 };

  it('Question 1 (Diet): Vegetarian plans contain strictly no non-vegetarian ingredients', () => {
    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      mealPlanPreferences: {
        dietPreference: 'vegetarian',
        shakePreference: 'yes',
        sugarPreference: 'sugar-free'
      }
    });

    const items = plan.flatMap(m => m.items);
    expect(items.length).toBeGreaterThan(0);
    items.forEach(item => {
      expect(item.category).not.toBe('Non-Veg');
      const name = item.name.toLowerCase();
      ['chicken', 'mutton', 'fish', 'egg', 'beef', 'pork', 'prawn', 'keema', 'boti kebab', 'nihari'].forEach(meat => {
        expect(name).not.toContain(meat);
      });
    });
    expect(plan.summary.dietaryPreference).toBe('vegetarian');
  });

  it('Question 1 (Diet): Non-vegetarian plans can include both non-veg and vegetarian foods', () => {
    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      mealPlanPreferences: {
        dietPreference: 'non-vegetarian',
        shakePreference: 'yes',
        sugarPreference: 'sugar-okay'
      }
    });

    const items = plan.flatMap(m => m.items);
    const hasNonVeg = items.some(i => i.category === 'Non-Veg' || ['chicken', 'fish', 'egg', 'meat'].some(k => i.name.toLowerCase().includes(k)));
    const hasVeg = items.some(i => ['Dals & Legumes', 'Breads', 'Rice Dishes', 'Fruits & Vegetables'].includes(i.category));
    expect(hasVeg).toBe(true);
    expect(plan.summary.dietaryPreference).toBe('non-vegetarian');
  });

  it('Question 2 (Shakes): Plans with shakePreference = "no" contain exactly 0 protein shakes', () => {
    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      mealPlanPreferences: {
        dietPreference: 'vegetarian',
        shakePreference: 'no',
        sugarPreference: 'sugar-free'
      }
    });

    const shakes = countShakeServings(plan);
    expect(shakes).toBe(0);
    expect(plan.summary.shakeServings).toBe(0);
    expect(plan.summary.allowProteinShakes).toBe(false);

    // Target must NEVER be reduced because shakes are disabled
    expect(plan.summary.targetProtein).toBe(standardTargets.protein);
    expect(plan.summary.targetCalories).toBe(standardTargets.calories);
  });

  it('Question 2 (Shakes): If high protein target cannot be fully reached without shakes, indicates shortfall without lowering target', () => {
    // Extreme target for vegetarian whole foods: 180g protein in 1800 cals
    const highTargets = { calories: 1800, protein: 180, carbs: 160, fat: 45 };
    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: highTargets,
      mealPlanPreferences: {
        dietPreference: 'vegetarian',
        shakePreference: 'no',
        sugarPreference: 'sugar-free'
      }
    });

    expect(countShakeServings(plan)).toBe(0);
    // Protein target remains strictly 180g
    expect(plan.summary.targetProtein).toBe(180);
    // Explains limitation instead of silently failing
    expect(plan.summary.allTargetsMet).toBe(false);
    expect(plan.summary.unmetTargets.some(t => t.toLowerCase().includes('protein'))).toBe(true);
  });

  it('Question 2 (Shakes): Plans with shakePreference = "yes" never exceed 2 servings across the entire day', () => {
    for (let i = 0; i < 5; i++) {
      const plan = generateMealPlan({
        foodData: foods,
        dailyTargets: { calories: 2300, protein: 155, carbs: 230, fat: 70 },
        planIndex: i,
        mealPlanPreferences: {
          dietPreference: 'vegetarian',
          shakePreference: 'yes',
          sugarPreference: 'sugar-free'
        }
      });
      const shakes = countShakeServings(plan);
      expect(shakes).toBeLessThanOrEqual(2.0);
    }
  });

  it('Question 3 (Sugar): Sugar-free plans exclude added sugars and desserts while preserving natural fruits and plain dairy', () => {
    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      mealPlanPreferences: {
        dietPreference: 'vegetarian',
        shakePreference: 'yes',
        sugarPreference: 'sugar-free'
      }
    });

    const items = plan.flatMap(m => m.items);
    // No dessert items
    items.forEach(item => {
      expect(item.category).not.toBe('Desserts');
      const name = item.name.toLowerCase();
      ['gulab jamun', 'halwa', 'kheer', 'jalebi', 'laddu', 'ladoo', 'barfi', 'chikki', 'ice cream', 'cake'].forEach(sweet => {
        expect(name).not.toContain(sweet);
      });
    });

    // Verify isFoodAllowed does NOT exclude plain milk, curd, or fruit under sugar-free
    const plainMilk = { id: 'milk-1', name: 'Cow Milk, whole', category: 'Dairy & Eggs', calories: 65, protein: 3.2, carbs: 4.8, fat: 3.6 };
    const rawApple = { id: 'apple-1', name: 'Apple, fresh raw', category: 'Fruits & Vegetables', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 };
    const gulabJamun = { id: 'gj-1', name: 'Gulab Jamun', category: 'Desserts', calories: 300, protein: 4, carbs: 50, fat: 10 };

    expect(isFoodAllowed(plainMilk, 'vegetarian', [], { sugarPreference: 'sugar-free' })).toBe(true);
    expect(isFoodAllowed(rawApple, 'vegetarian', [], { sugarPreference: 'sugar-free' })).toBe(true);
    expect(isFoodAllowed(gulabJamun, 'vegetarian', [], { sugarPreference: 'sugar-free' })).toBe(false);
  });

  it('Question 3 (Sugar): Sugar-okay allows desserts in moderation without forcing them into every slot', () => {
    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      mealPlanPreferences: {
        dietPreference: 'vegetarian',
        shakePreference: 'yes',
        sugarPreference: 'sugar-okay'
      }
    });

    // Sugar is allowed, but plan remains nutritionally balanced
    expect(plan.summary.actualCalories).toBeLessThanOrEqual(standardTargets.calories * 1.06);
    expect(plan.summary.sugarPreference).toBe('sugar-okay');

    // Verify isFoodAllowed allows dessert when sugarPreference is sugar-okay
    const gulabJamun = { id: 'gj-1', name: 'Gulab Jamun', category: 'Desserts', calories: 300, protein: 4, carbs: 50, fat: 10 };
    expect(isFoodAllowed(gulabJamun, 'vegetarian', [], { sugarPreference: 'sugar-okay' })).toBe(true);
  });

  it('Regeneration retains active preferences and maintains stable nutrition targets', () => {
    const preferences = {
      dietPreference: 'vegetarian',
      shakePreference: 'no',
      sugarPreference: 'sugar-free'
    };

    const plan1 = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      planIndex: 0,
      mealPlanPreferences: preferences
    });

    const plan2 = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      planIndex: 1,
      mealPlanPreferences: preferences
    });

    // Targets must remain identical
    expect(plan1.summary.targetCalories).toBe(plan2.summary.targetCalories);
    expect(plan1.summary.targetProtein).toBe(plan2.summary.targetProtein);

    // Both plans must preserve preferences
    expect(countShakeServings(plan1)).toBe(0);
    expect(countShakeServings(plan2)).toBe(0);
    expect(plan1.summary.dietaryPreference).toBe('vegetarian');
    expect(plan2.summary.dietaryPreference).toBe('vegetarian');

    // Both plans should produce distinct food selections
    const items1 = plan1.flatMap(m => m.items).map(i => i.id || i.name);
    const items2 = plan2.flatMap(m => m.items).map(i => i.id || i.name);
    const identicalCount = items1.filter(id => items2.includes(id)).length;
    expect(identicalCount).toBeLessThan(items1.length);
  });
});

describe('Food Eligibility, Preparation Metadata, Meat Preferences, and Snack Restrictions', () => {
  const standardTargets = {
    calories: 2000,
    protein: 120,
    carbs: 230,
    fat: 65,
    goal: 'maintain',
    tdee: 2000
  };

  it('1. Raw pulses and uncooked grains never appear as standalone meal-plan entries', () => {
    // Generate multiple plans across iterations and dietary modes
    for (const diet of ['vegetarian', 'non-vegetarian']) {
      for (const idx of [0, 1, 2]) {
        const plan = generateMealPlan({
          foodData: foods,
          dailyTargets: standardTargets,
          planIndex: idx,
          mealPlanPreferences: {
            dietPreference: diet,
            meatPreferences: ['chicken', 'eggs'],
            shakePreference: 'no',
            sugarPreference: 'sugar-free'
          }
        });

        const allItems = plan.flatMap(m => m.items);
        allItems.forEach(item => {
          expect(isRawIngredient(item)).toBe(false);
          expect(item.preparation_state).not.toBe('raw_ingredient');
          expect(item.is_meal_plan_eligible).not.toBe(false);

          const n = (item.name || '').toLowerCase();
          // Raw pulses/grains strictly excluded
          expect(n).not.toMatch(/\b(bengal gram|black gram|green gram|lentil|horse gram|cowpea|rajma|chickpea).*raw\b/i);
          expect(n).not.toMatch(/\braw (rice|atta|maida|flour|dal|wheat|millet)\b/i);
        });
      }
    }
  });

  it('2. Cooked dal, rajma, and chole remain eligible when prepared', () => {
    const cookedDals = foods.filter(f =>
      f.preparation_state === 'prepared_dish' &&
      ['dal tadka', 'dal fry', 'rajma', 'chole', 'sambar'].some(k => (f.name || '').toLowerCase().includes(k))
    );
    expect(cookedDals.length).toBeGreaterThan(0);
    cookedDals.forEach(dish => {
      expect(dish.is_meal_plan_eligible).toBe(true);
      expect(isFoodAllowed(dish, 'vegetarian', [], { sugarPreference: 'sugar-free' })).toBe(true);
    });
  });

  it('3. Raw ingredients remain in catalogue for search and recipe calculations', () => {
    const rawPulse = foods.find(f => f.name.toLowerCase().includes('bengal gram') && f.preparation_state === 'raw_ingredient');
    expect(rawPulse).toBeDefined();
    expect(rawPulse.protein).toBeGreaterThan(15);
    // Ineligible for direct meal planning, but exists in catalogue
    expect(rawPulse.is_meal_plan_eligible).toBe(false);
    expect(isFoodAllowed(rawPulse, 'vegetarian')).toBe(false);
  });

  it('4. Vegetarian plans contain no meat, fish, poultry, or eggs', () => {
    const vegPlan = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      mealPlanPreferences: {
        dietPreference: 'vegetarian',
        shakePreference: 'yes',
        sugarPreference: 'sugar-free'
      }
    });

    const allItems = vegPlan.flatMap(m => m.items);
    allItems.forEach(item => {
      expect(detectMeatType(item)).toBeNull();
      expect(item.category).not.toBe('Non-Veg');
      const n = (item.name || '').toLowerCase();
      expect(['chicken', 'fish', 'mutton', 'prawn', 'egg', 'pork', 'beef', 'lamb', 'stingray']).not.toEqual(
        expect.arrayContaining([expect.stringMatching(new RegExp(`\\b${n}\\b`))])
      );
    });

    const validation = validateMealPlan(vegPlan, { dietaryPreference: 'vegetarian' });
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('5. Egg-and-chicken preferences exclude fish, mutton, and other unselected meats', () => {
    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: { ...standardTargets, protein: 140 },
      mealPlanPreferences: {
        dietPreference: 'non-vegetarian',
        meatPreferences: ['eggs', 'chicken'],
        shakePreference: 'no',
        sugarPreference: 'sugar-free'
      }
    });

    const allItems = plan.flatMap(m => m.items);
    allItems.forEach(item => {
      const meatType = detectMeatType(item);
      if (meatType) {
        expect(['eggs', 'chicken']).toContain(meatType);
        expect(['fish', 'mutton', 'other_meat']).not.toContain(meatType);
      }
    });

    const validation = validateMealPlan(plan, {
      dietaryPreference: 'non-vegetarian',
      meatPreferences: ['eggs', 'chicken']
    });
    expect(validation.isValid).toBe(true);
  });

  it('6. Chicken-only preferences exclude eggs, fish, mutton, and other meats', () => {
    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: { ...standardTargets, protein: 130 },
      mealPlanPreferences: {
        dietPreference: 'non-vegetarian',
        meatPreferences: ['chicken'],
        shakePreference: 'no',
        sugarPreference: 'sugar-free'
      }
    });

    const allItems = plan.flatMap(m => m.items);
    allItems.forEach(item => {
      const meatType = detectMeatType(item);
      if (meatType) {
        expect(meatType).toBe('chicken');
      }
    });

    const validation = validateMealPlan(plan, {
      dietaryPreference: 'non-vegetarian',
      meatPreferences: ['chicken']
    });
    expect(validation.isValid).toBe(true);
  });

  it('7. Snacks recommendations contain only approved snack categories (no stingray, curries, dals, breads)', () => {
    const testPlans = [0, 1, 2, 3].map(idx =>
      generateMealPlan({
        foodData: foods,
        dailyTargets: standardTargets,
        planIndex: idx,
        mealPlanPreferences: {
          dietPreference: 'non-vegetarian',
          meatPreferences: ['chicken', 'fish', 'eggs', 'mutton'],
          shakePreference: 'no',
          sugarPreference: 'sugar-free'
        }
      })
    );

    testPlans.forEach(plan => {
      const snackSlot = plan.find(m => m.meal === 'Snacks');
      expect(snackSlot).toBeDefined();
      expect(snackSlot.items.length).toBeGreaterThan(0);

      snackSlot.items.forEach(item => {
        const n = (item.name || '').toLowerCase();
        // NEVER stingray or meat or fish
        expect(n).not.toContain('stingray');
        expect(detectMeatType(item)).toBeNull();
        expect(item.category).not.toBe('Non-Veg');

        // NEVER main meals or breads
        expect(n).not.toMatch(/\b(curry|dal|sambar|rasam|rajma|chole|biryani|pulao|khichdi|roti|naan|paratha)\b/i);

        // Allowed categories: fruits, yogurt/dairy, dry fruits/nuts, approved snacks
        const isApproved =
          item.preparation_state === 'ready_to_eat_snack' ||
          item.is_snack_eligible === true ||
          item.category === 'Fruits & Vegetables' ||
          item.category === 'Snacks' ||
          ['apple', 'banana', 'orange', 'yogurt', 'curd', 'almond', 'walnut', 'peanut', 'makhana', 'chana', 'sprouts'].some(k => n.includes(k));
        expect(isApproved).toBe(true);
      });
    });
  });

  it('8. Stingray and raw animal cuts cannot appear in meals or snacks', () => {
    const stingray = foods.find(f => (f.name || '').toLowerCase().includes('stingray'));
    expect(stingray).toBeDefined();
    expect(stingray.is_meal_plan_eligible).toBe(false);
    expect(stingray.is_snack_eligible).toBe(false);

    expect(isFoodAllowed(stingray, 'non-vegetarian', [], { meatPreferences: ['fish'] })).toBe(false);
  });

  it('9. Roti and naan are treated as accompaniments/staples by default', () => {
    const roti = foods.find(f => (f.name || '').toLowerCase().includes('roti') && f.is_meal_plan_eligible);
    expect(roti).toBeDefined();
    expect(roti.isSide).toBe(true);
    expect(roti.isMain).toBe(false);

    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      mealPlanPreferences: {
        dietPreference: 'vegetarian',
        shakePreference: 'no',
        sugarPreference: 'sugar-free'
      }
    });

    const lunchOrDinner = plan.filter(m => m.meal === 'Lunch' || m.meal === 'Dinner');
    lunchOrDinner.forEach(slot => {
      slot.items.forEach(item => {
        if ((item.name || '').toLowerCase().includes('roti') || (item.name || '').toLowerCase().includes('naan')) {
          expect(['Accompaniment', 'Carb Staple', 'Side']).toContain(item.role);
          expect(item.role).not.toBe('Main');
        }
      });
    });
  });

  it('10. Regeneration preserves dietary preferences and meat choices', () => {
    const prefs = {
      dietPreference: 'non-vegetarian',
      meatPreferences: ['chicken'],
      shakePreference: 'no',
      sugarPreference: 'sugar-free'
    };

    const plan1 = generateMealPlan({ foodData: foods, dailyTargets: standardTargets, planIndex: 0, mealPlanPreferences: prefs });
    const plan2 = generateMealPlan({ foodData: foods, dailyTargets: standardTargets, planIndex: 1, mealPlanPreferences: prefs });

    expect(plan1.summary.meatPreferences).toEqual(['chicken']);
    expect(plan2.summary.meatPreferences).toEqual(['chicken']);

    [...plan1.flatMap(m => m.items), ...plan2.flatMap(m => m.items)].forEach(item => {
      const meatType = detectMeatType(item);
      if (meatType) {
        expect(meatType).toBe('chicken');
      }
    });
  });

  it('11. Switching to vegetarian clears/ignores meat choices', () => {
    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      mealPlanPreferences: {
        dietPreference: 'vegetarian',
        meatPreferences: ['chicken', 'fish'], // Stale or leftover from previous state
        shakePreference: 'no',
        sugarPreference: 'sugar-free'
      }
    });

    expect(plan.summary.dietaryPreference).toBe('vegetarian');
    expect(plan.summary.meatPreferences).toEqual([]);

    const allItems = plan.flatMap(m => m.items);
    allItems.forEach(item => {
      expect(detectMeatType(item)).toBeNull();
    });
  });

  it('12. Validation function rejects invalid plans with descriptive errors', () => {
    const invalidPlan = [
      {
        meal: 'Lunch',
        items: [
          { name: 'Bengal gram, dal (raw)', preparation_state: 'raw_ingredient', is_meal_plan_eligible: false }
        ]
      },
      {
        meal: 'Snacks',
        items: [
          { name: 'Stingray Fry', category: 'Non-Veg', meat_type: 'fish' }
        ]
      }
    ];

    const result = validateMealPlan(invalidPlan, { dietaryPreference: 'vegetarian' });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
    expect(result.errors.some(e => e.includes('Raw ingredient'))).toBe(true);
    expect(result.errors.some(e => e.includes('Meat or fish dish not permitted as snack') || e.includes('Non-vegetarian'))).toBe(true);
  });
});

describe('Meal Variety, Protein Distribution, Light Snacks, and Beverage Preferences', () => {
  const standardTargets = {
    calories: 2000,
    protein: 120,
    carbs: 230,
    fat: 65,
    goal: 'maintain',
    tdee: 2000
  };

  it('1. The same canonical food cannot appear twice in a daily plan by default', () => {
    for (let idx = 0; idx < 4; idx++) {
      const plan = generateMealPlan({
        foodData: foods,
        dailyTargets: standardTargets,
        planIndex: idx,
        mealPlanPreferences: {
          dietPreference: 'vegetarian',
          shakePreference: 'yes',
          sugarPreference: 'sugar-free',
          beveragePreference: 'no'
        }
      });

      const allItems = plan.flatMap(m => m.items);
      const seenCanonicalIds = new Set();
      const seenDishKeys = new Set();

      allItems.forEach(item => {
        const keys = getFoodKeys(item);
        if (item.canonical_id) {
          expect(seenCanonicalIds.has(item.canonical_id)).toBe(false);
          seenCanonicalIds.add(item.canonical_id);
        }
        keys.forEach(k => {
          expect(seenDishKeys.has(k)).toBe(false);
          seenDishKeys.add(k);
        });
      });

      // Pairwise check using areFoodsDuplicate
      for (let i = 0; i < allItems.length; i++) {
        for (let j = i + 1; j < allItems.length; j++) {
          expect(areFoodsDuplicate(allItems[i], allItems[j])).toBe(false);
        }
      }

      // Validation passes uniqueness rule
      const validation = validateMealPlan(plan, {
        dietaryPreference: 'vegetarian',
        beveragePreference: 'no'
      });
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    }
  });

  it('2. Different valid recipes using the same ingredient can still be selected', () => {
    const paneerBhurji = { id: 'p-1', canonical_id: 'rec_pb', name: 'Paneer Bhurji', category: 'Dairy & Eggs' };
    const paneerTikka = { id: 'p-2', canonical_id: 'rec_pt', name: 'Paneer Tikka', category: 'Dairy & Eggs' };
    const chickenCurry = { id: 'c-1', canonical_id: 'rec_cc', name: 'Chicken Curry', category: 'Non-Veg' };
    const chickenTikka = { id: 'c-2', canonical_id: 'rec_ct', name: 'Chicken Tikka', category: 'Non-Veg' };

    // Same base ingredient, but distinct preparations/canonical recipes
    expect(areFoodsDuplicate(paneerBhurji, paneerTikka)).toBe(false);
    expect(areFoodsDuplicate(chickenCurry, chickenTikka)).toBe(false);

    // Identical dishes with slightly different naming/aliases ARE flagged as duplicates
    const roti1 = { id: 'r-1', name: 'Whole Wheat Roti', category: 'Breads' };
    const roti2 = { id: 'r-2', name: 'Roti (Whole Wheat)', category: 'Breads' };
    expect(areFoodsDuplicate(roti1, roti2)).toBe(true);

    const yogurt1 = { id: 'y-1', name: 'Greek Yogurt', category: 'Dairy & Eggs' };
    const yogurt2 = { id: 'y-2', name: 'Greek Yogurt (Plain)', category: 'Dairy & Eggs' };
    expect(areFoodsDuplicate(yogurt1, yogurt2)).toBe(true);
  });

  it('3. At least 80% of daily protein is targeted from breakfast, lunch, and dinner combined', () => {
    for (const diet of ['vegetarian', 'non-vegetarian']) {
      const plan = generateMealPlan({
        foodData: foods,
        dailyTargets: standardTargets,
        mealPlanPreferences: {
          dietPreference: diet,
          meatPreferences: ['chicken', 'eggs'],
          shakePreference: 'no',
          sugarPreference: 'sugar-free',
          beveragePreference: 'no'
        }
      });

      const dist = plan.summary.proteinDistribution;
      expect(dist).toBeDefined();
      expect(dist.mainMealsRatio).toBeGreaterThanOrEqual(0.80);
      expect(dist.mainMealsProtein).toBeGreaterThanOrEqual(dist.totalProtein * 0.80);
    }
  });

  it('4. Snacks contribute no more than 20% of daily protein when feasible', () => {
    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      mealPlanPreferences: {
        dietPreference: 'vegetarian',
        shakePreference: 'no',
        sugarPreference: 'sugar-free',
        beveragePreference: 'no'
      }
    });

    const dist = plan.summary.proteinDistribution;
    expect(dist).toBeDefined();
    expect(dist.snackRatio).toBeLessThanOrEqual(0.20);
    expect(dist.isMet).toBe(true);
  });

  it('5. Snacks remain light and do not contain main dishes, breads, or curries', () => {
    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      mealPlanPreferences: {
        dietPreference: 'vegetarian',
        shakePreference: 'no',
        sugarPreference: 'sugar-free',
        beveragePreference: 'no'
      }
    });

    const snackSlot = plan.find(m => m.meal === 'Snacks');
    expect(snackSlot).toBeDefined();
    expect(snackSlot.items.length).toBeGreaterThan(0);

    // Snack calories should be light (< 25% of daily calories)
    expect(snackSlot.totalCalories).toBeLessThanOrEqual(standardTargets.calories * 0.25);

    snackSlot.items.forEach(item => {
      const n = (item.name || '').toLowerCase();
      // No heavy curries, dals, breads, or rice main meals
      expect(n).not.toMatch(/\b(curry|dal|sambar|rasam|rajma|chole|biryani|pulao|khichdi|roti|naan|paratha)\b/i);
      expect(item.role).not.toBe('Main');
      // Should be light fruit, yogurt, nuts, or ready-to-eat snack
      const isLight =
        item.category === 'Fruits & Vegetables' ||
        item.category === 'Snacks' ||
        item.is_snack_eligible === true ||
        ['apple', 'banana', 'orange', 'yogurt', 'curd', 'almond', 'walnut', 'peanut', 'makhana', 'chana', 'sprouts'].some(k => n.includes(k));
      expect(isLight).toBe(true);
    });
  });

  it('6. Greek yogurt uses correct product-specific nutrition and configured serving size', () => {
    const greekYogurts = foods.filter(f => (f.name || '').toLowerCase().includes('greek yogurt'));
    expect(greekYogurts.length).toBeGreaterThan(0);

    greekYogurts.forEach(gy => {
      // Greek yogurt per 100g is typically 8-12g protein, NEVER 30g
      expect(gy.protein).toBeLessThanOrEqual(15.0);
      expect(gy.protein).not.toBe(30);
      // Serving size should be configured around 100g
      if (gy.serving_size_g) {
        expect(gy.serving_size_g).toBe(100);
      }
    });
  });

  it('7. Greek yogurt can appear in a suitable main meal or snack, but never twice in the same day', () => {
    // Check eligibility
    const plainGreekYogurt = foods.find(f => (f.name || '').toLowerCase() === 'greek yogurt (plain)' || (f.name || '').toLowerCase() === 'greek yogurt');
    expect(plainGreekYogurt).toBeDefined();
    expect(isFoodAllowed(plainGreekYogurt, 'vegetarian')).toBe(true);

    // If Greek yogurt is selected in a plan, ensure it appears at most once across the entire day
    for (let idx = 0; idx < 5; idx++) {
      const plan = generateMealPlan({
        foodData: foods,
        dailyTargets: standardTargets,
        planIndex: idx,
        mealPlanPreferences: {
          dietPreference: 'vegetarian',
          shakePreference: 'no',
          sugarPreference: 'sugar-free'
        }
      });

      const gyItems = plan.flatMap(m => m.items).filter(i => (i.name || '').toLowerCase().includes('greek yogurt'));
      expect(gyItems.length).toBeLessThanOrEqual(1);
    }
  });

  it('8. Caloric beverages are excluded when the user opts out', () => {
    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      mealPlanPreferences: {
        dietPreference: 'non-vegetarian',
        meatPreferences: ['chicken', 'fish', 'eggs'],
        shakePreference: 'yes',
        sugarPreference: 'sugar-okay',
        beveragePreference: 'no'
      }
    });

    expect(plan.summary.beveragePreference).toBe('no');

    const allItems = plan.flatMap(m => m.items);
    allItems.forEach(item => {
      expect(isCaloricBeverage(item)).toBe(false);
      const n = (item.name || '').toLowerCase();
      expect(n).not.toMatch(/\b(milkshake|juice|smoothie|lassi|sharbat|cold drink|soda)\b/i);
    });

    // Directly test isCaloricBeverage on caloric drinks
    const milkshake = { name: 'Orange Milkshake', category: 'Beverages', calories: 180, protein: 4, carbs: 30, fat: 5 };
    const juice = { name: 'Mango Juice', category: 'Beverages', calories: 120, protein: 1, carbs: 28, fat: 0 };
    const sweetenedMilk = { name: 'Badam Milk', category: 'Beverages', calories: 160, protein: 6, carbs: 20, fat: 6 };
    expect(isCaloricBeverage(milkshake)).toBe(true);
    expect(isCaloricBeverage(juice)).toBe(true);
    expect(isCaloricBeverage(sweetenedMilk)).toBe(true);

    expect(isFoodAllowed(milkshake, 'all', [], { beveragePreference: 'no' })).toBe(false);
    expect(isFoodAllowed(juice, 'all', [], { beveragePreference: 'no' })).toBe(false);
    expect(isFoodAllowed(sweetenedMilk, 'all', [], { beveragePreference: 'no' })).toBe(false);
  });

  it('9. Zero-calorie beverages and solid whole fruits remain allowed when caloric beverages are disabled', () => {
    const water = { name: 'Water', category: 'Beverages', calories: 0, protein: 0, carbs: 0, fat: 0 };
    const rawApple = { name: 'Apple, fresh raw', category: 'Fruits & Vegetables', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 };
    const plainCurd = { name: 'Curd / Plain Dahi', category: 'Dairy & Eggs', calories: 60, protein: 3.5, carbs: 4.5, fat: 3.0 };
    const oatsWithMilk = { name: 'Oats with Milk', category: 'Breakfast', calories: 250, protein: 9, carbs: 40, fat: 4, role: 'Main' };

    expect(isCaloricBeverage(water)).toBe(false);
    expect(isCaloricBeverage(rawApple)).toBe(false);
    expect(isCaloricBeverage(plainCurd)).toBe(false);
    expect(isCaloricBeverage(oatsWithMilk)).toBe(false);

    expect(isFoodAllowed(water, 'all', [], { beveragePreference: 'no' })).toBe(true);
    expect(isFoodAllowed(rawApple, 'all', [], { beveragePreference: 'no' })).toBe(true);
    expect(isFoodAllowed(plainCurd, 'all', [], { beveragePreference: 'no' })).toBe(true);
    expect(isFoodAllowed(oatsWithMilk, 'all', [], { beveragePreference: 'no' })).toBe(true);
  });

  it('10. Caloric beverages are permitted in moderation when the user selects "yes"', () => {
    const milkshake = { name: 'Banana Milkshake', category: 'Beverages', calories: 180, protein: 5, carbs: 32, fat: 4 };
    expect(isFoodAllowed(milkshake, 'all', [], { beveragePreference: 'yes' })).toBe(true);
  });

  it('11. Regeneration preserves beverage preference, nutrition targets, and food variety', () => {
    const prefs = {
      dietPreference: 'vegetarian',
      shakePreference: 'no',
      sugarPreference: 'sugar-free',
      beveragePreference: 'no'
    };

    const plan1 = generateMealPlan({ foodData: foods, dailyTargets: standardTargets, planIndex: 0, mealPlanPreferences: prefs });
    const plan2 = generateMealPlan({ foodData: foods, dailyTargets: standardTargets, planIndex: 1, mealPlanPreferences: prefs });

    // Preference preserved
    expect(plan1.summary.beveragePreference).toBe('no');
    expect(plan2.summary.beveragePreference).toBe('no');

    // Targets strictly stable
    expect(plan1.summary.targetCalories).toBe(standardTargets.calories);
    expect(plan2.summary.targetCalories).toBe(standardTargets.calories);
    expect(plan1.summary.targetProtein).toBe(standardTargets.protein);
    expect(plan2.summary.targetProtein).toBe(standardTargets.protein);

    // Variety: distinct selections across regenerations
    const items1 = plan1.flatMap(m => m.items).map(i => i.id || i.name);
    const items2 = plan2.flatMap(m => m.items).map(i => i.id || i.name);
    const differentFoods = items1.some(id => !items2.includes(id));
    expect(differentFoods).toBe(true);
  });

  it('12. Existing meal logging, saved plans, and dashboard calculations continue working with standard data shape', () => {
    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      mealPlanPreferences: {
        dietPreference: 'vegetarian',
        shakePreference: 'yes',
        sugarPreference: 'sugar-free',
        beveragePreference: 'no'
      }
    });

    expect(Array.isArray(plan)).toBe(true);
    expect(plan).toHaveLength(4);

    const mealNames = plan.map(m => m.meal);
    expect(mealNames).toEqual(['Breakfast', 'Lunch', 'Dinner', 'Snacks']);

    plan.forEach(slot => {
      expect(typeof slot.meal).toBe('string');
      expect(Array.isArray(slot.items)).toBe(true);
      expect(typeof slot.totalCalories).toBe('number');
      expect(typeof slot.totalProtein).toBe('number');
      expect(typeof slot.totalCarbs).toBe('number');
      expect(typeof slot.totalFat).toBe('number');

      slot.items.forEach(item => {
        expect(typeof item.name).toBe('string');
        expect(typeof item.calories).toBe('number');
        expect(typeof item.protein).toBe('number');
        expect(typeof item.carbs).toBe('number');
        expect(typeof item.fat).toBe('number');
        expect(typeof item.portion).toBe('string');
      });
    });

    expect(plan.summary).toBeDefined();
    expect(typeof plan.summary.actualCalories).toBe('number');
    expect(typeof plan.summary.actualProtein).toBe('number');
    expect(typeof plan.summary.proteinDistribution).toBe('object');
  });
});

describe('Meal-Time Appropriateness and Role Classification (Acceptance Criteria)', () => {
  const standardTargets = { calories: 2000, protein: 110, carbs: 230, fat: 65 };

  // Criterion 1: Breakfast never contains conventional curry, sabzi, roti, naan, or lunch/dinner rice dishes by default
  it('1. Strictly excludes conventional curries, sabzis, breads, and rice from breakfast', () => {
    const disallowedBreakfastItems = [
      { name: 'Paneer Butter Masala', category: 'Main Dishes' },
      { name: 'Chicken Tikka Masala', category: 'Non-Veg' },
      { name: 'Aloo Gobi Sabzi', category: 'Vegetables' },
      { name: 'Bhindi Masala Sabzi', category: 'Vegetables' },
      { name: 'Whole Wheat Roti', category: 'Breads' },
      { name: 'Tandoori Naan', category: 'Breads' },
      { name: 'Steamed Basmati Rice', category: 'Rice Dishes' },
      { name: 'Dal Tadka', category: 'Dals & Legumes' },
      { name: 'Rajma Masala', category: 'Dals & Legumes' },
      { name: 'Chole', category: 'Dals & Legumes' }
    ];

    disallowedBreakfastItems.forEach(item => {
      expect(isBreakfastAppropriate(item)).toBe(false);
      expect(isFoodEligibleForMeal(item, 'Breakfast')).toBe(false);
    });

    // Verify in generated plans across multiple seeds
    for (let i = 0; i < 5; i++) {
      const plan = generateMealPlan({
        foodData: foods,
        dailyTargets: standardTargets,
        dietaryPreference: 'vegetarian',
        planIndex: i
      });

      const breakfast = plan.find(m => m.meal === 'Breakfast');
      expect(breakfast).toBeDefined();

      breakfast.items.forEach(it => {
        const n = it.name.toLowerCase();
        expect(n).not.toMatch(/\b(curry|sabzi|subzi|kadhai|makhani|korma)\b/i);
        expect(n).not.toMatch(/\b(roti|chapati|naan|phulka|kulcha)\b/i);
        expect(n).not.toMatch(/\b(steamed basmati rice|plain rice|boiled rice)\b/i);
        expect(n).not.toMatch(/\b(dal tadka|dal fry|dal makhani|rajma|chole)\b/i);
      });
    }
  });

  // Criterion 2: Genuine breakfast preparations remain eligible according to their recipe classification
  it('2. Keeps genuine breakfast preparations eligible for breakfast', () => {
    const validBreakfastItems = [
      { name: 'Poha', category: 'Breakfast' },
      { name: 'Vegetable Upma', category: 'Breakfast' },
      { name: 'Masala Dosa', category: 'Breakfast' },
      { name: 'Idli with Chutney', category: 'Breakfast' },
      { name: 'Oats with Milk', category: 'Breakfast' },
      { name: 'Moong Dal Cheela', category: 'Breakfast' },
      { name: 'Paneer Paratha', category: 'Breakfast' },
      { name: 'Egg Bhurji', category: 'Dairy & Eggs' },
      { name: 'Greek Yogurt Bowl', category: 'Dairy & Eggs' }
    ];

    validBreakfastItems.forEach(item => {
      expect(isBreakfastAppropriate(item)).toBe(true);
      expect(isFoodEligibleForMeal(item, 'Breakfast')).toBe(true);
    });
  });

  // Criterion 3: Lunch and dinner can combine appropriate mains with roti, naan, rice, and other staples
  it('3. Combines appropriate mains with roti, naan, rice, and staples in lunch and dinner', () => {
    for (let i = 0; i < 5; i++) {
      const plan = generateMealPlan({
        foodData: foods,
        dailyTargets: standardTargets,
        dietaryPreference: 'vegetarian',
        planIndex: i
      });

      const lunch = plan.find(m => m.meal === 'Lunch');
      const dinner = plan.find(m => m.meal === 'Dinner');

      [lunch, dinner].forEach(slot => {
        expect(slot.items.length).toBeGreaterThanOrEqual(2);
        const roles = slot.items.map(it => it.role);
        expect(roles).toContain('Main');
        expect(roles).toContain('Carb Staple');

        // Confirm main item is a cooked main
        const mainItem = slot.items.find(it => it.role === 'Main');
        expect(isLunchDinnerMainAppropriate(mainItem)).toBe(true);

        // Confirm carb staple is a staple (bread or rice)
        const carbItem = slot.items.find(it => it.role === 'Carb Staple');
        expect(isLunchDinnerStapleAppropriate(carbItem)).toBe(true);
      });
    }
  });

  // Criterion 4: Staples are not repeatedly selected as standalone main dishes
  it('4. Classifies staples correctly and does not select them as standalone mains', () => {
    const staples = [
      { name: 'Whole Wheat Roti', category: 'Breads' },
      { name: 'Tandoori Naan', category: 'Breads' },
      { name: 'Steamed Rice', category: 'Rice Dishes' },
      { name: 'Jeera Rice', category: 'Rice Dishes' },
      { name: 'Vegetable Pulao', category: 'Rice Dishes' }
    ];

    staples.forEach(item => {
      expect(isLunchDinnerStapleAppropriate(item)).toBe(true);
      expect(isLunchDinnerMainAppropriate(item)).toBe(false);
      expect(classifyMealRole(item)).toBe(MEAL_ROLES.STAPLE);
    });
  });

  // Criterion 5: Vegetarian and non-vegetarian preferences remain enforced
  it('5. Strictly enforces vegetarian vs non-vegetarian preferences', () => {
    const vegPlan = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      dietaryPreference: 'vegetarian',
      planIndex: 0
    });

    vegPlan.forEach(slot => {
      slot.items.forEach(it => {
        expect(it.category).not.toBe('Non-Veg');
        expect(it.meat_type).toBeFalsy();
      });
    });

    const nonVegPlan = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      dietaryPreference: 'non-vegetarian',
      meatPreferences: ['chicken', 'fish'],
      planIndex: 0
    });

    expect(nonVegPlan.summary.validation.isValid).toBe(true);
    nonVegPlan.forEach(slot => {
      slot.items.forEach(it => {
        if (it.meat_type) {
          expect(['chicken', 'fish']).toContain(it.meat_type);
        }
      });
    });
  });

  // Criterion 6: Meal-time restrictions never get bypassed to satisfy macro targets
  it('6. Never bypasses meal-time appropriateness to satisfy high macro targets', () => {
    const highProteinTargets = { calories: 2300, protein: 150, carbs: 220, fat: 70 };

    for (let i = 0; i < 4; i++) {
      const plan = generateMealPlan({
        foodData: foods,
        dailyTargets: highProteinTargets,
        dietaryPreference: 'vegetarian',
        planIndex: i
      });

      const breakfast = plan.find(m => m.meal === 'Breakfast');
      breakfast.items.forEach(it => {
        expect(isBreakfastAppropriate(it)).toBe(true);
      });

      const snacks = plan.find(m => m.meal === 'Snacks');
      snacks.items.forEach(it => {
        expect(isSnackAppropriate(it)).toBe(true);
      });
    }
  });

  // Criterion 7: Calorie, protein, carbohydrate, and fat totals remain correct
  it('7. Calorie, protein, carbohydrate, and fat totals match slot sums and target bounds', () => {
    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      dietaryPreference: 'vegetarian',
      planIndex: 0
    });

    let sumCals = 0;
    let sumProt = 0;
    let sumCarbs = 0;
    let sumFat = 0;

    plan.forEach(slot => {
      let slotCals = 0;
      let slotProt = 0;
      let slotCarbs = 0;
      let slotFat = 0;

      slot.items.forEach(it => {
        slotCals += it.calories;
        slotProt += it.protein;
        slotCarbs += it.carbs;
        slotFat += it.fat;
      });

      expect(slot.totalCalories).toBe(Math.round(slotCals));
      expect(slot.totalProtein).toBe(Math.round(slotProt * 10) / 10);
      expect(slot.totalCarbs).toBe(Math.round(slotCarbs * 10) / 10);
      expect(slot.totalFat).toBe(Math.round(slotFat * 10) / 10);

      sumCals += slot.totalCalories;
      sumProt += slot.totalProtein;
      sumCarbs += slot.totalCarbs;
      sumFat += slot.totalFat;
    });

    expect(plan.summary.actualCalories).toBe(Math.round(sumCals));
    expect(plan.summary.actualProtein).toBe(Math.round(sumProt * 10) / 10);
    expect(plan.summary.actualCarbs).toBe(Math.round(sumCarbs * 10) / 10);
    expect(plan.summary.actualFat).toBe(Math.round(sumFat * 10) / 10);
  });

  // Criterion 8: Food uniqueness, light-snack, beverage, and protein-shake constraints still work
  it('8. Enforces food uniqueness, light snacks, and protein shake limits', () => {
    const plan = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      dietaryPreference: 'vegetarian',
      planIndex: 0
    });

    // Uniqueness
    const allItems = plan.flatMap(m => m.items);
    for (let i = 0; i < allItems.length; i++) {
      for (let j = i + 1; j < allItems.length; j++) {
        expect(areFoodsDuplicate(allItems[i], allItems[j])).toBe(false);
      }
    }

    // Light snacks <= 20% total protein
    const snackMeal = plan.find(m => m.meal === 'Snacks');
    const snackProt = snackMeal.items.reduce((s, it) => s + (it.protein || 0), 0);
    expect(snackProt).toBeLessThanOrEqual(plan.summary.actualProtein * 0.205);

    // Protein shake <= 2 servings
    const shakes = countShakeServings(plan);
    expect(shakes).toBeLessThanOrEqual(2.0);
  });

  // Criterion 9: Regeneration preserves targets and preferences
  it('9. Regeneration preserves targets and preferences across cycles', () => {
    const prefs = {
      dietPreference: 'vegetarian',
      shakePreference: 'yes',
      sugarPreference: 'sugar-free',
      beveragePreference: 'yes'
    };

    const planA = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      mealPlanPreferences: prefs,
      planIndex: 0
    });

    const planB = generateMealPlan({
      foodData: foods,
      dailyTargets: standardTargets,
      mealPlanPreferences: prefs,
      planIndex: 1
    });

    expect(planA.summary.targetCalories).toBe(standardTargets.calories);
    expect(planB.summary.targetCalories).toBe(standardTargets.calories);
    expect(planA.summary.targetProtein).toBe(standardTargets.protein);
    expect(planB.summary.targetProtein).toBe(standardTargets.protein);
    expect(planA.summary.mealPlanPreferences.dietPreference).toBe('vegetarian');
    expect(planB.summary.mealPlanPreferences.dietPreference).toBe('vegetarian');

    // Breakfast appropriateness preserved across both
    [planA, planB].forEach(plan => {
      const bSlot = plan.find(m => m.meal === 'Breakfast');
      bSlot.items.forEach(it => {
        expect(isBreakfastAppropriate(it)).toBe(true);
      });
    });
  });

  // Criterion 10: Normalized classification layer correctly assigns roles and eligible meals
  it('10. Normalized classification layer assigns valid roles and meal-time eligibility', () => {
    const sampleFoods = [
      { name: 'Masala Dosa', category: 'Breakfast' },
      { name: 'Palak Paneer', category: 'Main Dishes' },
      { name: 'Whole Wheat Roti', category: 'Breads' },
      { name: 'Cucumber Raita', category: 'Soups & Salads' },
      { name: 'Roasted Almonds', category: 'Snacks' },
      { name: 'Protein Shake', category: 'Beverages' },
      { name: 'Gulab Jamun', category: 'Desserts' },
      { name: 'Masala Chai', category: 'Beverages' }
    ];

    sampleFoods.forEach(food => {
      const role = classifyMealRole(food);
      expect(Object.values(MEAL_ROLES)).toContain(role);

      const eligibleMeals = classifyEligibleMeals(food);
      expect(Array.isArray(eligibleMeals)).toBe(true);
      eligibleMeals.forEach(meal => {
        expect(Object.values(MEAL_SLOTS)).toContain(meal);
      });
    });
  });
});



