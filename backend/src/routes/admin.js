/**
 * Rotas de Administração
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Todas as rotas requerem autenticação e admin
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/stats - Estatísticas gerais
router.get('/stats', adminController.getStats);

// GET /api/admin/users - Listar usuários
router.get('/users',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validate,
  adminController.getUsers
);

// GET /api/admin/users/:id - Detalhes de usuário
router.get('/users/:id',
  [
    param('id').isInt().withMessage('ID inválido')
  ],
  validate,
  adminController.getUserById
);

// PUT /api/admin/users/:id/credits - Atualizar créditos
router.put('/users/:id/credits',
  [
    param('id').isInt().withMessage('ID inválido'),
    body('credits').isInt({ min: 0 }).withMessage('Créditos inválidos')
  ],
  validate,
  adminController.updateUserCredits
);

// GET /api/admin/desserts/popular - Sobremesas populares
router.get('/desserts/popular',
  [
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  adminController.getPopularDesserts
);

// POST /api/admin/cleanup - Limpar logs antigos
router.post('/cleanup',
  [
    body('days').optional().isInt({ min: 1 }).withMessage('Dias inválidos')
  ],
  validate,
  adminController.cleanOldLogs
);

module.exports = router;
