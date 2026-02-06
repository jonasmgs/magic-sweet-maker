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
    pt: (ingredients, theme) => `Crie uma sobremesa infantil m?gica usando os ingredientes: ${ingredients}.\n${theme === "masculine" ? "- Use tema de super-her?is e poderes" : "- Use tema de doces fofos e m?gicos"}\n- Gere nome criativo baseado em doce real\n- Receita curta em 3 passos simples\n- Linguagem divertida para crian?as\n\nResponda APENAS no formato JSON v?lido (sem markdown):\n{"name": "Nome da Sobremesa", "ingredients": ["ingrediente 1", "ingrediente 2", "ingrediente 3"], "steps": ["Passo 1", "Passo 2", "Passo 3"]}` ,
    en: (ingredients, theme) => `Create a magical kids dessert using the ingredients: ${ingredients}.\n${theme === "masculine" ? "- Use superhero and powers theme" : "- Use cute and magical sweets theme"}\n- Generate a creative name based on a real dessert\n- Short recipe in 3 simple steps\n- Fun language for kids\n\nReply ONLY in valid JSON format (no markdown):\n{"name": "Dessert Name", "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"], "steps": ["Step 1", "Step 2", "Step 3"]}` ,
    es: (ingredients, theme) => `Crea un postre infantil m?gico usando los ingredientes: ${ingredients}.\n${theme === "masculine" ? "- Usa tema de superh?roes y poderes" : "- Usa tema de dulces tiernos y m?gicos"}\n- Genera un nombre creativo basado en un postre real\n- Receta corta en 3 pasos simples\n- Lenguaje divertido para ni?os\n\nResponde SOLO en formato JSON v?lido (sin markdown):\n{"name": "Nombre del Postre", "ingredients": ["ingrediente 1", "ingrediente 2", "ingrediente 3"], "steps": ["Paso 1", "Paso 2", "Paso 3"]}` ,
    fr: (ingredients, theme) => `Cr?e une douceur magique pour les enfants avec les ingr?dients : ${ingredients}.\n${theme === "masculine" ? "- Th?me super-h?ros et pouvoirs" : "- Th?me de douceurs mignonnes et magiques"}\n- G?n?re un nom cr?atif bas? sur un dessert r?el\n- Recette courte en 3 ?tapes simples\n- Langage amusant pour les enfants\n\nR?ponds UNIQUEMENT en JSON valide (sans markdown) :\n{"name": "Nom du dessert", "ingredients": ["ingr?dient 1", "ingr?dient 2", "ingr?dient 3"], "steps": ["?tape 1", "?tape 2", "?tape 3"]}` ,
    de: (ingredients, theme) => `Erstelle ein magisches Kinderdessert mit den Zutaten: ${ingredients}.\n${theme === "masculine" ? "- Superhelden- und Kr?fte-Thema" : "- S??es, niedliches, magisches Thema"}\n- Erfinde einen kreativen Namen basierend auf einem echten Dessert\n- Kurzes Rezept in 3 einfachen Schritten\n- Kindgerechte, spa?ige Sprache\n\nAntworte NUR im g?ltigen JSON-Format (ohne Markdown):\n{"name": "Dessertname", "ingredients": ["Zutat 1", "Zutat 2", "Zutat 3"], "steps": ["Schritt 1", "Schritt 2", "Schritt 3"]}` ,
    ja: (ingredients, theme) => `?????????????????????????????: ${ingredients}.\n${theme === "masculine" ? "- ???????????????" : "- ????????????????"}\n- ??????????????????\n- 3?????????????\n- ???????????\n\n???JSON??????????????markdown???:\n{"name": "?????", "ingredients": ["??1", "??2", "??3"], "steps": ["??1", "??2", "??3"]}`
  },

  image: (name, theme) => `Create a charming 3D character inspired by "${name}".\nDessert-shaped body with ingredients integrated.\n${theme === "masculine" ? "Superhero style, dynamic pose, action hero vibe." : "Disney-Pixar cinematic style."}\nBig joyful eyes, playful pose.\n${theme === "masculine" ? "Epic cosmic background with stars and energy." : "Candy magical background."}\nHigh quality 3D render, vibrant colors, studio lighting, no text.`
};

/**
 * Dados mock para desenvolvimento sem API key
 */
const MOCK_RECIPES = {
  pt: {
    feminine: [
      {
        name: "Brigadeiro Encantado das Fadas",
        ingredients: ["Leite condensado", "Chocolate em p?", "Manteiga", "Granulado colorido"],
        steps: [
          "Misture o leite condensado com o chocolate e a manteiga em uma panela m?gica",
          "Mexa sem parar at? a mistura se desprender do fundo (pe?a ajuda de um adulto!)",
          "Espere esfriar, fa?a bolinhas e cubra com granulado colorido"
        ]
      },
      {
        name: "Cupcake Arco-?ris da Felicidade",
        ingredients: ["Farinha", "Ovos", "Leite", "Corante colorido", "Chantilly"],
        steps: [
          "Misture todos os ingredientes secos e depois adicione os l?quidos",
          "Divida a massa e adicione cores diferentes em cada parte",
          "Asse e decore com chantilly m?gico!"
        ]
      }
    ],
    masculine: [
      {
        name: "Brownie do Poder Supremo",
        ingredients: ["Chocolate", "Manteiga", "Ovos", "A??car", "Farinha"],
        steps: [
          "Derreta o chocolate com a manteiga como um super-her?i derrete vil?es!",
          "Misture os ovos e a??car com for?a total",
          "Adicione a farinha e asse para ganhar poderes!"
        ]
      },
      {
        name: "Shake Turbinado do Trov?o",
        ingredients: ["Leite", "Sorvete de chocolate", "Banana", "Granola"],
        steps: [
          "Coloque tudo no liquidificador como se fosse sua arma secreta",
          "Bata em velocidade m?xima at? virar energia pura",
          "Sirva com granola para for?a extra!"
        ]
      }
    ]
  },
  en: {
    feminine: [
      {
        name: "Enchanted Fairy Truffle",
        ingredients: ["Condensed milk", "Cocoa powder", "Butter", "Rainbow sprinkles"],
        steps: [
          "Mix condensed milk with cocoa and butter in a magic pot",
          "Stir constantly until the mixture pulls away from the bottom (ask an adult for help!)",
          "Let it cool, make little balls and cover with rainbow sprinkles"
        ]
      }
    ],
    masculine: [
      {
        name: "Supreme Power Brownie",
        ingredients: ["Chocolate", "Butter", "Eggs", "Sugar", "Flour"],
        steps: [
          "Melt chocolate and butter like a superhero melts villains!",
          "Mix eggs and sugar with full power",
          "Add flour and bake to gain powers!"
        ]
      }
    ]
  },
  es: {
    feminine: [
      {
        name: "Trufa Encantada de Hadas",
        ingredients: ["Leche condensada", "Cacao en polvo", "Mantequilla", "Sprinkles de colores"],
        steps: [
          "Mezcla la leche condensada con el cacao y la mantequilla en una olla m?gica",
          "Revuelve sin parar hasta que se despegue del fondo (pide ayuda a un adulto)",
          "Deja enfriar, haz bolitas y c?brelas con sprinkles"
        ]
      }
    ],
    masculine: [
      {
        name: "Brownie del Poder Supremo",
        ingredients: ["Chocolate", "Mantequilla", "Huevos", "Az?car", "Harina"],
        steps: [
          "Derrite el chocolate con la mantequilla como un superh?roe",
          "Mezcla los huevos y el az?car con toda tu energ?a",
          "Agrega la harina y hornea para ganar poderes"
        ]
      }
    ]
  },
  fr: {
    feminine: [
      {
        name: "Truffe F?erique Enchant?e",
        ingredients: ["Lait concentr?", "Cacao en poudre", "Beurre", "Vermicelles color?s"],
        steps: [
          "M?lange le lait concentr?, le cacao et le beurre dans une casserole magique",
          "Remue sans t?arr?ter jusqu?? ce que ?a se d?colle du fond (demande l?aide d?un adulte)",
          "Laisse refroidir, forme des petites boules et roule-les dans les vermicelles"
        ]
      }
    ],
    masculine: [
      {
        name: "Brownie du Pouvoir Supr?me",
        ingredients: ["Chocolat", "Beurre", "?ufs", "Sucre", "Farine"],
        steps: [
          "Fais fondre le chocolat et le beurre comme un super-h?ros",
          "M?lange les ?ufs et le sucre avec toute ta force",
          "Ajoute la farine et fais cuire pour gagner des pouvoirs"
        ]
      }
    ]
  },
  de: {
    feminine: [
      {
        name: "Zauberhafte Feen-Tr?ffel",
        ingredients: ["Kondensmilch", "Kakaopulver", "Butter", "Bunte Streusel"],
        steps: [
          "Vermische Kondensmilch, Kakao und Butter im magischen Topf",
          "R?hre, bis sich die Masse vom Boden l?st (bitte einen Erwachsenen um Hilfe)",
          "Abk?hlen lassen, kleine Kugeln formen und in Streuseln w?lzen"
        ]
      }
    ],
    masculine: [
      {
        name: "Ultimativer Power-Brownie",
        ingredients: ["Schokolade", "Butter", "Eier", "Zucker", "Mehl"],
        steps: [
          "Schmelze Schokolade und Butter wie ein Superheld",
          "Verr?hre Eier und Zucker mit voller Kraft",
          "Mehl dazugeben und backen, um Kr?fte zu gewinnen"
        ]
      }
    ]
  },
  ja: {
    feminine: [
      {
        name: "??????????",
        ingredients: ["??", "???????", "???", "??????????"],
        steps: [
          "?????????????????????",
          "?????????????????????????????????",
          "????????????????????"
        ]
      }
    ],
    masculine: [
      {
        name: "?????????????",
        ingredients: ["??????", "???", "?", "??", "???"],
        steps: [
          "????????????????????",
          "??????????????",
          "???????????????????"
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
  const recipesByLang = MOCK_RECIPES[language] || MOCK_RECIPES.en || MOCK_RECIPES.pt;
  const recipes = recipesByLang[theme] || recipesByLang.feminine || MOCK_RECIPES.pt.feminine;
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
  const recipePrompt = PROMPTS.recipe[language] || PROMPTS.recipe.en;
  const prompt = recipePrompt(ingredients, theme);

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
