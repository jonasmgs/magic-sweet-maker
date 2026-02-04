/**
 * Configuração do Banco de Dados SQLite
 *
 * Este módulo gerencia a conexão e inicialização do banco de dados.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH =
  process.env.DATABASE_PATH ||
  (process.env.NODE_ENV === 'production'
    ? path.join('/tmp', 'database.sqlite')
    : path.join(__dirname, '../../database.sqlite'));

let db = null;

/**
 * Obtém a conexão do banco de dados
 */
function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        throw err;
      }
      console.log('✅ Conectado ao banco de dados SQLite');
    });

    // Habilitar foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

/**
 * Executa uma query com promessa
 */
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Obtém uma única linha
 */
function getOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * Obtém múltiplas linhas
 */
function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

/**
 * Fecha a conexão do banco de dados
 */
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) reject(err);
        else {
          db = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  getDatabase,
  runQuery,
  getOne,
  getAll,
  closeDatabase
};
