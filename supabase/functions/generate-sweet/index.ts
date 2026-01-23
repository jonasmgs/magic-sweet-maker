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
    const { ingredients, language } = await req.json();
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

    const systemPrompt = language === 'pt'
      ? `Você é um chef de doces mágico para crianças! Crie receitas divertidas e seguras.

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
      ? `Crie uma receita de doce mágico com estes ingredientes: ${ingredients}`
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

    // Generate image
    const imagePrompt = language === 'pt'
      ? `Uma imagem 3D fofa estilo Pixar de um doce chamado "${recipe.name}" feito com ${ingredients}. O doce tem um rostinho feliz sorrindo, olhos grandes e expressivos, cores vibrantes em tons pastel. Fundo mágico com brilhos e estrelas. Estilo cartoon fofo para crianças. Ultra alta resolução.`
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
            image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop", // Fallback cute cake image
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
          image: generatedImage || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop",
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
