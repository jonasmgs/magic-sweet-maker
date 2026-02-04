/**
 * Magic Sweet Maker - API Server
 *
 * Servidor principal da aplicação.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const routes = require('./routes');
const { globalLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { getDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Inicializar banco de dados
getDatabase();

// Middlewares de segurança
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compressão
app.use(compression());

// Rate limiting global
app.use(globalLimiter);

// Trust proxy (para rate limiting correto atrás de proxies)
app.set('trust proxy', 1);

// Supabase keep-alive while server is running (useful during development)
const keepAliveMs = Number(process.env.SUPABASE_KEEP_ALIVE_MS || 12 * 60 * 1000);
const startSupabaseKeepAlive = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  if (!Number.isFinite(keepAliveMs) || keepAliveMs <= 0) {
    return null;
  }

  const healthUrl = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/health`;

  const ping = async () => {
    try {
      await fetch(healthUrl, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
    } catch {
      // Ignore errors to avoid breaking development flow
    }
  };

  ping();
  return setInterval(ping, keepAliveMs);
};

const keepAliveTimer = startSupabaseKeepAlive();

// Logging simples
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Rotas da API
app.use('/api', routes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    name: 'Magic Sweet Maker API',
    version: '1.0.0',
    description: 'API para geração de sobremesas mágicas infantis com IA',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      desserts: '/api/desserts',
      users: '/api/users',
      admin: '/api/admin'
    }
  });
});

// Handlers de erro
app.use(notFoundHandler);
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
🍭 ═══════════════════════════════════════════════════════════ 🍭

   ✨ Magic Sweet Maker API ✨

   🚀 Servidor rodando em: http://localhost:${PORT}
   📚 Documentação: http://localhost:${PORT}
   🏥 Health check: http://localhost:${PORT}/api/health

   Ambiente: ${process.env.NODE_ENV || 'development'}

🍭 ═══════════════════════════════════════════════════════════ 🍭
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Recebido SIGTERM. Encerrando servidor...');
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
  }
  const { closeDatabase } = require('./config/database');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Recebido SIGINT. Encerrando servidor...');
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
  }
  const { closeDatabase } = require('./config/database');
  await closeDatabase();
  process.exit(0);
});

module.exports = app;
