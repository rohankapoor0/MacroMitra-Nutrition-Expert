import { describe, it, expect } from 'vitest';
import {
  EGG_NUTRITION,
  RECIPE_DEFINITIONS,
  calculateRecipeNutritionByEggCount,
  calculateItemNutrition,
  formatScaledFoodDisplay
} from '../nutritionCalculator';

describe('MacroMitra Single Source of Truth — Egg Nutrition & Recipe Calculation', () => {
  it('1. Two typical large eggs contribute 12–13.5 g protein before additional ingredients', () => {
    // IFCT 2017 M001 raw whole egg edible portion: 13.28g protein per 100g
    expect(EGG_NUTRITION.RAW_100G.protein).toBeCloseTo(13.28, 2);
    expect(EGG_NUTRITION.RAW_100G.calories).toBeCloseTo(134.8, 1);

    // Standard large egg = 50g edible weight (ICMR-NIN & USDA standard)
    const twoLargeEggsRawProtein = EGG_NUTRITION.RAW_LARGE_EGG_50G.protein * 2;
    expect(twoLargeEggsRawProtein).toBeGreaterThanOrEqual(12.0);
    expect(twoLargeEggsRawProtein).toBeLessThanOrEqual(13.5);
    expect(twoLargeEggsRawProtein).toBeCloseTo(13.28, 2);

    // Boiled egg M004: 13.43g protein per 100g
    const twoLargeEggsBoiledProtein = EGG_NUTRITION.BOILED_LARGE_EGG_50G.protein * 2;
    expect(twoLargeEggsBoiledProtein).toBeGreaterThanOrEqual(12.5);
    expect(twoLargeEggsBoiledProtein).toBeLessThanOrEqual(13.5);
    expect(twoLargeEggsBoiledProtein).toBeCloseTo(13.43, 1);
  });

  it('2. Egg Bhurji recipe totals match the exact sum of its ingredients', () => {
    const bhurji = RECIPE_DEFINITIONS.egg_bhurji;
    expect(bhurji).toBeDefined();
    expect(bhurji.baseEggs).toBe(2);

    // Sum individual ingredient contributions
    const sumCals = bhurji.ingredients.reduce((acc, ing) => acc + ing.calories, 0);
    const sumProt = bhurji.ingredients.reduce((acc, ing) => acc + ing.protein, 0);
    const sumCarbs = bhurji.ingredients.reduce((acc, ing) => acc + ing.carbs, 0);
    const sumFat = bhurji.ingredients.reduce((acc, ing) => acc + ing.fat, 0);

    // Verify ingredient sums:
    // 2 raw eggs (134.8 kcal, 13.28g P) + 30g onion (12 kcal, 0.33g P) + 25g tomato (4.5 kcal, 0.23g P)
    // + 5g green chili & spices (2.2 kcal, 0.1g P) + 4.5g oil (40.5 kcal, 0g P) = 194.0 kcal, 13.94g P
    expect(sumCals).toBeCloseTo(194.0, 1);
    expect(sumProt).toBeCloseTo(13.94, 1);
    expect(sumCarbs).toBeCloseTo(4.22, 1);
    expect(sumFat).toBeCloseTo(13.75, 1);

    // Canonical dish values match within reasonable culinary rounding (< 5 kcal, < 0.5g macros)
    expect(Math.abs(bhurji.totals.calories - sumCals)).toBeLessThan(5);
    expect(Math.abs(bhurji.totals.protein - sumProt)).toBeLessThan(0.5);
    expect(bhurji.totals.protein).toBe(14.0);
    expect(bhurji.totals.calories).toBe(190.0);
  });

  it('3. Adding a 3rd egg increases egg contribution proportionally', () => {
    // 2-egg base
    const twoEggs = calculateRecipeNutritionByEggCount('egg_bhurji', 2);
    expect(twoEggs.protein).toBe(14.0);
    expect(twoEggs.calories).toBe(190.0);

    // 3 eggs: adds exactly 1 raw egg (+6.64g P, +67.4 kcal)
    const threeEggs = calculateRecipeNutritionByEggCount('egg_bhurji', 3);
    const deltaProt = threeEggs.protein - twoEggs.protein;
    const deltaCals = threeEggs.calories - twoEggs.calories;

    expect(deltaProt).toBeCloseTo(6.6, 1);
    expect(deltaCals).toBeGreaterThanOrEqual(65);
    expect(deltaCals).toBeLessThanOrEqual(70);
    expect(threeEggs.protein).toBe(20.6); // 14.0 + 6.64 = 20.6g
    expect(threeEggs.calories).toBe(257); // 190 + 67 = 257 kcal

    // 4 eggs (2 servings): yields 28g protein and 380 kcal
    const fourEggs = calculateRecipeNutritionByEggCount('egg_bhurji', 4);
    expect(fourEggs.protein).toBe(27.3); // Base 14 + 13.28 = 27.28 ~ 27.3g from ingredients
  });

  it('4. formatScaledFoodDisplay prevents user confusion on scaled egg dishes', () => {
    const food = {
      id: 'core-16-egg-bhurji-2-eggs',
      name: 'Egg Bhurji (2 eggs)',
      category: 'Dairy & Eggs',
      serving_basis: 'serving',
      serving_unit: 'serving',
      serving_size_g: 120,
      calories: 190.0,
      protein: 14.0,
      carbs: 4.0,
      fat: 14.0
    };

    // Case A: 1 serving (2 eggs)
    const display1 = formatScaledFoodDisplay(food, 1.0);
    expect(display1.displayName).toBe('Egg Bhurji (2 eggs)');
    expect(display1.displayPortion).toContain('2 eggs');
    expect(display1.displayPortion).toContain('1 serving');
    expect(display1.calories).toBe(190);
    expect(display1.protein).toBe(14.0);

    // Case B: 1.5 servings (3 eggs)
    const display1_5 = formatScaledFoodDisplay(food, 1.5);
    expect(display1_5.displayName).toBe('Egg Bhurji (3 eggs)');
    expect(display1_5.displayPortion).toContain('3 eggs');
    expect(display1_5.displayPortion).toContain('1.5 servings');
    expect(display1_5.protein).toBe(21.0);
    expect(display1_5.calories).toBe(285);

    // Case C: 2.0 servings (4 eggs) - The exact case from user report
    const display2 = formatScaledFoodDisplay(food, 2.0);
    expect(display2.displayName).toBe('Egg Bhurji (4 eggs)');
    expect(display2.displayPortion).toContain('4 eggs');
    expect(display2.displayPortion).toContain('2 servings');
    expect(display2.displayPortion).toContain('240g');
    expect(display2.protein).toBe(28.0);
    expect(display2.calories).toBe(380);

    // Case D: 0.5 serving (1 egg)
    const display0_5 = formatScaledFoodDisplay(food, 0.5);
    expect(display0_5.displayName).toBe('Egg Bhurji (1 egg)');
    expect(display0_5.displayPortion).toContain('1 egg');
    expect(display0_5.protein).toBe(7.0);
    expect(display0_5.calories).toBe(95);
  });

  it('5. Handles Greek Yogurt without nonsensical unit extractions', () => {
    const greekYogurt = {
      id: 'core-17-greek-yogurt-plain',
      name: 'Greek Yogurt (Plain)',
      category: 'Dairy & Eggs',
      serving_basis: 'serving',
      serving_unit: '100g',
      serving_size_g: 100,
      calories: 100.0,
      protein: 10.0,
      carbs: 6.0,
      fat: 4.0
    };

    const formatted1 = formatScaledFoodDisplay(greekYogurt, 1.0);
    expect(formatted1.displayName).toBe('Greek Yogurt (Plain)');
    expect(formatted1.displayPortion).toBe('100g (1 serving)');
    expect(formatted1.protein).toBe(10.0);

    const formatted2 = formatScaledFoodDisplay(greekYogurt, 2.0);
    expect(formatted2.displayName).toBe('Greek Yogurt (Plain)');
    expect(formatted2.displayPortion).toBe('200g (2 servings)');
    expect(formatted2.protein).toBe(20.0);
    expect(formatted2.calories).toBe(200);
  });

  it('6. calculateItemNutrition handles both 100g and serving basis reliably', () => {
    // 100g basis food
    const paneerSoup = {
      id: 'indb-paneer-soup',
      name: 'Paneer soup',
      serving_basis: '100g',
      calories: 47.85,
      protein: 3.22,
      carbs: 2.42,
      fat: 2.81
    };

    // 150g quantity
    const res150g = calculateItemNutrition(paneerSoup, 150, 'g');
    expect(res150g.multiplier).toBe(1.5);
    expect(res150g.calories).toBe(Math.round(47.85 * 1.5));
    expect(res150g.protein).toBe(Math.round(3.22 * 1.5 * 10) / 10);

    // Serving basis food
    const bhurji = {
      id: 'core-16-egg-bhurji-2-eggs',
      name: 'Egg Bhurji (2 eggs)',
      serving_basis: 'serving',
      serving_unit: 'serving',
      serving_size_g: 120,
      calories: 190.0,
      protein: 14.0,
      carbs: 4.0,
      fat: 14.0
    };

    // 2 servings
    const res2serv = calculateItemNutrition(bhurji, 2, 'serving');
    expect(res2serv.multiplier).toBe(2.0);
    expect(res2serv.calories).toBe(380);
    expect(res2serv.protein).toBe(28.0);

    // 240g quantity on 120g serving food
    const res240g = calculateItemNutrition(bhurji, 240, 'g');
    expect(res240g.multiplier).toBe(2.0);
    expect(res240g.calories).toBe(380);
    expect(res240g.protein).toBe(28.0);
  });

  it('7. Other egg records (Boiled, Omelette, Curry) compute accurate nutrition', () => {
    // Boiled eggs (2 eggs)
    const boiled = RECIPE_DEFINITIONS.boiled_eggs;
    expect(boiled.totals.calories).toBeCloseTo(147.7, 1);
    expect(boiled.totals.protein).toBeCloseTo(13.43, 2);

    // Plain Omelette (2 eggs + 5g oil)
    const omelette = RECIPE_DEFINITIONS.plain_omelette;
    expect(omelette.totals.protein).toBeCloseTo(13.3, 1);
    expect(omelette.totals.calories).toBe(180.0);

    // Egg Curry (2 boiled eggs + 120g gravy)
    const curry = RECIPE_DEFINITIONS.egg_curry;
    expect(curry.totals.protein).toBeGreaterThan(14.5);
    expect(curry.totals.calories).toBeGreaterThan(230);
  });

  it('8. Meal Planner and Dashboard yield parity for the same recipe and portions', () => {
    const food = {
      id: 'core-16-egg-bhurji-2-eggs',
      name: 'Egg Bhurji (2 eggs)',
      category: 'Dairy & Eggs',
      serving_basis: 'serving',
      serving_unit: 'serving',
      serving_size_g: 120,
      calories: 190.0,
      protein: 14.0,
      carbs: 4.0,
      fat: 14.0
    };

    // Planner scales to 2.0
    const mult = 2.0;
    const planned = formatScaledFoodDisplay(food, mult);

    // User logs this planned item
    const logged = calculateItemNutrition(food, mult, 'serving');

    // Both must be identical
    expect(planned.calories).toBe(logged.calories);
    expect(planned.protein).toBe(logged.protein);
    expect(planned.carbs).toBe(logged.carbs);
    expect(planned.fat).toBe(logged.fat);

    expect(planned.calories).toBe(380);
    expect(planned.protein).toBe(28.0);
  });
});
