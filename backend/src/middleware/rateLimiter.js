/**
 * Middleware de Rate Limiting
 *
 * Protege contra abusos e limita requisições.
 */

const rateLimit = require('express-rate-limit');

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 1 minuto
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10;

/**
 * Rate limiter global
 */
const globalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS * 10, // 100 requisições por minuto
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente mais tarde.',
    errorType: 'rate-limit'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usar userId se autenticado, senão IP
    return req.userId || req.ip;
  }
});

/**
 * Rate limiter para geração de sobremesas
 * Mais restritivo para evitar uso excessivo da API de IA
 */
const generateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 5, // 5 gerações por minuto
  message: {
    success: false,
    error: 'Muita magia de uma vez! Aguarde um momento.',
    errorType: 'rate-limit'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.userId || req.ip;
  },
  skip: (req) => {
    // Não aplicar para admins
    return req.userEmail === 'admin@email.com';
  }
});

/**
 * Rate limiter para autenticação
 * Protege contra brute force
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 tentativas
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    errorType: 'rate-limit'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter para registro
 * Evita criação em massa de contas
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 registros por hora por IP
  message: {
    success: false,
    error: 'Muitos cadastros. Tente novamente mais tarde.',
    errorType: 'rate-limit'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  globalLimiter,
  generateLimiter,
  authLimiter,
  registerLimiter
};
