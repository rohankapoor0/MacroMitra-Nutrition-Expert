/**
 * Calculates BMR and TDEE using the Mifflin-St Jeor equation.
 * 
 * BMR Formula:
 * Male:   10 × weightKg + 6.25 × heightCm − 5 × age + 5
 * Female: 10 × weightKg + 6.25 × heightCm − 5 × age − 161
 * 
 * Activity Multipliers:
 * - Sedentary: 1.2
 * - Lightly active: 1.375
 * - Moderately active: 1.55
 * - Very active: 1.725
 * 
 * TDEE = BMR × Activity Multiplier
 */

export const calculateBMR = ({ weight, height, age, sex, activityLevel }) => {
  // Validate and clamp inputs to realistic biological ranges
  const numWeight = parseFloat(weight);
  const numHeight = parseFloat(height);
  const numAge = parseFloat(age);

  if (isNaN(numWeight) || numWeight <= 0 || isNaN(numHeight) || numHeight <= 0 || isNaN(numAge) || numAge <= 0) {
    throw new Error('Invalid biometric parameters: weight, height, and age must be positive numbers.');
  }

  const validWeight = Math.max(20, Math.min(300, numWeight));
  const validHeight = Math.max(50, Math.min(250, numHeight));
  const validAge = Math.max(1, Math.min(120, numAge));
  const isFemale = typeof sex === 'string' && sex.toLowerCase() === 'female';

  const baseBMR = (10 * validWeight) + (6.25 * validHeight) - (5 * validAge);
  const bmr = isFemale ? baseBMR - 161 : baseBMR + 5;

  // Normalized activity multipliers matching Mifflin-St Jeor clinical guidelines
  const normalizedAct = (activityLevel || '').toLowerCase().replace(/[\s_-]/g, '');
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    lightlyactive: 1.375,
    moderate: 1.55,
    moderatelyactive: 1.55,
    active: 1.725,
    veryactive: 1.725,
    extreme: 1.9,
  };

  const multiplier = multipliers[normalizedAct] || 1.2;
  const tdee = bmr * multiplier;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieGoal: Math.round(tdee), // Base maintenance TDEE
  };
};

