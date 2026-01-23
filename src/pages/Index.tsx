import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { FloatingDecorations } from '@/components/FloatingDecorations';
import { IngredientInput } from '@/components/IngredientInput';
import { SweetResult } from '@/components/SweetResult';
import { Confetti } from '@/components/Confetti';
import { useGenerateSweet } from '@/hooks/useGenerateSweet';

function SweetMagicApp() {
  const { t } = useLanguage();
  const { recipe, error, isLoading, generateSweet, reset } = useGenerateSweet();

  const showResult = recipe || error;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-muted/30 to-secondary/20 -z-10" />
      
      {/* Floating decorations */}
      <FloatingDecorations />
      
      {/* Confetti on success */}
      <Confetti show={!!recipe} />

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-4 md:p-6">
        <div className="flex items-center gap-2">
          <span className="text-3xl md:text-4xl animate-wiggle">🧁</span>
        </div>
        <LanguageSwitcher />
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8 md:space-y-12">
          {/* Title section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-gradient-candy animate-pop-in">
              {t.title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {t.subtitle}
            </p>
            <div className="flex justify-center gap-3 text-3xl md:text-4xl">
              <span className="animate-bounce-slow" style={{ animationDelay: '0s' }}>🍰</span>
              <span className="animate-bounce-slow" style={{ animationDelay: '0.2s' }}>🍭</span>
              <span className="animate-bounce-slow" style={{ animationDelay: '0.4s' }}>🍫</span>
              <span className="animate-bounce-slow" style={{ animationDelay: '0.6s' }}>🍓</span>
              <span className="animate-bounce-slow" style={{ animationDelay: '0.8s' }}>🍦</span>
            </div>
          </div>

          {/* Input or Result */}
          {!showResult ? (
            <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <IngredientInput onSubmit={generateSweet} isLoading={isLoading} />
            </div>
          ) : (
            <SweetResult recipe={recipe} error={error} onReset={reset} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-muted-foreground text-sm">
        <p className="flex items-center justify-center gap-2">
          <span>Made with</span>
          <span className="text-primary animate-pulse">💖</span>
          <span>for little chefs</span>
          <span className="animate-wiggle">👨‍🍳</span>
        </p>
      </footer>
    </div>
  );
}

export default function Index() {
  return (
    <LanguageProvider>
      <SweetMagicApp />
    </LanguageProvider>
  );
}
