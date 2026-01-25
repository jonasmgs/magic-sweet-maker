/**
 * Serviço de Créditos
 *
 * Gerencia sistema de créditos e renovações.
 */

const User = require('../models/User');
const UsageLog = require('../models/UsageLog');
const { getAll } = require('../config/database');

const FREE_CREDITS = parseInt(process.env.FREE_CREDITS) || 3;
const PREMIUM_CREDITS = parseInt(process.env.PREMIUM_CREDITS) || 100;
const CREDIT_RENEWAL_DAYS = parseInt(process.env.CREDIT_RENEWAL_DAYS) || 30;

/**
 * Verifica se usuário pode consumir crédito
 */
async function canConsume(userId) {
  const user = await User.findById(userId);
  return user && user.credits > 0;
}

/**
 * Consome um crédito
 */
async function consume(userId, reason = 'generation') {
  const hasCredits = await canConsume(userId);
  if (!hasCredits) {
    return {
      success: false,
      error: 'Créditos insuficientes'
    };
  }

  const user = await User.decrementCredit(userId);

  // Log da transação
  await UsageLog.create({
    userId,
    action: 'credit_consumed',
    creditsUsed: 1,
    details: { reason, remainingCredits: user.credits }
  });

  return {
    success: true,
    remainingCredits: user.credits
  };
}

/**
 * Adiciona créditos ao usuário
 */
async function addCredits(userId, amount, reason = 'manual') {
  const user = await User.findById(userId);
  if (!user) {
    return {
      success: false,
      error: 'Usuário não encontrado'
    };
  }

  const newCredits = user.credits + amount;
  await User.updateCredits(userId, newCredits);

  // Log da transação
  await UsageLog.create({
    userId,
    action: 'credits_added',
    details: { amount, reason, newTotal: newCredits }
  });

  return {
    success: true,
    credits: newCredits
  };
}

/**
 * Renova créditos de todos os usuários premium elegíveis
 */
async function renewAllEligible() {
  try {
    const eligibleUsers = await getAll(`
      SELECT id FROM users
      WHERE plan = 'premium'
      AND date(credits_renewed_at, '+' || ? || ' days') <= date('now')
    `, [CREDIT_RENEWAL_DAYS]);

    let renewed = 0;
    for (const user of eligibleUsers) {
      await User.renewCredits(user.id);
      renewed++;
    }

    console.log(`🔄 Créditos renovados para ${renewed} usuários premium`);
    return renewed;
  } catch (error) {
    console.error('Erro ao renovar créditos:', error);
    return 0;
  }
}

/**
 * Obtém resumo de créditos do usuário
 */
async function getSummary(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  const totalUsed = await UsageLog.getTotalCreditsUsed(userId);

  // Calcular dias até renovação (para premium)
  let daysUntilRenewal = null;
  if (user.plan === 'premium') {
    const renewedAt = new Date(user.credits_renewed_at);
    const nextRenewal = new Date(renewedAt);
    nextRenewal.setDate(nextRenewal.getDate() + CREDIT_RENEWAL_DAYS);
    const now = new Date();
    daysUntilRenewal = Math.max(0, Math.ceil((nextRenewal - now) / (1000 * 60 * 60 * 24)));
  }

  return {
    credits: user.credits,
    plan: user.plan,
    totalUsed,
    daysUntilRenewal,
    maxCredits: user.plan === 'premium' ? PREMIUM_CREDITS : FREE_CREDITS,
    creditsRenewedAt: user.credits_renewed_at
  };
}

/**
 * Verifica e alerta sobre créditos baixos
 */
async function checkLowCredits(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  const threshold = user.plan === 'premium' ? 10 : 1;
  const isLow = user.credits <= threshold;

  return {
    isLow,
    credits: user.credits,
    threshold
  };
}

// Executar renovação diária
setInterval(() => {
  renewAllEligible().catch(console.error);
}, 24 * 60 * 60 * 1000);

module.exports = {
  canConsume,
  consume,
  addCredits,
  renewAllEligible,
  getSummary,
  checkLowCredits,
  FREE_CREDITS,
  PREMIUM_CREDITS,
  CREDIT_RENEWAL_DAYS
};
