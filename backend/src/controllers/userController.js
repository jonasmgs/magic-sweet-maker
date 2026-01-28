/**
 * Controller de Usuário
 *
 * Gerencia perfil, créditos e upgrade de plano.
 */

const User = require('../models/User');
const UsageLog = require('../models/UsageLog');
const Dessert = require('../models/Dessert');

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
 *
 * IMPORTANTE: Este endpoint está DESABILITADO para uso direto.
 * O upgrade deve ser feito via RevenueCat webhook ou através
 * de verificação de pagamento com gateway (Stripe, etc.)
 *
 * Para ativar, configure ENABLE_DIRECT_UPGRADE=true no .env
 * (NÃO RECOMENDADO em produção sem validação de pagamento)
 */
async function upgradeToPremium(req, res) {
  try {
    const { paymentToken, revenuecatUserId } = req.body;
    const isProd = process.env.NODE_ENV === 'production';
    const allowDirectUpgrade = process.env.ENABLE_DIRECT_UPGRADE === 'true';

    // Em produção, NÃO permitir upgrade direto sem verificação
    if (isProd && !allowDirectUpgrade) {
      return res.status(403).json({
        success: false,
        error: 'Upgrade direto não permitido. Use o sistema de assinatura do app.',
        code: 'DIRECT_UPGRADE_DISABLED'
      });
    }

    // Se não está em produção, exigir pelo menos um token
    if (!paymentToken && !revenuecatUserId) {
      return res.status(400).json({
        success: false,
        error: 'Token de pagamento ou ID RevenueCat é obrigatório',
        code: 'PAYMENT_TOKEN_REQUIRED'
      });
    }

    // Log de aviso em desenvolvimento
    if (!isProd) {
      console.warn(`⚠️  AVISO: Upgrade direto usado em desenvolvimento para userId: ${req.userId}`);
    }

    // TODO: Implementar verificação real com RevenueCat ou Stripe
    // const isValid = await verifyPayment(paymentToken);
    // if (!isValid) { return res.status(402)... }

    const user = await User.upgradeToPremium(req.userId);

    // Registrar log
    await UsageLog.create({
      userId: req.userId,
      action: 'upgrade_premium',
      details: {
        paymentToken: paymentToken ? '[REDACTED]' : null,
        revenuecatUserId,
        method: 'direct_api'
      },
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
 * Atualiza perfil do usuário
 */
async function updateProfile(req, res) {
  try {
    const { name } = req.body;
    const userId = req.userId;

    // Atualizar nome se fornecido
    if (name) {
      const { runQuery } = require('../config/database');
      await runQuery(
        'UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, userId]
      );
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
  updateProfile,
  getUsageHistory
};
