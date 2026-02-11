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
