/**
 * Controller de Sobremesas
 *
 * Gerencia geração de sobremesas com IA e histórico.
 */

const User = require('../models/User');
const Dessert = require('../models/Dessert');
const UsageLog = require('../models/UsageLog');
const AIService = require('../services/aiService');
const CacheService = require('../services/cacheService');
const { validateIngredients } = require('../utils/ingredientValidator');

// Lista de ingredientes bloqueados (não são comida)
const BLOCKED_TERMS = [
  'veneno', 'poison', 'sabão', 'soap', 'detergente', 'detergent',
  'álcool', 'alcohol', 'gasolina', 'gasoline', 'tinta', 'paint',
  'cola', 'glue', 'plástico', 'plastic', 'metal', 'vidro', 'glass'
];

/**
 * Gera uma nova sobremesa mágica
 */
async function generate(req, res) {
  try {
    const { ingredients, theme = 'feminine', language = 'pt' } = req.body;
    const userId = req.userId;
    const ipAddress = req.ip;

    // Validar ingredientes
    const validation = validateIngredients(ingredients, BLOCKED_TERMS);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        blocked: true,
        message: validation.message
      });
    }

    // Verificar créditos
    const hasCredits = await User.hasCredits(userId);
    if (!hasCredits) {
      return res.status(402).json({
        success: false,
        error: 'Créditos insuficientes',
        errorType: 'credits'
      });
    }

    // Gerar cache key
    const cacheKey = Dessert.generateCacheKey(ingredients, theme, language);

    // Verificar cache
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      // Mesmo usando cache, consome crédito
      await User.decrementCredit(userId);

      // Registrar log
      await UsageLog.create({
        userId,
        action: 'generate_dessert',
        creditsUsed: 1,
        details: { ingredients, theme, language, fromCache: true },
        ipAddress
      });

      return res.json({
        success: true,
        recipe: cached,
        fromCache: true
      });
    }

    // Gerar com IA
    const recipe = await AIService.generateDessert(ingredients, theme, language);

    if (!recipe) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao gerar sobremesa'
      });
    }

    // Decrementar crédito
    await User.decrementCredit(userId);

    // Salvar no banco
    await Dessert.create({
      userId,
      ingredients,
      name: recipe.name,
      recipe: {
        ingredients: recipe.ingredients,
        steps: recipe.steps
      },
      imageUrl: recipe.image,
      theme,
      language,
      cacheKey
    });

    // Salvar no cache
    await CacheService.set(cacheKey, recipe);

    // Registrar log
    await UsageLog.create({
      userId,
      action: 'generate_dessert',
      creditsUsed: 1,
      details: { ingredients, theme, language, name: recipe.name },
      ipAddress
    });

    res.json({
      success: true,
      recipe
    });
  } catch (error) {
    console.error('Erro ao gerar sobremesa:', error);

    // Verificar se é erro de rate limit da API
    if (error.status === 429 || error.message?.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: 'Muitas requisições. Aguarde um momento.',
        errorType: 'rate-limit'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erro ao gerar sobremesa'
    });
  }
}

/**
 * Obtém histórico de sobremesas do usuário
 */
async function history(req, res) {
  try {
    const userId = req.userId;
    const { limit = 20, offset = 0 } = req.query;

    const desserts = await Dessert.findByUserId(
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    const total = await Dessert.countByUserId(userId);

    res.json({
      success: true,
      desserts,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar histórico'
    });
  }
}

/**
 * Obtém uma sobremesa específica
 */
async function getById(req, res) {
  try {
    const { id } = req.params;
    const dessert = await Dessert.findById(parseInt(id));

    if (!dessert) {
      return res.status(404).json({
        success: false,
        error: 'Sobremesa não encontrada'
      });
    }

    // Verificar se pertence ao usuário
    if (dessert.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    res.json({
      success: true,
      dessert
    });
  } catch (error) {
    console.error('Erro ao buscar sobremesa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar sobremesa'
    });
  }
}

/**
 * Deleta uma sobremesa do histórico
 */
async function remove(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Dessert.delete(parseInt(id), req.userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Sobremesa não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Sobremesa removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover sobremesa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover sobremesa'
    });
  }
}

/**
 * Obtém sobremesas populares
 */
async function popular(req, res) {
  try {
    const { limit = 10 } = req.query;
    const popular = await Dessert.getPopular(parseInt(limit));

    res.json({
      success: true,
      popular
    });
  } catch (error) {
    console.error('Erro ao buscar populares:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar sobremesas populares'
    });
  }
}

module.exports = {
  generate,
  history,
  getById,
  remove,
  popular
};
