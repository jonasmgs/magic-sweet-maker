/**
 * Rotas de Usuário
 */

const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// GET /api/users/profile - Perfil completo
router.get('/profile', authenticate, userController.getProfile);

// GET /api/users/credits - Créditos do usuário
router.get('/credits', authenticate, userController.getCredits);

// POST /api/users/upgrade - Upgrade para Premium
router.post('/upgrade',
  authenticate,
  [
    body('paymentToken').optional().isString()
  ],
  validate,
  userController.upgradeToPremium
);

// PUT /api/users/profile - Atualizar perfil
router.put('/profile',
  authenticate,
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
  ],
  validate,
  userController.updateProfile
);

// GET /api/users/usage - Histórico de uso
router.get('/usage',
  authenticate,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validate,
  userController.getUsageHistory
);

module.exports = router;
