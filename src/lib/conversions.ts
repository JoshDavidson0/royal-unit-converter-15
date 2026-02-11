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

const linear = (factor: number): Pick<UnitDef, 'toBase' | 'fromBase'> => ({
  toBase: (v) => v * factor,
  fromBase: (v) => v / factor,
});

export const categories: Category[] = [
  {
    key: 'length',
    label: 'Length',
    icon: Ruler,
    baseUnit: 'm',
    units: [
      { key: 'mm', label: 'Millimeter', abbr: 'mm', ...linear(0.001) },
      { key: 'cm', label: 'Centimeter', abbr: 'cm', ...linear(0.01) },
      { key: 'm', label: 'Meter', abbr: 'm', ...linear(1) },
      { key: 'km', label: 'Kilometer', abbr: 'km', ...linear(1000) },
      { key: 'in', label: 'Inch', abbr: 'in', ...linear(0.0254) },
      { key: 'ft', label: 'Foot', abbr: 'ft', ...linear(0.3048) },
      { key: 'yd', label: 'Yard', abbr: 'yd', ...linear(0.9144) },
      { key: 'mi', label: 'Mile', abbr: 'mi', ...linear(1609.344) },
    ],
  },
  {
    key: 'mass',
    label: 'Mass',
    icon: Weight,
    baseUnit: 'g',
    units: [
      { key: 'mg', label: 'Milligram', abbr: 'mg', ...linear(0.001) },
      { key: 'g', label: 'Gram', abbr: 'g', ...linear(1) },
      { key: 'kg', label: 'Kilogram', abbr: 'kg', ...linear(1000) },
      { key: 'oz', label: 'Ounce', abbr: 'oz', ...linear(28.3495) },
      { key: 'lb', label: 'Pound', abbr: 'lb', ...linear(453.592) },
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

export function convert(categoryKey: string, fromKey: string, toKey: string, value: number): number {
  const cat = categories.find((c) => c.key === categoryKey);
  if (!cat) return 0;
  const from = cat.units.find((u) => u.key === fromKey);
  const to = cat.units.find((u) => u.key === toKey);
  if (!from || !to) return 0;
  const base = from.toBase(value);
  return to.fromBase(base);
}
