/**
 * Controller de Autenticação
 *
 * Gerencia cadastro, login, refresh de tokens e dados do usuário.
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const UsageLog = require('../models/UsageLog');
const { runQuery, getOne } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

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
 * Cadastro de novo usuário
 */
async function register(req, res) {
  try {
    const { email, password, name, deviceId } = req.body;
    const ipAddress = req.ip;

    // Verificar se email já existe
    if (await User.emailExists(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email já cadastrado'
      });
    }

    // Verificar múltiplas contas por dispositivo
    if (deviceId) {
      const existingDevice = await User.findByDeviceId(deviceId);
      if (existingDevice) {
        return res.status(400).json({
          success: false,
          error: 'Já existe uma conta neste dispositivo'
        });
      }
    }

    // Criar usuário
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      deviceId
    });

    // Gerar tokens
    const tokens = generateTokens(user);

    // Salvar refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await runQuery(`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `, [user.id, tokens.refreshToken, expiresAt.toISOString()]);

    // Registrar log
    await UsageLog.create({
      userId: user.id,
      action: 'register',
      details: { deviceId },
      ipAddress
    });

    res.status(201).json({
      success: true,
      user: User.sanitize(user),
      ...tokens
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar conta'
    });
  }
}

/**
 * Login de usuário
 */
async function login(req, res) {
  try {
    const { email, password, deviceId } = req.body;
    const ipAddress = req.ip;

    // Buscar usuário
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos'
      });
    }

    // Verificar senha
    const validPassword = await User.verifyPassword(user, password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos'
      });
    }

    // Atualizar device ID se fornecido
    if (deviceId && user.device_id !== deviceId) {
      await User.updateDeviceId(user.id, deviceId);
    }

    // Verificar e renovar créditos se necessário
    const updatedUser = await User.checkAndRenewCredits(user.id);

    // Gerar tokens
    const tokens = generateTokens(updatedUser);

    // Salvar refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await runQuery(`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `, [user.id, tokens.refreshToken, expiresAt.toISOString()]);

    // Registrar log
    await UsageLog.create({
      userId: user.id,
      action: 'login',
      details: { deviceId },
      ipAddress
    });

    res.json({
      success: true,
      user: updatedUser,
      ...tokens
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer login'
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
        error: 'Refresh token não fornecido'
      });
    }

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado'
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
        error: 'Token não encontrado'
      });
    }

    // Verificar se token não expirou
    if (new Date(storedToken.expires_at) < new Date()) {
      await runQuery('DELETE FROM refresh_tokens WHERE id = ?', [storedToken.id]);
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }

    // Buscar usuário atualizado
    const user = await User.checkAndRenewCredits(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
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
 * Obter dados do usuário atual
 */
async function me(req, res) {
  try {
    const user = await User.checkAndRenewCredits(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar dados do usuário'
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
  refreshToken,
  me,
  logout
};
