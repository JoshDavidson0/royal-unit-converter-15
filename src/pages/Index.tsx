import { Crown } from 'lucide-react';
import { CategorySelector } from '@/components/CategorySelector';
import { ConverterPanel } from '@/components/ConverterPanel';
import { FavoritesBar } from '@/components/FavoritesBar';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - compact at top */}
      <header className="pt-8 pb-4 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Crown size={22} className="text-secondary" />
          <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
            The Royal Utility
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">Precision conversions at your fingertips</p>
      </header>

      {/* Spacer pushes content toward bottom */}
      <div className="flex-1 min-h-[40px] max-h-[120px]" />

      {/* Main content - bottom-heavy */}
      <div className="flex flex-col gap-5 pb-8">
        <FavoritesBar />
        <CategorySelector />
        <ConverterPanel />
      </div>
    </div>
  );
};

export default Index;
