/**
 * Model de Log de Uso
 *
 * Registra todas as ações dos usuários para monitoramento.
 */

const { runQuery, getOne, getAll } = require('../config/database');

class UsageLog {
  /**
   * Registra um log de uso
   */
  static async create({ userId, action, creditsUsed = 0, details = null, ipAddress = null }) {
    const result = await runQuery(`
      INSERT INTO usage_logs (user_id, action, credits_used, details, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, action, creditsUsed, JSON.stringify(details), ipAddress]);

    return result.lastID;
  }

  /**
   * Busca logs por usuário
   */
  static async findByUserId(userId, limit = 50, offset = 0) {
    const logs = await getAll(`
      SELECT * FROM usage_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    return logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));
  }

  /**
   * Conta ações por usuário em um período
   */
  static async countActions(userId, action, hours = 24) {
    const result = await getOne(`
      SELECT COUNT(*) as count FROM usage_logs
      WHERE user_id = ? AND action = ?
      AND created_at >= datetime('now', '-' || ? || ' hours')
    `, [userId, action, hours]);
    return result.count;
  }

  /**
   * Total de créditos usados por usuário
   */
  static async getTotalCreditsUsed(userId) {
    const result = await getOne(`
      SELECT SUM(credits_used) as total FROM usage_logs
      WHERE user_id = ?
    `, [userId]);
    return result.total || 0;
  }

  /**
   * Estatísticas gerais de uso
   */
  static async getStats() {
    const totalActions = await getOne('SELECT COUNT(*) as count FROM usage_logs');
    const totalCreditsUsed = await getOne('SELECT SUM(credits_used) as total FROM usage_logs');
    const actionsToday = await getOne(`
      SELECT COUNT(*) as count FROM usage_logs
      WHERE created_at >= datetime('now', '-1 day')
    `);
    const generationsToday = await getOne(`
      SELECT COUNT(*) as count FROM usage_logs
      WHERE action = 'generate_dessert'
      AND created_at >= datetime('now', '-1 day')
    `);

    // Top ações
    const topActions = await getAll(`
      SELECT action, COUNT(*) as count
      FROM usage_logs
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `);

    return {
      totalActions: totalActions.count,
      totalCreditsUsed: totalCreditsUsed.total || 0,
      actionsToday: actionsToday.count,
      generationsToday: generationsToday.count,
      topActions
    };
  }

  /**
   * Limpa logs antigos (manutenção)
   */
  static async cleanOldLogs(daysToKeep = 90) {
    const result = await runQuery(`
      DELETE FROM usage_logs
      WHERE created_at < datetime('now', '-' || ? || ' days')
    `, [daysToKeep]);
    return result.changes;
  }
}

module.exports = UsageLog;
