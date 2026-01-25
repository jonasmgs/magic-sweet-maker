/**
 * Script de Seed - Dados Iniciais
 *
 * Executa: npm run seed
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getDatabase, runQuery, closeDatabase } = require('./database');

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Garante que o banco está conectado
  getDatabase();

  // Criar usuário de teste gratuito
  const hashedPassword = await bcrypt.hash('teste123', 10);

  try {
    await runQuery(`
      INSERT OR IGNORE INTO users (email, password, name, plan, credits)
      VALUES (?, ?, ?, ?, ?)
    `, ['teste@email.com', hashedPassword, 'Usuário Teste', 'free', 3]);
    console.log('✅ Usuário teste gratuito criado (teste@email.com / teste123)');
  } catch (err) {
    console.log('ℹ️  Usuário teste já existe');
  }

  // Criar usuário de teste premium
  try {
    await runQuery(`
      INSERT OR IGNORE INTO users (email, password, name, plan, credits)
      VALUES (?, ?, ?, ?, ?)
    `, ['premium@email.com', hashedPassword, 'Usuário Premium', 'premium', 100]);
    console.log('✅ Usuário teste premium criado (premium@email.com / teste123)');
  } catch (err) {
    console.log('ℹ️  Usuário premium já existe');
  }

  // Criar usuário admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  try {
    await runQuery(`
      INSERT OR IGNORE INTO users (email, password, name, plan, credits)
      VALUES (?, ?, ?, ?, ?)
    `, ['admin@email.com', adminPassword, 'Administrador', 'premium', 9999]);
    console.log('✅ Usuário admin criado (admin@email.com / admin123)');
  } catch (err) {
    console.log('ℹ️  Usuário admin já existe');
  }

  console.log('\n🎉 Seed concluído com sucesso!');

  await closeDatabase();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
