/**
 * Validador de Ingredientes
 *
 * Verifica se os ingredientes são válidos e seguros.
 */

/**
 * Lista de ingredientes populares válidos
 */
const POPULAR_INGREDIENTS = [
  // Frutas
  'morango', 'banana', 'maçã', 'laranja', 'limão', 'abacaxi', 'manga',
  'uva', 'pêssego', 'framboesa', 'mirtilo', 'kiwi', 'melancia',
  'strawberry', 'banana', 'apple', 'orange', 'lemon', 'pineapple', 'mango',

  // Chocolates
  'chocolate', 'chocolate branco', 'chocolate ao leite', 'chocolate amargo',
  'cacau', 'nutella', 'creme de avelã',
  'white chocolate', 'milk chocolate', 'dark chocolate', 'cocoa',

  // Laticínios
  'leite', 'leite condensado', 'creme de leite', 'manteiga', 'queijo',
  'cream cheese', 'iogurte', 'chantilly', 'sorvete',
  'milk', 'condensed milk', 'cream', 'butter', 'cheese', 'yogurt', 'ice cream',

  // Outros
  'açúcar', 'mel', 'farinha', 'ovos', 'baunilha', 'canela', 'caramelo',
  'biscoito', 'bolacha', 'granulado', 'confete', 'marshmallow', 'cookie',
  'sugar', 'honey', 'flour', 'eggs', 'vanilla', 'cinnamon', 'caramel',
  'sprinkles', 'cookies'
];

/**
 * Valida ingredientes
 */
function validateIngredients(ingredients, blockedTerms = []) {
  if (!ingredients || typeof ingredients !== 'string') {
    return {
      valid: false,
      message: 'Ingredientes são obrigatórios'
    };
  }

  const cleaned = ingredients.trim().toLowerCase();

  // Verificar tamanho mínimo
  if (cleaned.length < 3) {
    return {
      valid: false,
      message: 'Digite pelo menos um ingrediente'
    };
  }

  // Verificar tamanho máximo
  if (cleaned.length > 500) {
    return {
      valid: false,
      message: 'Texto muito longo. Máximo de 500 caracteres.'
    };
  }

  // Extrair ingredientes individuais primeiro
  const ingredientList = cleaned
    .split(/[,;]/)
    .map(i => i.trim())
    .filter(i => i.length > 0);

  // Verificar termos bloqueados (apenas palavras inteiras)
  for (const term of blockedTerms) {
    const termLower = term.toLowerCase();
    for (const ingredient of ingredientList) {
      // Verifica se o termo bloqueado é uma palavra inteira no ingrediente
      const wordRegex = new RegExp(`\\b${termLower}\\b`, 'i');
      if (wordRegex.test(ingredient)) {
        return {
          valid: false,
          blocked: true,
          message: 'Ops! Esse ingrediente não é comidinha 😅 Vamos escolher algo gostoso como chocolate, frutas ou leite?'
        };
      }
    }
  }

  if (ingredientList.length === 0) {
    return {
      valid: false,
      message: 'Digite pelo menos um ingrediente'
    };
  }

  // Verificar se há pelo menos um ingrediente válido conhecido (opcional)
  const hasKnownIngredient = ingredientList.some(ingredient =>
    POPULAR_INGREDIENTS.some(popular =>
      ingredient.includes(popular) || popular.includes(ingredient)
    )
  );

  return {
    valid: true,
    ingredients: ingredientList,
    hasKnownIngredient
  };
}

/**
 * Normaliza lista de ingredientes para cache key
 */
function normalizeIngredients(ingredients) {
  return ingredients
    .toLowerCase()
    .split(/[,;]/)
    .map(i => i.trim())
    .filter(i => i.length > 0)
    .sort()
    .join(',');
}

/**
 * Sugere ingredientes populares
 */
function getSuggestions(category = 'all') {
  const categories = {
    fruits: POPULAR_INGREDIENTS.filter(i =>
      ['morango', 'banana', 'maçã', 'laranja', 'limão', 'abacaxi', 'manga', 'uva'].includes(i)
    ),
    chocolate: POPULAR_INGREDIENTS.filter(i =>
      i.includes('chocolate') || i.includes('cacau')
    ),
    dairy: POPULAR_INGREDIENTS.filter(i =>
      ['leite', 'manteiga', 'creme', 'iogurte', 'sorvete'].some(d => i.includes(d))
    ),
    all: POPULAR_INGREDIENTS.slice(0, 20)
  };

  return categories[category] || categories.all;
}

module.exports = {
  validateIngredients,
  normalizeIngredients,
  getSuggestions,
  POPULAR_INGREDIENTS
};
