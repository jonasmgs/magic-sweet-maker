/**
 * Serviço de Integração com IA
 *
 * Usa Groq (Mixtral) para texto + Replicate (SDXL) para imagens
 * Custo: ~$0.003 por geração (94% de lucro no plano $4.99!)
 */

const Groq = require('groq-sdk');
const Replicate = require('replicate');

// Configuração
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

const USE_MOCK = process.env.NODE_ENV === 'development' && (!GROQ_API_KEY || !REPLICATE_API_TOKEN);

// Clientes de IA
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;
const replicate = REPLICATE_API_TOKEN ? new Replicate({ auth: REPLICATE_API_TOKEN }) : null;

// Modelos
const TEXT_MODEL = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';
const IMAGE_MODEL = process.env.REPLICATE_MODEL || 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';

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
High quality 3D render, vibrant colors, studio lighting`
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
 * Gera receita com Groq (Mixtral)
 * GRÁTIS! 🎉
 */
async function generateRecipeWithAI(ingredients, theme, language) {
  const prompt = PROMPTS.recipe[language](ingredients, theme);

  const completion = await groq.chat.completions.create({
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
 * Gera imagem com Replicate (SDXL)
 * ~$0.002 por imagem 💰
 */
async function generateImageWithAI(name, theme) {
  const prompt = PROMPTS.image(name, theme);

  const output = await replicate.run(IMAGE_MODEL, {
    input: {
      prompt,
      negative_prompt: 'ugly, blurry, low quality, distorted, disfigured, bad anatomy, text, watermark',
      width: 1024,
      height: 1024,
      num_outputs: 1,
      scheduler: 'K_EULER',
      num_inference_steps: 30,
      guidance_scale: 7.5,
      refine: 'expert_ensemble_refiner',
      high_noise_frac: 0.8
    }
  });

  // Replicate retorna array de URLs
  return Array.isArray(output) ? output[0] : output;
}

/**
 * Função principal: gera sobremesa completa
 */
async function generateDessert(ingredients, theme = 'feminine', language = 'pt') {
  try {
    if (USE_MOCK) {
      console.log('🎭 Usando modo mock para desenvolvimento');
      console.log('💡 Configure GROQ_API_KEY e REPLICATE_API_TOKEN para usar IA real');

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

    // Gerar receita com Groq (Mixtral) - GRÁTIS!
    console.log('🤖 Gerando receita com Mixtral (Groq)...');
    const recipe = await generateRecipeWithAI(ingredients, theme, language);

    // Gerar imagem com Replicate (SDXL) - ~$0.002
    console.log('🎨 Gerando imagem com SDXL (Replicate)...');
    const image = await generateImageWithAI(recipe.name, theme);

    console.log('✅ Geração completa! Custo estimado: ~$0.002');

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
