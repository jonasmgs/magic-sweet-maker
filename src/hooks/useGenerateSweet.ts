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

type ErrorType = 'generic' | 'credits' | 'rate-limit';

interface GenerateSweetResult {
  recipe: Recipe | null;
  error: string | null;
  errorType: ErrorType | null;
  isLoading: boolean;
  generateSweet: (ingredients: string, theme?: 'feminine' | 'masculine') => Promise<void>;
  reset: () => void;
}

export function useGenerateSweet(): GenerateSweetResult {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { language, t } = useLanguage();
  const { toast } = useToast();

  const generateSweet = async (ingredients: string, theme: 'feminine' | 'masculine' = 'feminine') => {
    setIsLoading(true);
    setError(null);
    setErrorType(null);
    setRecipe(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-sweet', {
        body: { ingredients, language, theme },
      });

      // Handle Supabase function errors (including 402, 429)
      if (functionError) {
        const errorMsg = functionError.message || '';
        
        // Check if it's a credits/payment error (402)
        if (errorMsg.includes('402') || errorMsg.includes('non-2xx')) {
          setErrorType('credits');
          setError(language === 'pt' 
            ? 'Os créditos mágicos acabaram! 😢' 
            : 'Magic credits ran out! 😢');
          return;
        }
        
        // Check if it's a rate limit error (429)
        if (errorMsg.includes('429')) {
          setErrorType('rate-limit');
          setError(language === 'pt'
            ? 'Muita magia de uma vez! Espere um pouquinho... ⏳'
            : 'Too much magic at once! Wait a moment... ⏳');
          return;
        }
        
        throw new Error(errorMsg);
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
        // Check for credits/rate limit errors
        if (data.error.includes('Payment required') || data.error.includes('credits')) {
          setErrorType('credits');
          setError(language === 'pt' 
            ? 'Os créditos mágicos acabaram! 😢' 
            : 'Magic credits ran out! 😢');
          return;
        }
        if (data.error.includes('Rate limit') || data.error.includes('try again later')) {
          setErrorType('rate-limit');
          setError(language === 'pt'
            ? 'Muita magia de uma vez! Espere um pouquinho... ⏳'
            : 'Too much magic at once! Wait a moment... ⏳');
          return;
        }
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
      
      // Check error message for specific error types
      if (errorMessage.includes('Payment required') || errorMessage.includes('credits') || errorMessage.includes('402')) {
        setErrorType('credits');
        setError(language === 'pt' 
          ? 'Os créditos mágicos acabaram! 😢' 
          : 'Magic credits ran out! 😢');
      } else if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
        setErrorType('rate-limit');
        setError(language === 'pt'
          ? 'Muita magia de uma vez! Espere um pouquinho... ⏳'
          : 'Too much magic at once! Wait a moment... ⏳');
      } else {
        setErrorType('generic');
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: t.errorTitle,
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setRecipe(null);
    setError(null);
    setErrorType(null);
  };

  return {
    recipe,
    error,
    errorType,
    isLoading,
    generateSweet,
    reset,
  };
}
