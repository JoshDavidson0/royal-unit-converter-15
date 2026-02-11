import { useConverterStore, type FavoriteConversion } from '@/store/converterStore';
import { categories } from '@/lib/conversions';
import { Star } from 'lucide-react';

export function FavoritesBar() {
  const { favorites, loadFavorite } = useConverterStore();

  if (favorites.length === 0) return null;

  return (
    <div className="px-4 animate-fade-in">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 pl-1 flex items-center gap-1.5">
        <Star size={10} /> Favorites
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {favorites.map((fav) => {
          const cat = categories.find((c) => c.key === fav.category);
          const from = cat?.units.find((u) => u.key === fav.fromUnit);
          const to = cat?.units.find((u) => u.key === fav.toUnit);
          if (!cat || !from || !to) return null;
          return (
            <button
              key={fav.id}
              onClick={() => loadFavorite(fav)}
              className="flex-shrink-0 flex items-center gap-1.5 bg-muted/50 hover:bg-muted
                text-xs text-foreground px-3 py-2 rounded-lg transition-smooth
                focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                focus-visible:ring-offset-background active:scale-[0.98]"
            >
              <cat.icon size={12} className="text-secondary" />
              {from.abbr} → {to.abbr}
            </button>
          );
        })}
      </div>
    </div>
  );
}
