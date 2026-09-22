# 🥗 MacroMitra
> **Your Intelligent Indian Nutrition & Macro Meal Planning Companion**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Overview

**MacroMitra** bridges traditional Indian culinary traditions with precision nutritional science. While most calorie counters struggle with desi meals, dishes, and varied staple portions, MacroMitra calculates your scientific caloric needs and generates culturally authentic, nutrient-balanced Indian meal plans tailored to your personal goals.

Whether you're cutting, bulking, or maintaining, MacroMitra simplifies your fitness journey—no generic Western diet substitutions required!

---

## ✨ Key Features

- ⚡ **Precision BMR & TDEE Engine**: Uses the gold-standard **Mifflin-St Jeor Equation** to calculate Basal Metabolic Rate and personalized caloric splits based on your activity tier and fitness targets.
- 🍛 **Authentic Indian Food Database**: Curated catalog of Indian foods, curries, dals, breads, and snacks with comprehensive macronutrient and micronutrient profiles.
- 🎯 **Smart Meal Planner**: Intelligent meal distribution algorithm tailored to Indian dining rhythms:
  - 🌅 **Breakfast**: 25% daily macros
  - ☀️ **Lunch**: 35% daily macros
  - 🌙 **Dinner**: 30% daily macros
  - ☕ **Snacks**: 10% daily macros
- 📊 **Macro & Health Analytics**: Interactive charts and progress rings tracking your daily breakdown of Protein, Carbohydrates, Fats, and Calories.
- 🔒 **100% Client-Side Privacy**: All personal data and calculation logs stay secure in your browser's local storage.
- 🐳 **Cloud & Docker Ready**: Multi-stage lightweight Docker image configured for fast deployments on Google Cloud Run, AWS, or local containers.

---

## 🧮 Nutritional Science & Methodology

| Component | Standard / Formula | Details |
|---|---|---|
| **BMR** | Mifflin-St Jeor | Gender, weight, height, and age-adjusted metabolic base |
| **Protein Target** | $1.8\text{ g/kg}$ body weight | Optimized for muscle retention and satiety |
| **Carbs & Fats** | 45% Carbs / 30% Fats | Balanced for sustained energy and hormonal health |
| **Indian Portioning** | Tailored Macro Splits | Designed to fit rotis, rice varieties, dals, and sabzis |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**

### 2. Local Setup

```bash
# Clone the repository
git clone https://github.com/rohankapoor0/MacroMitra-Nutrition-Expert.git
cd MacroMitra-Nutrition-Expert/calorie-app

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🐳 Docker Deployment

Run the complete production-grade application inside a containerized Nginx environment:

```bash
# Build the Docker image from project root
docker build -t macromitra .

# Run on port 8080 (Cloud Run compatible)
docker run -p 8080:8080 macromitra
```

Access the app at `http://localhost:8080`.

---

## 📁 Repository Structure

```text
MacroMitra-Nutrition-Expert/
├── Dockerfile                   # Multi-stage production build configuration
├── nginx.conf                   # High-performance SPA routing config
├── calorie-app/                 # Primary React + Vite web client
│   ├── public/
│   │   └── data/                # Indian food nutritional datasets (CSV)
│   ├── src/
│   │   ├── components/          # BMR Calculator, Meal Planner, Dashboards
│   │   ├── context/             # Global user context & state management
│   │   ├── hooks/               # Custom hooks for food search & local data
│   │   ├── pages/               # Home, Calculator, Meals, Database
│   │   └── utils/               # Mifflin-St Jeor, macro, and planner logic
│   └── vite.config.js           # Build settings & plugins
├── health/                      # Research datasets, documentation & schemas
└── stitch/                      # UI design references, prototypes & mockups
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/rohankapoor0/MacroMitra-Nutrition-Expert/issues).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
