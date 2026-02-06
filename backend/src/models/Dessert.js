/**
 * Model de Sobremesa
 *
 * Gerencia sobremesas geradas e histórico no Supabase.
 */

const supabase = require('../config/supabase');
const crypto = require('crypto');

class Dessert {
  /**
   * Cria uma nova sobremesa
   */
  static async create({ userId, ingredients, name, recipe, imageUrl, theme, language, cacheKey }) {
    const { data, error } = await supabase
      .from('desserts')
      .insert([
        {
          user_id: userId,
          ingredients,
          name,
          recipe: JSON.stringify(recipe),
          image_url: imageUrl,
          theme,
          language,
          cache_key: cacheKey
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar sobremesa:', error);
      throw error;
    }

    if (data) {
      // Parse JSON recipe immediately if successful
      data.recipe = typeof data.recipe === 'string' ? JSON.parse(data.recipe) : data.recipe;
    }

    return data;
  }

  /**
   * Encontra sobremesa por ID
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('desserts')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar sobremesa:', error);
      return null;
    }

    if (data && data.recipe) {
      try {
        data.recipe = typeof data.recipe === 'string' ? JSON.parse(data.recipe) : data.recipe;
      } catch (e) {
        // ignore parse error or already object
      }
    }
    return data;
  }

  /**
   * Encontra sobremesa por cache key
   */
  static async findByCacheKey(cacheKey) {
    const { data, error } = await supabase
      .from('desserts')
      .select('*')
      .eq('cache_key', cacheKey)
      .single();

    if (error) return null;

    if (data && data.recipe) {
      try {
        data.recipe = typeof data.recipe === 'string' ? JSON.parse(data.recipe) : data.recipe;
      } catch (e) { }
    }
    return data;
  }

  /**
   * Gera cache key baseado nos ingredientes
   */
  static generateCacheKey(ingredients, theme, language) {
    const normalized = ingredients
      .toLowerCase()
      .split(',')
      .map(i => i.trim())
      .sort()
      .join(',');

    return crypto
      .createHash('sha256')
      .update(`${normalized}-${theme}-${language}`)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Busca histórico de sobremesas do usuário
   */
  static async findByUserId(userId, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('desserts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return [];

    return data.map(d => {
      try {
        return {
          ...d,
          recipe: typeof d.recipe === 'string' ? JSON.parse(d.recipe) : d.recipe
        };
      } catch (e) {
        return d;
      }
    });
  }

  /**
   * Conta sobremesas do usuário
   */
  static async countByUserId(userId) {
    const { count } = await supabase
      .from('desserts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    return count || 0;
  }

  /**
   * Busca sobremesas populares (mais geradas)
   */
  static async getPopular(limit = 10) {
    // Note: This query is complex for standard Supabase API (GROUP BY).
    // Standard solution: Use a stored procedure (RPC) or raw SQL via rpc if allowed.
    // Fallback if no RPC: Fetch many and aggregate in JS (inefficient for large DBs but safe here).

    // Better fallback: Just order by created_at desc for "Recent" if "Popular" isn't supported without RPC.
    // Or if Supabase supports .select('name') with duplicates...

    // Let's assume we can't do GROUP BY easily with query builder without Views/RPC.
    // We will approximate 'Popular' by 'Latest' for now to avoid creating RPCs blindly,
    // OR we fetch the last 100 desserts and aggregate locally.

    try {
      const { data } = await supabase
        .from('desserts')
        .select('name')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!data) return [];

      const counts = {};
      data.forEach(d => {
        counts[d.name] = (counts[d.name] || 0) + 1;
      });

      return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([name, count]) => ({ name, count }));

    } catch (e) {
      console.error('Error getting popular desserts:', e);
      return [];
    }
  }

  /**
   * Estatísticas de sobremesas
   */
  static async getStats() {
    const { count: total } = await supabase
      .from('desserts')
      .select('*', { count: 'exact', head: true });

    const oneDayAgo = new Date(); oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const { count: today } = await supabase
      .from('desserts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo.toISOString());

    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: thisWeek } = await supabase
      .from('desserts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: thisMonth } = await supabase
      .from('desserts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    return {
      total: total || 0,
      today: today || 0,
      thisWeek: thisWeek || 0,
      thisMonth: thisMonth || 0
    };
  }

  /**
   * Deleta sobremesa
   */
  static async delete(id, userId) {
    const { data, error } = await supabase
      .from('desserts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) return false;
    return data && data.length > 0;
  }
}

module.exports = Dessert;

