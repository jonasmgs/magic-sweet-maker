/**
 * Rotas de Autenticação
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/register - Cadastro
router.post('/register',
  registerLimiter, // Proteção contra criação em massa de contas
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
    body('deviceId').optional().isString()
  ],
  validate,
  authController.register
);

// POST /api/auth/login - Login
router.post('/login',
  authLimiter, // Proteção contra brute force
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
    body('deviceId').optional().isString()
  ],
  validate,
  authController.login
);

// POST /api/auth/refresh - Renovar token
router.post('/refresh',
  authLimiter, // Proteção contra abuso de refresh
  [
    body('refreshToken').notEmpty().withMessage('Refresh token é obrigatório')
  ],
  validate,
  authController.refreshToken
);

// GET /api/auth/me - Dados do usuário atual
router.get('/me', authenticate, authController.me);

// POST /api/auth/logout - Logout
router.post('/logout', authenticate, authController.logout);

module.exports = router;
