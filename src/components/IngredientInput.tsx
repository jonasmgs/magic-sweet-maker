import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';

const popularIngredients = {
  pt: ['🍫 Chocolate', '🍓 Morango', '🥛 Leite', '🍌 Banana', '🍯 Mel', '🥜 Amendoim'],
  en: ['🍫 Chocolate', '🍓 Strawberry', '🥛 Milk', '🍌 Banana', '🍯 Honey', '🥜 Peanut'],
};

interface IngredientInputProps {
  onSubmit: (ingredients: string) => void;
  isLoading: boolean;
}

export function IngredientInput({ onSubmit, isLoading }: IngredientInputProps) {
  const { t, language } = useLanguage();
  const [ingredients, setIngredients] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ingredients.trim() && !isLoading) {
      onSubmit(ingredients.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const cleanSuggestion = suggestion.replace(/^[^\s]+\s/, ''); // Remove emoji
    setIngredients((prev) => {
      if (prev.trim()) {
        return `${prev}, ${cleanSuggestion}`;
      }
      return cleanSuggestion;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6">
      <div className="relative">
        <Textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder={t.inputPlaceholder}
          disabled={isLoading}
          className="min-h-[120px] text-lg p-4 bg-card/80 backdrop-blur-sm border-2 border-primary/30 rounded-3xl shadow-lg focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 resize-none font-body placeholder:text-muted-foreground/70"
        />
        <div className="absolute -top-3 -right-3 text-4xl animate-wiggle">
          ✨
        </div>
        <div className="absolute -bottom-2 -left-2 text-3xl animate-bounce-slow">
          🍰
        </div>
      </div>

      {/* Popular ingredients */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground font-medium text-center">
          {t.popularIngredients}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {popularIngredients[language].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleSuggestionClick(item)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-secondary/80 hover:bg-secondary text-secondary-foreground rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-center">
        <Button
          type="submit"
          disabled={!ingredients.trim() || isLoading}
          size="lg"
          className="btn-sweet px-8 py-6 text-xl font-display rounded-full bg-gradient-to-r from-primary via-sweet-purple to-sweet-blue text-primary-foreground shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-glow"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              {t.loadingText}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-6 w-6" />
              {t.buttonText}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
