/**
 * Middleware de Autenticação
 *
 * Verifica tokens JWT e protege rotas.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/env');

// JWT_SECRET obtido de forma segura - sem fallback inseguro
const JWT_SECRET = getJwtSecret();

// Admin emails carregados de variável de ambiente (lista separada por vírgula)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(e => e.length > 0);

/**
 * Middleware de autenticação principal
 */
async function authenticate(req, res, next) {
  try {
    // Obter token do header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Verificar se usuário existe
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Adicionar dados do usuário ao request
    req.userId = user.id;
    req.userEmail = user.email;
    req.userPlan = user.plan;

    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro na autenticação'
    });
  }
}

/**
 * Middleware que requer usuário admin
 * Admins são definidos pela variável de ambiente ADMIN_EMAILS
 */
async function requireAdmin(req, res, next) {
  try {
    // Verificar se lista de admins está configurada
    if (ADMIN_EMAILS.length === 0) {
      console.warn('⚠️  ADMIN_EMAILS não configurado. Nenhum usuário terá acesso admin.');
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Sistema de admin não configurado.'
      });
    }

    // Verificar se usuário é admin
    const userEmail = (req.userEmail || '').toLowerCase();
    if (!ADMIN_EMAILS.includes(userEmail)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Requer privilégios de administrador.'
      });
    }

    // Marcar request como admin
    req.isAdmin = true;
    next();
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar permissões'
    });
  }
}

/**
 * Verifica se um email é admin (para uso interno)
 */
function isAdminEmail(email) {
  return ADMIN_EMAILS.includes((email || '').toLowerCase());
}

/**
 * Middleware que requer plano premium
 */
async function requirePremium(req, res, next) {
  try {
    if (req.userPlan !== 'premium') {
      return res.status(403).json({
        success: false,
        error: 'Recurso disponível apenas para usuários Premium'
      });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar premium:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar plano'
    });
  }
}

/**
 * Middleware opcional de autenticação
 * Não bloqueia se não houver token, mas adiciona dados se houver
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (user) {
        req.userId = user.id;
        req.userEmail = user.email;
        req.userPlan = user.plan;
      }
    } catch (err) {
      // Ignora erros de token - continua sem autenticação
    }

    next();
  } catch (error) {
    next();
  }
}

module.exports = {
  authenticate,
  requireAdmin,
  requirePremium,
  optionalAuth,
  isAdminEmail
};
