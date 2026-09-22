/**
 * Generates a full day meal plan based on calorie and protein targets.
 * 
 * Rules:
 * 1. 1 Main Meal + 1-2 Sides for B/L/D.
 * 2. Main provides most calories.
 * 3. Prefer High Protein (Chicken, Fish, Egg curries only).
 * 4. Realistic pairs.
 * 5. Aggressive target matching.
 */

export const generateMealPlan = ({ foodData, calorieGoal, proteinGoal }) => {
  if (!foodData || foodData.length === 0) return [];

  const mealSlots = [
    { name: "Breakfast", ratio: 0.25 },
    { name: "Lunch", ratio: 0.35 },
    { name: "Dinner", ratio: 0.30 },
    { name: "Snacks", ratio: 0.10 },
  ];

  const mains = foodData.filter(f => f.isMain);
  const sides = foodData.filter(f => f.isSide);

  // Sorting for prioritization: Protein density (Protein / Calories)
  const sortFn = (a, b) => {
    const scoreA = (a.protein / (a.calories || 1)) + (a.isHighProtein ? 10 : 0);
    const scoreB = (b.protein / (b.calories || 1)) + (b.isHighProtein ? 10 : 0);
    return scoreB - scoreA;
  };

  const prioritizeFood = (list) => [...list].sort(sortFn).sort(() => Math.random() - 0.5).slice(0, 30);

  let currentPlanProtein = 0;
  let currentPlanCalories = 0;

  const result = mealSlots.map((slot) => {
    const slotCalorieBudget = calorieGoal * slot.ratio;
    const items = [];
    
    if (slot.name === "Snacks") {
      const snackCandidates = prioritizeFood(foodData);
      let currentCals = 0;
      for (const food of snackCandidates) {
        if (currentCals + food.calories <= slotCalorieBudget * 1.8) {
          items.push({ ...food, role: 'Snack' });
          currentCals += food.calories;
          if (items.length >= 2) break;
        }
      }
    } else {
      const mainCandidates = prioritizeFood(mains);
      const sideCandidates = prioritizeFood(sides);

      // 1. Pick Main (Must be significantly caloric but stay within budget)
      for (const main of mainCandidates) {
        if (main.calories <= slotCalorieBudget * 0.95 && main.calories >= slotCalorieBudget * 0.4) {
          items.push({ ...main, role: 'Main' });
          break;
        }
      }
      
      // Fallback if no main found in ideal range
      if (items.length === 0 && mainCandidates.length > 0) {
        items.push({ ...mainCandidates[0], role: 'Main' });
      }

      // 2. Add Sides (Up to 3 if needed to meet calorie/protein goals)
      let currentCals = items[0]?.calories || 0;
      for (const side of sideCandidates) {
        if (currentCals + side.calories <= slotCalorieBudget * 1.3) {
          items.push({ ...side, role: 'Side' });
          currentCals += side.calories;
          if (items.length >= 4) break; 
          if (currentCals >= slotCalorieBudget * 0.9) break;
        }
      }
    }

    const totalCals = Math.round(items.reduce((a, b) => a + b.calories, 0));
    const totalProt = Math.round(items.reduce((a, b) => a + b.protein, 0));
    
    currentPlanCalories += totalCals;
    currentPlanProtein += totalProt;

    return {
      meal: slot.name,
      items,
      totalCalories: totalCals,
      totalProtein: totalProt,
    };
  });

  // Global Check: If we are still far from protein goal, add one last high-protein adjustment from snacks
  if (currentPlanProtein < proteinGoal * 0.95) {
      // Find the snack slot
      const snackSlot = result.find(r => r.meal === "Snacks");
      if (snackSlot) {
          const highProteinSides = prioritizeFood(sides).filter(s => s.protein > 8);
          if (highProteinSides.length > 0) {
              snackSlot.items.push({ ...highProteinSides[0], role: 'Protein Boost' });
              snackSlot.totalCalories += Math.round(highProteinSides[0].calories);
              snackSlot.totalProtein += Math.round(highProteinSides[0].protein);
          }
      }
  }

  return result;
};
