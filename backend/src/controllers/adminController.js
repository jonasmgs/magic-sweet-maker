/**
 * Controller de Administração
 *
 * Endpoints para dashboard e gerenciamento (requer autenticação admin).
 */

const User = require('../models/User');
const Dessert = require('../models/Dessert');
const UsageLog = require('../models/UsageLog');

/**
 * Obtém estatísticas gerais
 */
async function getStats(req, res) {
  try {
    const userStats = await User.getStats();
    const dessertStats = await Dessert.getStats();
    const usageStats = await UsageLog.getStats();

    res.json({
      success: true,
      stats: {
        users: userStats,
        desserts: dessertStats,
        usage: usageStats,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas'
    });
  }
}

/**
 * Lista usuários
 */
async function getUsers(req, res) {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const users = await User.findAll(parseInt(limit), parseInt(offset));
    const total = await User.count();

    res.json({
      success: true,
      users,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar usuários'
    });
  }
}

/**
 * Obtém detalhes de um usuário
 */
async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(parseInt(id));

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Buscar dados adicionais
    const desserts = await Dessert.findByUserId(user.id, 10);
    const usageLogs = await UsageLog.findByUserId(user.id, 20);
    const totalDesserts = await Dessert.countByUserId(user.id);
    const totalCreditsUsed = await UsageLog.getTotalCreditsUsed(user.id);

    res.json({
      success: true,
      user: {
        ...user,
        recentDesserts: desserts,
        recentActivity: usageLogs,
        stats: {
          totalDesserts,
          totalCreditsUsed
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuário'
    });
  }
}

/**
 * Atualiza créditos de um usuário (admin)
 */
async function updateUserCredits(req, res) {
  try {
    const { id } = req.params;
    const { credits } = req.body;

    if (typeof credits !== 'number' || credits < 0) {
      return res.status(400).json({
        success: false,
        error: 'Créditos inválidos'
      });
    }

    const user = await User.updateCredits(parseInt(id), credits);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Registrar log
    await UsageLog.create({
      userId: user.id,
      action: 'admin_update_credits',
      details: { newCredits: credits, adminId: req.userId },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erro ao atualizar créditos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar créditos'
    });
  }
}

/**
 * Obtém sobremesas populares
 */
async function getPopularDesserts(req, res) {
  try {
    const { limit = 20 } = req.query;
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

/**
 * Limpa logs antigos
 */
async function cleanOldLogs(req, res) {
  try {
    const { days = 90 } = req.body;
    const deleted = await UsageLog.cleanOldLogs(parseInt(days));

    res.json({
      success: true,
      message: `${deleted} logs removidos`,
      deletedCount: deleted
    });
  } catch (error) {
    console.error('Erro ao limpar logs:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao limpar logs'
    });
  }
}

module.exports = {
  getStats,
  getUsers,
  getUserById,
  updateUserCredits,
  getPopularDesserts,
  cleanOldLogs
};
