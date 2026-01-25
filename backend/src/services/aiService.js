/**
 * Serviço de Integração com IA
 *
 * Gera receitas e imagens usando OpenAI ou mock para desenvolvimento.
 */

const OpenAI = require('openai');

const USE_MOCK = process.env.NODE_ENV === 'development' && !process.env.OPENAI_API_KEY;
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || 'gpt-4';
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';

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

Responda APENAS no formato JSON:
{
  "name": "Nome da Sobremesa",
  "ingredients": ["ingrediente 1", "ingrediente 2", "ingrediente 3"],
  "steps": ["Passo 1", "Passo 2", "Passo 3"]
}`,
    en: (ingredients, theme) => `Create a magical children's dessert using the ingredients: ${ingredients}.
${theme === 'masculine' ? '- Use superhero and powers theme' : '- Use cute and magical sweets theme'}
- Generate creative name based on a real dessert
- Short recipe in 3 simple steps
- Fun language for children

Reply ONLY in JSON format:
{
  "name": "Dessert Name",
  "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
  "steps": ["Step 1", "Step 2", "Step 3"]
}`
  },
  image: (name, theme) => `A charismatic 3D anthropomorphic character inspired by "${name}".
Dessert-shaped body, ingredients integrated.
${theme === 'masculine' ? 'Superhero style, dynamic pose, action hero vibe.' : 'Disney-Pixar cinematic style.'}
Big joyful eyes, playful pose.
${theme === 'masculine' ? 'Epic cosmic background with stars and energy.' : 'Candy magical background.'}
Do not add extra elements.
High quality 3D render --ar 1:1`
};

/**
 * Dados mock para desenvolvimento
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
 * Gera receita com OpenAI
 */
async function generateRecipeWithAI(ingredients, theme, language) {
  const prompt = PROMPTS.recipe[language](ingredients, theme);

  const completion = await openai.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: 'system',
        content: 'Você é um chef de confeitaria mágica que cria receitas divertidas para crianças. Sempre responda em JSON válido.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.8,
    max_tokens: 500
  });

  const content = completion.choices[0].message.content;

  // Extrair JSON da resposta
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Resposta da IA não contém JSON válido');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Gera imagem com DALL-E
 */
async function generateImageWithAI(name, theme) {
  const prompt = PROMPTS.image(name, theme);

  const response = await openai.images.generate({
    model: IMAGE_MODEL,
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard'
  });

  return response.data[0].url;
}

/**
 * Função principal: gera sobremesa completa
 */
async function generateDessert(ingredients, theme = 'feminine', language = 'pt') {
  try {
    if (USE_MOCK) {
      console.log('🎭 Usando modo mock para desenvolvimento');

      // Simular delay de API
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

    // Gerar receita com IA
    console.log('🤖 Gerando receita com IA...');
    const recipe = await generateRecipeWithAI(ingredients, theme, language);

    // Gerar imagem com IA
    console.log('🎨 Gerando imagem com IA...');
    const image = await generateImageWithAI(recipe.name, theme);

    return {
      name: recipe.name,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      image
    };
  } catch (error) {
    console.error('Erro no serviço de IA:', error);

    // Fallback para mock em caso de erro
    if (!USE_MOCK) {
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

    throw error;
  }
}

module.exports = {
  generateDessert,
  generateRecipeWithAI,
  generateImageWithAI,
  getMockRecipe,
  getMockImage
};
