/**
 * Calculates BMR and TDEE using the Mifflin-St Jeor equation.
 * 
 * BMR Formula:
 * Male: (10 × weight) + (6.25 × height) − (5 × age) + 5
 * Female: (10 × weight) + (6.25 × height) − (5 × age) − 161
 * 
 * TDEE = BMR × Activity Multiplier
 */

export const calculateBMR = ({ weight, height, age, sex, activityLevel }) => {
  const baseBMR = (10 * weight) + (6.25 * height) - (5 * age);
  const bmr = sex === "male" ? baseBMR + 5 : baseBMR - 161;

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };

  const multiplier = multipliers[activityLevel] || 1.2;
  const tdee = bmr * multiplier;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieGoal: Math.round(tdee), // Base maintenance
  };
};
