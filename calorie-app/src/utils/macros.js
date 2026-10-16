/**
 * Calculates macro distribution based on calorie goal, body weight, and fitness goal.
 * 
 * Goal Adjustments:
 * - Fat loss (lose / cut): ~400–500 kcal below TDEE (standard 400 kcal deficit)
 * - Maintenance: 0 kcal adjustment (TDEE)
 * - Muscle gain (gain / bulk): ~250–350 kcal above TDEE (standard 300 kcal surplus)
 * 
 * Protein Targets (Goal-Dependent & Weight-Based):
 * - Fat loss: 2.0g per kg body weight (preserves lean muscle mass during calorie restriction)
 * - Maintenance: 1.8g per kg body weight (established MacroMitra baseline)
 * - Muscle gain: 2.0g per kg body weight (supports muscle protein synthesis)
 * 
 * Carbs & Fat:
 * - Carbs: 45% of total adjusted calories (4 kcal/g)
 * - Fat: 30% of total adjusted calories (9 kcal/g)
 */

export const calculateMacros = ({ weight, calorieGoal, goal, customDeficit, customSurplus, customProteinFactor }) => {
  const numCalorieGoal = parseFloat(calorieGoal);
  const numWeight = parseFloat(weight);

  if (isNaN(numCalorieGoal) || numCalorieGoal <= 0 || isNaN(numWeight) || numWeight <= 0) {
    throw new Error('Invalid macro parameters: weight and calorieGoal must be positive numbers.');
  }

  const normalizedGoal = (goal || 'maintain').toLowerCase().replace(/[\s_-]/g, '');
  let adjustedCalories = numCalorieGoal;

  if (normalizedGoal === 'lose' || normalizedGoal === 'fatloss' || normalizedGoal === 'cut') {
    const deficit = customDeficit !== undefined ? customDeficit : 400; // 400-500 kcal deficit
    adjustedCalories = Math.max(1200, adjustedCalories - deficit);
  } else if (normalizedGoal === 'gain' || normalizedGoal === 'musclegain' || normalizedGoal === 'bulk') {
    const surplus = customSurplus !== undefined ? customSurplus : 300; // 250-350 kcal surplus
    adjustedCalories = adjustedCalories + surplus;
  }

  // Protein target: goal-dependent and weight-based
  let proteinFactor = 1.8;
  if (customProteinFactor !== undefined && customProteinFactor > 0) {
    proteinFactor = customProteinFactor;
  } else if (normalizedGoal === 'lose' || normalizedGoal === 'fatloss' || normalizedGoal === 'cut') {
    proteinFactor = 2.0;
  } else if (normalizedGoal === 'gain' || normalizedGoal === 'musclegain' || normalizedGoal === 'bulk') {
    proteinFactor = 2.0;
  } else {
    proteinFactor = 1.8;
  }

  const proteinG = Math.round(proteinFactor * numWeight);

  // Carbs: 45% of total adjusted calories
  const carbsCalories = adjustedCalories * 0.45;
  const carbsG = Math.round(carbsCalories / 4);

  // Fat: 30% of total adjusted calories
  const fatCalories = adjustedCalories * 0.30;
  const fatG = Math.round(fatCalories / 9);

  return {
    adjustedCalories: Math.round(adjustedCalories),
    proteinG,
    carbsG,
    fatG,
  };
};

