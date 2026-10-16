#!/usr/bin/env python3
"""
Unit tests for MacroMitra Dual Kaggle Dataset Importer
"""

import unittest
import os
import json
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

from import_kaggle_dataset import (
    normalize_key,
    extract_aliases,
    infer_category,
    parse_float_safe,
    compute_planner_flags,
    assign_preparation_metadata
)

class TestImporterUtilities(unittest.TestCase):

    def test_normalize_key(self):
        self.assertEqual(normalize_key("  Dal Tadka! "), "dal tadka")
        self.assertEqual(normalize_key("Roti (Whole Wheat)"), "roti whole wheat")
        self.assertEqual(normalize_key("Mutton   biryani/biriyani"), "mutton biryani biriyani")
        self.assertEqual(normalize_key("Apple, raw"), "apple raw")

    def test_extract_aliases(self):
        aliases = extract_aliases("Hot tea (Garam Chai)")
        self.assertIn("Hot tea", aliases)
        self.assertIn("Garam Chai", aliases)

        curd_rice_aliases = extract_aliases("Curd rice (Dahi bhaat/Dahi chawal/ Perugu annam/Daddojanam/Thayir saadam)")
        self.assertIn("Curd rice", curd_rice_aliases)
        self.assertIn("Dahi bhaat", curd_rice_aliases)
        self.assertIn("Dahi chawal", curd_rice_aliases)

        slash_aliases = extract_aliases("Tandoori parantha/paratha")
        self.assertTrue(any("parantha" in a for a in slash_aliases))
        self.assertTrue(any("paratha" in a for a in slash_aliases))

        # Dataset B inverted comma names
        apple_aliases = extract_aliases("Apple, raw")
        self.assertIn("Raw Apple", apple_aliases)
        self.assertIn("Apple", apple_aliases)

    def test_infer_category(self):
        self.assertEqual(infer_category("Masala Chai"), "Beverages")
        self.assertEqual(infer_category("Moong Dal"), "Dals & Legumes")
        self.assertEqual(infer_category("Tandoori Chicken"), "Non-Veg")
        self.assertEqual(infer_category("Tandoori Roti"), "Breads")
        self.assertEqual(infer_category("Gulab Jamun"), "Desserts")
        self.assertEqual(infer_category("Idli Sambar"), "Breakfast")
        self.assertEqual(infer_category("Samosa"), "Snacks")
        # Dataset B categories
        self.assertEqual(infer_category("Apple, raw", "Apples"), "Fruits & Vegetables")
        self.assertEqual(infer_category("Yogurt, Greek", "Dairy and Egg Products"), "Dairy & Eggs")
        self.assertEqual(infer_category("Bread, sweet potato", "Yeast breads"), "Breads")

    def test_parse_float_safe(self):
        self.assertEqual(parse_float_safe("12.34"), 12.34)
        self.assertEqual(parse_float_safe(" 100 "), 100.0)
        self.assertIsNone(parse_float_safe(""))
        self.assertIsNone(parse_float_safe("N/A"))
        self.assertIsNone(parse_float_safe("nan"))
        self.assertIsNone(parse_float_safe(float('nan')))
        self.assertIsNone(parse_float_safe(None))

    def test_compute_planner_flags(self):
        is_side, is_main, is_hp, is_ac = compute_planner_flags("Chicken Curry", 25.0)
        self.assertTrue(is_main)
        self.assertFalse(is_side)
        self.assertTrue(is_hp)
        self.assertTrue(is_ac)

        is_side_dahi, is_main_dahi, is_hp_dahi, _ = compute_planner_flags("Curd (Dahi)", 3.0)
        self.assertTrue(is_side_dahi)
        self.assertFalse(is_main_dahi)

    def test_assign_preparation_metadata(self):
        # 1. Raw pulse from IFCT: strictly ineligible for meal plans
        raw_pulse = {
            "name": "Bengal gram, dal",
            "source": "ifct_2017_reference",
            "category": "Main Dishes",
            "raw_data": {"grup": "Grain Legumes"}
        }
        classified_pulse = assign_preparation_metadata(raw_pulse)
        self.assertEqual(classified_pulse["preparation_state"], "raw_ingredient")
        self.assertFalse(classified_pulse["is_meal_plan_eligible"])
        self.assertFalse(classified_pulse["is_snack_eligible"])

        # 2. Cooked pulse dish: eligible as prepared meal
        dal_tadka = {
            "name": "Dal Tadka",
            "source": "macro_mitra_core",
            "category": "Dals & Legumes"
        }
        classified_dal = assign_preparation_metadata(dal_tadka)
        self.assertEqual(classified_dal["preparation_state"], "prepared_dish")
        self.assertTrue(classified_dal["is_meal_plan_eligible"])
        self.assertFalse(classified_dal["is_snack_eligible"])

        # 3. Raw marine commodity (Stingray): raw ingredient, not meal plan eligible, fish
        stingray = {
            "name": "Stingray",
            "source": "ifct_2017_reference",
            "category": "Non-Veg",
            "raw_data": {"grup": "Marine Fish"}
        }
        classified_stingray = assign_preparation_metadata(stingray)
        self.assertEqual(classified_stingray["preparation_state"], "raw_ingredient")
        self.assertFalse(classified_stingray["is_meal_plan_eligible"])
        self.assertFalse(classified_stingray["is_snack_eligible"])
        self.assertEqual(classified_stingray["meat_type"], "fish")

        # 4. Ready to eat snacks: fruit, nuts, yogurt
        apple = {
            "name": "Apple, raw",
            "source": "kaggle_everyday_150",
            "category": "Fruits & Vegetables"
        }
        classified_apple = assign_preparation_metadata(apple)
        self.assertEqual(classified_apple["preparation_state"], "ready_to_eat_snack")
        self.assertTrue(classified_apple["is_meal_plan_eligible"])
        self.assertTrue(classified_apple["is_snack_eligible"])

        # 5. Staple bread: side accompaniment
        roti = {
            "name": "Roti (Whole Wheat)",
            "source": "macro_mitra_core",
            "category": "Breads"
        }
        classified_roti = assign_preparation_metadata(roti)
        self.assertEqual(classified_roti["preparation_state"], "side_accompaniment")
        self.assertTrue(classified_roti["is_meal_plan_eligible"])
        self.assertFalse(classified_roti["is_snack_eligible"])
        self.assertTrue(classified_roti["isSide"])
        self.assertFalse(classified_roti["isMain"])

        # 6. Meat types: chicken, eggs, mutton
        chicken = {"name": "Chicken Curry", "source": "macro_mitra_core", "category": "Non-Veg"}
        self.assertEqual(assign_preparation_metadata(chicken)["meat_type"], "chicken")

        egg = {"name": "Boiled Eggs (2 pcs)", "source": "macro_mitra_core", "category": "Dairy & Eggs"}
        self.assertEqual(assign_preparation_metadata(egg)["meat_type"], "eggs")

        mutton = {"name": "Mutton Biryani", "source": "kaggle_indb_100g", "category": "Non-Veg"}
        self.assertEqual(assign_preparation_metadata(mutton)["meat_type"], "mutton")

class TestMergedCatalogueOutput(unittest.TestCase):

    def test_merged_catalogue_structure(self):
        cat_path = os.path.join(os.path.dirname(SCRIPT_DIR), "calorie-app", "public", "data", "merged_food_catalogue.json")
        self.assertTrue(os.path.exists(cat_path), f"Merged catalogue not found at {cat_path}")

        with open(cat_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertIn("foods", data)
        self.assertGreaterEqual(len(data["foods"]), 1800)

        sources = set(f["source"] for f in data["foods"])
        self.assertIn("macro_mitra_core", sources)
        self.assertIn("ifct_2017_reference", sources)
        self.assertIn("existing_health_100g", sources)
        self.assertIn("kaggle_indb_100g", sources)
        self.assertIn("kaggle_everyday_150", sources)

        # Check required fields on all records
        for food in data["foods"]:
            self.assertIn("id", food)
            self.assertIn("name", food)
            self.assertIn("calories", food)
            self.assertIn("protein", food)
            self.assertIn("protein_per_100g", food)
            self.assertIn("calories_per_100g", food)
            self.assertIn("carbs_per_100g", food)
            self.assertIn("fat_per_100g", food)
            self.assertIn("carbs", food)
            self.assertIn("fat", food)
            self.assertIn("serving_basis", food)
            self.assertIn("source", food)
            self.assertIn("source_priority", food)
            self.assertIn("preparation_state", food)
            self.assertIn("is_meal_plan_eligible", food)
            self.assertIn("is_snack_eligible", food)

            # Raw ingredients must NEVER be eligible for meal plans
            if food["preparation_state"] == "raw_ingredient":
                self.assertFalse(food["is_meal_plan_eligible"])

        # Check that Stingray is excluded from meals and snacks
        stingray = next((f for f in data["foods"] if f["name"] == "Stingray"), None)
        self.assertIsNotNone(stingray)
        self.assertFalse(stingray["is_meal_plan_eligible"])
        self.assertFalse(stingray["is_snack_eligible"])
        self.assertEqual(stingray["meat_type"], "fish")

        # Check raw pulse is excluded from meal plans
        bengal_gram = next((f for f in data["foods"] if f["name"] == "Bengal gram, dal"), None)
        self.assertIsNotNone(bengal_gram)
        self.assertFalse(bengal_gram["is_meal_plan_eligible"])
        self.assertEqual(bengal_gram["preparation_state"], "raw_ingredient")

    def test_paneer_dishes_provenance_and_audit(self):
        cat_path = os.path.join(os.path.dirname(SCRIPT_DIR), "calorie-app", "public", "data", "merged_food_catalogue.json")
        audit_path = os.path.join(os.path.dirname(SCRIPT_DIR), "calorie-app", "public", "data", "nutrition_audit_log.json")
        conflicts_path = os.path.join(os.path.dirname(SCRIPT_DIR), "calorie-app", "public", "data", "conflicts_audit.json")

        self.assertTrue(os.path.exists(audit_path))
        self.assertTrue(os.path.exists(conflicts_path))

        with open(cat_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        foods = data["foods"]

        # 1. Palak Paneer / Spinach Paneer:
        # Trusted canonical records are preserved; INDB duplicate was detected and resolved.
        palak_paneer_core = next((f for f in foods if f["name"] == "Palak Paneer" and f["source"] == "macro_mitra_core"), None)
        self.assertIsNotNone(palak_paneer_core)
        self.assertEqual(palak_paneer_core["calories"], 210.0)
        self.assertEqual(palak_paneer_core["protein"], 14.0)
        self.assertIn("Spinach paneer", palak_paneer_core["aliases"])

        # 2. Paneer Tikka / Paneer shashlik/tikka:
        paneer_tikka_core = next((f for f in foods if f["name"] == "Paneer Tikka" and f["source"] == "macro_mitra_core"), None)
        self.assertIsNotNone(paneer_tikka_core)
        self.assertEqual(paneer_tikka_core["calories"], 265.0)
        self.assertEqual(paneer_tikka_core["protein"], 18.0)

        # 3. Paneer soup:
        # Legitimate soup from INDB (47.85 kcal, ~47.76 calculated kcal via 4/4/9 check)
        paneer_soup = next((f for f in foods if f["name"] == "Paneer soup"), None)
        self.assertIsNotNone(paneer_soup)
        self.assertAlmostEqual(paneer_soup["calories"], 47.85, places=1)
        self.assertAlmostEqual(paneer_soup["protein"], 3.22, places=1)
        self.assertEqual(paneer_soup["serving_basis"], "100g")
        # 4/4/9 energy diagnostic verification
        calc_cals = (paneer_soup["protein"] * 4.0) + (paneer_soup["carbs"] * 4.0) + (paneer_soup["fat"] * 9.0)
        self.assertAlmostEqual(calc_cals, 47.76, delta=0.5)

    def test_audit_logs_and_anomalous_records_flagged(self):
        audit_path = os.path.join(os.path.dirname(SCRIPT_DIR), "calorie-app", "public", "data", "nutrition_audit_log.json")
        with open(audit_path, "r", encoding="utf-8") as f:
            audit = json.load(f)

        self.assertIn("flagged_records_count", audit)
        self.assertGreater(audit["flagged_records_count"], 0)
        self.assertIn("methodology", audit)
        self.assertIn("specific_dishes_audited", audit)
        self.assertIn("spinach_paneer_palak_paneer", audit["specific_dishes_audited"])
        self.assertIn("paneer_shashlik_tikka", audit["specific_dishes_audited"])
        self.assertIn("paneer_soup", audit["specific_dishes_audited"])

if __name__ == "__main__":
    unittest.main()

