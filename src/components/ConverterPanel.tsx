import { useConverterStore } from '@/store/converterStore';
import { convert, categories } from '@/lib/conversions';
import { UnitPicker } from './UnitPicker';
import { ArrowUpDown, Star, Copy, Check } from 'lucide-react';
import { useMemo, useState, useCallback, useEffect } from 'react';

export function ConverterPanel() {
  const {
    category, fromUnit, toUnit, inputValue,
    setFromUnit, setToUnit, setInputValue,
    swapUnits, toggleFavorite, isFavorite,
  } = useConverterStore();

  const [copied, setCopied] = useState(false);

  const rawNumeric = parseFloat(inputValue);
  const numericForConvert = Number.isFinite(rawNumeric) ? rawNumeric : 0;

  const [debouncedNumeric, setDebouncedNumeric] = useState(numericForConvert);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedNumeric(numericForConvert), 150);
    return () => clearTimeout(t);
  }, [numericForConvert]);

  const result = useMemo(
    () => convert(category, fromUnit, toUnit, debouncedNumeric),
    [category, fromUnit, toUnit, debouncedNumeric]
  );

  const cat = categories.find((c) => c.key === category);
  const toUnitDef = cat?.units.find((u) => u.key === toUnit);

  const formatResult = (val: number) => {
    if (!Number.isFinite(val)) return '—';
    if (inputValue.trim() === '') return '—';
    if (val === 0 && inputValue === '') return '—';
    if (Number.isInteger(val)) return val.toLocaleString();
    if (Math.abs(val) < 0.0001 || Math.abs(val) >= 1e12) return val.toExponential(4);
    return parseFloat(val.toFixed(6)).toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  const copyResult = useCallback(() => {
    const text = `${formatResult(result)} ${toUnitDef?.abbr ?? ''}`.trim();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result, toUnitDef?.abbr, inputValue]);

  const fav = isFavorite();

  return (
    <div className="flex flex-col gap-5 px-4 animate-fade-in">
      {/* Result display */}
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
          className="absolute top-3 right-3 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all duration-200"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>

      {/* Input */}
      <div className="glass-card p-4">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block pl-1">
          Value
        </label>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="0"
          className="w-full bg-muted/60 rounded-xl px-4 py-3.5 text-foreground text-lg font-medium
            placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/50 focus-visible:ring-2 focus-visible:ring-primary
            transition-smooth"
        />
      </div>

      {/* Unit selectors with swap */}
      <div className="flex items-end gap-2 px-0">
        <UnitPicker value={fromUnit} onChange={setFromUnit} label="From" />

        <button
          onClick={swapUnits}
          className="mb-0.5 p-3 rounded-full bg-accent/15 text-accent hover:bg-accent/25
            active:scale-90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
            focus-visible:ring-offset-background transition-all duration-200 ease-out glow-accent"
          aria-label="Swap units"
        >
          <ArrowUpDown size={20} />
        </button>

        <UnitPicker value={toUnit} onChange={setToUnit} label="To" />
      </div>

      {/* Favorite */}
      <button
        onClick={toggleFavorite}
        className={`mx-auto flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium
          focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
          focus-visible:ring-offset-background active:scale-[0.98] transition-all duration-200 ${fav
            ? 'bg-accent/15 text-accent'
            : 'bg-muted/50 text-muted-foreground hover:text-foreground'
          }`}
      >
        <Star size={16} fill={fav ? 'currentColor' : 'none'} />
        {fav ? 'Saved' : 'Save Favorite'}
      </button>
    </div>
  );
}
