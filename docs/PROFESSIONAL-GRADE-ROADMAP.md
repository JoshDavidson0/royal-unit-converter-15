# Professional Grade Improvement Roadmap

This document outlines targeted improvements across four areas: **Code Architecture**, **UX & Input Handling**, **Visual Polish**, and **Error Handling**. Each section includes specific code snippets for the most impactful changes.

---

## 1. Code Architecture

### Current state
- Conversion logic lives in `src/lib/conversions.ts` with a flat `categories` array and a single `convert()` function.
- Adding a new category or unit requires editing the same file and following the existing pattern manually.
- There is no single source of truth for “all unit keys” or validation that selected units belong to the current category.

### 1.1 Central unit registry and factory

**Goal:** Make adding new units and categories trivial and consistent.

Add a small **registry** and **factory** so new units are declared in one place and conversion stays type-safe.

**New file: `src/lib/unitRegistry.ts`**

```ts
import { type LucideIcon, Ruler, Weight, Thermometer } from 'lucide-react';

export interface UnitDef {
  key: string;
  label: string;
  abbr: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

export interface Category {
  key: string;
  label: string;
  icon: LucideIcon;
  baseUnit: string;
  units: UnitDef[];
}

/** Factory for linear units: value * factor = base. */
export function linearUnit(
  key: string,
  label: string,
  abbr: string,
  factor: number
): UnitDef {
  return {
    key,
    label,
    abbr,
    toBase: (v) => v * factor,
    fromBase: (v) => v / factor,
  };
}

/** Registry: add categories here; everything else derives from this. */
const categoryRegistry: Category[] = [
  {
    key: 'length',
    label: 'Length',
    icon: Ruler,
    baseUnit: 'm',
    units: [
      linearUnit('mm', 'Millimeter', 'mm', 0.001),
      linearUnit('cm', 'Centimeter', 'cm', 0.01),
      linearUnit('m', 'Meter', 'm', 1),
      linearUnit('km', 'Kilometer', 'km', 1000),
      linearUnit('in', 'Inch', 'in', 0.0254),
      linearUnit('ft', 'Foot', 'ft', 0.3048),
      linearUnit('yd', 'Yard', 'yd', 0.9144),
      linearUnit('mi', 'Mile', 'mi', 1609.344),
    ],
  },
  {
    key: 'mass',
    label: 'Mass',
    icon: Weight,
    baseUnit: 'g',
    units: [
      linearUnit('mg', 'Milligram', 'mg', 0.001),
      linearUnit('g', 'Gram', 'g', 1),
      linearUnit('kg', 'Kilogram', 'kg', 1000),
      linearUnit('oz', 'Ounce', 'oz', 28.3495),
      linearUnit('lb', 'Pound', 'lb', 453.592),
    ],
  },
  {
    key: 'temperature',
    label: 'Temperature',
    icon: Thermometer,
    baseUnit: 'K',
    units: [
      {
        key: 'C',
        label: 'Celsius',
        abbr: '°C',
        toBase: (v) => v + 273.15,
        fromBase: (v) => v - 273.15,
      },
      {
        key: 'F',
        label: 'Fahrenheit',
        abbr: '°F',
        toBase: (v) => (v - 32) * (5 / 9) + 273.15,
        fromBase: (v) => (v - 273.15) * (9 / 5) + 32,
      },
      {
        key: 'K',
        label: 'Kelvin',
        abbr: 'K',
        toBase: (v) => v,
        fromBase: (v) => v,
      },
    ],
  },
];

export const categories = categoryRegistry;

/** Lookup by category + unit key; use for validation and dropdowns. */
export function getUnit(categoryKey: string, unitKey: string): UnitDef | undefined {
  const cat = categoryRegistry.find((c) => c.key === categoryKey);
  return cat?.units.find((u) => u.key === unitKey);
}

/** Get category; use to ensure fromUnit/toUnit exist when switching category. */
export function getCategory(categoryKey: string): Category | undefined {
  return categoryRegistry.find((c) => c.key === categoryKey);
}
```

Then **`src/lib/conversions.ts`** can be reduced to a thin layer that uses the registry and exposes a safe `convert`:

```ts
import { categories, getCategory, getUnit } from './unitRegistry';

export { type UnitDef, type Category, categories } from './unitRegistry';

export function convert(
  categoryKey: string,
  fromKey: string,
  toKey: string,
  value: number
): number {
  const from = getUnit(categoryKey, fromKey);
  const to = getUnit(categoryKey, toKey);
  if (!from || !to || !Number.isFinite(value)) return 0;
  return to.fromBase(from.toBase(value));
}
```

**Benefits:** Adding a new category or unit is a single entry in the registry; `getUnit`/`getCategory` support validation and safe fallbacks in the store.

---

### 1.2 Validate unit selection when category or favorites change

**Goal:** Avoid showing “undefined” or wrong units when category changes or a favorite points to removed units.

In **`src/store/converterStore.ts`**, when setting category or loading a favorite, clamp `fromUnit`/`toUnit` to units that exist in the current category:

```ts
import { getCategory } from '@/lib/unitRegistry'; // or conversions if you keep categories there

setCategory: (key) => {
  const cat = getCategory(key); // or categories.find((c) => c.key === key)
  if (!cat) return;
  const units = cat.units;
  const fromKey = units[0]?.key ?? '';
  const toKey = units[1]?.key ?? units[0]?.key ?? '';
  set({
    category: key,
    fromUnit: fromKey,
    toUnit: toKey,
    inputValue: '1',
  });
},

// When loading a favorite, validate unit keys for that category
loadFav: (fav) => {
  const cat = getCategory(fav.category);
  if (!cat) return;
  const fromExists = cat.units.some((u) => u.key === fav.fromUnit);
  const toExists = cat.units.some((u) => u.key === fav.toUnit);
  const fromUnit = fromExists ? fav.fromUnit : cat.units[0]?.key ?? '';
  const toUnit = toExists ? fav.toUnit : cat.units[1]?.key ?? cat.units[0]?.key ?? '';
  set({ category: fav.category, fromUnit, toUnit });
};
```

This prevents crashes and confusing UI when a favorite references units that no longer exist.

---

## 2. UX & Input Handling

### 2.1 Swap button already present
You already have a swap button; consider making it more discoverable on mobile (e.g. larger tap target and optional “Swap” label below icon on small screens).

### 2.2 Copy result to clipboard
Add a single “Copy result” action so users can paste the converted value elsewhere.

**In `ConverterPanel.tsx`**, add state and a copy button next to the result:

```tsx
const [copied, setCopied] = useState(false);

const copyResult = useCallback(() => {
  const text = `${formatResult(result)} ${toUnitDef?.abbr ?? ''}`.trim();
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}, [result, toUnitDef?.abbr, inputValue]);

// In the result block, next to the result:
<div className="glass-card p-6 text-center relative">
  <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">Result</p>
  <p className="text-4xl font-display font-bold text-secondary tabular-nums leading-tight">
    {formatResult(result)}
  </p>
  <p className="text-muted-foreground text-sm mt-1">{toUnitDef?.label}</p>
  <button
    type="button"
    onClick={copyResult}
    aria-label="Copy result"
    className="absolute top-3 right-3 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-smooth"
  >
    {copied ? <Check size={18} /> : <Copy size={18} />}
  </button>
</div>
```

(Import `Copy` and `Check` from `lucide-react`.)

### 2.3 Mobile: optional custom numeric pad
On small screens, opening a modal/sheet with a custom numeric keypad (digits, decimal, backspace, clear) can improve usability and avoid zoom/focus issues. Use your existing `useIsMobile()` and only render the keypad on mobile if you want to keep the current input on desktop.

**Concept:** One approach is to keep the main input as-is, but when `useIsMobile()` is true, also show a row of large “quick values” (e.g. 1, 10, 100, 0.1) that append or set the value, and/or a bottom sheet that opens with a full keypad. The keypad would update `inputValue` via `setInputValue` and support decimal and minus so scientific notation is still possible via the regular input if needed.

**Minimal change:** Ensure the number input is mobile-friendly:

```tsx
<input
  type="text"
  inputMode="decimal"
  autoComplete="off"
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  placeholder="0"
  className="..."
/>
```

Using `type="text"` with `inputMode="decimal"` gives a numeric keyboard on mobile while allowing you to parse and validate (including scientific notation) in `onChange` or when converting. Then parsing stays in one place (see Error handling below).

### 2.4 Debounce or controlled parse for rapid input
See **§4.2** for debouncing/parsing so rapid typing doesn’t cause jank or inconsistent display.

---

## 3. Visual Polish

### 3.1 Accessibility — contrast (purple theme)
Your purple theme uses `--primary: 265 100% 47%` and `--secondary: 270 80% 76%`. On dark backgrounds, ensure text and interactive elements meet WCAG AA (e.g. 4.5:1 for normal text, 3:1 for large text and UI components).

**Suggested refinement in `src/index.css`:**

- Slightly lighten `muted-foreground` so placeholder and secondary text are readable.
- Ensure primary buttons and links have sufficient contrast against the background.

```css
@layer base {
  :root {
    /* Keep your existing palette; bump muted-foreground for better contrast */
    --muted-foreground: 270 8% 62%;  /* was 55%; 62% improves contrast on dark bg */

    /* Optional: slightly lighter primary for focus rings / borders */
    --ring: 265 100% 55%;
  }
}
```

Check focus rings: ensure `focus-visible` uses a ring color that meets 3:1 against the background (your current `focus:ring-2 focus:ring-primary/50` is a good start; you can increase to `ring-primary` if needed).

### 3.2 Micro-interactions — hover and transitions
Add consistent hover/active states and a short transition for the swap and favorite buttons so the UI feels responsive.

**Swap button** (in `ConverterPanel.tsx`):

```tsx
<button
  onClick={swapUnits}
  className="mb-0.5 p-3 rounded-full bg-accent/15 text-accent hover:bg-accent/25
    active:scale-90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
    focus-visible:ring-offset-background transition-all duration-200 ease-out glow-accent"
  aria-label="Swap units"
>
  <ArrowUpDown size={20} className="transition-transform duration-200 group-hover:rotate-180" />
</button>
```

Wrap the button in `<span className="group">` if you use `group-hover:rotate-180`; otherwise omit that class. Prefer a quick 180° rotation on click (using a small animation or state) so the swap feels tactile.

**Favorite button** — add focus and active states:

```tsx
className={`... focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
  focus-visible:ring-offset-background active:scale-[0.98] transition-all duration-200`}
```

**Category pills** — subtle scale on press:

```tsx
className={`... active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary
  focus-visible:ring-offset-2 focus-visible:ring-offset-background ...`}
```

### 3.3 Reduced motion
Respect `prefers-reduced-motion` so animations are optional:

```css
@layer utilities {
  .transition-smooth {
    @apply transition-all duration-300 ease-out;
  }
}

@media (prefers-reduced-motion: reduce) {
  .transition-smooth,
  .animate-fade-in,
  .animate-scale-in {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

You can also add a Tailwind variant for `reduced-motion` and apply it to specific components if you prefer.

---

## 4. Error Handling

### 4.1 Null / undefined and non-finite values
**`convert()`** already returns `0` when unit lookups fail. Harden it and the display so that `NaN`/`Infinity` never reach the UI.

**In `conversions.ts` (or unitRegistry-based convert):**

```ts
export function convert(
  categoryKey: string,
  fromKey: string,
  toKey: string,
  value: number
): number {
  const from = getUnit(categoryKey, fromKey);
  const to = getUnit(categoryKey, toKey);
  if (!from || !to) return 0;
  if (!Number.isFinite(value)) return 0;
  const base = from.toBase(value);
  const result = to.fromBase(base);
  return Number.isFinite(result) ? result : 0;
}
```

**In `ConverterPanel.tsx`**, guard the parsed value and `formatResult`:

```ts
const rawNumeric = parseFloat(inputValue);
const numericValue = Number.isFinite(rawNumeric) ? rawNumeric : 0;

const formatResult = (val: number) => {
  if (!Number.isFinite(val)) return '—';
  if (inputValue.trim() === '') return '—';
  if (val === 0 && inputValue === '') return '—';
  if (Number.isInteger(val)) return val.toLocaleString();
  if (Math.abs(val) < 0.0001 || Math.abs(val) >= 1e12) return val.toExponential(4);
  return parseFloat(val.toFixed(6)).toLocaleString(undefined, { maximumFractionDigits: 6 });
};
```

This avoids crashes or “NaN”/“Infinity” in the result line when the user types something invalid or when conversion overflows.

### 4.2 Scientific notation and rapid input
- **Scientific notation:** `parseFloat` already accepts values like `1e10` or `2.5e-3`. Keep the input as `type="text"` (or `type="number"`) and parse with `parseFloat` so pasted scientific notation works.
- **Rapid input:** If the UI feels laggy while typing, debounce the *derived* conversion (not the input value) so the displayed result updates after a short pause, while the input stays responsive. Example:

```ts
// Debounce only the value used for conversion, not the input string
const [debouncedNumeric, setDebouncedNumeric] = useState(0);
const rawNumeric = parseFloat(inputValue);
const numericForConvert = Number.isFinite(rawNumeric) ? rawNumeric : 0;

useEffect(() => {
  const t = setTimeout(() => setDebouncedNumeric(numericForConvert), 150);
  return () => clearTimeout(t);
}, [numericForConvert]);

const result = useMemo(
  () => convert(category, fromUnit, toUnit, debouncedNumeric),
  [category, fromUnit, toUnit, debouncedNumeric]
);
```

Alternatively, keep computing from `numericValue` every time if performance is fine; the important part is that parsing and `formatResult` are safe for any string.

### 4.3 UnitPicker when `value` is not in the current category
If the store ever has `fromUnit`/`toUnit` that don’t exist in the current category (e.g. after a category switch or a stale favorite), `selected` in `UnitPicker` can be `undefined`. You already use `selected?.label`; ensure the rest of the UI doesn’t assume `selected` exists (e.g. don’t pass `selected.abbr` without optional chaining). Combining this with **§1.2** (validating unit keys when changing category or loading a favorite) removes the root cause.

### 4.4 FavoritesBar and stale favorites
When a favorite’s category or units have been removed, **§1.2** ensures we don’t set invalid `fromUnit`/`toUnit`. In `FavoritesBar`, you already skip rendering when `!cat || !from || !to`. Optionally, add a “Remove” control for each favorite and, on load, if the favorite’s units are invalid, offer to remove it from the list so the bar doesn’t show dead entries.

---

## Summary checklist

| Area | High-impact change |
|------|---------------------|
| **Architecture** | Introduce `unitRegistry.ts` with `linearUnit()`, `getUnit()`, `getCategory()` and validate fromUnit/toUnit when setting category or loading a favorite. |
| **UX** | Add copy-to-clipboard for the result; use `inputMode="decimal"` and optional debounced conversion for smooth typing. |
| **Visual** | Increase muted-foreground contrast; add focus-visible and active states; respect `prefers-reduced-motion`. |
| **Error handling** | Use `Number.isFinite()` in `convert()` and in parsing/formatResult; validate unit keys in the store when category or favorites change. |

Implementing the registry + validation and the error-handling guards will give the biggest stability and maintainability gains; copy + contrast and micro-interactions will make the app feel more polished and accessible.
