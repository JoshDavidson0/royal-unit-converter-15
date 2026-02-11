import { categories, getUnit } from './unitRegistry';

export type { UnitDef, Category } from './unitRegistry';
export { categories, getCategory } from './unitRegistry';

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
