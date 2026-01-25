/**
 * Model de Usuário
 *
 * Gerencia todas as operações relacionadas a usuários no banco de dados.
 */

const bcrypt = require('bcryptjs');
const { runQuery, getOne, getAll } = require('../config/database');

const FREE_CREDITS = parseInt(process.env.FREE_CREDITS) || 3;
const PREMIUM_CREDITS = parseInt(process.env.PREMIUM_CREDITS) || 100;
const CREDIT_RENEWAL_DAYS = parseInt(process.env.CREDIT_RENEWAL_DAYS) || 30;

class User {
  /**
   * Cria um novo usuário
   */
  static async create({ email, password, name, deviceId }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await runQuery(`
      INSERT INTO users (email, password, name, device_id, plan, credits)
      VALUES (?, ?, ?, ?, 'free', ?)
    `, [email, hashedPassword, name, deviceId, FREE_CREDITS]);

    return this.findById(result.lastID);
  }

  /**
   * Encontra usuário por ID
   */
  static async findById(id) {
    const user = await getOne('SELECT * FROM users WHERE id = ?', [id]);
    return user ? this.sanitize(user) : null;
  }

  /**
   * Encontra usuário por email
   */
  static async findByEmail(email) {
    return getOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  }

  /**
   * Encontra usuário por device ID
   */
  static async findByDeviceId(deviceId) {
    return getOne('SELECT * FROM users WHERE device_id = ?', [deviceId]);
  }

  /**
   * Verifica se email já existe
   */
  static async emailExists(email) {
    const user = await getOne(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    return !!user;
  }

  /**
   * Verifica a senha do usuário
   */
  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password);
  }

  /**
   * Atualiza créditos do usuário
   */
  static async updateCredits(userId, credits) {
    await runQuery(
      'UPDATE users SET credits = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [credits, userId]
    );
    return this.findById(userId);
  }

  /**
   * Decrementa um crédito
   */
  static async decrementCredit(userId) {
    await runQuery(
      'UPDATE users SET credits = credits - 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND credits > 0',
      [userId]
    );
    return this.findById(userId);
  }

  /**
   * Verifica se usuário tem créditos
   */
  static async hasCredits(userId) {
    const user = await getOne('SELECT credits FROM users WHERE id = ?', [userId]);
    return user && user.credits > 0;
  }

  /**
   * Atualiza plano do usuário
   */
  static async upgradeToPremium(userId) {
    await runQuery(`
      UPDATE users
      SET plan = 'premium', credits = ?, credits_renewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [PREMIUM_CREDITS, userId]);
    return this.findById(userId);
  }

  /**
   * Renova créditos mensais (para Premium)
   */
  static async renewCredits(userId) {
    const user = await getOne('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user || user.plan !== 'premium') return null;

    const renewedAt = new Date(user.credits_renewed_at);
    const now = new Date();
    const daysSinceRenewal = Math.floor((now - renewedAt) / (1000 * 60 * 60 * 24));

    if (daysSinceRenewal >= CREDIT_RENEWAL_DAYS) {
      await runQuery(`
        UPDATE users
        SET credits = ?, credits_renewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [PREMIUM_CREDITS, userId]);
      return this.findById(userId);
    }

    return this.sanitize(user);
  }

  /**
   * Verifica e renova créditos automaticamente
   */
  static async checkAndRenewCredits(userId) {
    const user = await getOne('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) return null;

    if (user.plan === 'premium') {
      return this.renewCredits(userId);
    }

    return this.sanitize(user);
  }

  /**
   * Atualiza device ID do usuário
   */
  static async updateDeviceId(userId, deviceId) {
    await runQuery(
      'UPDATE users SET device_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [deviceId, userId]
    );
  }

  /**
   * Lista todos os usuários (admin)
   */
  static async findAll(limit = 100, offset = 0) {
    const users = await getAll(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return users.map(u => this.sanitize(u));
  }

  /**
   * Conta total de usuários
   */
  static async count() {
    const result = await getOne('SELECT COUNT(*) as total FROM users');
    return result.total;
  }

  /**
   * Estatísticas de usuários
   */
  static async getStats() {
    const total = await this.count();
    const premium = await getOne("SELECT COUNT(*) as count FROM users WHERE plan = 'premium'");
    const free = await getOne("SELECT COUNT(*) as count FROM users WHERE plan = 'free'");
    const activeToday = await getOne(`
      SELECT COUNT(*) as count FROM users
      WHERE updated_at >= datetime('now', '-1 day')
    `);

    return {
      total,
      premium: premium.count,
      free: free.count,
      activeToday: activeToday.count
    };
  }

  /**
   * Remove dados sensíveis do usuário
   */
  static sanitize(user) {
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }
}

module.exports = User;
