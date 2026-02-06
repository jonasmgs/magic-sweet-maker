/**
 * Model de Usuário
 *
 * Gerencia todas as operações relacionadas a usuários no Supabase.
 */

const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

const FREE_CREDITS = parseInt(process.env.FREE_CREDITS) || 3;
const PREMIUM_CREDITS = parseInt(process.env.PREMIUM_CREDITS) || 100;
const CREDIT_RENEWAL_DAYS = parseInt(process.env.CREDIT_RENEWAL_DAYS) || 30;

class User {
  /**
   * Cria um novo usuário
   */
  static async create({ email, password, name, deviceId }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          device_id: deviceId,
          plan: 'free',
          credits: FREE_CREDITS
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }

    return this.sanitize(data);
  }

  /**
   * Encontra usuário por ID
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
      console.error('Erro ao buscar usuário por ID:', error);
    }

    return data ? this.sanitize(data) : null;
  }

  /**
   * Encontra usuário por email
   */
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar usuário por email:', error);
    }

    return data ? this.sanitize(data) : null;
  }

  /**
   * Encontra usuário por device ID
   */
  static async findByDeviceId(deviceId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (error && error.code !== 'PGRST116') return null;
    return this.sanitize(data);
  }

  /**
   * Verifica se email já existe
   */
  static async emailExists(email) {
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('email', email.toLowerCase());

    if (error) return false;
    return count > 0;
  }

  /**
   * Verifica a senha do usuário
   */
  static async verifyPassword(user, password) {
    if (!user || !user.password) return false;
    return bcrypt.compare(password, user.password);
  }

  /**
   * Atualiza créditos do usuário
   */
  static async updateCredits(userId, credits) {
    const { data, error } = await supabase
      .from('users')
      .update({ credits, updated_at: new Date() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar créditos:', error);
      throw error;
    }

    return this.sanitize(data);
  }

  /**
   * Decrementa um crédito
   */
  static async decrementCredit(userId) {
    // Nota: Supabase não tem decrement atômico direto via JS client simples sem RPC,
    // mas poderiamos usar rpc() se tivessemos uma function no DB.
    // Vamos fazer read-update por enquanto, ou confiar que a concorrencia não é critica aqui.
    // Melhor: verificar saldo antes.

    // Abordagem segura: chamar RPC 'decrement_credits' se existisse.
    // Abordagem JS (race condition possível):
    const { data: user } = await supabase.from('users').select('credits').eq('id', userId).single();

    if (user && user.credits > 0) {
      const { data, error } = await supabase
        .from('users')
        .update({ credits: user.credits - 1, updated_at: new Date() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return this.sanitize(data);
    }

    return this.findById(userId);
  }

  /**
   * Verifica se usuário tem créditos
   */
  static async hasCredits(userId) {
    const { data } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    return data && data.credits > 0;
  }

  /**
   * Atualiza plano do usuário
   */
  static async upgradeToPremium(userId) {
    const { data, error } = await supabase
      .from('users')
      .update({
        plan: 'premium',
        credits: PREMIUM_CREDITS,
        credits_renewed_at: new Date(),
        updated_at: new Date()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return this.sanitize(data);
  }

  /**
   * Renova créditos mensais (para Premium)
   */
  static async renewCredits(userId) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user || user.plan !== 'premium') return null;

    const renewedAt = new Date(user.credits_renewed_at);
    const now = new Date();
    const daysSinceRenewal = Math.floor((now - renewedAt) / (1000 * 60 * 60 * 24));

    if (daysSinceRenewal >= CREDIT_RENEWAL_DAYS) {
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({
          credits: PREMIUM_CREDITS,
          credits_renewed_at: new Date(),
          updated_at: new Date()
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) throw updateError;
      return this.sanitize(updated);
    }

    return this.sanitize(user);
  }

  /**
   * Verifica e renova créditos automaticamente
   */
  static async checkAndRenewCredits(userId) {
    // Otimização: buscar apenas o necessário primeiro
    const { data: user } = await supabase
      .from('users')
      .select('plan, credits_renewed_at')
      .eq('id', userId)
      .single();

    if (!user) return null;

    if (user.plan === 'premium') {
      return this.renewCredits(userId); // renewCredits busca o user full novamente, aceitável
    }

    return this.findById(userId);
  }

  /**
   * Atualiza device ID do usuário
   */
  static async updateDeviceId(userId, deviceId) {
    await supabase
      .from('users')
      .update({ device_id: deviceId, updated_at: new Date() })
      .eq('id', userId);
  }

  /**
   * Lista todos os usuários (admin)
   */
  static async findAll(limit = 100, offset = 0) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return [];
    return data.map(u => this.sanitize(u));
  }

  /**
   * Conta total de usuários
   */
  static async count() {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    return count || 0;
  }

  /**
   * Estatísticas de usuários
   */
  static async getStats() {
    const { count: total } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: premium } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'premium');

    const { count: free } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'free');

    // Active today query is complex with Supabase JS simple filter
    // We'll use a date filter
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { count: activeToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', oneDayAgo.toISOString());

    return {
      total: total || 0,
      premium: premium || 0,
      free: free || 0,
      activeToday: activeToday || 0
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

