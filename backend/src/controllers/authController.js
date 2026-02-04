/**
 * Controller de AutenticaÃ§Ã£o
 *
 * Gerencia cadastro, login, refresh de tokens e dados do usuÃ¡rio.
 * Email/senha desativado. Apenas Google e Apple.
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const appleSigninAuth = require('apple-signin-auth');
const User = require('../models/User');
const UsageLog = require('../models/UsageLog');
const { runQuery, getOne } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || '';

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

/**
 * Gera tokens JWT
 */
function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, plan: user.plan },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
}

/**
 * Cadastro via email/senha desativado
 */
async function register(req, res) {
  return res.status(403).json({
    success: false,
    error: 'Cadastro desativado. Use Google ou Apple.'
  });
}

/**
 * Login via email/senha desativado
 */
async function login(req, res) {
  return res.status(403).json({
    success: false,
    error: 'Login por email/senha desativado. Use Google ou Apple.'
  });
}

/**
 * Login/Cadastro via Google
 */
async function googleAuth(req, res) {
  try {
    const { idToken, deviceId } = req.body;
    const ipAddress = req.ip;

    if (!idToken || !googleClient) {
      return res.status(400).json({
        success: false,
        error: 'Google auth indisponÃ­vel'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({
        success: false,
        error: 'Token Google invÃ¡lido'
      });
    }

    const email = payload.email.toLowerCase();
    const name = payload.name || null;

    let user = await User.findByEmail(email);
    if (!user) {
      user = await User.create({
        email,
        password: uuidv4(),
        name,
        deviceId
      });
    } else if (deviceId && user.device_id !== deviceId) {
      await User.updateDeviceId(user.id, deviceId);
    }

    const updatedUser = await User.checkAndRenewCredits(user.id);
    const tokens = generateTokens(updatedUser);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await runQuery(`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `, [updatedUser.id, tokens.refreshToken, expiresAt.toISOString()]);

    await UsageLog.create({
      userId: updatedUser.id,
      action: 'login_google',
      details: { deviceId },
      ipAddress
    });

    return res.json({
      success: true,
      user: updatedUser,
      ...tokens
    });
  } catch (error) {
    console.error('Erro no Google login:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao autenticar com Google'
    });
  }
}

/**
 * Login/Cadastro via Apple
 */
async function appleAuth(req, res) {
  try {
    const { idToken, deviceId } = req.body;
    const ipAddress = req.ip;

    if (!idToken || !APPLE_CLIENT_ID) {
      return res.status(400).json({
        success: false,
        error: 'Apple auth indisponÃ­vel'
      });
    }

    const payload = await appleSigninAuth.verifyIdToken(idToken, {
      audience: APPLE_CLIENT_ID
    });

    if (!payload || !payload.email) {
      return res.status(401).json({
        success: false,
        error: 'Token Apple invÃ¡lido'
      });
    }

    const email = payload.email.toLowerCase();
    const name = payload.name || null;

    let user = await User.findByEmail(email);
    if (!user) {
      user = await User.create({
        email,
        password: uuidv4(),
        name,
        deviceId
      });
    } else if (deviceId && user.device_id !== deviceId) {
      await User.updateDeviceId(user.id, deviceId);
    }

    const updatedUser = await User.checkAndRenewCredits(user.id);
    const tokens = generateTokens(updatedUser);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await runQuery(`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `, [updatedUser.id, tokens.refreshToken, expiresAt.toISOString()]);

    await UsageLog.create({
      userId: updatedUser.id,
      action: 'login_apple',
      details: { deviceId },
      ipAddress
    });

    return res.json({
      success: true,
      user: updatedUser,
      ...tokens
    });
  } catch (error) {
    console.error('Erro no Apple login:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao autenticar com Apple'
    });
  }
}

/**
 * Refresh de token
 */
async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token nÃ£o fornecido'
      });
    }

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Token invÃ¡lido ou expirado'
      });
    }

    // Verificar se token existe no banco
    const storedToken = await getOne(
      'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ?',
      [refreshToken, decoded.userId]
    );

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        error: 'Token nÃ£o encontrado'
      });
    }

    // Verificar se token nÃ£o expirou
    if (new Date(storedToken.expires_at) < new Date()) {
      await runQuery('DELETE FROM refresh_tokens WHERE id = ?', [storedToken.id]);
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }

    // Buscar usuÃ¡rio atualizado
    const user = await User.checkAndRenewCredits(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'UsuÃ¡rio nÃ£o encontrado'
      });
    }

    // Gerar novos tokens
    const tokens = generateTokens(user);

    // Atualizar refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await runQuery(
      'UPDATE refresh_tokens SET token = ?, expires_at = ? WHERE id = ?',
      [tokens.refreshToken, expiresAt.toISOString(), storedToken.id]
    );

    res.json({
      success: true,
      user,
      ...tokens
    });
  } catch (error) {
    console.error('Erro no refresh:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao renovar token'
    });
  }
}

/**
 * Obter dados do usuÃ¡rio atual
 */
async function me(req, res) {
  try {
    const user = await User.checkAndRenewCredits(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'UsuÃ¡rio nÃ£o encontrado'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erro ao buscar usuÃ¡rio:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar dados do usuÃ¡rio'
    });
  }
}

/**
 * Logout - invalida o refresh token
 */
async function logout(req, res) {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await runQuery('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }

    // Registrar log
    await UsageLog.create({
      userId: req.userId,
      action: 'logout',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer logout'
    });
  }
}

module.exports = {
  register,
  login,
  googleAuth,
  appleAuth,
  refreshToken,
  me,
  logout
};
