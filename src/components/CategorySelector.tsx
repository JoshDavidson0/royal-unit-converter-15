import { useConverterStore } from '@/store/converterStore';
import { categories } from '@/lib/conversions';

export function CategorySelector() {
  const { category, setCategory } = useConverterStore();

  return (
    <div className="flex gap-2 justify-center px-4">
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isActive = category === cat.key;
        return (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`
              flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl
              transition-smooth min-w-[80px]
              ${isActive
                ? 'bg-primary/20 text-secondary glow-primary'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }
            `}
          >
            <Icon size={22} />
            <span className="text-xs font-medium">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
