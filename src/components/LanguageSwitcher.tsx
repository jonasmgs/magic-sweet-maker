import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full p-1 shadow-lg border border-border">
      <button
        onClick={() => setLanguage('pt')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
          language === 'pt'
            ? "bg-primary text-primary-foreground shadow-md"
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="text-lg">🇧🇷</span>
        <span className="hidden sm:inline">PT</span>
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
          language === 'en'
            ? "bg-primary text-primary-foreground shadow-md"
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="text-lg">🇺🇸</span>
        <span className="hidden sm:inline">EN</span>
      </button>
    </div>
  );
}
