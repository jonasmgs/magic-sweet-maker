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
const { validateEnv, getCorsOrigin } = require('./config/env');

// Validar variáveis de ambiente antes de iniciar
validateEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar banco de dados
getDatabase();

// Middlewares de segurança
app.use(helmet());

// CORS configurado de forma segura
const corsOrigins = getCorsOrigin();
app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
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
  const { closeDatabase } = require('./config/database');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Recebido SIGINT. Encerrando servidor...');
  const { closeDatabase } = require('./config/database');
  await closeDatabase();
  process.exit(0);
});

module.exports = app;
