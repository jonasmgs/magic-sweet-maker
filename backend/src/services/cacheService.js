/**
 * Serviço de Cache
 *
 * Implementa cache em memória (LRU) e persistente (Supabase).
 */

const { LRUCache } = require('lru-cache');
const supabase = require('../config/supabase');

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
    const { data: cached, error } = await supabase
      .from('cache')
      .select('*')
      .eq('cache_key', key)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar cache:', error);
    }

    if (cached) {
      let data;
      try {
        data = JSON.parse(cached.data);
      } catch (e) {
        data = cached.data;
      }

      // Atualizar hits (fire and forget)
      supabase
        .from('cache')
        .update({ hits: (cached.hits || 0) + 1 })
        .eq('id', cached.id)
        .then(); // no await

      // Salvar no cache em memória
      memoryCache.set(key, data);

      console.log(`📦 Cache hit (db): ${key.substring(0, 8)}...`);
      return data;
    }
  } catch (error) {
    console.error('Erro ao buscar cache (exception):', error);
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

    const { error } = await supabase
      .from('cache')
      .upsert({
        cache_key: key,
        data: JSON.stringify(data),
        expires_at: expiresAt.toISOString()
      }, { onConflict: 'cache_key' });

    if (error) {
      console.error('Erro ao salvar cache no Supabase:', error);
      return false;
    }

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

    const { error } = await supabase
      .from('cache')
      .delete()
      .eq('cache_key', key);

    if (error) throw error;

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
    const { count, error } = await supabase
      .from('cache')
      .delete({ count: 'exact' })
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;

    console.log(`🧹 Cache cleanup: ${count} itens removidos`);
    return count;
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
    const { count: total } = await supabase.from('cache').select('*', { count: 'exact', head: true });

    const { count: active } = await supabase
      .from('cache')
      .select('*', { count: 'exact', head: true })
      .gt('expires_at', new Date().toISOString());

    // Summing hits is expensive without aggregate support. Skipping for now.
    const totalHits = 0;

    return {
      memorySize: memoryCache.size,
      memoryMaxSize: CACHE_MAX_SIZE,
      dbTotal: total || 0,
      dbActive: active || 0,
      totalHits
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
    const { error } = await supabase.from('cache').delete().neq('id', 0); // Delete all requires a filter usually

    if (error) throw error;

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

