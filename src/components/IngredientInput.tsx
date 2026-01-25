import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, Plus, X } from 'lucide-react';

const popularIngredients = {
  pt: ['🍫 Chocolate', '🍓 Morango', '🥛 Leite', '🍌 Banana', '🍯 Mel', '🥜 Amendoim'],
  en: ['🍫 Chocolate', '🍓 Strawberry', '🥛 Milk', '🍌 Banana', '🍯 Honey', '🥜 Peanut'],
};

interface IngredientInputProps {
  onSubmit: (ingredients: string) => void;
  isLoading: boolean;
}

export function IngredientInput({ onSubmit, isLoading }: IngredientInputProps) {
  const { t, language, theme, savedIngredients, saveIngredient, removeIngredient } = useLanguage();
  const [ingredients, setIngredients] = useState('');
  const [newIngredient, setNewIngredient] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

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

  const handleSaveIngredient = () => {
    if (newIngredient.trim()) {
      saveIngredient(newIngredient.trim());
      setNewIngredient('');
      setShowSaveInput(false);
    }
  };

  const isMasculine = theme === 'masculine';

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6">
      <div className="relative">
        <Textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder={t.inputPlaceholder}
          disabled={isLoading}
          className={`min-h-[120px] text-lg p-4 bg-card/80 backdrop-blur-sm border-2 rounded-3xl shadow-lg focus:ring-4 transition-all duration-300 resize-none font-body placeholder:text-muted-foreground/70 ${
            isMasculine 
              ? 'border-blue-400/30 focus:border-blue-500 focus:ring-blue-500/20' 
              : 'border-primary/30 focus:border-primary focus:ring-primary/20'
          }`}
        />
        <div className="absolute -top-3 -right-3 text-4xl animate-wiggle">
          {isMasculine ? '⚡' : '✨'}
        </div>
        <div className="absolute -bottom-2 -left-2 text-3xl animate-bounce-slow">
          {isMasculine ? '🦸' : '🍰'}
        </div>
      </div>

      {/* Saved ingredients */}
      {savedIngredients.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium text-center">
            {t.savedIngredients}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {savedIngredients.map((item) => (
              <div
                key={item}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isMasculine 
                    ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' 
                    : 'bg-primary/20 text-primary'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(item)}
                  disabled={isLoading}
                  className="hover:underline"
                >
                  ⭐ {item}
                </button>
                <button
                  type="button"
                  onClick={() => removeIngredient(item)}
                  className="ml-1 hover:text-destructive transition-colors"
                  title={t.removeIngredient}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save ingredient input */}
      <div className="flex justify-center">
        {showSaveInput ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              placeholder={language === 'pt' ? 'Nome do ingrediente...' : 'Ingredient name...'}
              className="px-3 py-2 rounded-full border border-muted-foreground/30 bg-card/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveIngredient())}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleSaveIngredient}
              className="rounded-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowSaveInput(false)}
              className="rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowSaveInput(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            {t.saveIngredient}
          </button>
        )}
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
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                isMasculine 
                  ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300' 
                  : 'bg-secondary/80 hover:bg-secondary text-secondary-foreground'
              }`}
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
          className={`btn-sweet px-8 py-6 text-xl font-display rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-glow ${
            isMasculine 
              ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-red-500 text-white' 
              : 'bg-gradient-to-r from-primary via-sweet-purple to-sweet-blue text-primary-foreground'
          }`}
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
