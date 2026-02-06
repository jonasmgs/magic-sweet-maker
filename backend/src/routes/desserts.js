/**
 * Rotas de Sobremesas
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();

const dessertController = require('../controllers/dessertController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { generateLimiter } = require('../middleware/rateLimiter');

// POST /api/desserts/generate - Gerar sobremesa
router.post('/generate',
  authenticate,
  generateLimiter,
  [
    body('ingredients')
      .notEmpty().withMessage('Ingredientes são obrigatórios')
      .isLength({ min: 3, max: 500 }).withMessage('Ingredientes devem ter entre 3 e 500 caracteres'),
    body('theme')
      .optional()
      .isIn(['feminine', 'masculine']).withMessage('Tema inválido'),
    body('language')
      .optional()
      .isIn(['pt', 'en', 'es', 'fr', 'de', 'ja']).withMessage('Idioma inválido')
  ],
  validate,
  dessertController.generate
);

// GET /api/desserts/history - Histórico do usuário
router.get('/history',
  authenticate,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validate,
  dessertController.history
);

// GET /api/desserts/popular - Sobremesas populares
router.get('/popular',
  [
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validate,
  dessertController.popular
);

// GET /api/desserts/:id - Obter sobremesa específica
router.get('/:id',
  authenticate,
  [
    param('id').isInt().withMessage('ID inválido')
  ],
  validate,
  dessertController.getById
);

// DELETE /api/desserts/:id - Remover sobremesa
router.delete('/:id',
  authenticate,
  [
    param('id').isInt().withMessage('ID inválido')
  ],
  validate,
  dessertController.remove
);

module.exports = router;
