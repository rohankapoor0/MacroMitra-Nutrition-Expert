import { describe, it, expect } from 'vitest';
import { calculateBMR } from '../bmr';

describe('calculateBMR', () => {
  it('correctly calculates BMR for a male with moderate activity', () => {
    const profile = {
      weight: 70,
      height: 170,
      age: 25,
      sex: 'male',
      activityLevel: 'moderate'
    };
    
    const result = calculateBMR(profile);
    
    // Formula check: (10*70) + (6.25*170) - (5*25) + 5 = 700 + 1062.5 - 125 + 5 = 1642.5
    // TDEE: 1642.5 * 1.55 = 2545.875
    expect(result.bmr).toBe(1643);
    expect(result.tdee).toBe(2546);
  });

  it('correctly calculates BMR for a female with sedentary activity', () => {
    const profile = {
      weight: 60,
      height: 160,
      age: 30,
      sex: 'female',
      activityLevel: 'sedentary'
    };
    
    const result = calculateBMR(profile);
    
    // Formula check: (10*60) + (6.25*160) - (5*30) - 161 = 600 + 1000 - 150 - 161 = 1289
    // TDEE: 1289 * 1.2 = 1546.8
    expect(result.bmr).toBe(1289);
    expect(result.tdee).toBe(1547);
  });

  it('handles invalid activity level by defaulting to sedentary', () => {
    const profile = {
      weight: 70,
      height: 170,
      age: 25,
      sex: 'male',
      activityLevel: 'unknown'
    };
    
    const result = calculateBMR(profile);
    // 1642.5 (bmr) * 1.2 = 1971
    expect(result.tdee).toBe(1971);
  });
});
