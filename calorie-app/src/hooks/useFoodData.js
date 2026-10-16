import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const JUNK_BLACKLIST = [
  'gulab jamun', 'jalebi', 'chaat', 'samosa', 'kachori', 'pakora',
  'fries', 'chips', 'sugary drink', 'fried snack', 'bakery junk',
  'sweet', 'sugar', 'biscuit', 'cookie', 'burger', 'pizza'
];

const SIDE_KEYWORDS = [
  'curd', 'yogurt', 'salad', 'fruit', 'nuts', 'buttermilk', 
  'vegetables', 'cucumber', 'carrot', 'sprouts', 'peanut', 'almond',
  'raita', 'chutney', 'papad'
];

const PROTEIN_RICH_KEYWORDS = [
  'chicken', 'egg', 'paneer', 'tofu', 'dal', 'rajma', 'chole', 
  'soya', 'milk', 'fish', 'meat', 'mutton', 'whey', 'greek yogurt',
  'prawn', 'salmon', 'tuna', 'keema'
];

export const useFoodData = () => {
  const [foodData, setFoodData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // 1. Try loading the pre-merged comprehensive JSON catalogue
        const jsonRes = await fetch('/data/merged_food_catalogue.json');
        if (jsonRes.ok) {
          const catalogue = await jsonRes.json();
          if (catalogue && Array.isArray(catalogue.foods) && catalogue.foods.length > 0) {
            if (isMounted) {
              setFoodData(catalogue.foods);
              setIsLoading(false);
            }
            return;
          }
        }

        // 2. Fallback to existing CSVs if JSON is not available
        console.warn('Merged catalogue JSON not found, falling back to CSV files.');
        const [res1, res2] = await Promise.all([
          fetch('/data/indian_food_nutrition.csv'),
          fetch('/data/indian_food_health.csv')
        ]);

        const texts = await Promise.all([res1.text(), res2.text()]);

        const parseCSV = (csvText, sourceName) => {
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
                      else if (lowerKey.includes('fiber')) finalKey = 'fiber';
                      else if (lowerKey.includes('sugar')) finalKey = 'sugar';
                      
                      normalizedRow[finalKey] = row[key];
                    });
                    return normalizedRow;
                  })
                  .map((row, idx) => {
                    const name = row.name || 'Unknown Item';
                    const nameLower = name.toLowerCase();
                    
                    const isBlacklisted = JUNK_BLACKLIST.some(j => nameLower.includes(j));
                    const isCurry = nameLower.includes('curry') || nameLower.includes('masala') || nameLower.includes('chettinad');
                    const isAllowedCurry = nameLower.includes('chicken') || nameLower.includes('fish') || nameLower.includes('egg') || nameLower.includes('meen') || nameLower.includes('kozhi');
                    const isForbiddenCurry = isCurry && !isAllowedCurry;

                    const isSide = SIDE_KEYWORDS.some(s => nameLower.includes(s));
                    const proteinVal = parseFloat(row.protein) || 0;
                    const isHighProtein = proteinVal >= 10 || PROTEIN_RICH_KEYWORDS.some(p => nameLower.includes(p));
                    
                    return {
                      id: `${sourceName}-${idx}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                      name,
                      aliases: [name],
                      category: isSide ? 'Side Dish' : 'Main Dish',
                      serving_basis: sourceName === 'core' ? 'serving' : '100g',
                      serving_unit: sourceName === 'core' ? '1 serving' : '100g',
                      calories: parseFloat(row.calories),
                      protein: proteinVal,
                      carbs: parseFloat(row.carbs) || 0,
                      fat: parseFloat(row.fat) || 0,
                      fiber: row.fiber ? parseFloat(row.fiber) : null,
                      sugar: row.sugar ? parseFloat(row.sugar) : null,
                      isSide,
                      isMain: !isSide && !isBlacklisted && !isForbiddenCurry,
                      isHighProtein,
                      isBlacklisted,
                      isAllowedCurry,
                      source: sourceName === 'core' ? 'macro_mitra_core' : 'existing_health_100g'
                    };
                  })
                  .filter(row => 
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

        const [data1, data2] = await Promise.all([
          parseCSV(texts[0], 'core'),
          parseCSV(texts[1], 'health')
        ]);

        const uniqueMap = new Map();
        [...data1, ...data2].forEach(item => {
          const key = item.name.toLowerCase().trim();
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, item);
          }
        });

        if (isMounted) {
          setFoodData(Array.from(uniqueMap.values()));
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { foodData, isLoading, error };
};
