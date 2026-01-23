import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface Recipe {
  name: string;
  image: string;
  ingredients: string[];
  steps: string[];
}

interface GenerateSweetResult {
  recipe: Recipe | null;
  error: string | null;
  isLoading: boolean;
  generateSweet: (ingredients: string) => Promise<void>;
  reset: () => void;
}

export function useGenerateSweet(): GenerateSweetResult {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { language, t } = useLanguage();
  const { toast } = useToast();

  const generateSweet = async (ingredients: string) => {
    setIsLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-sweet', {
        body: { ingredients, language },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.blocked) {
        toast({
          variant: "destructive",
          title: language === 'pt' ? "Ingrediente não permitido" : "Ingredient not allowed",
          description: data.message,
        });
        setError(data.message);
        return;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.success && data.recipe) {
        setRecipe(data.recipe);
      } else {
        throw new Error(t.errorMessage);
      }
    } catch (err) {
      console.error('Error generating sweet:', err);
      const errorMessage = err instanceof Error ? err.message : t.errorMessage;
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: t.errorTitle,
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setRecipe(null);
    setError(null);
  };

  return {
    recipe,
    error,
    isLoading,
    generateSweet,
    reset,
  };
}
