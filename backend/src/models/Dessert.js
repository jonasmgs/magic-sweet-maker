/**
 * Model de Sobremesa
 *
 * Gerencia sobremesas geradas e histórico.
 */

const { runQuery, getOne, getAll } = require('../config/database');
const crypto = require('crypto');

class Dessert {
  /**
   * Cria uma nova sobremesa
   */
  static async create({ userId, ingredients, name, recipe, imageUrl, theme, language, cacheKey }) {
    const result = await runQuery(`
      INSERT INTO desserts (user_id, ingredients, name, recipe, image_url, theme, language, cache_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, ingredients, name, JSON.stringify(recipe), imageUrl, theme, language, cacheKey]);

    return this.findById(result.lastID);
  }

  /**
   * Encontra sobremesa por ID
   */
  static async findById(id) {
    const dessert = await getOne('SELECT * FROM desserts WHERE id = ?', [id]);
    if (dessert) {
      dessert.recipe = JSON.parse(dessert.recipe);
    }
    return dessert;
  }

  /**
   * Encontra sobremesa por cache key
   */
  static async findByCacheKey(cacheKey) {
    const dessert = await getOne('SELECT * FROM desserts WHERE cache_key = ?', [cacheKey]);
    if (dessert) {
      dessert.recipe = JSON.parse(dessert.recipe);
    }
    return dessert;
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
    const desserts = await getAll(`
      SELECT * FROM desserts
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    return desserts.map(d => ({
      ...d,
      recipe: JSON.parse(d.recipe)
    }));
  }

  /**
   * Conta sobremesas do usuário
   */
  static async countByUserId(userId) {
    const result = await getOne(
      'SELECT COUNT(*) as total FROM desserts WHERE user_id = ?',
      [userId]
    );
    return result.total;
  }

  /**
   * Busca sobremesas populares (mais geradas)
   */
  static async getPopular(limit = 10) {
    const desserts = await getAll(`
      SELECT name, COUNT(*) as count
      FROM desserts
      GROUP BY name
      ORDER BY count DESC
      LIMIT ?
    `, [limit]);
    return desserts;
  }

  /**
   * Estatísticas de sobremesas
   */
  static async getStats() {
    const total = await getOne('SELECT COUNT(*) as count FROM desserts');
    const today = await getOne(`
      SELECT COUNT(*) as count FROM desserts
      WHERE created_at >= datetime('now', '-1 day')
    `);
    const thisWeek = await getOne(`
      SELECT COUNT(*) as count FROM desserts
      WHERE created_at >= datetime('now', '-7 days')
    `);
    const thisMonth = await getOne(`
      SELECT COUNT(*) as count FROM desserts
      WHERE created_at >= datetime('now', '-30 days')
    `);

    return {
      total: total.count,
      today: today.count,
      thisWeek: thisWeek.count,
      thisMonth: thisMonth.count
    };
  }

  /**
   * Deleta sobremesa
   */
  static async delete(id, userId) {
    const result = await runQuery(
      'DELETE FROM desserts WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.changes > 0;
  }
}

module.exports = Dessert;
