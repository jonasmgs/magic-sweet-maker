/**
 * Middleware de Autenticação
 *
 * Verifica tokens JWT e protege rotas.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

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
 * (Por enquanto, considera admin o usuário com email admin@email.com)
 */
async function requireAdmin(req, res, next) {
  try {
    const ADMIN_EMAILS = ['admin@email.com'];

    if (!ADMIN_EMAILS.includes(req.userEmail)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Requer privilégios de administrador.'
      });
    }

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
  optionalAuth
};
