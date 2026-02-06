/**
 * Auth middleware
 *
 * Validates Supabase JWTs and ensures a local user exists.
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

const getEmailFromToken = (decoded) => {
  if (!decoded) return null;
  if (decoded.email) return decoded.email;
  if (decoded.user_metadata?.email) return decoded.user_metadata.email;
  if (decoded.user_metadata?.user_email) return decoded.user_metadata.user_email;
  return null;
};

const getNameFromToken = (decoded) => {
  if (!decoded) return null;
  return (
    decoded.user_metadata?.full_name ||
    decoded.user_metadata?.name ||
    decoded.user_metadata?.user_name ||
    decoded.user_metadata?.preferred_username ||
    null
  );
};

async function resolveUserFromToken(token, deviceId) {
  if (!SUPABASE_JWT_SECRET) {
    const err = new Error('SUPABASE_JWT_SECRET missing');
    err.code = 'SUPABASE_SECRET_MISSING';
    throw err;
  }

  const decoded = jwt.verify(token, SUPABASE_JWT_SECRET, { algorithms: ['HS256'] });

  const email = getEmailFromToken(decoded);
  if (!email) {
    const err = new Error('Token missing email');
    err.code = 'SUPABASE_EMAIL_MISSING';
    throw err;
  }

  const normalizedEmail = email.toLowerCase();
  let user = await User.findByEmail(normalizedEmail);

  if (!user) {
    user = await User.create({
      email: normalizedEmail,
      password: uuidv4(),
      name: getNameFromToken(decoded),
      deviceId
    });
  } else if (deviceId && user.device_id !== deviceId) {
    await User.updateDeviceId(user.id, deviceId);
  }

  const updatedUser = await User.checkAndRenewCredits(user.id);
  return { user: updatedUser || User.sanitize(user), decoded };
}

/**
 * Main auth middleware
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token nao fornecido'
      });
    }

    const token = authHeader.split(' ')[1];
    const deviceId = req.headers['x-device-id'];

    const { user, decoded } = await resolveUserFromToken(token, deviceId);

    req.userId = user.id;
    req.userEmail = user.email;
    req.userPlan = user.plan;
    req.supabaseUserId = decoded.sub;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.code === 'SUPABASE_SECRET_MISSING') {
      return res.status(500).json({
        success: false,
        error: 'Supabase JWT secret nao configurado'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Token invalido'
    });
  }
}

/**
 * Admin-only middleware
 */
async function requireAdmin(req, res, next) {
  try {
    const ADMIN_EMAILS = ['admin@email.com'];

    if (!ADMIN_EMAILS.includes(req.userEmail)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Requer privilegios de administrador.'
      });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar permissoes'
    });
  }
}

/**
 * Premium-only middleware
 */
async function requirePremium(req, res, next) {
  try {
    if (req.userPlan !== 'premium') {
      return res.status(403).json({
        success: false,
        error: 'Recurso disponivel apenas para usuarios Premium'
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
 * Optional auth middleware
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const deviceId = req.headers['x-device-id'];

    try {
      const { user, decoded } = await resolveUserFromToken(token, deviceId);

      req.userId = user.id;
      req.userEmail = user.email;
      req.userPlan = user.plan;
      req.supabaseUserId = decoded.sub;
    } catch {
      // Ignore token errors for optional auth
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
