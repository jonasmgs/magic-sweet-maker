# Magic Sweet Maker - Supabase Database

Esquema do banco de dados PostgreSQL para o Supabase.

## Estrutura do Banco

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuários (extensão do auth.users) |
| `subscriptions` | Assinaturas RevenueCat |
| `desserts` | Sobremesas geradas pelos usuários |
| `usage_logs` | Logs de todas as ações |
| `refresh_tokens` | Tokens JWT de refresh |
| `cache` | Cache de receitas |
| `subscription_products` | Catálogo de produtos |
| `purchase_history` | Histórico de compras |

### Views

| View | Descrição |
|------|-----------|
| `user_subscription_status` | Status consolidado da assinatura |
| `dessert_stats` | Estatísticas de sobremesas populares |

### Funções Principais

| Função | Descrição |
|--------|-----------|
| `decrement_credit(user_id)` | Decrementa um crédito |
| `increment_subscription_usage(user_id)` | Incrementa uso da assinatura |
| `check_and_renew_credits(user_id)` | Verifica e renova créditos |
| `get_user_stats(user_id)` | Estatísticas do usuário |
| `sync_revenuecat_subscription(...)` | Sincroniza com RevenueCat |

## Setup no Supabase

### 1. Criar Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **New Project**
3. Configure:
   - **Name**: magic-sweet-maker
   - **Database Password**: (guarde em local seguro!)
   - **Region**: Escolha a mais próxima dos usuários
4. Clique em **Create new project**

### 2. Executar Migrações

#### Via SQL Editor (Recomendado)

1. No Supabase Dashboard, vá em **SQL Editor**
2. Execute os arquivos na ordem:
   ```
   migrations/20240128000001_initial_schema.sql
   migrations/20240128000002_functions_triggers.sql
   migrations/20240128000003_rls_policies.sql
   ```

#### Via Supabase CLI

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref YOUR_PROJECT_REF

# Executar migrações
supabase db push
```

### 3. Configurar Variáveis de Ambiente

Após criar o projeto, copie as credenciais:

```env
# Backend (.env)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Mobile (config)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

### 4. Criar Usuários de Teste

#### Via Dashboard

1. Vá em **Authentication** > **Users**
2. Clique em **Add User**
3. Adicione:
   - `free@test.com` / `teste123`
   - `basic@test.com` / `teste123`
   - `premium@test.com` / `teste123`

#### Configurar Planos

Após criar os usuários, execute no SQL Editor:

```sql
SELECT public.setup_test_user('free@test.com', 'free', 3);
SELECT public.setup_test_user('basic@test.com', 'basic', 60);
SELECT public.setup_test_user('premium@test.com', 'premium', 150);
```

## Integração com Backend

### Instalar Supabase Client

```bash
cd backend
npm install @supabase/supabase-js
```

### Exemplo de Uso

```javascript
// backend/src/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role no backend
);

module.exports = supabase;
```

```javascript
// Exemplo: Buscar perfil do usuário
async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, subscriptions(*)')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

// Exemplo: Criar sobremesa
async function createDessert(userId, dessertData) {
  const { data, error } = await supabase
    .from('desserts')
    .insert({
      user_id: userId,
      name: dessertData.name,
      ingredients: dessertData.ingredients,
      recipe: dessertData.recipe,
      theme: dessertData.theme,
      language: dessertData.language,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Exemplo: Incrementar uso
async function incrementUsage(userId) {
  const { data, error } = await supabase
    .rpc('increment_subscription_usage', { p_user_id: userId });

  if (error) throw error;
  return data;
}
```

## Integração com Mobile

### Instalar Supabase Client

```bash
cd mobile
npm install @supabase/supabase-js
```

### Configuração

```typescript
// mobile/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = 'https://YOUR_PROJECT.supabase.co';
const supabaseAnonKey = 'YOUR_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

## Webhook RevenueCat

Para sincronizar assinaturas, configure um webhook no RevenueCat:

### 1. Criar Edge Function

```bash
supabase functions new revenuecat-webhook
```

```typescript
// supabase/functions/revenuecat-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const body = await req.json();
  const event = body.event;

  // Processar eventos do RevenueCat
  if (event.type === 'INITIAL_PURCHASE' || event.type === 'RENEWAL') {
    await supabase.rpc('sync_revenuecat_subscription', {
      p_user_id: event.app_user_id,
      p_product_id: event.product_id,
      p_revenuecat_subscription_id: event.id,
      p_is_active: true,
      p_will_renew: event.will_renew,
      p_expires_at: event.expiration_at,
      p_store: event.store,
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 2. Deploy Function

```bash
supabase functions deploy revenuecat-webhook
```

### 3. Configurar no RevenueCat

1. Vá em RevenueCat Dashboard > Integrations > Webhooks
2. Adicione a URL: `https://YOUR_PROJECT.supabase.co/functions/v1/revenuecat-webhook`
3. Configure o Authorization header se necessário

## Manutenção

### Limpeza Automática

Configure um cron job para limpeza periódica:

```sql
-- Executar diariamente via pg_cron ou Edge Function
SELECT public.cleanup_expired_cache();
SELECT public.cleanup_expired_tokens();
SELECT public.cleanup_old_logs(90);
SELECT public.reset_monthly_usage();
```

### Backup

O Supabase faz backups automáticos diários no plano Pro. Para plano Free, exporte manualmente:

```bash
supabase db dump -f backup.sql
```

## Segurança

- ✅ Row Level Security (RLS) habilitado em todas as tabelas
- ✅ Service Role Key usada apenas no backend
- ✅ Anon Key usada no mobile (com RLS)
- ✅ Senhas hasheadas pelo Supabase Auth
- ✅ JWT tokens com expiração configurável

## Troubleshooting

### Erro: "new row violates row-level security policy"

Verifique se o usuário está autenticado e se as políticas RLS estão corretas.

### Erro: "relation does not exist"

Execute as migrações na ordem correta.

### Performance lenta

1. Verifique os índices estão criados
2. Use `EXPLAIN ANALYZE` para otimizar queries
3. Considere habilitar connection pooling
