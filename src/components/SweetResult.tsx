import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Recipe {
  name: string;
  image: string;
  ingredients: string[];
  steps: string[];
}

interface SweetResultProps {
  recipe: Recipe | null;
  error: string | null;
  onReset: () => void;
}

export function SweetResult({ recipe, error, onReset }: SweetResultProps) {
  const { t } = useLanguage();

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto animate-pop-in">
        <Card className="bg-card/90 backdrop-blur-sm border-2 border-destructive/30 rounded-3xl shadow-lg overflow-hidden">
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-6xl animate-wiggle">😅</div>
            <h3 className="text-2xl font-display text-destructive">{t.errorTitle}</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button
              onClick={onReset}
              variant="outline"
              size="lg"
              className="rounded-full mt-4"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              {t.tryAgain}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-slide-up">
      {/* Sweet Name */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-display text-gradient-candy animate-pop-in">
          {recipe.name}
        </h2>
        <div className="flex justify-center gap-2 text-2xl">
          <span className="animate-bounce-slow" style={{ animationDelay: '0s' }}>🎉</span>
          <span className="animate-bounce-slow" style={{ animationDelay: '0.2s' }}>✨</span>
          <span className="animate-bounce-slow" style={{ animationDelay: '0.4s' }}>🎊</span>
        </div>
      </div>

      {/* Sweet Image */}
      <div className="relative mx-auto w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-primary/30 animate-pop-in" style={{ animationDelay: '0.2s' }}>
        <img
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-full object-cover"
        />
        {/* Decorative frame */}
        <div className="absolute inset-0 border-8 border-white/20 rounded-3xl pointer-events-none" />
        <div className="absolute -top-2 -right-2 text-4xl animate-sparkle">⭐</div>
        <div className="absolute -bottom-2 -left-2 text-4xl animate-float">🍭</div>
      </div>

      {/* Recipe Card */}
      <Card className="bg-card/90 backdrop-blur-sm border-2 border-primary/20 rounded-3xl shadow-lg overflow-hidden animate-pop-in" style={{ animationDelay: '0.4s' }}>
        <CardHeader className="bg-gradient-to-r from-primary/10 via-sweet-purple/10 to-sweet-blue/10 pb-4">
          <CardTitle className="text-2xl font-display text-center flex items-center justify-center gap-2">
            <span>📜</span>
            {t.recipeTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Ingredients */}
          <div className="space-y-3">
            <h4 className="text-xl font-display text-primary">{t.ingredientsTitle}</h4>
            <ul className="grid grid-cols-2 gap-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 bg-secondary/50 rounded-full px-4 py-2 text-sm"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <span>🌟</span>
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <h4 className="text-xl font-display text-primary">{t.stepsTitle}</h4>
            <ol className="space-y-3">
              {recipe.steps.map((step, index) => (
                <li
                  key={index}
                  className="flex gap-3 items-start bg-muted/50 rounded-2xl p-4"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </span>
                  <p className="text-foreground/90 pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Safety Warning */}
          <div className="flex items-center gap-3 bg-accent/50 rounded-2xl p-4 border border-accent">
            <AlertTriangle className="h-6 w-6 text-accent-foreground flex-shrink-0" />
            <p className="text-sm font-medium text-accent-foreground">
              {t.safetyWarning}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Create Another Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={onReset}
          size="lg"
          className="btn-sweet px-8 py-6 text-xl font-display rounded-full bg-gradient-to-r from-sweet-mint via-secondary to-sweet-blue text-secondary-foreground shadow-lg"
        >
          <RefreshCw className="mr-2 h-6 w-6" />
          {t.createAnother}
        </Button>
      </div>
    </div>
  );
}
