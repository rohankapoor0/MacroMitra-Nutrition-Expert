import { describe, it, expect } from 'vitest';
import { calculateMacros } from '../macros';

describe('calculateMacros', () => {
  it('calculates maintenance macros correctly', () => {
    const data = {
      weight: 70,
      calorieGoal: 2000,
      goal: 'maintain'
    };
    
    const result = calculateMacros(data);
    
    expect(result.adjustedCalories).toBe(2000);
    expect(result.proteinG).toBe(126); // 1.8 * 70
    expect(result.carbsG).toBe(225); // 2000 * 0.45 / 4
    expect(result.fatG).toBe(67); // 2000 * 0.30 / 9
  });

  it('calculates cutting macros correctly with 400-500 kcal deficit and goal-dependent protein', () => {
    const data = {
      weight: 80,
      calorieGoal: 2500,
      goal: 'lose'
    };
    
    const result = calculateMacros(data);
    // 400-500 kcal deficit policy: 2500 - 400 = 2100 kcal
    expect(result.adjustedCalories).toBe(2100);
    // Goal-dependent protein: 2.0g/kg for fat loss = 160g
    expect(result.proteinG).toBe(160);
    expect(result.carbsG).toBe(Math.round(2100 * 0.45 / 4));
    expect(result.fatG).toBe(Math.round(2100 * 0.30 / 9));
  });

  it('calculates bulking macros correctly with 250-350 kcal surplus', () => {
    const data = {
      weight: 60,
      calorieGoal: 2000,
      goal: 'gain'
    };
    
    const result = calculateMacros(data);
    // 250-350 kcal surplus policy: 2000 + 300 = 2300 kcal
    expect(result.adjustedCalories).toBe(2300);
    // Goal-dependent protein: 2.0g/kg for muscle gain = 120g
    expect(result.proteinG).toBe(120);
    expect(result.carbsG).toBe(Math.round(2300 * 0.45 / 4));
    expect(result.fatG).toBe(Math.round(2300 * 0.30 / 9));
  });

  it('allows custom deficit or surplus overrides when provided', () => {
    const customData = {
      weight: 75,
      calorieGoal: 2400,
      goal: 'lose',
      customDeficit: 500,
      customProteinFactor: 2.2
    };

    const result = calculateMacros(customData);
    expect(result.adjustedCalories).toBe(1900); // 2400 - 500
    expect(result.proteinG).toBe(Math.round(2.2 * 75)); // 165g
  });

  it('validates invalid inputs and boundary conditions', () => {
    expect(() => calculateMacros({ weight: -50, calorieGoal: 2000 })).toThrow();
    expect(() => calculateMacros({ weight: 70, calorieGoal: 0 })).toThrow();
    expect(() => calculateMacros({ weight: NaN, calorieGoal: 2000 })).toThrow();
  });
});
