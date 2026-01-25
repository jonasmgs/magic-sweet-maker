import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// List of dangerous/non-edible items to block
const blockedItems = [
  // Dangerous objects
  'prego', 'nail', 'vidro', 'glass', 'faca', 'knife', 'tesoura', 'scissors',
  'agulha', 'needle', 'parafuso', 'screw', 'arame', 'wire', 'lâmina', 'blade',
  // Chemicals
  'detergente', 'detergent', 'sabão', 'soap', 'shampoo', 'alvejante', 'bleach',
  'veneno', 'poison', 'cloro', 'chlorine', 'amônia', 'ammonia', 'soda cáustica',
  'caustic soda', 'desinfetante', 'disinfectant', 'gasolina', 'gasoline', 'óleo de motor',
  // Medicines
  'remédio', 'medicine', 'medicamento', 'medication', 'pílula', 'pill', 'comprimido',
  'tablet', 'antibiótico', 'antibiotic', 'aspirina', 'aspirin',
  // Other non-food items
  'pilha', 'battery', 'bateria', 'plástico', 'plastic', 'papel', 'paper',
  'terra', 'dirt', 'areia', 'sand', 'pedra', 'stone', 'rock',
  'inseto', 'insect', 'barata', 'cockroach', 'formiga', 'ant', 'mosca', 'fly',
  'cigarro', 'cigarette', 'álcool', 'alcohol', 'cerveja', 'beer', 'vinho', 'wine',
  'vodka', 'whisky', 'rum', 'cachaça', 'tinta', 'paint', 'cola', 'glue',
];

function containsBlockedItem(ingredients: string): { blocked: boolean; item?: string } {
  const lowerIngredients = ingredients.toLowerCase();
  for (const item of blockedItems) {
    if (lowerIngredients.includes(item)) {
      return { blocked: true, item };
    }
  }
  return { blocked: false };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingredients, language, theme = 'feminine' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Check for blocked ingredients
    const blockCheck = containsBlockedItem(ingredients);
    if (blockCheck.blocked) {
      return new Response(
        JSON.stringify({
          blocked: true,
          message: language === 'pt'
            ? `Ops! "${blockCheck.item}" não é comidinha 😅 Vamos escolher algo gostoso como chocolate, frutas ou leite?`
            : `Oops! "${blockCheck.item}" isn't food 😅 Let's choose something yummy like chocolate, fruits, or milk!`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isMasculine = theme === 'masculine';

    const systemPrompt = language === 'pt'
      ? isMasculine 
        ? `Você é um chef de doces SUPER-HERÓI para crianças! Crie receitas épicas com tema de super-heróis.

REGRAS:
1. Use APENAS ingredientes comestíveis e seguros para crianças
2. Crie um nome ÉPICO de super-herói para o doce (ex: "Bolo do Poder do Superman", "Cupcake Relâmpago do Flash", "Brownie Vingador")
3. O nome DEVE ter referência a super-heróis, poderes ou ação
4. Liste ingredientes simples (máximo 8)
5. Escreva passos simples em linguagem infantil com tema heróico (máximo 6 passos)
6. Use emojis de super-heróis: ⚡💪🦸🔥🌟💥
7. Nunca inclua ingredientes perigosos ou inadequados

Responda APENAS com JSON válido no formato:
{
  "name": "Nome Épico de Super-Herói do Doce",
  "ingredients": ["ingrediente 1", "ingrediente 2"],
  "steps": ["Passo 1 heróico ⚡", "Passo 2 poderoso 💪"]
}`
        : `Você é um chef de doces mágico para crianças! Crie receitas divertidas e seguras.

REGRAS:
1. Use APENAS ingredientes comestíveis e seguros para crianças
2. Crie um nome criativo e divertido para o doce
3. Liste ingredientes simples (máximo 8)
4. Escreva passos simples em linguagem infantil (máximo 6 passos)
5. Use emojis para tornar divertido
6. Nunca inclua ingredientes perigosos ou inadequados

Responda APENAS com JSON válido no formato:
{
  "name": "Nome Criativo do Doce",
  "ingredients": ["ingrediente 1", "ingrediente 2"],
  "steps": ["Passo 1 com emojis 💕", "Passo 2 divertido ✨"]
}`
      : isMasculine
        ? `You are a SUPERHERO sweet chef for kids! Create epic superhero-themed recipes.

RULES:
1. Use ONLY edible and kid-safe ingredients
2. Create an EPIC superhero name for the sweet (e.g., "Superman's Power Cake", "Flash Lightning Cupcake", "Avenger Brownie")
3. The name MUST reference superheroes, powers, or action
4. List simple ingredients (max 8)
5. Write simple steps in child-friendly language with heroic theme (max 6 steps)
6. Use superhero emojis: ⚡💪🦸🔥🌟💥
7. Never include dangerous or inappropriate ingredients

Reply ONLY with valid JSON in this format:
{
  "name": "Epic Superhero Sweet Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "steps": ["Heroic step 1 ⚡", "Powerful step 2 💪"]
}`
        : `You are a magical sweet chef for kids! Create fun and safe recipes.

RULES:
1. Use ONLY edible and kid-safe ingredients
2. Create a creative and fun name for the sweet
3. List simple ingredients (max 8)
4. Write simple steps in child-friendly language (max 6 steps)
5. Use emojis to make it fun
6. Never include dangerous or inappropriate ingredients

Reply ONLY with valid JSON in this format:
{
  "name": "Creative Sweet Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "steps": ["Step 1 with emojis 💕", "Fun step 2 ✨"]
}`;

    const userPrompt = language === 'pt'
      ? isMasculine
        ? `Crie uma receita de doce de SUPER-HERÓI épico com estes ingredientes: ${ingredients}`
        : `Crie uma receita de doce mágico com estes ingredientes: ${ingredients}`
      : isMasculine
        ? `Create an epic SUPERHERO sweet recipe with these ingredients: ${ingredients}`
        : `Create a magical sweet recipe with these ingredients: ${ingredients}`;

    // Generate recipe with text model
    const recipeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!recipeResponse.ok) {
      if (recipeResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (recipeResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Recipe API error: ${recipeResponse.status}`);
    }

    const recipeData = await recipeResponse.json();
    const recipeContent = recipeData.choices?.[0]?.message?.content;

    if (!recipeContent) {
      throw new Error("No recipe content received");
    }

    // Parse recipe JSON
    let recipe;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = recipeContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : recipeContent;
      recipe = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error("Failed to parse recipe:", recipeContent);
      throw new Error("Failed to parse recipe response");
    }

    // Generate image with appropriate style
    const imagePrompt = language === 'pt'
      ? isMasculine
        ? `Uma imagem 3D fofa estilo Pixar de um doce de SUPER-HERÓI chamado "${recipe.name}" feito com ${ingredients}. O doce tem formato heroico, cores vibrantes de super-herói (vermelho, azul, dourado), com capa ou máscara ou símbolo de poder. Fundo épico com raios e energia. Estilo cartoon fofo para crianças mas com tema de super-herói. Olhos grandes expressivos. Ultra alta resolução.`
        : `Uma imagem 3D fofa estilo Pixar de um doce chamado "${recipe.name}" feito com ${ingredients}. O doce tem um rostinho feliz sorrindo, olhos grandes e expressivos, cores vibrantes em tons pastel. Fundo mágico com brilhos e estrelas. Estilo cartoon fofo para crianças. Ultra alta resolução.`
      : isMasculine
        ? `A cute 3D Pixar-style image of a SUPERHERO sweet dessert called "${recipe.name}" made with ${ingredients}. The dessert has heroic shape, vibrant superhero colors (red, blue, gold), with cape or mask or power symbol. Epic background with lightning and energy. Cute cartoon style for kids but with superhero theme. Big expressive eyes. Ultra high resolution.`
        : `A cute 3D Pixar-style image of a sweet dessert called "${recipe.name}" made with ${ingredients}. The dessert has a happy smiling face, big expressive eyes, vibrant pastel colors. Magical background with sparkles and stars. Cute cartoon style for kids. Ultra high resolution.`;

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "user", content: imagePrompt },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) {
      console.error("Image generation failed:", imageResponse.status);
      // Return recipe without image if image generation fails
      return new Response(
        JSON.stringify({
          success: true,
          recipe: {
            name: recipe.name,
            ingredients: recipe.ingredients,
            steps: recipe.steps,
            image: isMasculine 
              ? "https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=800&h=800&fit=crop" // Superhero themed fallback
              : "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop", // Cute cake fallback
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageData = await imageResponse.json();
    const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    return new Response(
      JSON.stringify({
        success: true,
        recipe: {
          name: recipe.name,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          image: generatedImage || (isMasculine 
            ? "https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=800&h=800&fit=crop"
            : "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop"),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-sweet:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
