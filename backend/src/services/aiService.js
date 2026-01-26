/**
 * Serviço de IA - Google Gemini
 *
 * Usa Gemini para texto e Imagen 3 para imagens
 * Configuração: GEMINI_API_KEY no .env
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuração
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const USE_MOCK = !GEMINI_API_KEY;

// Cliente Gemini
let genAI = null;
let model = null;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

/**
 * Prompts para geração
 */
const PROMPTS = {
  recipe: {
    pt: (ingredients, theme) => `Crie uma sobremesa infantil mágica usando os ingredientes: ${ingredients}.
${theme === 'masculine' ? '- Use tema de super-heróis e poderes' : '- Use tema de doces fofos e mágicos'}
- Gere nome criativo baseado em doce real
- Receita curta em 3 passos simples
- Linguagem divertida para crianças

Responda APENAS no formato JSON válido (sem markdown):
{"name": "Nome da Sobremesa", "ingredients": ["ingrediente 1", "ingrediente 2", "ingrediente 3"], "steps": ["Passo 1", "Passo 2", "Passo 3"]}`,

    en: (ingredients, theme) => `Create a magical children's dessert using the ingredients: ${ingredients}.
${theme === 'masculine' ? '- Use superhero and powers theme' : '- Use cute and magical sweets theme'}
- Generate creative name based on a real dessert
- Short recipe in 3 simple steps
- Fun language for children

Reply ONLY in valid JSON format (no markdown):
{"name": "Dessert Name", "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"], "steps": ["Step 1", "Step 2", "Step 3"]}`
  },

  image: (name, theme) => `Create a charming 3D character inspired by "${name}".
Dessert-shaped body with ingredients integrated.
${theme === 'masculine' ? 'Superhero style, dynamic pose, action hero vibe.' : 'Disney-Pixar cinematic style.'}
Big joyful eyes, playful pose.
${theme === 'masculine' ? 'Epic cosmic background with stars and energy.' : 'Candy magical background.'}
High quality 3D render, vibrant colors, studio lighting, no text.`
};

/**
 * Dados mock para desenvolvimento sem API key
 */
const MOCK_RECIPES = {
  pt: {
    feminine: [
      {
        name: 'Brigadeiro Encantado das Fadas',
        ingredients: ['Leite condensado', 'Chocolate em pó', 'Manteiga', 'Granulado colorido'],
        steps: [
          'Misture o leite condensado com o chocolate e a manteiga em uma panela mágica',
          'Mexa sem parar até a mistura se desprender do fundo (peça ajuda de um adulto!)',
          'Espere esfriar, faça bolinhas e cubra com granulado colorido'
        ]
      },
      {
        name: 'Cupcake Arco-Íris da Felicidade',
        ingredients: ['Farinha', 'Ovos', 'Leite', 'Corante colorido', 'Chantilly'],
        steps: [
          'Misture todos os ingredientes secos e depois adicione os líquidos',
          'Divida a massa e adicione cores diferentes em cada parte',
          'Asse e decore com chantilly mágico!'
        ]
      }
    ],
    masculine: [
      {
        name: 'Brownie do Poder Supremo',
        ingredients: ['Chocolate', 'Manteiga', 'Ovos', 'Açúcar', 'Farinha'],
        steps: [
          'Derreta o chocolate com a manteiga como um super-herói derrete vilões!',
          'Misture os ovos e açúcar com força total',
          'Adicione a farinha e asse para ganhar poderes!'
        ]
      },
      {
        name: 'Shake Turbinado do Trovão',
        ingredients: ['Leite', 'Sorvete de chocolate', 'Banana', 'Granola'],
        steps: [
          'Coloque tudo no liquidificador como se fosse sua arma secreta',
          'Bata em velocidade máxima até virar energia pura',
          'Sirva com granola para força extra!'
        ]
      }
    ]
  },
  en: {
    feminine: [
      {
        name: 'Enchanted Fairy Truffle',
        ingredients: ['Condensed milk', 'Cocoa powder', 'Butter', 'Rainbow sprinkles'],
        steps: [
          'Mix condensed milk with cocoa and butter in a magic pot',
          'Stir constantly until the mixture pulls away from the bottom (ask an adult for help!)',
          'Let it cool, make little balls and cover with rainbow sprinkles'
        ]
      }
    ],
    masculine: [
      {
        name: 'Supreme Power Brownie',
        ingredients: ['Chocolate', 'Butter', 'Eggs', 'Sugar', 'Flour'],
        steps: [
          'Melt chocolate and butter like a superhero melts villains!',
          'Mix eggs and sugar with full power',
          'Add flour and bake to gain powers!'
        ]
      }
    ]
  }
};

const MOCK_IMAGES = {
  feminine: [
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=512&h=512&fit=crop',
    'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=512&h=512&fit=crop',
    'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=512&h=512&fit=crop'
  ],
  masculine: [
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=512&h=512&fit=crop',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=512&h=512&fit=crop',
    'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=512&h=512&fit=crop'
  ]
};

/**
 * Gera receita mock
 */
function getMockRecipe(language, theme) {
  const recipes = MOCK_RECIPES[language]?.[theme] || MOCK_RECIPES.pt.feminine;
  return recipes[Math.floor(Math.random() * recipes.length)];
}

/**
 * Gera imagem mock
 */
function getMockImage(theme) {
  const images = MOCK_IMAGES[theme] || MOCK_IMAGES.feminine;
  return images[Math.floor(Math.random() * images.length)];
}

/**
 * Gera receita com Gemini
 */
async function generateRecipeWithAI(ingredients, theme, language) {
  const prompt = PROMPTS.recipe[language](ingredients, theme);

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const content = response.text();

  // Extrair JSON da resposta (remove possíveis backticks markdown)
  let jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Resposta da IA não contém JSON válido');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Gera imagem com Gemini Imagen
 * Nota: Imagen 3 requer configuração específica no Google Cloud
 * Por enquanto usa placeholder até API key ser configurada
 */
async function generateImageWithAI(name, theme) {
  // Gemini Imagen 3 - quando disponível
  // Por enquanto retorna placeholder de alta qualidade
  const imagePrompt = PROMPTS.image(name, theme);

  // TODO: Integrar com Imagen 3 quando API key for fornecida
  // const imagenModel = genAI.getGenerativeModel({ model: 'imagen-3.0-generate-001' });
  // const result = await imagenModel.generateImage({ prompt: imagePrompt });

  // Placeholder temporário - será substituído por Imagen 3
  const placeholders = {
    feminine: [
      'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1024&h=1024&fit=crop',
      'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=1024&h=1024&fit=crop',
    ],
    masculine: [
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=1024&h=1024&fit=crop',
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1024&h=1024&fit=crop',
    ]
  };

  const images = placeholders[theme] || placeholders.feminine;
  return images[Math.floor(Math.random() * images.length)];
}

/**
 * Função principal: gera sobremesa completa
 */
async function generateDessert(ingredients, theme = 'feminine', language = 'pt') {
  try {
    if (USE_MOCK) {
      console.log('🎭 Modo mock - Configure GEMINI_API_KEY para usar IA real');

      await new Promise(resolve => setTimeout(resolve, 1500));

      const recipe = getMockRecipe(language, theme);
      const image = getMockImage(theme);

      return {
        name: recipe.name,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        image
      };
    }

    console.log('🤖 Gerando receita com Gemini...');
    const recipe = await generateRecipeWithAI(ingredients, theme, language);

    console.log('🎨 Gerando imagem...');
    const image = await generateImageWithAI(recipe.name, theme);

    console.log('✅ Geração completa!');

    return {
      name: recipe.name,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      image
    };
  } catch (error) {
    console.error('Erro no serviço de IA:', error);

    // Fallback para mock em caso de erro
    console.log('⚠️ Usando fallback mock devido a erro na IA');
    const recipe = getMockRecipe(language, theme);
    const image = getMockImage(theme);

    return {
      name: recipe.name,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      image
    };
  }
}

module.exports = {
  generateDessert,
  generateRecipeWithAI,
  generateImageWithAI,
  getMockRecipe,
  getMockImage
};
