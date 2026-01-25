/**
 * Script de Migração do Banco de Dados
 *
 * Executa: npm run migrate
 */

require('dotenv').config();
const { getDatabase, closeDatabase } = require('./database');

const migrations = [
  // Tabela de usuários
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    device_id TEXT,
    plan TEXT DEFAULT 'free' CHECK(plan IN ('free', 'premium')),
    credits INTEGER DEFAULT 3,
    credits_renewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Tabela de tokens de refresh
  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  // Tabela de sobremesas geradas
  `CREATE TABLE IF NOT EXISTS desserts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ingredients TEXT NOT NULL,
    name TEXT NOT NULL,
    recipe TEXT NOT NULL,
    image_url TEXT,
    theme TEXT DEFAULT 'feminine',
    language TEXT DEFAULT 'pt',
    cache_key TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  // Tabela de logs de uso
  `CREATE TABLE IF NOT EXISTS usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    credits_used INTEGER DEFAULT 0,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  // Tabela de cache de resultados
  `CREATE TABLE IF NOT EXISTS cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT UNIQUE NOT NULL,
    data TEXT NOT NULL,
    hits INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
  )`,

  // Índices para otimização
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
  `CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id)`,
  `CREATE INDEX IF NOT EXISTS idx_desserts_user_id ON desserts(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_desserts_cache_key ON desserts(cache_key)`,
  `CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_cache_key ON cache(cache_key)`,
  `CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at)`,
];

async function runMigrations() {
  console.log('🚀 Iniciando migrações...\n');

  const db = getDatabase();

  for (let i = 0; i < migrations.length; i++) {
    const sql = migrations[i];
    const tableName = sql.match(/(?:TABLE|INDEX)\s+(?:IF NOT EXISTS\s+)?(\w+)/i)?.[1] || `migration_${i}`;

    try {
      await new Promise((resolve, reject) => {
        db.run(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log(`✅ ${tableName}`);
    } catch (error) {
      console.error(`❌ Erro em ${tableName}:`, error.message);
      throw error;
    }
  }

  console.log('\n🎉 Migrações concluídas com sucesso!');

  await closeDatabase();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('❌ Erro nas migrações:', err);
  process.exit(1);
});
