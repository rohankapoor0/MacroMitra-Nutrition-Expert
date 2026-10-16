/**
 * MacroMitra Constraint-Based Full-Day Indian Meal Plan Generator
 * 
 * Optimizes an entire day of meals (Breakfast, Lunch, Dinner, Snacks) against
 * the user's authoritative daily nutrition targets (Calories, Protein, Carbs, Fat).
 * 
 * Key Constraints:
 * 1. Calories meet or slightly exceed target: ideally 0% to 3% above target (target <= actual <= target * 1.03).
 * 2. Protein meets or exceeds target: ideally 0% to 5% above target (target <= actual <= target * 1.05).
 * 3. Carbohydrates and Fat remain close to target within reasonable tolerances.
 * 4. Respects dietary preferences (Vegetarian, Vegan, Non-Veg) and restrictions.
 * 5. Uses realistic Indian meal pairings (Mains + Breads/Rice + Accompaniments).
 * 6. Deterministic regeneration: generates distinct culinary menus without ANY target drift.
 * 7. Independently sums nutrition totals across all items.
 */

import { formatScaledFoodDisplay, calculateItemNutrition } from './nutritionCalculator';

export const DEFAULT_TOLERANCES = {
  calorieMinRatio: 1.00,       // Must meet target (>= 100%)
  calorieIdealMaxRatio: 1.03,  // Ideal zone: 0% to 3% above target
  calorieMaxRatio: 1.06,       // Acceptable ceiling
  proteinMinRatio: 1.00,       // Must meet target (>= 100%)
  proteinIdealMaxRatio: 1.05,  // Ideal zone: 0% to 5% above target
  proteinMaxRatio: 1.15,       // Acceptable ceiling
  carbsToleranceRatio: 0.25,   // +/- 25% tolerance
  fatToleranceRatio: 0.25      // +/- 25% tolerance
};

/**
 * Identifies whether a food item is a protein shake supplement.
 */
export const isProteinShake = (food) => {
  if (!food) return false;
  const name = (food.name || '').toLowerCase();
  const id = (food.id || '').toLowerCase();
  return id === 'core-44-protein-shake' ||
    name === 'protein shake' ||
    name.includes('protein shake') ||
    name.includes('whey protein') ||
    name.includes('protein powder');
};

/**
 * Counts total servings of protein shake across a plan or item array.
 * 1 serving corresponds to 1.0 portion multiplier (1 scoop / serving).
 */
export const countShakeServings = (planMealsOrItems) => {
  if (!planMealsOrItems) return 0;
  const items = Array.isArray(planMealsOrItems) && planMealsOrItems[0]?.items
    ? planMealsOrItems.flatMap(m => m.items)
    : (Array.isArray(planMealsOrItems) ? planMealsOrItems : []);
  const shakeItems = items.filter(it => isProteinShake(it));
  return Math.round(shakeItems.reduce((sum, it) => sum + (it.portionMultiplier || 1.0), 0) * 10) / 10;
};

/**
 * Detects whether a food naturally contains sugars (fruits, plain dairy, whole grains, lentils).
 * These must NOT be excluded when the user chooses "Sugar-free / minimize added sugar".
 */
export const isNaturallySweetOrStaple = (food) => {
  if (!food) return false;
  const name = (food.name || '').toLowerCase();
  const cat = (food.category || '').toLowerCase();

  // Plain fruits and vegetables, whole grains, and lentils
  if (cat === 'fruits & vegetables' || cat === 'dals & legumes' || cat === 'rice dishes' || cat === 'breads') {
    if (!['kheer', 'halwa', 'laddu', 'ladoo', 'barfi', 'burfi', 'jam', 'jelly', 'syrup', 'sweet', 'mithai'].some(k => name.includes(k))) {
      return true;
    }
  }

  // Plain dairy and traditional unsweetened staples
  const plainDairyKeywords = ['milk', 'curd', 'dahi', 'yogurt', 'paneer', 'chaas', 'buttermilk', 'sattu'];
  if (plainDairyKeywords.some(k => name.includes(k))) {
    if (!['kheer', 'halwa', 'ice cream', 'milkshake', 'sweet lassi', 'syrup', 'dessert', 'pudding'].some(k => name.includes(k))) {
      return true;
    }
  }

  return false;
};

/**
 * Detects whether a food contains added sugar, sweetened drinks, sugary snacks, or desserts.
 */
export const hasAddedSugar = (food) => {
  if (!food) return false;
  const name = (food.name || '').toLowerCase();
  const cat = (food.category || '').toLowerCase();

  // 1. Explicit dessert category
  if (cat === 'desserts') return true;

  // 2. Confectionery and sweet keywords
  const dessertKeywords = [
    'kheer', 'halwa', 'laddu', 'ladoo', 'barfi', 'burfi', 'gulab jamun', 'jalebi',
    'rasgulla', 'sandesh', 'payasam', 'peda', 'mysore pak', 'chikki', 'pudding',
    'custard', 'pastry', 'cake', 'sundae', 'ice cream', 'mithai', 'chocolate',
    'syrup', 'sweet lassi', 'sharbat', 'rooh afza', 'cola', 'candy'
  ];
  if (dessertKeywords.some(k => name.includes(k))) return true;

  // 3. Sweetened drinks and shakes
  if (name.includes('milkshake') || name.includes('cooler') || name.includes('fruit punch') || name.includes('with ice cream')) {
    return true;
  }

  // 4. Free sugar column in INDB or high sugar in non-staple foods
  const freeSugar = food.raw_data && food.raw_data['Free Sugar (g)'] ? parseFloat(food.raw_data['Free Sugar (g)']) : null;
  if (freeSugar !== null && !isNaN(freeSugar) && freeSugar >= 4.0 && !isNaturallySweetOrStaple(food)) {
    return true;
  }

  if (food.sugar && food.sugar >= 10.0 && !isNaturallySweetOrStaple(food)) {
    return true;
  }

  return false;
};

/**
 * Detects specific meat category: 'eggs', 'chicken', 'fish', 'mutton', 'other_meat', or null.
 */
export const detectMeatType = (food) => {
  if (!food) return null;
  if (food.meat_type) return food.meat_type;
  const name = (food.name || '').toLowerCase();
  const cat = (food.category || '').toLowerCase();
  if (['egg', 'anda', 'omelet', 'muttai'].some(k => name.includes(k)) && !['eggplant', 'veg egg', 'paneer', 'tofu', 'soya'].some(k => name.includes(k))) {
    return 'eggs';
  }
  if (['chicken', 'murgh', 'kozhi', 'poultry'].some(k => name.includes(k) || cat.includes(k))) {
    return 'chicken';
  }
  if (['fish', 'machhli', 'meen', 'prawn', 'shrimp', 'crab', 'seafood', 'salmon', 'tuna', 'rohu', 'catla', 'stingray', 'pomfret', 'allathi'].some(k => name.includes(k) || cat.includes(k))) {
    return 'fish';
  }
  if (['keema', 'mutton', 'gosht', 'lamb', 'goat', 'roghan josh', 'boti kebab', 'nihari', 'shami kebab', 'galouti', 'sheekh kebab', 'kashmiri mutton', 'gushtaba'].some(k => name.includes(k) || cat.includes(k))) {
    return 'mutton';
  }
  if (['beef', 'pork', 'bacon', 'ham', 'veal', 'sausage'].some(k => name.includes(k) || cat.includes(k))) {
    return 'other_meat';
  }
  if (cat === 'non-veg') {
    if (['keema', 'curry, meat', 'meat'].some(k => name.includes(k))) return 'mutton';
    return 'other_meat';
  }
  return null;
};

/**
 * Checks whether a food is non-vegetarian.
 */
export const isNonVegFood = (food) => {
  if (!food) return false;
  const cat = (food.category || '').toLowerCase();
  if (cat === 'non-veg') return true;
  if (food.meat_type !== null && food.meat_type !== undefined) return true;
  return detectMeatType(food) !== null;
};

/**
 * Checks whether a food is a raw ingredient strictly ineligible for direct meal plan recommendation:
 * e.g. raw pulses/legumes, uncooked lentils, raw atta/flours, dry grains, uncooked rice, raw meats/fish.
 */
export const isRawIngredient = (food) => {
  if (!food) return false;
  if (food.preparation_state === 'raw_ingredient') return true;
  if (food.is_meal_plan_eligible === false) return true;
  const name = (food.name || '').toLowerCase();

  // Raw pulses & legumes
  const rawPulseKws = [
    'bengal gram, dal', 'bengal gram, whole', 'black gram, dal', 'black gram, whole',
    'green gram, dal', 'green gram, whole', 'horse gram', 'lentil, dal', 'lentil, whole',
    'red gram, dal', 'red gram, whole', 'cowpea', 'rajma, raw', 'kidney bean, raw',
    'chickpea, raw', 'soyabean, brown', 'soyabean, white', 'peas, dry', 'moth bean',
    'field bean', 'khesari dal', 'ricebean', 'winged bean', 'cluster beans, dry',
    'raw pulse', 'raw lentil', 'raw legume', 'uncooked pulse', 'uncooked lentil'
  ];
  if (rawPulseKws.some(k => name.includes(k))) return true;

  // Raw grains & flours
  const rawGrainKws = [
    'wheat flour', 'raw flour', 'flour, raw', 'raw atta', 'maida', 'suji', 'semolina', 'besan',
    'raw rice', 'uncooked rice', 'rice, raw', 'dry grain', 'amaranth seed', 'seed, black', 'seed, pale'
  ];
  if (rawGrainKws.some(k => name.includes(k)) && !['roti', 'bread', 'chilla', 'cheela', 'halwa', 'dosa', 'idli', 'pancake', 'cooked'].some(k => name.includes(k))) {
    return true;
  }

  // Raw meat / raw fish commodities
  if (['raw chicken', 'raw meat', 'raw fish', 'raw egg', 'chicken, raw', 'meat, raw', 'fish, raw', 'egg, raw', 'stingray', 'allathi'].some(k => name.includes(k))) {
    return true;
  }

  return false;
};

/**
 * Checks if a food item is a caloric beverage that contributes meaningful calories (> 5 kcal).
 * Excludes solid foods (fruits, yogurt, oats, sandwiches) even if they contain juice or milk in title.
 */
export const isCaloricBeverage = (food) => {
  if (!food) return false;
  const cals = food.calories ?? 0;
  if (cals <= 5) return false; // Genuinely zero/negligible calorie drinks (water, plain tea/black coffee)

  const name = (food.name || '').toLowerCase();
  const cat = (food.category || '').toLowerCase();
  const prep = (food.preparation_state || '').toLowerCase();

  // Solid foods safeguards
  if (cat === 'non-veg') return false; // Fish, meat, etc.
  if (['sandwich', 'pasta', 'packed in', 'canned in', 'solid', 'oats', 'porridge', 'cereal', 'muesli', 'cornflakes'].some(k => name.includes(k))) {
    return false;
  }
  if (['curd', 'yogurt', 'dahi', 'paneer', 'cheese', 'dessert', 'halwa', 'kheer'].some(k => name.includes(k))) {
    return false;
  }
  if (cat === 'fruits & vegetables' && !['juice', 'smoothie', 'drink', 'shake', 'cooler', 'punch'].some(k => name.includes(k))) {
    return false;
  }

  // Explicit beverage preparation state or category
  if (prep === 'beverage' || cat === 'beverages') {
    return true;
  }

  // Beverage keywords
  const drinkKeywords = [
    'milkshake', 'smoothie', 'fruit juice', 'juice,', ' juice', 'sharbat',
    'lassi', 'chaas', 'buttermilk', 'sherbet', 'cooler', 'punch',
    'aam panna', 'squash', 'syrup', 'soda', 'tea', 'chai', 'coffee'
  ];
  if (drinkKeywords.some(k => name.includes(k))) {
    return true;
  }

  // Liquid milk
  const milkKeywords = [
    'cow milk', 'buffalo milk', 'milk, whole', 'milk, cow', 'milk, buffalo',
    'toned milk', 'skimmed milk', 'sweetened milk', 'flavoured milk', 'flavored milk',
    'semolina milk drink'
  ];
  if (milkKeywords.some(k => name.includes(k))) {
    return true;
  }

  return false;
};

/**
 * Normalizes dish name by stripping qualifiers and sorting core words so that
 * recipe aliases (e.g. 'Whole Wheat Roti' vs 'Roti (Whole Wheat)') map to the same key.
 */
export const normalizeDishName = (name = '') => {
  const cleaned = (name || '')
    .toLowerCase()
    .replace(/\b(fresh|raw|cooked|plain|homemade|home-style|style|special|tiffin|recipe|dish|ripe)\b/gi, '')
    .replace(/[(),\-–—_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned.split(' ').filter(w => w.length > 1).sort();
  return words.join(' ');
};

/**
 * Returns all canonical lookup keys for a food item (IDs, normalized name, and aliases).
 */
export const getFoodKeys = (food) => {
  if (!food) return [];
  const keys = new Set();
  if (food.id) keys.add(String(food.id).toLowerCase().trim());
  if (food.canonical_id) keys.add(String(food.canonical_id).toLowerCase().trim());
  if (food.name) {
    keys.add(food.name.toLowerCase().trim());
    const norm = normalizeDishName(food.name);
    if (norm) keys.add(norm);
  }
  if (Array.isArray(food.aliases)) {
    food.aliases.forEach(a => {
      if (a) {
        keys.add(String(a).toLowerCase().trim());
        const norm = normalizeDishName(a);
        if (norm) keys.add(norm);
      }
    });
  }
  return Array.from(keys).filter(Boolean);
};

/**
 * Checks whether two food representations refer to the same dish (duplicate).
 */
export const areFoodsDuplicate = (foodA, foodB) => {
  if (!foodA || !foodB) return false;
  if (foodA.id && foodB.id && foodA.id === foodB.id) return true;
  const keysA = getFoodKeys(foodA);
  const keysB = new Set(getFoodKeys(foodB));
  return keysA.some(k => keysB.has(k));
};

/**
 * Canonical meal roles.
 */
export const MEAL_ROLES = {
  MAIN: 'main',
  STAPLE: 'staple',
  SIDE: 'side',
  ACCOMPANIMENT: 'accompaniment',
  SNACK: 'snack',
  BEVERAGE: 'beverage',
  DESSERT: 'dessert',
  SUPPLEMENT: 'supplement'
};

export const MEAL_SLOTS = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACKS: 'Snacks'
};

/**
 * Checks whether a food is appropriate for an Indian breakfast.
 * Strictly excludes conventional curries, sabzis, roti/chapati/naan, lunch/dinner rice staples,
 * and conventional dals/rajma/chole.
 * Allows genuine breakfast preparations (poha, upma, idli, dosa, parathas, oats, egg dishes, etc.).
 */
export const isBreakfastAppropriate = (food) => {
  if (!food) return false;
  if (food.is_meal_plan_eligible === false || food.preparation_state === 'raw_ingredient') return false;

  const n = (food.name || '').toLowerCase();
  const c = (food.category || '').toLowerCase();

  // 1. Hard exclusions for Breakfast
  const curryKeywords = [
    'curry', 'korma', 'kofta', 'gravy', 'butter masala', 'tikka masala',
    'kadai', 'kadhai', 'nihari', 'roghan josh', 'masala dish', 'makhani'
  ];
  if (curryKeywords.some(k => n.includes(k))) return false;

  const sabziKeywords = [
    'sabzi', 'subzi', 'bharta', 'saag paneer', 'sukha', 'jeera aloo',
    'bhindi', 'tori', 'tindora', 'lauki ki', 'lauki kofta', 'aloo gobi',
    'aloo gobhi', 'cabbage sabzi', 'shimla mirch', 'methi malai matar'
  ];
  if (sabziKeywords.some(k => n.includes(k))) return false;

  const conventionalBreads = [
    'roti', 'chapati', 'phulka', 'naan', 'tandoori roti', 'rumali', 'kulcha', 'bhatura'
  ];
  if (conventionalBreads.some(k => n.includes(k))) return false;

  const conventionalRice = [
    'steamed basmati rice', 'basmati rice', 'plain rice', 'boiled rice',
    'white rice', 'brown rice', 'steamed rice', 'jeera rice', 'curd rice'
  ];
  if (conventionalRice.some(k => n.includes(k))) return false;

  const conventionalLegumes = [
    'dal tadka', 'dal fry', 'dal makhani', 'moong dal tadka', 'toor dal',
    'yellow dal', 'rajma', 'chole', 'chana masala', 'sambar'
  ];
  if (conventionalLegumes.some(k => n.includes(k))) return false;
  if (c === 'dals & legumes' && !['cheela', 'chilla', 'sprout', 'dosa', 'idli', 'khichdi'].some(k => n.includes(k))) {
    return false;
  }

  if ((c === 'non-veg' || food.meat_type) && !['egg', 'anda', 'omelet', 'omelette', 'bhurji'].some(k => n.includes(k))) {
    return false;
  }

  // 2. Legitimate breakfast items
  if (c === 'breakfast') return true;

  const breakfastDishes = [
    'poha', 'upma', 'idli', 'dosa', 'cheela', 'chilla', 'uttapam',
    'oats', 'oatmeal', 'porridge', 'daliya', 'khichdi', 'pancake',
    'cornflakes', 'muesli', 'cereal'
  ];
  if (breakfastDishes.some(k => n.includes(k))) return true;

  const eggBreakfast = [
    'boiled egg', 'egg bhurji', 'scrambled egg', 'omelet', 'omelette',
    'poached egg', 'egg roll', 'fried egg', 'baked egg'
  ];
  if (eggBreakfast.some(k => n.includes(k))) return true;

  if (['paneer bhurji', 'tofu bhurji', 'tofu scramble'].some(k => n.includes(k))) return true;

  if (n.includes('paratha') || n.includes('parantha')) return true;

  const isFruitOrDairy = ['curd', 'yogurt', 'dahi', 'milk', 'apple', 'banana', 'papaya', 'orange', 'fruit', 'sprouts'].some(k => n.includes(k));
  if (isFruitOrDairy) return true;

  if (isProteinShake(food)) return true;

  return false;
};

/**
 * Checks whether a food is an appropriate cooked main dish for Lunch or Dinner.
 */
export const isLunchDinnerMainAppropriate = (food) => {
  if (!food) return false;
  if (food.is_meal_plan_eligible === false || food.preparation_state === 'raw_ingredient') return false;
  if (isProteinShake(food)) return false;
  if (food.category === 'Desserts' || food.category === 'Beverages') return false;

  const n = (food.name || '').toLowerCase();
  const c = (food.category || '').toLowerCase();

  // Breads and rice dishes are staples, NOT cooked main dishes
  const isBread = c === 'breads' || ['roti', 'chapati', 'phulka', 'naan', 'tandoori roti', 'kulcha', 'bhatura', 'paratha', 'parantha'].some(k => n.includes(k));
  if (isBread) return false;

  const isRiceOrStaple = c === 'rice dishes' || ['rice', 'pulao', 'biryani', 'khichdi'].some(k => n.includes(k));
  if (isRiceOrStaple) return false;

  const isCookedMain =
    ['dals & legumes', 'main dishes', 'non-veg'].includes(c) ||
    ['curry', 'sabzi', 'subzi', 'dal', 'sambar', 'rajma', 'chole', 'paneer', 'chicken', 'fish', 'mutton', 'egg curry', 'bhurji', 'tikka', 'korma', 'saag', 'kofta', 'keema', 'bharta', 'sukha', 'kadai', 'makhani'].some(k => n.includes(k));

  return isCookedMain || (food.isMain && !food.isSide);
};

/**
 * Checks whether a food is an appropriate staple for Lunch or Dinner (roti, naan, chapati, rice, pulao).
 */
export const isLunchDinnerStapleAppropriate = (food) => {
  if (!food) return false;
  if (food.is_meal_plan_eligible === false || food.preparation_state === 'raw_ingredient') return false;
  const n = (food.name || '').toLowerCase();
  const c = (food.category || '').toLowerCase();

  const isBread = c === 'breads' || ['roti', 'chapati', 'phulka', 'naan', 'paratha', 'parantha', 'thepla', 'kulcha'].some(k => n.includes(k));
  const isRice = c === 'rice dishes' || ['rice', 'pulao', 'biryani', 'khichdi'].some(k => n.includes(k));

  if (['raw rice', 'rice, raw', 'seed', 'chips', 'cracker'].some(k => n.includes(k))) return false;

  return isBread || isRice;
};

/**
 * Checks whether a food is an appropriate side or accompaniment for Lunch or Dinner (curd, raita, salad, chaas).
 */
export const isLunchDinnerSideAppropriate = (food) => {
  if (!food) return false;
  if (food.is_meal_plan_eligible === false || food.preparation_state === 'raw_ingredient') return false;
  if (isProteinShake(food)) return false;
  if (food.category === 'Desserts' || food.category === 'Beverages') return false;

  const n = (food.name || '').toLowerCase();
  const c = (food.category || '').toLowerCase();

  // Exclude sweet fruits from lunch/dinner sides
  const sweetFruits = [
    'banana', 'apple', 'mango', 'papaya', 'guava', 'orange', 'grapes',
    'pear', 'peach', 'plum', 'pomegranate', 'pineapple', 'berries', 'strawberry',
    'melon', 'watermelon', 'muskmelon', 'custard apple', 'chikoo', 'sapota', 'fig', 'dates'
  ];
  if (sweetFruits.some(k => n.includes(k))) return false;

  // Exclude breads and rice from being sides
  if (c === 'breads' || c === 'rice dishes') return false;
  if (['roti', 'chapati', 'naan', 'rice', 'pulao', 'biryani'].some(k => n.includes(k))) return false;

  return food.isSide ||
    ['Soups & Salads'].includes(food.category) ||
    ['curd', 'yogurt', 'dahi', 'raita', 'salad', 'kachumber', 'chaas', 'buttermilk', 'soup', 'sprouts', 'papad', 'cucumber', 'chutney'].some(k => n.includes(k));
};

/**
 * Checks whether a food is appropriate for light snacks.
 */
export const isSnackAppropriate = (food) => {
  if (!food) return false;
  if (food.is_meal_plan_eligible === false || food.preparation_state === 'raw_ingredient') return false;
  if (isNonVegFood(food) || food.meat_type) return false;

  const n = (food.name || '').toLowerCase();
  const c = (food.category || '').toLowerCase();

  const disallowedSnacks = [
    'curry', 'sabzi', 'subzi', 'dal', 'sambar', 'rasam', 'rajma', 'chole',
    'biryani', 'pulao', 'khichdi', 'roti', 'naan', 'paratha', 'chapati',
    'paneer butter masala', 'stingray'
  ];
  if (disallowedSnacks.some(k => n.includes(k))) return false;

  const isFruit = c === 'fruits & vegetables' || ['apple', 'banana', 'orange', 'papaya', 'guava', 'grapes', 'mango', 'watermelon', 'muskmelon', 'pear', 'peach', 'plum', 'pomegranate', 'pineapple', 'berries', 'strawberry', 'fruit'].some(k => n.includes(k));
  const isYogurtDairy = ['curd', 'dahi', 'yogurt', 'greek yogurt', 'milk', 'chaas', 'buttermilk'].some(k => n.includes(k));
  const isNuts = ['almond', 'walnut', 'peanut', 'cashew', 'pistachio', 'raisin', 'dates', 'makhana', 'roasted chana'].some(k => n.includes(k));
  const isApprovedSnack = ['sprouts salad', 'roasted makhana', 'roasted chana'].some(k => n.includes(k));

  return isFruit || isYogurtDairy || isNuts || isApprovedSnack || (food.is_snack_eligible === true && (food.preparation_state === 'ready_to_eat_snack' || food.isSide));
};

/**
 * Classifies the meal role of a food record.
 */
export const classifyMealRole = (food) => {
  if (!food) return MEAL_ROLES.MAIN;
  if (food.meal_role) return food.meal_role;
  if (isProteinShake(food) || food.preparation_state === 'supplement') return MEAL_ROLES.SUPPLEMENT;
  if (food.category === 'Desserts' || food.preparation_state === 'dessert' || hasAddedSugar(food)) return MEAL_ROLES.DESSERT;
  if (food.category === 'Beverages' || food.preparation_state === 'beverage' || isCaloricBeverage(food)) return MEAL_ROLES.BEVERAGE;

  if (isLunchDinnerStapleAppropriate(food)) return MEAL_ROLES.STAPLE;
  if (isLunchDinnerSideAppropriate(food)) return MEAL_ROLES.SIDE;
  if (isSnackAppropriate(food)) return MEAL_ROLES.SNACK;
  return MEAL_ROLES.MAIN;
};

/**
 * Returns the list of meal slots for which a food record is eligible.
 */
export const classifyEligibleMeals = (food) => {
  const eligible = [];
  if (isBreakfastAppropriate(food)) eligible.push(MEAL_SLOTS.BREAKFAST);
  if (isLunchDinnerMainAppropriate(food) || isLunchDinnerStapleAppropriate(food) || isLunchDinnerSideAppropriate(food)) {
    eligible.push(MEAL_SLOTS.LUNCH);
    eligible.push(MEAL_SLOTS.DINNER);
  }
  if (isSnackAppropriate(food)) eligible.push(MEAL_SLOTS.SNACKS);
  return eligible;
};

/**
 * Checks whether a food item is eligible for a specific meal slot.
 */
export const isFoodEligibleForMeal = (food, mealSlot) => {
  if (!food || !mealSlot) return false;
  const m = String(mealSlot).toLowerCase();
  if (m === 'breakfast') return isBreakfastAppropriate(food);
  if (m === 'lunch' || m === 'dinner') {
    return isLunchDinnerMainAppropriate(food) || isLunchDinnerStapleAppropriate(food) || isLunchDinnerSideAppropriate(food);
  }
  if (m === 'snacks') return isSnackAppropriate(food);
  return false;
};

/**
 * Configurable default protein distribution targets across meals:
 * >= 80% from breakfast, lunch, and dinner combined; <= 20% from snacks.
 */
export const DEFAULT_PROTEIN_DISTRIBUTION = {
  mainMealsMinRatio: 0.80,
  snacksMaxRatio: 0.20
};

/**
 * Calculates protein distribution across main meals (Breakfast, Lunch, Dinner) vs Snacks.
 */
export const calculateProteinDistribution = (meals) => {
  let mainProtein = 0;
  let snackProtein = 0;
  for (const m of meals || []) {
    const isSnack = (m.meal || m.name || '').toLowerCase() === 'snacks';
    const p = (m.items || []).reduce((acc, it) => acc + (it.protein || 0), 0);
    if (isSnack) {
      snackProtein += p;
    } else {
      mainProtein += p;
    }
  }
  const total = mainProtein + snackProtein;
  const mainRatio = total > 0 ? Math.round((mainProtein / total) * 1000) / 1000 : 1;
  const snackRatio = total > 0 ? Math.round((snackProtein / total) * 1000) / 1000 : 0;
  const isMet = total > 0 ? (mainRatio >= 0.799 && snackRatio <= 0.201) : true;
  return {
    mainProtein: Math.round(mainProtein * 10) / 10,
    mainMealsProtein: Math.round(mainProtein * 10) / 10,
    snackProtein: Math.round(snackProtein * 10) / 10,
    totalProtein: Math.round(total * 10) / 10,
    mainRatio,
    mainMealsRatio: mainRatio,
    snackRatio,
    isMet,
    targetMet: isMet
  };
};

/**
 * Checks if a food item is permitted under the user's dietary preferences, restrictions, and options.
 * Enforces data-quality handling: treats missing protein as unknown, rejects unverified records,
 * strictly excludes raw ingredients, and enforces hard constraints on meat preferences.
 */
export const isFoodAllowed = (food, dietaryPreference = 'all', restrictions = [], options = {}) => {
  if (!food) return false;
  // Treat missing protein values as unknown, not zero
  if (food.protein === null || food.protein === undefined || isNaN(food.protein) || food.protein < 0) return false;
  if (food.calories === null || food.calories === undefined || isNaN(food.calories) || food.calories < 0) return false;

  // Exclude corrupted, unverified, or flagged food records from nutrition audit
  if (food.flagged_for_review === true || food.is_verified === false) return false;

  // 1. Strictly exclude raw ingredients (pulses, dry grains, raw flours, raw meats, raw fish)
  if (isRawIngredient(food)) {
    return false;
  }

  // 2. Protein Shake option filter
  const allowShakes = options.allowProteinShakes ?? (options.shakePreference ? options.shakePreference === 'yes' : true);
  if (!allowShakes && isProteinShake(food)) {
    return false;
  }

  // 3. Sugar preference filter: applied only when sugarPreference is explicitly requested
  const sugarPref = options?.sugarPreference;
  if ((sugarPref === 'sugar-free' || sugarPref === 'minimize added sugar') && hasAddedSugar(food)) {
    return false;
  }

  // 3b. Caloric beverage filter: exclude when beveragePreference is explicitly 'no'
  const bevPref = options?.beveragePreference || options?.mealPlanPreferences?.beveragePreference;
  if (bevPref === 'no' && isCaloricBeverage(food)) {
    return false;
  }

  // 4. Energy discrepancy check (Atwater 4/4/9 factor)
  const macroEnergy = (food.protein || 0) * 4 + (food.carbs || 0) * 4 + (food.fat || 0) * 9;
  if (food.calories > 15 && macroEnergy > food.calories * 1.5 && (macroEnergy - food.calories) > 35) {
    return false;
  }

  const name = (food.name || '').toLowerCase();
  const cat = (food.category || '').toLowerCase();

  const isNonVeg = isNonVegFood(food);
  const meatType = detectMeatType(food);

  const isDairy = cat === 'dairy & eggs' ||
    ['paneer', 'milk', 'curd', 'dahi', 'yogurt', 'cheese', 'ghee', 'butter', 'whey', 'lassi'].some(w =>
      name.includes(w) || cat.includes(w)
    );

  // Audit vegetarian protein ceiling:
  // Vegetable pulao/rice/sabzi cannot be assumed to provide 20g protein without evidence
  const isLegitVegProtein = ['paneer', 'tofu', 'soya', 'soy', 'whey', 'protein shake', 'dal', 'rajma', 'chole', 'chana', 'channa', 'chickpea', 'lentil', 'sprout', 'nuts', 'almond', 'peanut', 'moong'].some(w => name.includes(w));
  if (!isNonVeg && !isLegitVegProtein) {
    const p100 = food.protein_per_100g ?? (food.serving_basis === '100g' ? food.protein : (food.serving_size_g ? (food.protein / food.serving_size_g) * 100 : null));
    if (['pulao', 'rice', 'khichdi', 'biryani'].some(r => name.includes(r))) {
      // Cooked vegetable pulao/rice cannot physiologically exceed 7g protein per 100g
      if (p100 && p100 > 7.0) return false;
      if (food.serving_basis === 'serving' && food.protein > 10.0) return false;
    }
    if (['sabzi', 'curry', 'soup'].some(s => name.includes(s))) {
      if (p100 && p100 > 7.0 && food.calories < 120) return false;
    }
  }

  const pref = (dietaryPreference || 'all').toLowerCase().replace(/[\s_-]/g, '');

  // 5. Dietary preference & meat preferences hard constraints
  if (pref === 'vegetarian' || pref === 'veg') {
    if (isNonVeg) return false;
  } else if (pref === 'vegan') {
    if (isNonVeg || isDairy) return false;
  } else if (pref === 'nonvegetarian' || pref === 'nonveg') {
    // If the food is non-vegetarian, only allow if its meat type was explicitly selected!
    const meatPrefs = options.meatPreferences || options.mealPlanPreferences?.meatPreferences;
    if (isNonVeg && Array.isArray(meatPrefs) && meatPrefs.length > 0) {
      if (!meatType || !meatPrefs.includes(meatType)) {
        return false;
      }
    }
  }

  // 6. Explicit user-specified restrictions
  if (Array.isArray(restrictions) && restrictions.length > 0) {
    for (const r of restrictions) {
      const rLower = (r || '').toLowerCase().trim();
      if (!rLower) continue;
      if (name.includes(rLower) || cat.includes(rLower)) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Validates a generated full-day meal plan to ensure strict adherence to all dietary,
 * preparation, and snack restrictions.
 */
export const validateMealPlan = (planMealsOrSlots, options = {}) => {
  const errors = [];
  const slots = Array.isArray(planMealsOrSlots) ? planMealsOrSlots : [];
  const pref = (options.dietaryPreference || 'all').toLowerCase().replace(/[\s_-]/g, '');
  const meatPrefs = options.meatPreferences || [];

  for (const slot of slots) {
    const mealName = slot.meal || slot.name || '';
    const items = slot.items || [];

    for (const item of items) {
      const name = (item.name || '').toLowerCase();

      // Rule 1: Never suggest raw pulses or uncooked ingredients
      if (isRawIngredient(item)) {
        errors.push(`Raw ingredient not eligible for meals: ${item.name}`);
      }

      // Rule 2: Strictly vegetarian plans contain zero meat/fish/eggs
      if ((pref === 'vegetarian' || pref === 'veg') && isNonVegFood(item)) {
        errors.push(`Non-vegetarian food found in vegetarian plan: ${item.name}`);
      }

      // Rule 3: Non-vegetarian plans strictly enforce selected meat preferences
      if ((pref === 'nonvegetarian' || pref === 'nonveg') && Array.isArray(meatPrefs) && meatPrefs.length > 0) {
        if (isNonVegFood(item)) {
          const mType = detectMeatType(item);
          if (!mType || !meatPrefs.includes(mType)) {
            errors.push(`Unselected meat type (${mType || 'unknown'}) found in plan: ${item.name}`);
          }
        }
      }

      // Rule 4: Snacks category must contain ONLY light, ready-to-eat approved foods
      if (mealName.toLowerCase() === 'snacks') {
        if (isNonVegFood(item)) {
          errors.push(`Meat or fish dish not permitted as snack: ${item.name}`);
        }
        if (!isSnackAppropriate(item)) {
          errors.push(`Main dish or bread not permitted as snack: ${item.name}`);
        }
      }

      // Rule 5: Caloric beverages excluded when beveragePreference === 'no'
      const bevPref = options.beveragePreference || options.mealPlanPreferences?.beveragePreference;
      if (bevPref === 'no' && isCaloricBeverage(item)) {
        errors.push(`Caloric beverage not permitted when beverage preference is 'no': ${item.name}`);
      }

      // Rule 7: Breakfast appropriateness: never suggest conventional curry, sabzi, roti, naan, plain rice, or dal/rajma/chole
      if (mealName.toLowerCase() === 'breakfast') {
        if (!isBreakfastAppropriate(item)) {
          errors.push(`Food not appropriate for Breakfast: ${item.name}`);
        }
      }
    }

    // Rule 8: Lunch and Dinner appropriateness: must contain an appropriate cooked main dish; staples alone cannot form a complete meal
    if (mealName.toLowerCase() === 'lunch' || mealName.toLowerCase() === 'dinner') {
      const hasMain = items.some(it => isLunchDinnerMainAppropriate(it) || it.role === 'Main');
      if (!hasMain && items.length > 0) {
        errors.push(`${mealName} must include a cooked main dish; staples alone cannot form a complete meal.`);
      }
    }
  }

  // Rule 6: No duplicate foods across the entire day
  const dailySeen = new Map();
  for (const slot of slots) {
    for (const item of slot.items || []) {
      const keys = getFoodKeys(item);
      for (const k of keys) {
        if (dailySeen.has(k)) {
          errors.push(`Duplicate food detected in daily plan: "${item.name}" duplicates "${dailySeen.get(k)}"`);
          break;
        }
      }
      keys.forEach(k => dailySeen.set(k, item.name));
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Creates a scaled meal item representation preserving food metadata.
 * Roti and naan breads default to Accompaniment or Carb Staple.
 */
const createScaledItem = (food, portionMultiplier = 1, role = 'Main') => {
  const mult = Math.max(0.1, Math.round(portionMultiplier * 10) / 10);
  const formatted = formatScaledFoodDisplay(food, mult);

  const baseCals = food.base_calories ?? (food.portionMultiplier ? food.calories / food.portionMultiplier : food.calories);
  const baseProt = food.base_protein ?? (food.portionMultiplier ? food.protein / food.portionMultiplier : food.protein);
  const baseCarbs = food.base_carbs ?? (food.portionMultiplier ? (food.carbs || 0) / food.portionMultiplier : (food.carbs || 0));
  const baseFat = food.base_fat ?? (food.portionMultiplier ? (food.fat || 0) / food.portionMultiplier : (food.fat || 0));

  // Roti and naan breads are accompaniments/staples by default, not standalone mains
  let finalRole = role;
  const isBread = food.category === 'Breads' || ['roti', 'naan', 'chapati', 'phulka', 'thepla', 'paratha'].some(k => (food.name || '').toLowerCase().includes(k));
  if (isBread && finalRole === 'Main') {
    finalRole = 'Accompaniment';
  }

  return {
    ...food,
    base_calories: baseCals,
    base_protein: baseProt,
    base_carbs: baseCarbs,
    base_fat: baseFat,
    role: finalRole,
    portionMultiplier: mult,
    portionGrams: formatted.portionGrams,
    portionServings: formatted.portionServings,
    displayName: formatted.displayName,
    displayPortion: formatted.displayPortion,
    portion: formatted.displayPortion,
    calories: formatted.calories,
    protein: formatted.protein,
    carbs: formatted.carbs,
    fat: formatted.fat,
  };
};

/**
 * Scores a full-day meal plan candidate against the user's fixed daily targets.
 * Enforces strict protein shake limits: hard ceiling at 2 servings, with strong
 * preference for 0 or 1 serving when whole foods can meet the targets.
 */
export const scoreDailyPlan = (totals, targets, tolerances = DEFAULT_TOLERANCES, shakeServings = 0, meals = null) => {
  const { calories, protein, carbs, fat } = totals;
  const targetCals = targets.calories || targets.adjustedCalories || 2000;
  const targetProt = targets.protein || targets.proteinG || 120;
  const targetCarbs = targets.carbs || targets.carbsG || 225;
  const targetFat = targets.fat || targets.fatG || 67;

  let penalty = 0;

  // 1. Calories constraint (Priority 1)
  const calRatio = calories / targetCals;
  if (calRatio < tolerances.calorieMinRatio) {
    penalty += Math.pow((targetCals - calories), 1.8) * 20;
  } else if (calRatio <= tolerances.calorieIdealMaxRatio) {
    penalty += (calories - targetCals) * 0.1;
  } else if (calRatio <= tolerances.calorieMaxRatio) {
    penalty += (calories - targetCals * tolerances.calorieIdealMaxRatio) * 5;
  } else {
    penalty += Math.pow((calories - targetCals * tolerances.calorieMaxRatio), 1.6) * 15;
  }

  // 2. Protein constraint (Priority 2)
  const protRatio = protein / targetProt;
  if (protRatio < tolerances.proteinMinRatio) {
    penalty += Math.pow((targetProt - protein), 2) * 50;
  } else if (protRatio <= tolerances.proteinIdealMaxRatio) {
    penalty += 0;
  } else {
    penalty += (protein - targetProt * tolerances.proteinIdealMaxRatio) * 8;
  }

  // 3. Carbohydrates & Fat constraint (Priority 3)
  const carbDiff = Math.abs(carbs - targetCarbs);
  const fatDiff = Math.abs(fat - targetFat);
  penalty += carbDiff * 1.5;
  penalty += fatDiff * 3.0;

  // Heavily penalize exceeding fat or carbs beyond tolerance limits
  const maxAllowedFat = targetFat * (1 + (tolerances.fatToleranceRatio || 0.25));
  if (fat > maxAllowedFat) {
    penalty += Math.pow(fat - maxAllowedFat, 2) * 200;
  }
  const maxAllowedCarbs = targetCarbs * (1 + (tolerances.carbsToleranceRatio || 0.25));
  if (carbs > maxAllowedCarbs) {
    penalty += Math.pow(carbs - maxAllowedCarbs, 2) * 100;
  }

  // 4. Protein Shake hard constraint & tier preference (Priority 4)
  if (shakeServings > 2.001) {
    // Hard constraint violation: strictly disallowed (max 2 servings per day)
    penalty += 100000 + (shakeServings - 2.0) * 50000;
  } else if (shakeServings > 1.001) {
    // Second serving allowed ONLY when strictly necessary, with strong penalty
    penalty += 350 + (shakeServings - 1.0) * 250;
  } else if (shakeServings > 0.001) {
    // 1 serving has mild penalty so 0-shake whole-food plans win whenever feasible
    penalty += shakeServings * 15;
  }

  // 5. Protein Distribution Optimization (Priority 5: >=80% main meals, <=20% snacks)
  if (meals && Array.isArray(meals)) {
    const dist = calculateProteinDistribution(meals);
    if (dist.snackRatio > 0.201) {
      penalty += 1500 + Math.pow((dist.snackRatio - 0.20) * 100, 2) * 50;
    }
    if (dist.mainRatio < 0.799) {
      penalty += 1500 + Math.pow((0.80 - dist.mainRatio) * 100, 2) * 50;
    }

    // 6. Meal-time appropriateness & complete meal constraint
    for (const m of meals) {
      const mName = (m.meal || m.name || '').toLowerCase();
      const items = m.items || [];
      if (mName === 'breakfast') {
        for (const it of items) {
          if (!isBreakfastAppropriate(it)) {
            penalty += 50000;
          }
        }
      } else if (mName === 'lunch' || mName === 'dinner') {
        const hasMain = items.some(it => isLunchDinnerMainAppropriate(it) || it.role === 'Main');
        if (!hasMain && items.length > 0) {
          penalty += 50000;
        }
      } else if (mName === 'snacks') {
        for (const it of items) {
          if (!isSnackAppropriate(it)) {
            penalty += 50000;
          }
        }
      }
    }
  }

  return penalty;
};

/**
 * Main meal plan generation entry point.
 */
export const generateMealPlan = ({
  foodData,
  calorieGoal,
  proteinGoal,
  carbsGoal,
  fatGoal,
  dailyTargets,
  planIndex = 0,
  dietaryPreference = 'all',
  restrictions = [],
  tolerances = DEFAULT_TOLERANCES,
  allowProteinShakes,
  sugarPreference,
  beveragePreference,
  meatPreferences,
  mealPlanPreferences
}) => {
  if (!foodData || foodData.length === 0) return [];

  // Determine authoritative targets (single source of truth)
  const targetCals = dailyTargets?.calories ?? calorieGoal ?? 2000;
  const targetProt = dailyTargets?.protein ?? proteinGoal ?? Math.round(1.8 * 70);
  const targetCarbs = dailyTargets?.carbs ?? carbsGoal ?? Math.round((targetCals * 0.45) / 4);
  const targetFat = dailyTargets?.fat ?? fatGoal ?? Math.round((targetCals * 0.30) / 9);

  const targets = {
    calories: targetCals,
    protein: targetProt,
    carbs: targetCarbs,
    fat: targetFat
  };

  const activePrefs = mealPlanPreferences || {};
  const pref = activePrefs.dietPreference || dailyTargets?.dietaryPreference || dietaryPreference || 'all';
  const rawMeatPrefs = activePrefs.meatPreferences || meatPreferences || [];
  const normalizedMeatPrefs = (pref === 'vegetarian' || pref === 'veg') ? [] : (Array.isArray(rawMeatPrefs) ? rawMeatPrefs : []);
  const restr = dailyTargets?.restrictions || restrictions || [];
  const effectiveAllowShakes = activePrefs.shakePreference
    ? (activePrefs.shakePreference === 'yes')
    : (allowProteinShakes !== undefined ? allowProteinShakes : true);
  const effectiveSugar = activePrefs.sugarPreference || sugarPreference || 'sugar-free';
  const effectiveBeverage = activePrefs.beveragePreference || beveragePreference || 'yes';

  // Filter allowed food catalogue using diet, meatPreferences, restrictions, shake, sugar, and beverage preferences
  const pool = foodData.filter(f => isFoodAllowed(f, pref, restr, {
    allowProteinShakes: effectiveAllowShakes,
    sugarPreference: effectiveSugar,
    beveragePreference: effectiveBeverage,
    meatPreferences: normalizedMeatPrefs,
    mealPlanPreferences: activePrefs
  }));
  if (pool.length === 0) return [];

  // Categorize food items into functional pools
  // Note: baseline pools exclude protein shakes so that baseline meals are whole foods!
  const wholeFoodPool = pool.filter(f => !isProteinShake(f));
  const shakeFood = effectiveAllowShakes ? pool.find(f => isProteinShake(f)) : null;

  // 1. Breakfast pools
  // Breakfast Mains: legitimate Indian breakfast preparations (poha, upma, idli, dosa, parathas, oats, egg dishes, etc.)
  const breakfastMains = wholeFoodPool.filter(f =>
    f.is_meal_plan_eligible !== false &&
    f.preparation_state !== 'raw_ingredient' &&
    isBreakfastAppropriate(f) &&
    !f.isSide &&
    (f.category === 'Breakfast' || ['poha', 'upma', 'idli', 'dosa', 'cheela', 'chilla', 'oats', 'porridge', 'egg', 'bhurji', 'omelet', 'paratha', 'khichdi', 'daliya'].some(k => (f.name || '').toLowerCase().includes(k)))
  );

  const breakfastSides = wholeFoodPool.filter(f =>
    f.is_meal_plan_eligible !== false &&
    f.preparation_state !== 'raw_ingredient' &&
    isBreakfastAppropriate(f) &&
    (f.isSide || ['Dairy & Eggs', 'Fruits & Vegetables', 'Soups & Salads'].includes(f.category) ||
      ['curd', 'yogurt', 'milk', 'apple', 'banana', 'fruit', 'sprouts', 'boiled egg'].some(k => (f.name || '').toLowerCase().includes(k)))
  );

  const effectiveBreakfastPool = breakfastMains.length > 0
    ? breakfastMains
    : wholeFoodPool.filter(f => isBreakfastAppropriate(f));

  // 2. Mains pool: strictly cooked main preparations (cooked dals, curries, sabzis, biryani/pulao, paneer/chicken/fish mains)
  // Roti and naan are accompaniments, NOT standalone mains!
  const mainsPool = wholeFoodPool.filter(f =>
    f.is_meal_plan_eligible !== false &&
    f.preparation_state !== 'raw_ingredient' &&
    isLunchDinnerMainAppropriate(f)
  );
  const effectiveMainsPool = mainsPool.length > 0
    ? mainsPool
    : wholeFoodPool.filter(f => isLunchDinnerMainAppropriate(f));

  // 3. Breads & Rice: staples (Roti, naan, chapati, cooked rice, pulao)
  const breadsAndRice = wholeFoodPool.filter(f =>
    f.is_meal_plan_eligible !== false &&
    f.preparation_state !== 'raw_ingredient' &&
    isLunchDinnerStapleAppropriate(f)
  );

  // 4. Sides pool: accompaniments (curd, yogurt, raita, salad, chaas)
  const sidesPool = wholeFoodPool.filter(f =>
    f.is_meal_plan_eligible !== false &&
    f.preparation_state !== 'raw_ingredient' &&
    isLunchDinnerSideAppropriate(f)
  );

  // 5. Snacks pool: STRICTLY restricted to approved light ready-to-eat foods!
  // Allowed: Fruits, yogurt / Greek yogurt, milk / suitable dairy drinks, dry fruits and nuts, approved snacks (roasted chana, roasted makhana, sprouts salad)
  // Strictly disallowed: meat/fish (e.g. stingray, chicken), cooked dals, curries, biryani, roti, naan, raw pulses!
  const snacksPool = wholeFoodPool.filter(f =>
    f.is_meal_plan_eligible !== false &&
    f.preparation_state !== 'raw_ingredient' &&
    isSnackAppropriate(f)
  );

  const effectiveSnacksPool = snacksPool.length > 0
    ? snacksPool
    : wholeFoodPool.filter(f => isSnackAppropriate(f));

  const wholeFoodHighProteinPool = wholeFoodPool.filter(f =>
    f.is_meal_plan_eligible !== false &&
    f.preparation_state !== 'raw_ingredient' &&
    (f.isHighProtein || f.protein >= 8.0 || ['Dals & Legumes', 'Non-Veg', 'Dairy & Eggs'].includes(f.category) ||
      ['paneer', 'tofu', 'soya', 'soy', 'dal', 'rajma', 'chole', 'yogurt', 'curd', 'sprouts', 'chana', 'sattu', 'chicken', 'egg', 'fish'].some(k => (f.name || '').toLowerCase().includes(k)))
  );

  // Helper to pick deterministic varied candidates for a given seed/planIndex
  const pickVaried = (list, offset, count) => {
    if (!list || list.length === 0) return [];
    const step = Math.max(1, Math.floor(list.length / Math.min(list.length, count)));
    const res = [];
    for (let i = 0; i < list.length && res.length < count; i++) {
      const idx = (offset + i * step) % list.length;
      if (!res.includes(list[idx])) {
        res.push(list[idx]);
      }
    }
    return res;
  };

  // Determine portion multipliers based on caloric demand
  const breakfastMult = targetCals >= 2400 ? 1.5 : (targetCals >= 2000 ? 1.2 : 1.0);
  const lunchCarbMult = targetCals >= 2400 ? 3.0 : (targetCals >= 1850 ? 2.0 : 1.0);
  const dinnerCarbMult = targetCals >= 2400 ? 2.0 : (targetCals >= 2100 ? 2.0 : 1.0);

  // Prioritize high-protein mains and breakfasts when protein target is significant
  const highProteinMains = effectiveMainsPool.filter(f =>
    f.isHighProtein || f.protein >= 8.0 || ['Dals & Legumes', 'Non-Veg', 'Dairy & Eggs'].includes(f.category) ||
    ['paneer', 'tofu', 'soya', 'soy', 'dal', 'rajma', 'chole', 'chicken', 'egg', 'fish'].some(k => f.name.toLowerCase().includes(k))
  );
  const prioritizedMains = (targetProt >= 90 && highProteinMains.length >= 6)
    ? [...highProteinMains, ...effectiveMainsPool]
    : effectiveMainsPool;

  const highProteinBreakfast = effectiveBreakfastPool.filter(f =>
    f.isHighProtein || f.protein >= 7.0 ||
    ['sprouts', 'oats', 'cheela', 'chilla', 'egg', 'paneer', 'yogurt', 'curd', 'dosa'].some(k => f.name.toLowerCase().includes(k))
  );
  const prioritizedBreakfast = (targetProt >= 90 && highProteinBreakfast.length >= 4)
    ? [...highProteinBreakfast, ...effectiveBreakfastPool]
    : effectiveBreakfastPool;

  // Build candidate meals for each of the 4 slots
  const breakfastCandidates = [];
  const bMains = pickVaried(prioritizedBreakfast, planIndex * 3, 15);
  const bSides = pickVaried(breakfastSides, planIndex * 2, 8);

  for (const bm of bMains) {
    breakfastCandidates.push([createScaledItem(bm, breakfastMult, 'Main')]);
    if (bSides.length > 0) {
      for (const bs of bSides.slice(0, 3)) {
        if (!areFoodsDuplicate(bs, bm)) {
          breakfastCandidates.push([
            createScaledItem(bm, breakfastMult, 'Main'),
            createScaledItem(bs, 1, 'Side')
          ]);
        }
      }
    }
  }

  const lunchCandidates = [];
  const lMains = pickVaried(prioritizedMains, planIndex * 5, 20);
  const lCarbs = pickVaried(breadsAndRice.length > 0 ? breadsAndRice : pool, planIndex * 2, 8);
  const lSides = pickVaried(sidesPool, planIndex * 3, 8);

  for (const lm of lMains) {
    for (const lc of lCarbs.slice(0, 4)) {
      if (areFoodsDuplicate(lc, lm)) continue;
      const actualLCarbMult = (lc.calories > 180) ? 1.0 : lunchCarbMult;
      // Pair 1: Main + Carb
      lunchCandidates.push([
        createScaledItem(lm, 1, 'Main'),
        createScaledItem(lc, actualLCarbMult, 'Carb Staple')
      ]);
      // Pair 2: Main + Carb + Accompaniment
      if (lSides.length > 0) {
        const ls = lSides[0];
        if (!areFoodsDuplicate(ls, lm) && !areFoodsDuplicate(ls, lc)) {
          lunchCandidates.push([
            createScaledItem(lm, 1, 'Main'),
            createScaledItem(lc, actualLCarbMult, 'Carb Staple'),
            createScaledItem(ls, 1, 'Accompaniment')
          ]);
        }
      }
    }
  }

  const dinnerCandidates = [];
  const dMains = pickVaried(prioritizedMains, (planIndex + 7) * 4, 20);
  const dCarbs = pickVaried(breadsAndRice.length > 0 ? breadsAndRice : sidesPool, (planIndex + 3) * 2, 8);
  const dSides = pickVaried(sidesPool, (planIndex + 5) * 3, 8);

  for (const dm of dMains) {
    for (const dc of dCarbs.slice(0, 4)) {
      if (areFoodsDuplicate(dc, dm)) continue;
      const actualDCarbMult = (dc.calories > 180) ? 1.0 : dinnerCarbMult;
      dinnerCandidates.push([
        createScaledItem(dm, 1, 'Main'),
        createScaledItem(dc, actualDCarbMult, 'Carb Staple')
      ]);
      if (dSides.length > 0) {
        const ds = dSides[0];
        if (!areFoodsDuplicate(ds, dm) && !areFoodsDuplicate(ds, dc)) {
          dinnerCandidates.push([
            createScaledItem(dm, 1, 'Main'),
            createScaledItem(dc, actualDCarbMult, 'Carb Staple'),
            createScaledItem(ds, 1, 'Salad')
          ]);
        }
      }
    }
  }

  const snackCandidates = [];
  // Keep snacks light: individual ready-to-eat snacks, fruits, modest yogurt, nuts
  const sItems = pickVaried(effectiveSnacksPool, planIndex * 4, 15);
  for (const si of sItems) {
    if (si.protein <= Math.max(15, targetProt * 0.18)) {
      snackCandidates.push([createScaledItem(si, 1, 'Snack')]);
    }
  }
  for (let i = 0; i < sItems.length - 1; i += 2) {
    const s1 = sItems[i];
    const s2 = sItems[i + 1];
    if (!areFoodsDuplicate(s1, s2) && (s1.protein + s2.protein) <= Math.max(15, targetProt * 0.18)) {
      snackCandidates.push([
        createScaledItem(s1, 1, 'Snack'),
        createScaledItem(s2, 1, 'Healthy Snack')
      ]);
    }
  }
  if (snackCandidates.length === 0 && sItems.length > 0) {
    snackCandidates.push([createScaledItem(sItems[0], 1, 'Snack')]);
  }

  // Beam Search across full day: Evaluate candidate combinations
  const validPlans = [];

  const bSample = breakfastCandidates.slice(0, 8);
  const lSample = lunchCandidates.slice(0, 10);
  const dSample = dinnerCandidates.slice(0, 10);
  const sSample = snackCandidates.slice(0, 8);

  for (let b = 0; b < bSample.length; b++) {
    for (let l = 0; l < lSample.length; l++) {
      const d = (b + l) % dSample.length;
      const s = (b * 2 + l) % sSample.length;

      const bMeal = bSample[b];
      const lMeal = lSample[l];
      const dMeal = dSample[d];
      const sMeal = sSample[s];

      // Check variety: avoid repeating the exact same dish across meals (enforces food uniqueness across full day)
      const seenDishKeys = new Set();
      let hasDuplicate = false;
      const allItems = [...bMeal, ...lMeal, ...dMeal, ...sMeal];

      for (const it of allItems) {
        const keys = getFoodKeys(it);
        if (keys.some(k => seenDishKeys.has(k))) {
          hasDuplicate = true;
          break;
        }
        keys.forEach(k => seenDishKeys.add(k));
      }

      if (hasDuplicate) continue;

      // Calculate daily totals independently
      const rawCals = allItems.reduce((acc, it) => acc + it.calories, 0);
      const rawProt = allItems.reduce((acc, it) => acc + it.protein, 0);
      const rawCarbs = allItems.reduce((acc, it) => acc + it.carbs, 0);
      const rawFat = allItems.reduce((acc, it) => acc + it.fat, 0);

      validPlans.push({
        meals: [
          { meal: 'Breakfast', items: bMeal },
          { meal: 'Lunch', items: lMeal },
          { meal: 'Dinner', items: dMeal },
          { meal: 'Snacks', items: sMeal }
        ],
        rawTotals: {
          calories: rawCals,
          protein: rawProt,
          carbs: rawCarbs,
          fat: rawFat
        }
      });

      if (validPlans.length >= 80) break;
    }
    if (validPlans.length >= 80) break;
  }

  // Fallback if combinatorial generation was too strict
  if (validPlans.length === 0) {
    const fallbackPlan = {
      meals: [
        { meal: 'Breakfast', items: breakfastCandidates[0] || [createScaledItem(effectiveBreakfastPool[0] || pool.find(isBreakfastAppropriate) || pool[0], 1, 'Main')] },
        { meal: 'Lunch', items: lunchCandidates[0] || [
            createScaledItem(effectiveMainsPool[0] || pool.find(isLunchDinnerMainAppropriate) || pool[0], 1, 'Main'),
            createScaledItem(breadsAndRice[0] || sidesPool[0] || pool[0], 1, 'Carb Staple')
          ]
        },
        { meal: 'Dinner', items: dinnerCandidates[0] || [
            createScaledItem(effectiveMainsPool[1] || effectiveMainsPool[0] || pool.find(isLunchDinnerMainAppropriate) || pool[0], 1, 'Main'),
            createScaledItem(breadsAndRice[1] || breadsAndRice[0] || sidesPool[0] || pool[0], 1, 'Carb Staple')
          ]
        },
        { meal: 'Snacks', items: snackCandidates[0] || [createScaledItem(effectiveSnacksPool[0] || pool.find(isSnackAppropriate) || pool[0], 1, 'Snack')] }
      ]
    };
    const allItems = fallbackPlan.meals.flatMap(m => m.items);
    fallbackPlan.rawTotals = {
      calories: allItems.reduce((a, b) => a + b.calories, 0),
      protein: allItems.reduce((a, b) => a + b.protein, 0),
      carbs: allItems.reduce((a, b) => a + b.carbs, 0),
      fat: allItems.reduce((a, b) => a + b.fat, 0)
    };
    validPlans.push(fallbackPlan);
  }

  // Optimization & Fine-tuning:
  // For each candidate plan, prioritize whole-food protein sources, enforce a strict
  // 2-serving protein shake ceiling, and bring calories and protein into ideal target ranges.
  const optimizedPlans = validPlans.map((candidate, candidateIdx) => {
    const mealsCopy = candidate.meals.map(m => ({
      ...m,
      items: m.items.map(it => ({ ...it }))
    }));
    let allItems = mealsCopy.flatMap(m => m.items);

    let curCals = allItems.reduce((a, b) => a + b.calories, 0);
    let curProt = allItems.reduce((a, b) => a + b.protein, 0);
    let curFat = allItems.reduce((a, b) => a + b.fat, 0);

    // Tier allocation:
    // If effectiveAllowShakes is false, maxShakesAllowed is strictly 0.0 across all plans!
    const maxShakesAllowed = !effectiveAllowShakes
      ? 0.0
      : ((candidateIdx % 3 === 0) ? 0.0 : ((candidateIdx % 3 === 1) ? 1.0 : 2.0));

    // 1. Protein Optimization: Whole Foods First
    if (curProt < targetProt) {
      // Step A: Scale up existing whole food protein items across meals
      const wholeFoodProteinItems = allItems.filter(i =>
        !isProteinShake(i) &&
        (i.protein >= 6.0 || ['Dals & Legumes', 'Non-Veg', 'Dairy & Eggs'].includes(i.category) ||
          ['paneer', 'tofu', 'soya', 'dal', 'rajma', 'chole', 'curd', 'yogurt', 'chicken', 'egg', 'fish', 'sprouts', 'chana'].some(k => (i.name || '').toLowerCase().includes(k)))
      );

      // Sort items: Main meals first (Breakfast, Lunch, Dinner) so main meals provide >= 80% protein,
      // and snacks remain light (<= 20% protein). Within group, sort by protein-to-fat efficiency.
      const sortedProteinItems = [...wholeFoodProteinItems].sort((a, b) => {
        const aMeal = mealsCopy.find(m => m.items.some(it => (it.id || it.name) === (a.id || a.name)))?.meal;
        const bMeal = mealsCopy.find(m => m.items.some(it => (it.id || it.name) === (b.id || b.name)))?.meal;
        const aIsSnack = (aMeal || '').toLowerCase() === 'snacks';
        const bIsSnack = (bMeal || '').toLowerCase() === 'snacks';
        if (aIsSnack && !bIsSnack) return 1;
        if (!aIsSnack && bIsSnack) return -1;
        const aRatio = a.protein / Math.max(0.5, a.fat);
        const bRatio = b.protein / Math.max(0.5, b.fat);
        return bRatio - aRatio;
      });

      for (const item of sortedProteinItems) {
        if (curProt >= targetProt) break;
        const parentMeal = mealsCopy.find(m => m.items.some(it => (it.id || it.name) === (item.id || item.name)));
        const isSnack = (parentMeal?.meal || '').toLowerCase() === 'snacks';
        if (isSnack) {
          const currentSnackProt = parentMeal.items.reduce((acc, it) => acc + (it.protein || 0), 0);
          if (currentSnackProt >= targetProt * 0.18) {
            continue; // Keep snacks light, do not scale snacks if already >= 18% of target protein
          }
        }
        const protNeeded = targetProt - curProt;
        const baseProt = item.protein / item.portionMultiplier;
        const baseCals = item.calories / item.portionMultiplier;
        const baseFat = item.fat / item.portionMultiplier;
        if (baseProt > 0) {
          const maxMult = Math.min(2.0, item.portionMultiplier + Math.min(1.0, Math.ceil((protNeeded / baseProt) * 10) / 10));
          const addCals = (maxMult - item.portionMultiplier) * baseCals;
          const addFat = (maxMult - item.portionMultiplier) * baseFat;
          // Guard both calorie tolerance and fat tolerance
          if (curCals + addCals <= targetCals * 1.05 && (baseFat <= 3 || curFat + addFat <= targetFat * 1.18)) {
            const updated = createScaledItem(item, Math.round(maxMult * 10) / 10, item.role);
            for (const m of mealsCopy) {
              const idx = m.items.findIndex(it => (it.id || it.name) === (item.id || item.name));
              if (idx !== -1) {
                m.items[idx] = updated;
                break;
              }
            }
            allItems = mealsCopy.flatMap(m => m.items);
            curCals = allItems.reduce((a, b) => a + b.calories, 0);
            curProt = allItems.reduce((a, b) => a + b.protein, 0);
            curFat = allItems.reduce((a, b) => a + b.fat, 0);
          }
        }
      }

      // Step B: If still under protein target, prioritize adding protein to MAIN meals (Lunch or Dinner), keeping snacks light
      if (curProt < targetProt) {
        const existingKeys = new Set(allItems.flatMap(i => getFoodKeys(i)));
        const availableMainProteins = wholeFoodHighProteinPool
          .filter(f => !getFoodKeys(f).some(k => existingKeys.has(k)))
          .sort((a, b) => {
            const aEff = a.protein / Math.max(1, a.calories);
            const bEff = b.protein / Math.max(1, b.calories);
            return bEff - aEff;
          });

        // Prioritize adding protein to Lunch or Dinner (e.g. additional dal or paneer or chicken side)
        const lunchDinnerSlots = [
          mealsCopy.find(m => m.meal === 'Lunch'),
          mealsCopy.find(m => m.meal === 'Dinner')
        ].filter(Boolean);

        let addedToMain = false;
        for (const candidateFood of availableMainProteins.slice(0, 8)) {
          if (curProt >= targetProt) break;
          // Must be appropriate for lunch/dinner!
          if (!isLunchDinnerMainAppropriate(candidateFood) && !isLunchDinnerSideAppropriate(candidateFood)) continue;

          const protNeeded = targetProt - curProt;
          const desiredMult = Math.min(1.5, Math.ceil((protNeeded / Math.max(1, candidateFood.protein)) * 10) / 10);
          const maxMultCal = Math.max(0, Math.floor(((targetCals * 1.05 - curCals) / Math.max(1, candidateFood.calories)) * 10) / 10);
          const multNeeded = Math.min(desiredMult, maxMultCal);
          if (multNeeded >= 0.5) {
            const addedCals = candidateFood.calories * multNeeded;
            const addedFat = (candidateFood.fat || 0) * multNeeded;
            if (curCals + addedCals <= targetCals * 1.05 && (addedFat <= 3 || curFat + addedFat <= targetFat * 1.20)) {
              const targetSlot = lunchDinnerSlots.sort((a, b) => a.items.length - b.items.length)[0];
              if (targetSlot && targetSlot.items.length < 4) {
                targetSlot.items.push(createScaledItem(candidateFood, multNeeded, 'Accompaniment'));
                allItems = mealsCopy.flatMap(m => m.items);
                curCals = allItems.reduce((a, b) => a + b.calories, 0);
                curProt = allItems.reduce((a, b) => a + b.protein, 0);
                curFat = allItems.reduce((a, b) => a + b.fat, 0);
                addedToMain = true;
                break;
              }
            }
          }
        }

        // If still under protein target, check if an eligible breakfast protein item can be added to Breakfast
        const bSlot = mealsCopy.find(m => m.meal === 'Breakfast');
        if (curProt < targetProt && bSlot && bSlot.items.length < 3) {
          const availableBProteins = effectiveBreakfastPool
            .filter(f => !getFoodKeys(f).some(k => existingKeys.has(k)) && isBreakfastAppropriate(f) && (f.protein >= 6.0 || ['egg', 'paneer', 'yogurt', 'sprout', 'dosa'].some(k => (f.name || '').toLowerCase().includes(k))))
            .sort((a, b) => (b.protein / Math.max(1, b.calories)) - (a.protein / Math.max(1, a.calories)));

          for (const bf of availableBProteins.slice(0, 4)) {
            if (curProt >= targetProt) break;
            const protNeeded = targetProt - curProt;
            const desiredMult = Math.min(1.0, Math.ceil((protNeeded / Math.max(1, bf.protein)) * 10) / 10);
            const maxMultCal = Math.max(0, Math.floor(((targetCals * 1.05 - curCals) / Math.max(1, bf.calories)) * 10) / 10);
            const multNeeded = Math.min(desiredMult, maxMultCal);
            if (multNeeded >= 0.5) {
              const addedCals = bf.calories * multNeeded;
              const addedFat = (bf.fat || 0) * multNeeded;
              if (curCals + addedCals <= targetCals * 1.05 && (addedFat <= 3 || curFat + addedFat <= targetFat * 1.20)) {
                bSlot.items.push(createScaledItem(bf, multNeeded, 'Breakfast Side'));
                allItems = mealsCopy.flatMap(m => m.items);
                curCals = allItems.reduce((a, b) => a + b.calories, 0);
                curProt = allItems.reduce((a, b) => a + b.protein, 0);
                curFat = allItems.reduce((a, b) => a + b.fat, 0);
                break;
              }
            }
          }
        }

        // Only if main meals could not take more, and snacks protein ratio is <= 15%, add a light snack item
        const snackMeal = mealsCopy.find(m => m.meal === 'Snacks');
        const snackProtCurrent = snackMeal ? snackMeal.items.reduce((acc, it) => acc + (it.protein || 0), 0) : 0;
        if (!addedToMain && curProt < targetProt && snackMeal && snackMeal.items.length < 2 && snackProtCurrent < targetProt * 0.15) {
          const availableSnackProteins = effectiveSnacksPool
            .filter(f => !getFoodKeys(f).some(k => existingKeys.has(k)))
            .sort((a, b) => (b.protein / Math.max(1, b.calories)) - (a.protein / Math.max(1, a.calories)));

          for (const candidateFood of availableSnackProteins.slice(0, 4)) {
            if (curProt >= targetProt) break;
            const protNeeded = targetProt - curProt;
            const desiredMult = Math.min(1.0, Math.ceil((protNeeded / Math.max(1, candidateFood.protein)) * 10) / 10);
            const maxMultCal = Math.max(0, Math.floor(((targetCals * 1.05 - curCals) / Math.max(1, candidateFood.calories)) * 10) / 10);
            const multNeeded = Math.min(desiredMult, maxMultCal);
            if (multNeeded >= 0.5 && (snackProtCurrent + candidateFood.protein * multNeeded) <= targetProt * 0.20) {
              const addedCals = candidateFood.calories * multNeeded;
              const addedFat = (candidateFood.fat || 0) * multNeeded;
              if (curCals + addedCals <= targetCals * 1.05 && (addedFat <= 3 || curFat + addedFat <= targetFat * 1.20)) {
                snackMeal.items.push(createScaledItem(candidateFood, multNeeded, 'Healthy Snack'));
                allItems = mealsCopy.flatMap(m => m.items);
                curCals = allItems.reduce((a, b) => a + b.calories, 0);
                curProt = allItems.reduce((a, b) => a + b.protein, 0);
                curFat = allItems.reduce((a, b) => a + b.fat, 0);
                break;
              }
            }
          }
        }
      }

      // Phase 2: Protein Shake Supplementation (ONLY if maxShakesAllowed >= 1.0 and protein is still unmet)
      // Attach to Breakfast or Lunch to keep Snacks light and main meals >= 80% protein!
      if (curProt < targetProt && maxShakesAllowed >= 1.0 && shakeFood) {
        const boostSlot = mealsCopy.find(m => m.meal === 'Breakfast') || mealsCopy.find(m => m.meal === 'Lunch') || mealsCopy[0];
        const protGap = targetProt - curProt;
        const shake1Mult = Math.min(1.0, Math.max(0.5, Math.ceil((protGap / shakeFood.protein) * 10) / 10));
        boostSlot.items.push(createScaledItem(shakeFood, shake1Mult, 'Protein Boost'));
        allItems = mealsCopy.flatMap(m => m.items);
        curCals = allItems.reduce((a, b) => a + b.calories, 0);
        curProt = allItems.reduce((a, b) => a + b.protein, 0);
        curFat = allItems.reduce((a, b) => a + b.fat, 0);
      }

      // Phase 3: Second Shake ONLY if maxShakesAllowed >= 2.0, target is high (>125g), and protein is STILL below target by > 12g
      if (curProt < targetProt && maxShakesAllowed >= 2.0 && shakeFood && targetProt > 125 && (targetProt - curProt) > 12) {
        const boostSlot = mealsCopy.find(m => m.meal === 'Breakfast') || mealsCopy.find(m => m.meal === 'Lunch') || mealsCopy[0];
        let currentShakes = countShakeServings(mealsCopy);
        if (currentShakes < 2.0) {
          const remainingAllowed = 2.0 - currentShakes;
          const protGap = targetProt - curProt;
          const shake2Mult = Math.min(remainingAllowed, Math.max(0.5, Math.ceil((protGap / shakeFood.protein) * 10) / 10));
          const existingShake = boostSlot.items.find(i => isProteinShake(i));
          if (existingShake) {
            const combined = Math.min(2.0, Math.round((existingShake.portionMultiplier + shake2Mult) * 10) / 10);
            const sIdx = boostSlot.items.indexOf(existingShake);
            boostSlot.items[sIdx] = createScaledItem(shakeFood, combined, 'Protein Boost');
          } else {
            boostSlot.items.push(createScaledItem(shakeFood, shake2Mult, 'Protein Boost'));
          }
          allItems = mealsCopy.flatMap(m => m.items);
          curCals = allItems.reduce((a, b) => a + b.calories, 0);
          curProt = allItems.reduce((a, b) => a + b.protein, 0);
          curFat = allItems.reduce((a, b) => a + b.fat, 0);
        }
      }

      // Fine adjustment: If still below protein target, scale up lean whole-food protein items until met or ceiling reached
      if (curProt < targetProt) {
        // If calories are close to ceiling, trim carb staples (e.g. excess rice/bread) to create caloric headroom for protein
        if (curCals >= targetCals * 0.98) {
          const carbItem = allItems.find(i => ['Rice Dishes', 'Breads'].includes(i.category) && (i.portionMultiplier || 1) > 1.0 && !isProteinShake(i));
          if (carbItem) {
            const reduceMult = Math.min(1.0, Math.round((carbItem.portionMultiplier - 1.0) * 10) / 10);
            if (reduceMult >= 0.2) {
              const updatedCarb = createScaledItem(carbItem, Math.round((carbItem.portionMultiplier - reduceMult) * 10) / 10, carbItem.role);
              for (const m of mealsCopy) {
                const idx = m.items.findIndex(it => (it.id || it.name) === (carbItem.id || carbItem.name));
                if (idx !== -1) {
                  m.items[idx] = updatedCarb;
                  break;
                }
              }
              allItems = mealsCopy.flatMap(m => m.items);
              curCals = allItems.reduce((a, b) => a + b.calories, 0);
              curProt = allItems.reduce((a, b) => a + b.protein, 0);
              curFat = allItems.reduce((a, b) => a + b.fat, 0);
            }
          }
        }

        const leanCandidates = allItems
          .filter(i => {
            if (isProteinShake(i)) return false;
            const parent = mealsCopy.find(m => m.items.some(it => (it.id || it.name) === (i.id || i.name)));
            if ((parent?.meal || '').toLowerCase() === 'snacks') return false; // Main meals only
            return (i.protein / i.portionMultiplier) >= 3 && ((i.fat / i.portionMultiplier) / Math.max(1, i.protein / i.portionMultiplier)) <= 1.2;
          })
          .sort((a, b) => {
            const aEff = (a.protein / a.portionMultiplier) / Math.max(0.5, a.fat / a.portionMultiplier);
            const bEff = (b.protein / b.portionMultiplier) / Math.max(0.5, b.fat / b.portionMultiplier);
            return bEff - aEff;
          });

        for (const leanItem of leanCandidates) {
          if (curProt >= targetProt) break;
          const gap = targetProt - curProt;
          const baseP = leanItem.protein / leanItem.portionMultiplier;
          const baseC = leanItem.calories / leanItem.portionMultiplier;
          const neededMult = Math.min(1.0, Math.ceil((gap / Math.max(1, baseP)) * 10) / 10);
          const maxMultCal = Math.max(0, Math.floor(((targetCals * 1.06 - curCals) / Math.max(1, baseC)) * 10) / 10);
          const maxMultPortion = Math.max(0, Math.round((3.0 - leanItem.portionMultiplier) * 10) / 10);
          const addMult = Math.min(neededMult, maxMultCal, maxMultPortion);
          if (addMult >= 0.1 && curCals + addMult * baseC <= targetCals * 1.06) {
            const updated = createScaledItem(leanItem, Math.round((leanItem.portionMultiplier + addMult) * 10) / 10, leanItem.role);
            for (const m of mealsCopy) {
              const idx = m.items.findIndex(it => (it.id || it.name) === (leanItem.id || leanItem.name));
              if (idx !== -1) {
                m.items[idx] = updated;
                break;
              }
            }
            allItems = mealsCopy.flatMap(m => m.items);
            curCals = allItems.reduce((a, b) => a + b.calories, 0);
            curProt = allItems.reduce((a, b) => a + b.protein, 0);
            curFat = allItems.reduce((a, b) => a + b.fat, 0);
          }
        }
      }
    }

    // 2. Calorie Optimization: Ensure calories meet or slightly exceed target
    if (curCals < targetCals) {
      const calGap = targetCals - curCals;
      const carbItem = allItems.find(i => i.role === 'Carb Staple' || i.category === 'Breads' || i.category === 'Rice Dishes');
      if (carbItem && carbItem.calories > 0) {
        const baseCals = carbItem.calories / carbItem.portionMultiplier;
        const addMult = Math.ceil((calGap / Math.max(1, baseCals)) * 10) / 10;
        const newMult = Math.round((carbItem.portionMultiplier + addMult) * 10) / 10;
        const updated = createScaledItem(carbItem, newMult, carbItem.role);
        for (const m of mealsCopy) {
          const idx = m.items.findIndex(i => (i.id || i.name) === (carbItem.id || carbItem.name));
          if (idx !== -1) {
            m.items[idx] = updated;
            break;
          }
        }
      } else {
        const snackMeal = mealsCopy.find(m => m.meal === 'Snacks') || mealsCopy[mealsCopy.length - 1];
        const existingIds = new Set(allItems.map(i => i.id || i.name.toLowerCase()));
        const availableSnacks = snacksPool.filter(f => !existingIds.has(f.id || f.name.toLowerCase()) && !isProteinShake(f));
        if (availableSnacks.length > 0) {
          const snackFood = availableSnacks[0];
          const mult = Math.max(0.5, Math.ceil((calGap / Math.max(1, snackFood.calories)) * 10) / 10);
          snackMeal.items.push(createScaledItem(snackFood, mult, 'Snack'));
        } else if (snackMeal.items.length > 0) {
          const nonShake = snackMeal.items.find(i => !isProteinShake(i)) || snackMeal.items[0];
          const baseCals = nonShake.calories / nonShake.portionMultiplier;
          const addMult = Math.ceil((calGap / Math.max(1, baseCals)) * 10) / 10;
          const sIdx = snackMeal.items.indexOf(nonShake);
          snackMeal.items[sIdx] = createScaledItem(nonShake, Math.round((nonShake.portionMultiplier + addMult) * 10) / 10, nonShake.role);
        }
      }

      allItems = mealsCopy.flatMap(m => m.items);
      curCals = allItems.reduce((a, b) => a + b.calories, 0);
      curProt = allItems.reduce((a, b) => a + b.protein, 0);
    }

    // Safety nudge: if still slightly below target by a few calories, nudge whole-food snack
    if (curCals < targetCals) {
      const snackMeal = mealsCopy.find(m => m.meal === 'Snacks') || mealsCopy[mealsCopy.length - 1];
      if (snackMeal && snackMeal.items.length > 0) {
        const wholeFoodItem = snackMeal.items.find(i => !isProteinShake(i)) || snackMeal.items[snackMeal.items.length - 1];
        if (wholeFoodItem && !isProteinShake(wholeFoodItem)) {
          const needed = targetCals - curCals;
          const baseCals = wholeFoodItem.calories / wholeFoodItem.portionMultiplier;
          const nudge = Math.max(0.1, Math.ceil((needed / Math.max(1, baseCals)) * 10) / 10);
          const idx = snackMeal.items.indexOf(wholeFoodItem);
          snackMeal.items[idx] = createScaledItem(wholeFoodItem, Math.round((wholeFoodItem.portionMultiplier + nudge) * 10) / 10, wholeFoodItem.role);
        }
      }
    }

    // Strict Hard-Cap Verification: never allow > 2.0 shake servings
    const finalShakes = countShakeServings(mealsCopy);
    if (finalShakes > 2.001) {
      let allowed = 2.0;
      for (const m of mealsCopy) {
        for (let i = 0; i < m.items.length; i++) {
          if (isProteinShake(m.items[i])) {
            if (allowed <= 0) {
              m.items.splice(i, 1);
              i--;
            } else {
              const itemMult = Math.min(allowed, m.items[i].portionMultiplier);
              m.items[i] = createScaledItem(m.items[i], itemMult, m.items[i].role);
              allowed -= itemMult;
            }
          }
        }
      }
    }

    // Recalculate final totals for candidate
    const finalItems = mealsCopy.flatMap(m => m.items);
    const finalTotals = {
      calories: Math.round(finalItems.reduce((a, b) => a + b.calories, 0)),
      protein: Math.round(finalItems.reduce((a, b) => a + b.protein, 0) * 10) / 10,
      carbs: Math.round(finalItems.reduce((a, b) => a + b.carbs, 0) * 10) / 10,
      fat: Math.round(finalItems.reduce((a, b) => a + b.fat, 0) * 10) / 10,
    };

    const penaltyScore = scoreDailyPlan(finalTotals, targets, tolerances, finalShakes, mealsCopy);

    return {
      meals: mealsCopy,
      finalTotals,
      penaltyScore
    };
  });

  // Sort candidates deterministically by penalty score
  optimizedPlans.sort((a, b) => a.penaltyScore - b.penaltyScore);

  // If planIndex > 0, pick a distinct top-performing plan for deterministic variety
  const selectionIndex = planIndex % Math.min(optimizedPlans.length, 5);
  const selectedPlan = optimizedPlans[selectionIndex] || optimizedPlans[0];

  // Independently sum and format final meal slots
  const formattedSlots = selectedPlan.meals.map(slot => {
    const slotItems = slot.items;
    const slotCals = Math.round(slotItems.reduce((a, b) => a + b.calories, 0));
    const slotProt = Math.round(slotItems.reduce((a, b) => a + b.protein, 0) * 10) / 10;
    const slotCarbs = Math.round(slotItems.reduce((a, b) => a + b.carbs, 0) * 10) / 10;
    const slotFat = Math.round(slotItems.reduce((a, b) => a + b.fat, 0) * 10) / 10;

    return {
      meal: slot.meal,
      items: slotItems,
      totalCalories: slotCals,
      totalProtein: slotProt,
      totalCarbs: slotCarbs,
      totalFat: slotFat
    };
  });

  // Verify target achievement
  const finalCals = formattedSlots.reduce((a, b) => a + b.totalCalories, 0);
  const finalProt = Math.round(formattedSlots.reduce((a, b) => a + b.totalProtein, 0) * 10) / 10;
  const finalCarbs = Math.round(formattedSlots.reduce((a, b) => a + b.totalCarbs, 0) * 10) / 10;
  const finalFat = Math.round(formattedSlots.reduce((a, b) => a + b.totalFat, 0) * 10) / 10;

  const calMet = finalCals >= targetCals;
  const protMet = finalProt >= targetProt;
  const carbsMet = Math.abs(finalCarbs - targetCarbs) <= targetCarbs * tolerances.carbsToleranceRatio;
  const fatMet = Math.abs(finalFat - targetFat) <= targetFat * tolerances.fatToleranceRatio;

  const unmetTargets = [];
  if (!calMet) unmetTargets.push(`Calories (${finalCals} kcal vs target ${targetCals} kcal)`);
  if (!protMet) {
    if (!effectiveAllowShakes) {
      unmetTargets.push(`Protein (${finalProt}g vs target ${targetProt}g — protein shakes disabled by user preference)`);
    } else {
      unmetTargets.push(`Protein (${finalProt}g vs target ${targetProt}g)`);
    }
  }
  if (!carbsMet) unmetTargets.push(`Carbohydrates (${finalCarbs}g vs target ${targetCarbs}g)`);
  if (!fatMet) unmetTargets.push(`Fat (${finalFat}g vs target ${targetFat}g)`);

  const allTargetsMet = unmetTargets.length === 0;

  const totalShakeServings = countShakeServings(formattedSlots);
  const proteinDistribution = calculateProteinDistribution(formattedSlots);

  // Validate the final generated plan after optimization
  const validationResult = validateMealPlan(formattedSlots, {
    dietaryPreference: pref,
    meatPreferences: normalizedMeatPrefs,
    allowProteinShakes: effectiveAllowShakes,
    beveragePreference: effectiveBeverage,
    mealPlanPreferences: activePrefs
  });

  let feasibilityNote = null;
  if (!allTargetsMet) {
    feasibilityNote = `Target shortfall: ${unmetTargets.join(', ')}. Returned closest feasible plan adhering strictly to dietary preferences without unselected meats, raw ingredients, or invalid snacks.`;
  } else if (!proteinDistribution.targetMet && proteinDistribution.totalProtein > 0) {
    feasibilityNote = `Protein distribution optimized to closest feasible whole-food profile: main meals provide ${Math.round(proteinDistribution.mainRatio * 100)}% (target ≥80%), snacks provide ${Math.round(proteinDistribution.snackRatio * 100)}% (target ≤20%).`;
  }

  // Attach authoritative plan summary directly to returned array
  formattedSlots.summary = {
    actualCalories: finalCals,
    targetCalories: targetCals,
    diffCalories: finalCals - targetCals,
    percentDiffCalories: Math.round(((finalCals - targetCals) / targetCals) * 1000) / 10,

    actualProtein: finalProt,
    targetProtein: targetProt,
    diffProtein: Math.round((finalProt - targetProt) * 10) / 10,
    percentDiffProtein: Math.round(((finalProt - targetProt) / targetProt) * 1000) / 10,

    actualCarbs: finalCarbs,
    targetCarbs: targetCarbs,
    diffCarbs: Math.round((finalCarbs - targetCarbs) * 10) / 10,

    actualFat: finalFat,
    targetFat: targetFat,
    diffFat: Math.round((finalFat - targetFat) * 10) / 10,

    shakeServings: totalShakeServings,
    shakeLimitMet: totalShakeServings <= (effectiveAllowShakes ? 2.001 : 0.001),
    allowProteinShakes: effectiveAllowShakes,
    sugarPreference: effectiveSugar,
    beveragePreference: effectiveBeverage,
    dietaryPreference: pref,
    meatPreferences: normalizedMeatPrefs,
    proteinDistribution,
    mainMealsProteinRatio: proteinDistribution.mainRatio,
    snacksProteinRatio: proteinDistribution.snackRatio,
    mealPlanPreferences: {
      dietPreference: pref,
      meatPreferences: normalizedMeatPrefs,
      shakePreference: effectiveAllowShakes ? 'yes' : 'no',
      beveragePreference: effectiveBeverage,
      sugarPreference: effectiveSugar
    },

    allTargetsMet,
    unmetTargets,
    validation: validationResult,
    feasibilityNote,
    planIndex
  };

  return formattedSlots;
};
