/**
 * Controller de Usuário
 *
 * Gerencia perfil, créditos e upgrade de plano.
 */

const User = require('../models/User');
const UsageLog = require('../models/UsageLog');
const Dessert = require('../models/Dessert');
const PaymentService = require('../services/paymentService');

/**
 * Obtém perfil completo do usuário
 */
async function getProfile(req, res) {
  try {
    const user = await User.checkAndRenewCredits(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Buscar estatísticas adicionais
    const totalDesserts = await Dessert.countByUserId(req.userId);
    const totalCreditsUsed = await UsageLog.getTotalCreditsUsed(req.userId);
    const recentActivity = await UsageLog.findByUserId(req.userId, 10);

    res.json({
      success: true,
      profile: {
        ...user,
        stats: {
          totalDesserts,
          totalCreditsUsed,
          memberSince: user.created_at
        },
        recentActivity
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar perfil'
    });
  }
}

/**
 * Obtém créditos do usuário
 */
async function getCredits(req, res) {
  try {
    const user = await User.checkAndRenewCredits(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Calcular dias até próxima renovação (para premium)
    let daysUntilRenewal = null;
    if (user.plan === 'premium') {
      const renewedAt = new Date(user.credits_renewed_at);
      const nextRenewal = new Date(renewedAt);
      nextRenewal.setDate(nextRenewal.getDate() + 30);
      const now = new Date();
      daysUntilRenewal = Math.max(0, Math.ceil((nextRenewal - now) / (1000 * 60 * 60 * 24)));
    }

    res.json({
      success: true,
      credits: user.credits,
      plan: user.plan,
      daysUntilRenewal,
      creditsRenewedAt: user.credits_renewed_at
    });
  } catch (error) {
    console.error('Erro ao buscar créditos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar créditos'
    });
  }
}

/**
 * Faz upgrade para Premium
 * Em produção, isso seria chamado após confirmação de pagamento
 */
async function upgradeToPremium(req, res) {
  try {
    const { paymentToken } = req.body;

    // Em produção, verificar pagamento com gateway (Stripe, etc.)
    // Por enquanto, apenas simula o upgrade

    const user = await User.upgradeToPremium(req.userId);

    // Registrar log
    await UsageLog.create({
      userId: req.userId,
      action: 'upgrade_premium',
      details: { paymentToken },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Upgrade para Premium realizado com sucesso!',
      user
    });
  } catch (error) {
    console.error('Erro no upgrade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer upgrade'
    });
  }
}

/**
 * Cria sessão de pagamento (Stripe Checkout)
 */
async function createCheckoutSession(req, res) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const session = await PaymentService.createCheckoutSession({
      userId: user.id,
      email: user.email
    });

    await UsageLog.create({
      userId: user.id,
      action: 'payment_checkout_created',
      details: { sessionId: session.id },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Erro ao criar checkout:', error);

    const status = error.code === 'STRIPE_NOT_CONFIGURED' ? 400 : 500;
    res.status(status).json({
      success: false,
      error: error.message || 'Erro ao iniciar pagamento'
    });
  }
}

/**
 * Atualiza perfil do usuário
 */
async function updateProfile(req, res) {
  try {
    const { name } = req.body;
    const userId = req.userId;

    // Atualizar nome se fornecido
    if (name) {
      const supabase = require('../config/supabase');
      const { error } = await supabase
        .from('users')
        .update({ name, updated_at: new Date() })
        .eq('id', userId);

      if (error) throw error;
    }

    const user = await User.findById(userId);

    // Registrar log
    await UsageLog.create({
      userId,
      action: 'update_profile',
      details: { name },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar perfil'
    });
  }
}

/**
 * Obtém histórico de uso
 */
async function getUsageHistory(req, res) {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const logs = await UsageLog.findByUserId(
      req.userId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      history: logs,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar histórico de uso'
    });
  }
}

module.exports = {
  getProfile,
  getCredits,
  upgradeToPremium,
  createCheckoutSession,
  updateProfile,
  getUsageHistory
};
