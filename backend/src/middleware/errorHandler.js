/**
 * Middleware de Tratamento de Erros
 *
 * Captura e formata erros da aplicação.
 */

/**
 * Handler de erros 404 (rota não encontrada)
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.path
  });
}

/**
 * Handler global de erros
 */
function errorHandler(err, req, res, next) {
  console.error('❌ Erro:', err);

  // Erro de sintaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'JSON inválido no corpo da requisição'
    });
  }

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: err.message
    });
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expirado',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Erro de banco de dados
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({
      success: false,
      error: 'Conflito de dados'
    });
  }

  // Erro da API OpenAI
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'Limite de requisições excedido. Tente novamente mais tarde.',
      errorType: 'rate-limit'
    });
  }

  // Erro genérico em produção
  const isProd = process.env.NODE_ENV === 'production';

  res.status(err.status || 500).json({
    success: false,
    error: isProd ? 'Erro interno do servidor' : err.message,
    ...(isProd ? {} : { stack: err.stack })
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
