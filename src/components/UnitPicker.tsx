import { categories } from '@/lib/conversions';
import { useConverterStore } from '@/store/converterStore';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface UnitPickerProps {
  value: string;
  onChange: (key: string) => void;
  label: string;
}

export function UnitPicker({ value, onChange, label }: UnitPickerProps) {
  const { category } = useConverterStore();
  const cat = categories.find((c) => c.key === category);
  const units = cat?.units ?? [];
  const selected = units.find((u) => u.key === value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block pl-1">
        {label}
      </span>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 bg-muted/60 hover:bg-muted
          rounded-xl px-4 py-3.5 text-left transition-smooth"
      >
        <div>
          <span className="text-foreground font-medium text-sm">{selected?.label}</span>
          <span className="text-muted-foreground text-xs ml-2">({selected?.abbr})</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-smooth ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-2xl
          overflow-hidden animate-scale-in max-h-52 overflow-y-auto">
          {units.map((u) => (
            <button
              key={u.key}
              onClick={() => { onChange(u.key); setOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm transition-smooth
                ${u.key === value
                  ? 'bg-primary/15 text-secondary'
                  : 'hover:bg-muted/60 text-foreground'
                }
              `}
            >
              {u.label} <span className="text-muted-foreground">({u.abbr})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
