# MacroMitra 🥗

An Indian Food Calorie & Meal Planner React web application.

## Features
- **BMR / Calorie Calculator**: Tells you exactly how many calories and protein you need.
- **Meal Planner**: Generates a full day of Indian meals meeting your targets.
- **Local Database**: Browsable Indian food database with macros.

## Dataset
This app uses a local CSV file located at `public/data/indian_food_nutrition.csv`. 

> [!NOTE]
> If the CSV file is missing or you wish to use your own, ensure it follows this column format:
> `Food Item`, `Calories`, `Protein (g)`, `Carbs (g)`, `Fat (g)`.

## Setup
1. Clone the repo
2. `npm install`
3. `npm run dev`

## Methodology
- **BMR calculation**: Mifflin-St Jeor Equation.
- **Macro targets**: 1.8g protein per kg weight, with remaining calories split between carbs (45%) and fat (30%).
- **Meal generation**: Greedy selection algorithm with specific meal splits (Breakfast 25%, Lunch 35%, Dinner 30%, Snacks 10%).
