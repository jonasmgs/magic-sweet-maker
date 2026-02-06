/**
 * Configuração do Cliente Supabase
 *
 * Utiliza @supabase/supabase-js para conectar ao projeto.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// Tenta usar a Service Role Key para operações administrativas (backend),
// caso contrário usa a Anon Key (mas pode ter restrições de RLS).
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: SUPABASE_URL ou SUPABASE_KEY não definidos no .env');
  // Não lançamos erro aqui para não crashar o server na inicialização, 
  // mas as chamadas falharão.
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Cliente Supabase inicializado');

module.exports = supabase;
