/**
 * Middleware de Validação
 *
 * Processa resultados do express-validator.
 */

const { validationResult } = require('express-validator');

/**
 * Middleware para validar requisições
 */
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      errors: formattedErrors
    });
  }

  next();
}

module.exports = { validate };
