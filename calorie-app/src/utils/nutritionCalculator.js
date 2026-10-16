/**
 * MacroMitra Unified Nutrition Calculation Engine & Recipe Single Source of Truth
 *
 * Provides authoritative nutrient calculations and portion scaling across:
 * - Food Database / Catalogue
 * - Meal Planner Generation
 * - Meal Logging
 * - Daily Goals Dashboard
 * - Saved Meal Plans
 *
 * References:
 * - ICMR-NIN Indian Food Composition Tables (IFCT 2017)
 *   M001 (Egg, poultry, whole, raw): 134.8 kcal, 13.28g P, 0g C, 9.15g F per 100g
 *   M004 (Egg, poultry, whole, boiled): 147.7 kcal, 13.43g P, 0g C, 10.54g F per 100g
 *   1 standard large egg edible portion = 50g
 */

export const EGG_NUTRITION = {
  // IFCT 2017 M001: Raw poultry whole egg
  RAW_100G: {
    calories: 134.8,
    protein: 13.28,
    carbs: 0.0,
    fat: 9.15,
  },
  // IFCT 2017 M004: Boiled poultry whole egg
  BOILED_100G: {
    calories: 147.7,
    protein: 13.43,
    carbs: 0.0,
    fat: 10.54,
  },
  // 1 standard large egg edible weight is 50g
  RAW_LARGE_EGG_50G: {
    edibleWeightG: 50,
    calories: 67.4,
    protein: 6.64,
    carbs: 0.0,
    fat: 4.58,
  },
  BOILED_LARGE_EGG_50G: {
    edibleWeightG: 50,
    calories: 73.85,
    protein: 6.72,
    carbs: 0.0,
    fat: 5.27,
  },
};

/**
 * Authentic Indian Egg Recipe Ingredient Breakdowns
 */
export const RECIPE_DEFINITIONS = {
  egg_bhurji: {
    id: 'recipe-egg-bhurji',
    name: 'Egg Bhurji (2 eggs)',
    baseEggs: 2,
    baseServings: 1,
    servingSizeG: 120,
    ingredients: [
      { name: 'Whole Eggs (raw)', quantityG: 100, calories: 134.8, protein: 13.28, carbs: 0.0, fat: 9.15 },
      { name: 'Onion, chopped', quantityG: 30, calories: 12.0, protein: 0.33, carbs: 2.79, fat: 0.03 },
      { name: 'Tomato, chopped', quantityG: 25, calories: 4.5, protein: 0.23, carbs: 0.98, fat: 0.05 },
      { name: 'Green Chili & Spices', quantityG: 5, calories: 2.2, protein: 0.10, carbs: 0.45, fat: 0.02 },
      { name: 'Vegetable Cooking Oil', quantityG: 4.5, calories: 40.5, protein: 0.0, carbs: 0.0, fat: 4.5 },
    ],
    // Total for 2 eggs base recipe: 194.0 kcal (standardized 190 kcal), 13.94g P (~14g), 4.22g C (~4g), 13.75g F (~14g)
    totals: {
      calories: 190.0,
      protein: 14.0,
      carbs: 4.0,
      fat: 14.0,
    },
  },
  boiled_eggs: {
    id: 'recipe-boiled-eggs',
    name: 'Boiled Eggs (2 eggs)',
    baseEggs: 2,
    baseServings: 1,
    servingSizeG: 100,
    ingredients: [
      { name: 'Whole Eggs (boiled)', quantityG: 100, calories: 147.7, protein: 13.43, carbs: 0.0, fat: 10.54 },
    ],
    totals: {
      calories: 147.7,
      protein: 13.43,
      carbs: 0.0,
      fat: 10.54,
    },
  },
  plain_omelette: {
    id: 'recipe-plain-omelette',
    name: 'Omelette (2 eggs)',
    baseEggs: 2,
    baseServings: 1,
    servingSizeG: 105,
    ingredients: [
      { name: 'Whole Eggs (raw)', quantityG: 100, calories: 134.8, protein: 13.28, carbs: 0.0, fat: 9.15 },
      { name: 'Vegetable Cooking Oil', quantityG: 5.0, calories: 45.0, protein: 0.0, carbs: 0.0, fat: 5.0 },
    ],
    totals: {
      calories: 180.0,
      protein: 13.3,
      carbs: 0.5,
      fat: 14.2,
    },
  },
  egg_curry: {
    id: 'recipe-egg-curry',
    name: 'Egg Curry (2 eggs)',
    baseEggs: 2,
    baseServings: 1,
    servingSizeG: 220,
    ingredients: [
      { name: 'Whole Eggs (boiled)', quantityG: 100, calories: 147.7, protein: 13.43, carbs: 0.0, fat: 10.54 },
      { name: 'Onion-Tomato Masala Gravy', quantityG: 115, calories: 45.0, protein: 1.5, carbs: 7.0, fat: 1.5 },
      { name: 'Cooking Oil', quantityG: 5.0, calories: 45.0, protein: 0.0, carbs: 0.0, fat: 5.0 },
    ],
    totals: {
      calories: 237.7,
      protein: 14.93,
      carbs: 7.0,
      fat: 17.04,
    },
  },
};

/**
 * Calculates recipe nutrition dynamically when adding or removing eggs.
 * Proportional scaling ensures:
 * - Adding a 3rd egg to a 2-egg dish adds exactly 1 egg's nutrients (+67.4 kcal raw / +73.85 boiled, +6.64g P / +6.72g boiled).
 * - Spices, aromatics, and base oil remain recipe-proportional.
 */
export const calculateRecipeNutritionByEggCount = (recipeKey, eggCount = 2) => {
  const recipe = RECIPE_DEFINITIONS[recipeKey];
  if (!recipe) {
    // Fallback to pure eggs if recipe unknown
    const p = Math.round(eggCount * EGG_NUTRITION.RAW_LARGE_EGG_50G.protein * 10) / 10;
    const cals = Math.round(eggCount * EGG_NUTRITION.RAW_LARGE_EGG_50G.calories);
    const fat = Math.round(eggCount * EGG_NUTRITION.RAW_LARGE_EGG_50G.fat * 10) / 10;
    return { calories: cals, protein: p, carbs: 0, fat };
  }

  const baseEggs = recipe.baseEggs || 2;
  const isBoiled = recipeKey === 'boiled_eggs' || recipeKey === 'egg_curry';
  const eggUnit = isBoiled ? EGG_NUTRITION.BOILED_LARGE_EGG_50G : EGG_NUTRITION.RAW_LARGE_EGG_50G;

  const extraEggs = eggCount - baseEggs;
  const extraCals = extraEggs * eggUnit.calories;
  const extraProt = extraEggs * eggUnit.protein;
  const extraFat = extraEggs * eggUnit.fat;

  return {
    calories: Math.round(recipe.totals.calories + extraCals),
    protein: Math.round((recipe.totals.protein + extraProt) * 10) / 10,
    carbs: Math.round(recipe.totals.carbs * 10) / 10,
    fat: Math.round((recipe.totals.fat + extraFat) * 10) / 10,
    servingSizeG: Math.round(recipe.servingSizeG + (extraEggs * 50)),
  };
};

/**
 * Authoritative item calculation function.
 * Handles both 100g and serving based items, supporting varied units (g, ml, serving, bowl, pieces).
 *
 * @param {Object} food - Food catalogue record
 * @param {number} quantity - Amount requested
 * @param {string} unit - Measurement unit
 * @returns {Object} Calculated nutrients and resolved multiplier
 */
export const calculateItemNutrition = (food, quantity = 1, unit = null) => {
  if (!food) {
    return { multiplier: 0, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }

  const numQty = Math.max(0, parseFloat(quantity) || 0);
  const isPer100g = food.serving_basis === '100g';
  const resolvedUnit = unit ? unit.trim().toLowerCase() : (isPer100g ? 'g' : (food.serving_unit || 'serving').toLowerCase());

  let multiplier = 1.0;

  if (isPer100g) {
    if (resolvedUnit === 'g' || resolvedUnit === 'grams' || resolvedUnit === 'ml') {
      multiplier = numQty / 100.0;
    } else if (resolvedUnit === 'serving' || resolvedUnit === 'servings' || resolvedUnit === 'bowl' || resolvedUnit === 'cup') {
      const servingG = food.serving_size_g || 100.0;
      multiplier = (numQty * servingG) / 100.0;
    } else {
      // Default assume grams if number is > 10, else servings of 100g
      multiplier = numQty > 10 ? (numQty / 100.0) : numQty;
    }
  } else {
    // Serving-based record
    if (resolvedUnit === 'g' || resolvedUnit === 'grams') {
      const servingG = food.serving_size_g || 100.0;
      multiplier = numQty / servingG;
    } else {
      // Direct serving multiplier (1 serving, 2 servings, 1 piece, etc.)
      multiplier = numQty;
    }
  }

  // Base values from food item
  const baseCals = food.base_calories ?? (food.portionMultiplier ? food.calories / food.portionMultiplier : food.calories) ?? 0;
  const baseProt = food.base_protein ?? (food.portionMultiplier ? food.protein / food.portionMultiplier : food.protein) ?? 0;
  const baseCarbs = food.base_carbs ?? (food.portionMultiplier ? (food.carbs || 0) / food.portionMultiplier : (food.carbs || 0));
  const baseFat = food.base_fat ?? (food.portionMultiplier ? (food.fat || 0) / food.portionMultiplier : (food.fat || 0));
  const baseFiber = food.base_fiber ?? (food.portionMultiplier ? (food.fiber || 0) / food.portionMultiplier : (food.fiber || 0));

  return {
    multiplier,
    calories: Math.round(baseCals * multiplier),
    protein: Math.round(baseProt * multiplier * 10) / 10,
    carbs: Math.round(baseCarbs * multiplier * 10) / 10,
    fat: Math.round(baseFat * multiplier * 10) / 10,
    fiber: baseFiber !== null && baseFiber !== undefined ? Math.round(baseFiber * multiplier * 10) / 10 : 0,
  };
};

/**
 * Formats a scaled food item for UI presentation, dynamically adjusting names and portion
 * descriptions when portion multipliers scale dish quantities.
 *
 * Prevents misleading UI displays such as "Egg Bhurji (2 eggs)" with 28g protein / 380 kcal
 * by dynamically updating the display name to "Egg Bhurji (4 eggs)" and displaying the portion as
 * "4 eggs (2 servings, ~240g)".
 *
 * @param {Object} food - The base food item
 * @param {number} portionMultiplier - The scale factor from the optimizer
 * @returns {Object} Scaled item attributes
 */
export const formatScaledFoodDisplay = (food, portionMultiplier = 1) => {
  const mult = Math.max(0.1, Math.round(portionMultiplier * 10) / 10);
  const is100g = food.serving_basis === '100g';
  const name = food.name || '';
  const nl = name.toLowerCase();

  const portionGrams = is100g
    ? Math.round(100 * mult)
    : (food.serving_size_g ? Math.round(food.serving_size_g * mult) : Math.round(100 * mult));
  const portionServings = !is100g ? mult : Math.round((portionGrams / (food.serving_size_g || 100)) * 10) / 10;

  let displayName = name;
  let displayPortion = '';

  // 1. Egg dish scaling (e.g., Egg Bhurji (2 eggs), Boiled Eggs (2 eggs), Omelette (2 eggs))
  const eggCountMatch = name.match(/^(.*?)\s*\((\d+)\s*eggs?\)(.*)$/i);
  if (eggCountMatch) {
    const baseDish = eggCountMatch[1].trim();
    const suffix = eggCountMatch[3].trim();
    const baseEggCount = parseInt(eggCountMatch[2], 10);
    const scaledEggCount = Math.max(1, Math.round(baseEggCount * mult));
    const eggWord = scaledEggCount === 1 ? 'egg' : 'eggs';

    displayName = `${baseDish} (${scaledEggCount} ${eggWord})${suffix ? ` ${suffix}` : ''}`;
    const servingStr = mult === 1 ? '1 serving' : `${mult} servings`;
    displayPortion = `${scaledEggCount} ${eggWord} (${servingStr}, ~${portionGrams}g)`;
  } else if (nl.includes('greek yogurt') || nl.includes('plain yogurt') || nl.includes('curd') || nl.includes('dahi')) {
    // 2. Greek yogurt / Curd portion scaling
    const servingStr = mult === 1 ? '1 serving' : `${mult} servings`;
    displayPortion = `${portionGrams}g (${servingStr})`;
  } else if (is100g) {
    // 3. Standard 100g foods
    displayPortion = `${portionGrams}g`;
  } else {
    // 4. Standard serving foods
    const cleanUnit = (food.serving_unit || 'serving').replace(/^\d+\s*/, '').trim();
    const pluralUnit = (mult > 1 && !cleanUnit.endsWith('s')) ? `${cleanUnit}s` : cleanUnit;
    displayPortion = `${mult} ${pluralUnit} (~${portionGrams}g)`;
  }

  // Calculate nutrition using single source of truth
  const nutrition = calculateItemNutrition(food, mult, 'serving');

  return {
    displayName,
    displayPortion,
    portionGrams,
    portionServings,
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    fiber: nutrition.fiber,
  };
};
