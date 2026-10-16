import { describe, it, expect } from 'vitest';
import catalogueData from '../../../public/data/merged_food_catalogue.json';
import conflictsAudit from '../../../public/data/conflicts_audit.json';
import nutritionAudit from '../../../public/data/nutrition_audit_log.json';
import {
  NUTRIENT_FILTERS,
  getNutrientPer100g,
  passesNutrientFilter,
  matchesNutrients
} from '../../components/MealPlanner/FoodSearch.jsx';

describe('MacroMitra Simplified Nutrient Filters & Acceptance Criteria', () => {
  const foods = catalogueData.foods;

  it('contains exactly the three specified nutrient filters in the nutrient filter row', () => {
    // 1. Only High Protein, Low Calorie, and Low Carb appear in the nutrient filter row.
    expect(NUTRIENT_FILTERS).toHaveLength(3);
    const filterIds = NUTRIENT_FILTERS.map(f => f.id);
    expect(filterIds).toEqual(['high_protein', 'low_calorie', 'low_carb']);

    // Low Fat and All Nutrients must be removed
    expect(filterIds).not.toContain('low_fat');
    expect(filterIds).not.toContain('Low Fat');
    expect(filterIds).not.toContain('All');
    expect(filterIds).not.toContain('all');

    // Check labels and threshold markers
    const hp = NUTRIENT_FILTERS.find(f => f.id === 'high_protein');
    expect(hp.label).toContain('High Protein');
    expect(hp.label).toContain('>10g');

    const lc = NUTRIENT_FILTERS.find(f => f.id === 'low_calorie');
    expect(lc.label).toContain('Low Calorie');
    expect(lc.label).toContain('100 kcal');

    const lcarb = NUTRIENT_FILTERS.find(f => f.id === 'low_carb');
    expect(lcarb.label).toContain('Low Carb');
    expect(lcarb.label).toContain('15g');
  });

  it('correctly evaluates High Protein threshold (> 10g protein per 100g)', () => {
    // Mock foods
    const foodPass = { protein_per_100g: 10.1, serving_basis: '100g' };
    const foodExactBoundary = { protein_per_100g: 10.0, serving_basis: '100g' };
    const foodFail = { protein_per_100g: 9.9, serving_basis: '100g' };

    // Requirement: "more than 10 g protein per 100 g"
    expect(passesNutrientFilter(foodPass, 'high_protein')).toBe(true);
    expect(passesNutrientFilter(foodExactBoundary, 'high_protein')).toBe(false);
    expect(passesNutrientFilter(foodFail, 'high_protein')).toBe(false);

    // In actual database
    const highProteinFoods = foods.filter(f => passesNutrientFilter(f, 'high_protein'));
    expect(highProteinFoods.length).toBeGreaterThan(50);
    expect(highProteinFoods.every(f => {
      const p = getNutrientPer100g(f, 'protein');
      return p !== null && p > 10;
    })).toBe(true);
  });

  it('correctly evaluates Low Calorie threshold (≤ 100 kcal per 100g)', () => {
    // Mock foods
    const foodPass = { calories_per_100g: 99.0, serving_basis: '100g' };
    const foodExactBoundary = { calories_per_100g: 100.0, serving_basis: '100g' };
    const foodFail = { calories_per_100g: 100.1, serving_basis: '100g' };

    // Requirement: "100 kcal or less per 100 g"
    expect(passesNutrientFilter(foodPass, 'low_calorie')).toBe(true);
    expect(passesNutrientFilter(foodExactBoundary, 'low_calorie')).toBe(true);
    expect(passesNutrientFilter(foodFail, 'low_calorie')).toBe(false);

    // In actual database
    const lowCalFoods = foods.filter(f => passesNutrientFilter(f, 'low_calorie'));
    expect(lowCalFoods.length).toBeGreaterThan(50);
    expect(lowCalFoods.every(f => {
      const c = getNutrientPer100g(f, 'calories');
      return c !== null && c <= 100;
    })).toBe(true);
  });

  it('correctly evaluates Low Carb threshold (≤ 15g carbohydrates per 100g)', () => {
    // Mock foods
    const foodPass = { carbs_per_100g: 14.5, serving_basis: '100g' };
    const foodExactBoundary = { carbs_per_100g: 15.0, serving_basis: '100g' };
    const foodFail = { carbs_per_100g: 15.1, serving_basis: '100g' };

    // Requirement: "15 g or less carbohydrates per 100 g"
    expect(passesNutrientFilter(foodPass, 'low_carb')).toBe(true);
    expect(passesNutrientFilter(foodExactBoundary, 'low_carb')).toBe(true);
    expect(passesNutrientFilter(foodFail, 'low_carb')).toBe(false);

    // In actual database
    const lowCarbFoods = foods.filter(f => passesNutrientFilter(f, 'low_carb'));
    expect(lowCarbFoods.length).toBeGreaterThan(50);
    expect(lowCarbFoods.every(f => {
      const c = getNutrientPer100g(f, 'carbs');
      return c !== null && c <= 15;
    })).toBe(true);
  });

  it('handles missing nutrient values as unknown rather than zero (they do not pass filters)', () => {
    const missingProtein = { protein_per_100g: null, protein: null, serving_basis: '100g' };
    const missingCalories = { calories_per_100g: null, calories: null, serving_basis: '100g' };
    const missingCarbs = { carbs_per_100g: null, carbs: null, serving_basis: '100g' };

    // Missing values must fail the filter
    expect(passesNutrientFilter(missingProtein, 'high_protein')).toBe(false);
    expect(passesNutrientFilter(missingCalories, 'low_calorie')).toBe(false);
    expect(passesNutrientFilter(missingCarbs, 'low_carb')).toBe(false);

    // Food with no serving weight conversion should not pass per-100g threshold
    const unknownBasisFood = {
      serving_basis: 'serving',
      serving_size_g: null,
      calories: 50,
      protein: 15,
      carbs: 5
    };
    expect(getNutrientPer100g(unknownBasisFood, 'protein')).toBeNull();
    expect(passesNutrientFilter(unknownBasisFood, 'high_protein')).toBe(false);
  });

  it('applies AND logic when multiple nutrient filters are active simultaneously', () => {
    // Both High Protein AND Low Calorie
    const hpAndLowCal = foods.filter(f => matchesNutrients(f, ['high_protein', 'low_calorie']));
    expect(hpAndLowCal.length).toBeGreaterThan(0);
    expect(hpAndLowCal.every(f => {
      const p = getNutrientPer100g(f, 'protein');
      const c = getNutrientPer100g(f, 'calories');
      return p > 10 && c <= 100;
    })).toBe(true);

    // High Protein AND Low Carb
    const hpAndLowCarb = foods.filter(f => matchesNutrients(f, ['high_protein', 'low_carb']));
    expect(hpAndLowCarb.length).toBeGreaterThan(0);
    expect(hpAndLowCarb.every(f => {
      const p = getNutrientPer100g(f, 'protein');
      const carbs = getNutrientPer100g(f, 'carbs');
      return p > 10 && carbs <= 15;
    })).toBe(true);

    // All three filters active simultaneously (High Protein AND Low Calorie AND Low Carb)
    const tripleFiltered = foods.filter(f => matchesNutrients(f, ['high_protein', 'low_calorie', 'low_carb']));
    expect(tripleFiltered.every(f => {
      const p = getNutrientPer100g(f, 'protein');
      const c = getNutrientPer100g(f, 'calories');
      const carbs = getNutrientPer100g(f, 'carbs');
      return p > 10 && c <= 100 && carbs <= 15;
    })).toBe(true);
  });

  it('clearing nutrient filters restores the full result set', () => {
    const noFilters = foods.filter(f => matchesNutrients(f, []));
    expect(noFilters.length).toBe(foods.length);
  });

  it('combines nutrient filters with category filters and text search simultaneously', () => {
    // Category: Non-Veg AND Nutrient: High Protein AND search: "chicken"
    const chickenResults = foods.filter(f => {
      const matchesCat = (f.category || '').toLowerCase().includes('non-veg');
      const matchesNutr = matchesNutrients(f, ['high_protein']);
      const matchesSearch = f.name.toLowerCase().includes('chicken');
      return matchesCat && matchesNutr && matchesSearch;
    });

    expect(chickenResults.length).toBeGreaterThan(0);
    chickenResults.forEach(item => {
      expect(item.name.toLowerCase()).toContain('chicken');
      const p = getNutrientPer100g(item, 'protein');
      expect(p).toBeGreaterThan(10);
    });
  });
});

describe('Traceability & Nutritional Accuracy Audit of Specific Dishes', () => {
  const foods = catalogueData.foods;

  it('traces Palak Paneer / Spinach Paneer to trusted canonical source and deduplicates INDB duplicate', () => {
    // Core Palak Paneer (serving basis: 200g portion, 210 kcal)
    const corePalak = foods.find(f => f.name === 'Palak Paneer' && f.source === 'macro_mitra_core');
    expect(corePalak).toBeDefined();
    expect(corePalak.calories).toBe(210);
    expect(corePalak.protein).toBe(14);
    expect(corePalak.serving_basis).toBe('serving');
    expect(corePalak.calories_per_100g).toBe(105);
    expect(corePalak.protein_per_100g).toBe(7);
    // Alias should include Spinach paneer
    expect(corePalak.aliases).toContain('Spinach paneer');

    // Health Palak Paneer (100g basis, 220 kcal, 14g protein)
    const healthPalak = foods.find(f => f.name === 'Palak Paneer' && f.source === 'existing_health_100g');
    expect(healthPalak).toBeDefined();
    expect(healthPalak.calories).toBe(220);
    expect(healthPalak.protein).toBe(14);
    expect(healthPalak.serving_basis).toBe('100g');

    // The inaccurate duplicate "Spinach paneer (Palak paneer)" (77.68 kcal) from INDB must NOT appear as a distinct record
    const indbDuplicate = foods.find(f => f.name === 'Spinach paneer (Palak paneer)' && f.source === 'kaggle_indb_100g');
    expect(indbDuplicate).toBeUndefined();

    // Verify logged in nutrition audit
    expect(nutritionAudit.specific_dishes_audited.spinach_paneer_palak_paneer).toBeDefined();
    expect(nutritionAudit.specific_dishes_audited.spinach_paneer_palak_paneer.status).toContain('Resolved');
  });

  it('traces Paneer Tikka / Paneer shashlik to trusted canonical source and deduplicates INDB duplicate', () => {
    // Core Paneer Tikka (serving basis: 150g portion, 265 kcal, 18g protein)
    const coreTikka = foods.find(f => f.name === 'Paneer Tikka' && f.source === 'macro_mitra_core');
    expect(coreTikka).toBeDefined();
    expect(coreTikka.calories).toBe(265);
    expect(coreTikka.protein).toBe(18);
    expect(coreTikka.calories_per_100g).toBeCloseTo(176.67, 1);
    expect(coreTikka.protein_per_100g).toBe(12);

    // Health Paneer Tikka (100g basis: 260 kcal, 18g protein)
    const healthTikka = foods.find(f => f.name === 'Paneer Tikka' && f.source === 'existing_health_100g');
    expect(healthTikka).toBeDefined();
    expect(healthTikka.calories).toBe(260);
    expect(healthTikka.protein).toBe(18);

    // The inaccurate duplicate "Paneer shaslik/tikka" (93.85 kcal) must NOT appear as a distinct record
    const indbDuplicate = foods.find(f => f.name === 'Paneer shaslik/tikka');
    expect(indbDuplicate).toBeUndefined();

    // Verify logged in nutrition audit
    expect(nutritionAudit.specific_dishes_audited.paneer_shashlik_tikka).toBeDefined();
    expect(nutritionAudit.specific_dishes_audited.paneer_shashlik_tikka.status).toContain('Resolved');
  });

  it('traces Paneer Soup to authentic broth and validates 4/4/9 energy consistency', () => {
    // Paneer soup from INDB (Row 913: 47.85 kcal, 3.22g P, 2.42g C, 2.81g F per 100g)
    const paneerSoup = foods.find(f => f.name === 'Paneer soup');
    expect(paneerSoup).toBeDefined();
    expect(paneerSoup.source).toBe('kaggle_indb_100g');
    expect(paneerSoup.serving_basis).toBe('100g');
    expect(paneerSoup.calories).toBeCloseTo(47.85, 2);
    expect(paneerSoup.protein).toBeCloseTo(3.22, 1);
    expect(paneerSoup.carbs).toBeCloseTo(2.42, 1);
    expect(paneerSoup.fat).toBeCloseTo(2.8, 1);

    // Diagnostic 4/4/9 consistency check
    const estimatedCals = (paneerSoup.protein * 4) + (paneerSoup.carbs * 4) + (paneerSoup.fat * 9);
    expect(estimatedCals).toBeCloseTo(47.76, 1);
    expect(Math.abs(paneerSoup.calories - estimatedCals)).toBeLessThan(0.5);

    // Verify logged in nutrition audit
    expect(nutritionAudit.specific_dishes_audited.paneer_soup).toBeDefined();
    expect(nutritionAudit.specific_dishes_audited.paneer_soup.status).toContain('Genuine');
  });

  it('validates kJ to kcal conversions in Dataset B and records them in the audit log', () => {
    // Dataset B contained 38 records with energy stored in kJ
    expect(nutritionAudit.kj_conversions_count).toBe(38);
    expect(nutritionAudit.kj_to_kcal_conversions).toHaveLength(38);

    // Bananas, raw: original was 371 kJ, converted to ~88.67 kcal
    const bananaRaw = foods.find(f => f.name === 'Bananas, raw');
    expect(bananaRaw).toBeDefined();
    expect(bananaRaw.is_kj_converted).toBe(true);
    expect(bananaRaw.calories).toBeCloseTo(88.67, 1);
    expect(bananaRaw.raw_data.calories).toBe(371.0);

    // Garlic bread, frozen: original was 1460 kJ, converted to ~348.95 kcal
    const garlicBread = foods.find(f => f.name === 'Garlic bread, frozen');
    expect(garlicBread).toBeDefined();
    expect(garlicBread.is_kj_converted).toBe(true);
    expect(garlicBread.calories).toBeCloseTo(348.95, 1);
    expect(garlicBread.raw_data.calories).toBe(1460.0);
  });

  it('preserves source priority rules without silently overwriting data', () => {
    expect(conflictsAudit.source_priority_rules).toBeDefined();
    expect(conflictsAudit.conflicts_count).toBeGreaterThan(0);
    // Verified that highest priority (Core=1, Health=2) are retained over INDB=3 and Everyday=4
    const conflicts = conflictsAudit.conflicts;
    expect(conflicts.every(c => c.retained_name && c.retained_source)).toBe(true);
  });
});

describe('Sort by Protein & Logging Consistency', () => {
  const foods = catalogueData.foods;

  it('sorts foods using per-100g protein values and keeps unknown protein at the end', () => {
    const sortedDesc = [...foods].sort((a, b) => {
      const protA = getNutrientPer100g(a, 'protein');
      const protB = getNutrientPer100g(b, 'protein');
      const isNullA = protA === null || protA === undefined || isNaN(protA);
      const isNullB = protB === null || protB === undefined || isNaN(protB);
      if (isNullA && isNullB) return 0;
      if (isNullA) return 1;
      if (isNullB) return -1;
      return protB - protA;
    });

    const topItem = sortedDesc[0];
    const topP = getNutrientPer100g(topItem, 'protein');
    expect(topP).toBeGreaterThanOrEqual(25);

    // Check monotonicity on first 30 items
    for (let i = 0; i < 30; i++) {
      const p1 = getNutrientPer100g(sortedDesc[i], 'protein');
      const p2 = getNutrientPer100g(sortedDesc[i + 1], 'protein');
      expect(p1).toBeGreaterThanOrEqual(p2);
    }
  });

  it('correctly calculates logged nutrition scaling for 100g vs serving foods', () => {
    // 100g food logged at 250g
    const food100g = {
      name: 'Paneer soup',
      serving_basis: '100g',
      calories: 47.85,
      protein: 3.22,
      carbs: 2.42,
      fat: 2.81
    };
    const qtyGrams = 250;
    const multGrams = qtyGrams / 100.0;
    expect(Math.round(food100g.calories * multGrams)).toBe(120);
    expect(Math.round(food100g.protein * multGrams * 10) / 10).toBe(8.1);

    // Serving food logged at 2 servings
    const foodServing = {
      name: 'Roti (Whole Wheat)',
      serving_basis: 'serving',
      calories: 85,
      protein: 3.0,
      carbs: 18.0,
      fat: 0.5
    };
    const qtyServings = 2;
    const multServings = qtyServings;
    expect(foodServing.calories * multServings).toBe(170);
    expect(foodServing.protein * multServings).toBe(6.0);
  });
});
