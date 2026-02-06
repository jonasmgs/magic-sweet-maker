/**
 * Auth controller
 *
 * Authentication is handled by Supabase. Backend only exposes /me and /logout.
 */

const UsageLog = require('../models/UsageLog');
const User = require('../models/User');

function deprecatedAuth(res) {
  return res.status(410).json({
    success: false,
    error: 'Autenticacao deve ser feita via Supabase.'
  });
}

async function register(req, res) {
  return deprecatedAuth(res);
}

async function login(req, res) {
  return deprecatedAuth(res);
}

async function googleAuth(req, res) {
  return deprecatedAuth(res);
}

async function appleAuth(req, res) {
  return deprecatedAuth(res);
}

async function refreshToken(req, res) {
  return deprecatedAuth(res);
}

async function me(req, res) {
  try {
    const user = await User.checkAndRenewCredits(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario nao encontrado'
      });
    }

    return res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erro ao buscar usuario:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar dados do usuario'
    });
  }
}

async function logout(req, res) {
  try {
    await UsageLog.create({
      userId: req.userId,
      action: 'logout',
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    return res.status(500).json({
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
