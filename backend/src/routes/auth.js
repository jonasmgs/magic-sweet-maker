/**
 * Rotas de AutenticaÃ§Ã£o
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// POST /api/auth/register - Cadastro (desativado)
router.post('/register', authController.register);

// POST /api/auth/login - Login (desativado)
router.post('/login', authController.login);

// POST /api/auth/google - Login/Cadastro Google
router.post('/google',
  [
    body('idToken').notEmpty().withMessage('Token Google Ã© obrigatÃ³rio'),
    body('deviceId').optional().isString()
  ],
  validate,
  authController.googleAuth
);

// POST /api/auth/apple - Login/Cadastro Apple
router.post('/apple',
  [
    body('idToken').notEmpty().withMessage('Token Apple Ã© obrigatÃ³rio'),
    body('deviceId').optional().isString()
  ],
  validate,
  authController.appleAuth
);

// POST /api/auth/refresh - Renovar token
router.post('/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token Ã© obrigatÃ³rio')
  ],
  validate,
  authController.refreshToken
);

// GET /api/auth/me - Dados do usuÃ¡rio atual
router.get('/me', authenticate, authController.me);

// POST /api/auth/logout - Logout
router.post('/logout', authenticate, authController.logout);

module.exports = router;
