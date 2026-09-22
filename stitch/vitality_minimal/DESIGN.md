# Design System Strategy: The Living Canvas

## 1. Overview & Creative North Star
This design system is built upon the Creative North Star of **"The Living Canvas."** In the high-end health and nutrition space, we must move away from the "clinical" or "utilitarian" feel of traditional calorie trackers. Instead, we treat the user’s health journey as a premium editorial experience.

"The Living Canvas" rejects the rigid, boxed-in nature of standard web apps. We utilize **intentional asymmetry**, wide-open white space (as a luxury, not an absence), and **layered depth** to create a sense of organic growth and vitality. Elements should feel like they are floating on a soft, luminescent surface rather than being trapped within a grid.

## 2. Colors & Surface Logic
Our palette is rooted in a sophisticated interpretation of vitality. We use high-chroma greens for action and deep, ink-like neutrals for authoritative content.

### The "No-Line" Rule
To maintain a premium, bespoke feel, **1px solid borders are prohibited for sectioning.** Boundaries between content areas must be achieved through:
- **Tonal Shifts:** Placing a `surface-container-low` card against a `surface` background.
- **Negative Space:** Using the Spacing Scale to create "islands" of content.
- **Soft Shadows:** Using elevation to imply edges.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper. 
- **Base Layer:** `surface` (#faf8ff)
- **Sectional Layer:** `surface-container-low` (#f2f3ff) for grouping related content.
- **Interactive/Focus Layer:** `surface-container-lowest` (#ffffff) for primary cards or input areas to make them "pop" against the off-white base.

### The "Glass & Gradient" Rule
Standard flat colors feel static. To inject "soul" into the interface:
- **Hero Elements:** Use a subtle linear gradient from `primary` (#006b2c) to `primary_container` (#00873a) at a 135-degree angle.
- **Floating Navigation:** Use **Glassmorphism** for the navbar. Apply `surface` with 80% opacity and a `20px` backdrop-blur. This allows the vibrant health data to bleed through the UI, making it feel integrated.

## 3. Typography: Editorial Authority
We utilize **Inter** not as a standard sans-serif, but as a modern grotesque that conveys precision.

- **The Display Tier (`display-lg` to `display-sm`):** Reserved for "Momentum Moments" (e.g., "You’ve hit your protein goal"). These should use tighter letter-spacing (-0.02em) to feel like a high-fashion magazine.
- **The Headline/Title Tier:** Used for clear, scannable data hierarchy. `title-lg` is your workhorse for card headers.
- **The Body Tier:** `body-lg` is the default for all user-generated content to ensure maximum legibility.
- **The Label Tier:** Use `label-md` in all-caps with +0.05em tracking for category tags (e.g., "MACRONUTRIENTS") to provide a professional, architectural feel.

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** and **Ambient Light**, never through heavy, muddy shadows.

- **The Layering Principle:** To create hierarchy without lines, nest `surface-container-high` elements inside `surface-container-low` sections. This creates a natural "step-up" effect.
- **Ambient Shadows:** When a card requires a float (e.g., a meal plan selector), use a custom shadow: 
  - `box-shadow: 0px 20px 40px rgba(19, 27, 46, 0.06);` 
  - *Note:* The shadow color is a low-opacity version of `on-surface`, creating a natural tint rather than a gray smudge.
- **The "Ghost Border" Fallback:** If a layout requires a container for accessibility (like a search input), use a `1px` stroke of `outline-variant` at **15% opacity**. It should be felt, not seen.

## 5. Signature Components

### Buttons
- **Primary:** Rounded `full`. Background: Gradient of `primary` to `primary_container`. Text: `on_primary`. 
- **Secondary:** Rounded `full`. Background: `secondary_container`. Text: `on_secondary_container`. No border.
- **States:** On hover, primary buttons should scale slightly (1.02x) and increase shadow diffusion.

### Modern Navbar
- **Style:** A floating "island" navbar centered at the top.
- **Visuals:** `surface_container_lowest` at 80% opacity, `xl` (1.5rem) rounded corners, and a "Ghost Border" of 10% `outline`.

### Nutrient Cards
- **Construction:** Use `surface-container-lowest` on top of a `surface` background.
- **The "No Divider" Mandate:** Do not use lines to separate "Protein," "Carbs," and "Fats." Use `body-sm` labels paired with large `title-lg` numbers, separated by `1.5rem` of horizontal padding.

### Data Visualization
- **Charts:** Use `primary` for positive trends and `tertiary` (#a72d51) for warning metrics (e.g., high sodium). 
- **Surfaces:** All chart containers must use `surface-container-low` to create a "recessed" look, making the data feel like it is etched into the page.

### Input Fields
- **Style:** `surface_container_low` background with a `md` (0.75rem) corner radius. 
- **Interaction:** On focus, the background shifts to `surface_container_lowest` and the "Ghost Border" increases to 40% opacity of the `primary` color.

## 6. Do’s and Don’ts

### Do
- **Do** use `display-lg` typography to celebrate user wins. Scale creates emotion.
- **Do** use the `xl` and `full` roundedness tokens to maintain the "Soft Minimalism" aesthetic.
- **Do** use `tertiary_fixed` for subtle highlight backgrounds behind nutritional warnings.
- **Do** allow content to bleed off the edge of a container (asymmetry) to create a sense of motion.

### Don't
- **Don't** use a 100% opaque `outline` color for borders. It breaks the "Living Canvas" flow.
- **Don't** use pure black (#000000) for text. Always use `on_surface` (#131b2e) for a premium, deep-ink feel.
- **Don't** use standard "drop shadows" from software defaults. Always tint the shadow with the `on_surface` token.
- **Don't** crowd the layout. If you feel you need a divider line, you actually need more whitespace.