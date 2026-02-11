import { create } from 'zustand';
import { categories, getCategory } from '@/lib/conversions';

export interface FavoriteConversion {
  id: string;
  category: string;
  fromUnit: string;
  toUnit: string;
}

interface ConverterState {
  category: string;
  fromUnit: string;
  toUnit: string;
  inputValue: string;
  favorites: FavoriteConversion[];

  setCategory: (key: string) => void;
  setFromUnit: (key: string) => void;
  setToUnit: (key: string) => void;
  setInputValue: (val: string) => void;
  swapUnits: () => void;
  loadFavorite: (fav: FavoriteConversion) => void;
  toggleFavorite: () => void;
  isFavorite: () => boolean;
}

function loadFavorites(): FavoriteConversion[] {
  try {
    const stored = localStorage.getItem('royal-utility-favorites');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favs: FavoriteConversion[]) {
  localStorage.setItem('royal-utility-favorites', JSON.stringify(favs));
}

function makeFavId(cat: string, from: string, to: string) {
  return `${cat}:${from}:${to}`;
}

export const useConverterStore = create<ConverterState>((set, get) => {
  const defaultCat = categories[0];
  return {
    category: defaultCat.key,
    fromUnit: defaultCat.units[0].key,
    toUnit: defaultCat.units[1].key,
    inputValue: '1',
    favorites: loadFavorites(),

    setCategory: (key) => {
      const cat = getCategory(key);
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

    setFromUnit: (key) => set({ fromUnit: key }),
    setToUnit: (key) => set({ toUnit: key }),
    setInputValue: (val) => set({ inputValue: val }),

    swapUnits: () => {
      const { fromUnit, toUnit } = get();
      set({ fromUnit: toUnit, toUnit: fromUnit });
    },

    loadFavorite: (fav) => {
      const cat = getCategory(fav.category);
      if (!cat) return;
      const fromExists = cat.units.some((u) => u.key === fav.fromUnit);
      const toExists = cat.units.some((u) => u.key === fav.toUnit);
      const fromUnit = fromExists ? fav.fromUnit : cat.units[0]?.key ?? '';
      const toUnit = toExists ? fav.toUnit : cat.units[1]?.key ?? cat.units[0]?.key ?? '';
      set({ category: fav.category, fromUnit, toUnit });
    },

    toggleFavorite: () => {
      const { category, fromUnit, toUnit, favorites } = get();
      const id = makeFavId(category, fromUnit, toUnit);
      const exists = favorites.some((f) => f.id === id);
      const updated = exists
        ? favorites.filter((f) => f.id !== id)
        : [...favorites, { id, category, fromUnit, toUnit }];
      saveFavorites(updated);
      set({ favorites: updated });
    },

    isFavorite: () => {
      const { category, fromUnit, toUnit, favorites } = get();
      return favorites.some((f) => f.id === makeFavId(category, fromUnit, toUnit));
    },
  };
});
