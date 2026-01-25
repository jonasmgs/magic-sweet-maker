import { useLanguage } from '@/contexts/LanguageContext';

export function ThemeSwitcher() {
  const { theme, setTheme, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground font-medium">{t.themeLabel}</span>
      <div className="flex rounded-full bg-muted/50 p-1 gap-1">
        <button
          onClick={() => setTheme('feminine')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
            theme === 'feminine'
              ? 'bg-gradient-to-r from-sweet-pink to-sweet-purple text-white shadow-md'
              : 'hover:bg-muted text-muted-foreground'
          }`}
        >
          {t.feminineTheme}
        </button>
        <button
          onClick={() => setTheme('masculine')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
            theme === 'masculine'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
              : 'hover:bg-muted text-muted-foreground'
          }`}
        >
          {t.masculineTheme}
        </button>
      </div>
    </div>
  );
}
