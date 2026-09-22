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

  it('calculates cutting macros correctly', () => {
    const data = {
      weight: 80,
      calorieGoal: 2500,
      goal: 'lose'
    };
    
    const result = calculateMacros(data);
    expect(result.adjustedCalories).toBe(2200);
  });

  it('calculates bulking macros correctly', () => {
    const data = {
      weight: 60,
      calorieGoal: 2000,
      goal: 'gain'
    };
    
    const result = calculateMacros(data);
    expect(result.adjustedCalories).toBe(2300);
  });
});
