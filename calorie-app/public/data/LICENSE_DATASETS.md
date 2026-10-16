# Dataset Licensing & Attribution

## 1. Source 1 — IFCT 2017 (Indian Food Composition Tables)
- **Repository:** `https://github.com/nodef/ifct2017.git`
- **Compiler/Maintainer:** Subhajit Sahu (`wolfram77@gmail.com`)
- **Original Source Publication:** *Indian Food Composition Tables 2017*, by T. Longvah, R. Ananthan, K. Bhaskarachary, and K. Venkaiah.
- **Publishing Authority:** National Institute of Nutrition (NIN), Indian Council of Medical Research (ICMR), Department of Health Research, Ministry of Health and Family Welfare, Government of India.
- **License:** GNU Affero General Public License Version 3 (AGPL-3.0-or-later).
- **Scope & Role:**
  Reference laboratory assay for 542 raw Indian agricultural commodities, pulses, grains, flours, vegetables, fruits, meats, and spices.
  All energy converted from kJ to kcal (`cals = enerc / 4.184`); minerals and vitamins converted from SI base grams to standard mg / µg units.
- **Attribution Notice:**
  Nutritional data for raw Indian foods and ingredients derived from the *Indian Food Composition Tables 2017* (ICMR-NIN), digitized by Subhajit Sahu under AGPL-3.0.

## 2. Source 2 — Kaggle Indian Food Nutrition Dataset (Dataset A)
- **Dataset:** `batthulavinay/indian-food-nutrition`
- **Author:** Vinay Batthula
- **Original Source:** Anuvaad Indian Nutrient Database (INDB)
- **License:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
- **Scope & Role:**
  Composite cooked Indian dishes and everyday prepared meal recipes.
- **Attribution Notice:**
  Nutritional data for prepared Indian dishes provided by Vinay Batthula via Kaggle (`batthulavinay/indian-food-nutrition`), processed from the Anuvaad Indian Nutrient Database (INDB).

## 3. Kaggle Food Nutrition Dataset — 150 Everyday Foods (Dataset B)
- **Dataset:** `sonalshinde123/food-nutrition-dataset-150-everyday-foods`
- **Author:** Sonal Shinde
- **License:** Creative Commons CC0 1.0 Universal (Public Domain Dedication)
- **Attribution Notice:**
  Nutritional data for everyday staple foods provided by Sonal Shinde via Kaggle (`sonalshinde123/food-nutrition-dataset-150-everyday-foods`).

## 4. MacroMitra Hand-Curated Indian Nutrition Catalogue
- **Source:** Hand-calibrated serving portions, portion multipliers, and regional dish nutritional models for MacroMitra.
- **License:** MIT License.

## 5. Deployment & Runtime Guarantee
- All dataset downloads, schema normalizations, and reconciliation scripts execute strictly during development/build pipelines.
- End users do not require Kaggle credentials, GitHub access, or third-party APIs to access the offline food database.
