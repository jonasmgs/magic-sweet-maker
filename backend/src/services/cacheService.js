/**
 * Serviço de Cache
 *
 * Implementa cache em memória (LRU) e persistente (SQLite).
 */

const { LRUCache } = require('lru-cache');
const { runQuery, getOne } = require('../config/database');

const CACHE_MAX_SIZE = parseInt(process.env.CACHE_MAX_SIZE) || 500;
const CACHE_TTL_SECONDS = parseInt(process.env.CACHE_TTL_SECONDS) || 86400; // 24 horas

// Cache em memória (LRU)
const memoryCache = new LRUCache({
  max: CACHE_MAX_SIZE,
  ttl: CACHE_TTL_SECONDS * 1000
});

/**
 * Obtém item do cache
 */
async function get(key) {
  // Primeiro, verificar cache em memória
  const memoryCached = memoryCache.get(key);
  if (memoryCached) {
    console.log(`📦 Cache hit (memory): ${key.substring(0, 8)}...`);
    return memoryCached;
  }

  // Verificar cache persistente
  try {
    const cached = await getOne(
      'SELECT * FROM cache WHERE cache_key = ? AND expires_at > datetime("now")',
      [key]
    );

    if (cached) {
      const data = JSON.parse(cached.data);

      // Atualizar hits
      await runQuery(
        'UPDATE cache SET hits = hits + 1 WHERE id = ?',
        [cached.id]
      );

      // Salvar no cache em memória
      memoryCache.set(key, data);

      console.log(`📦 Cache hit (db): ${key.substring(0, 8)}...`);
      return data;
    }
  } catch (error) {
    console.error('Erro ao buscar cache:', error);
  }

  console.log(`📭 Cache miss: ${key.substring(0, 8)}...`);
  return null;
}

/**
 * Salva item no cache
 */
async function set(key, data, ttlSeconds = CACHE_TTL_SECONDS) {
  try {
    // Salvar no cache em memória
    memoryCache.set(key, data, { ttl: ttlSeconds * 1000 });

    // Salvar no cache persistente
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + ttlSeconds);

    await runQuery(`
      INSERT OR REPLACE INTO cache (cache_key, data, expires_at)
      VALUES (?, ?, ?)
    `, [key, JSON.stringify(data), expiresAt.toISOString()]);

    console.log(`💾 Cache set: ${key.substring(0, 8)}...`);
    return true;
  } catch (error) {
    console.error('Erro ao salvar cache:', error);
    return false;
  }
}

/**
 * Remove item do cache
 */
async function remove(key) {
  try {
    memoryCache.delete(key);
    await runQuery('DELETE FROM cache WHERE cache_key = ?', [key]);
    return true;
  } catch (error) {
    console.error('Erro ao remover cache:', error);
    return false;
  }
}

/**
 * Limpa cache expirado
 */
async function cleanup() {
  try {
    const result = await runQuery(
      'DELETE FROM cache WHERE expires_at < datetime("now")'
    );
    console.log(`🧹 Cache cleanup: ${result.changes} itens removidos`);
    return result.changes;
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    return 0;
  }
}

/**
 * Obtém estatísticas do cache
 */
async function getStats() {
  try {
    const total = await getOne('SELECT COUNT(*) as count FROM cache');
    const active = await getOne(
      'SELECT COUNT(*) as count FROM cache WHERE expires_at > datetime("now")'
    );
    const totalHits = await getOne('SELECT SUM(hits) as total FROM cache');

    return {
      memorySize: memoryCache.size,
      memoryMaxSize: CACHE_MAX_SIZE,
      dbTotal: total.count,
      dbActive: active.count,
      totalHits: totalHits.total || 0
    };
  } catch (error) {
    console.error('Erro ao obter stats do cache:', error);
    return {
      memorySize: memoryCache.size,
      memoryMaxSize: CACHE_MAX_SIZE,
      dbTotal: 0,
      dbActive: 0,
      totalHits: 0
    };
  }
}

/**
 * Limpa todo o cache
 */
async function clear() {
  try {
    memoryCache.clear();
    await runQuery('DELETE FROM cache');
    console.log('🗑️ Cache completamente limpo');
    return true;
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    return false;
  }
}

// Executar limpeza periódica (a cada hora)
setInterval(() => {
  cleanup().catch(console.error);
}, 60 * 60 * 1000);

module.exports = {
  get,
  set,
  remove,
  cleanup,
  getStats,
  clear
};
