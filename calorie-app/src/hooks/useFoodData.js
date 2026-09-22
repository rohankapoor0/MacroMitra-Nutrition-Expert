import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const JUNK_BLACKLIST = [
  'gulab jamun', 'jalebi', 'chaat', 'samosa', 'kachori', 'pakora',
  'fries', 'chips', 'sugary drink', 'fried snack', 'bakery junk',
  'sweet', 'sugar', 'biscuit', 'cookie', 'burger', 'pizza'
];

const SIDE_KEYWORDS = [
  'curd', 'yogurt', 'salad', 'fruit', 'nuts', 'buttermilk', 
  'vegetables', 'cucumber', 'carrot', 'sprouts', 'peanut', 'almond'
];

const PROTEIN_RICH_KEYWORDS = [
  'chicken', 'egg', 'paneer', 'tofu', 'dal', 'rajma', 'chole', 
  'soya', 'milk', 'fish', 'meat', 'mutton', 'whey', 'greek yogurt'
];

export const useFoodData = () => {
  const [foodData, setFoodData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch('/data/indian_food_nutrition.csv'),
          fetch('/data/indian_food_health.csv')
        ]);

        const texts = await Promise.all([res1.text(), res2.text()]);
        
        const parseCSV = (csvText) => {
          return new Promise((resolve) => {
            Papa.parse(csvText, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                const normalizedData = results.data
                  .map(row => {
                    const normalizedRow = {};
                    Object.keys(row).forEach(key => {
                      const lowerKey = key.toLowerCase();
                      let finalKey = lowerKey;
                      if (lowerKey.includes('food')) finalKey = 'name';
                      else if (lowerKey.includes('calories')) finalKey = 'calories';
                      else if (lowerKey.includes('protein')) finalKey = 'protein';
                      else if (lowerKey.includes('carbs')) finalKey = 'carbs';
                      else if (lowerKey.includes('fat')) finalKey = 'fat';
                      
                      normalizedRow[finalKey] = row[key];
                    });
                    return normalizedRow;
                  })
                  .map(row => {
                    const name = row.name || 'Unknown Item';
                    const nameLower = name.toLowerCase();
                    
                    // Categorization Logic
                    const isBlacklisted = JUNK_BLACKLIST.some(j => nameLower.includes(j));
                    
                    // Strict Curry Rules: Only Chicken, Fish, Egg
                    const isCurry = nameLower.includes('curry') || nameLower.includes('masala') || nameLower.includes('chettinad');
                    const isAllowedCurry = nameLower.includes('chicken') || nameLower.includes('fish') || nameLower.includes('egg') || nameLower.includes('meen') || nameLower.includes('kozhi');
                    
                    // If it's a curry but not an allowed one, we don't treat it as a main dish candidate
                    // for the planner, but we keep it in the database.
                    const isForbiddenCurry = isCurry && !isAllowedCurry;

                    const isSide = SIDE_KEYWORDS.some(s => nameLower.includes(s));
                    const isHighProtein = PROTEIN_RICH_KEYWORDS.some(p => nameLower.includes(p));
                    
                    return {
                      name,
                      calories: parseFloat(row.calories),
                      protein: parseFloat(row.protein),
                      carbs: parseFloat(row.carbs),
                      fat: parseFloat(row.fat),
                      isSide,
                      isMain: !isSide && !isBlacklisted && !isForbiddenCurry,
                      isHighProtein,
                      isBlacklisted,
                      isAllowedCurry
                    };
                  })
                  .filter(row => 
                    !row.isBlacklisted &&
                    !isNaN(row.calories) && 
                    !isNaN(row.protein) && 
                    !isNaN(row.carbs) && 
                    !isNaN(row.fat)
                  );
                resolve(normalizedData);
              }
            });
          });
        };

        const [data1, data2] = await Promise.all([parseCSV(texts[0]), parseCSV(texts[1])]);
        
        // Merge and remove duplicates by name
        const combined = [...data1, ...data2];
        const uniqueMap = new Map();
        combined.forEach(item => {
          if (!uniqueMap.has(item.name.toLowerCase())) {
            uniqueMap.set(item.name.toLowerCase(), item);
          }
        });

        setFoodData(Array.from(uniqueMap.values()));
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { foodData, isLoading, error };
};
