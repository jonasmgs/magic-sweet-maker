-- ============================================
-- Magic Sweet Maker - Row Level Security (RLS)
-- ============================================
-- Políticas de segurança para todas as tabelas
-- Data: 2024-01-28
-- ============================================

-- ===========================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ===========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desserts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_history ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- POLÍTICAS: profiles
-- ===========================================

-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Inserção é controlada pelo trigger on_auth_user_created
CREATE POLICY "System can insert profiles"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Service role tem acesso total (para backend/admin)
CREATE POLICY "Service role has full access to profiles"
    ON public.profiles
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- POLÍTICAS: subscriptions
-- ===========================================

-- Usuários podem ver suas assinaturas
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Apenas service role pode modificar assinaturas (via webhook)
CREATE POLICY "Service role can manage subscriptions"
    ON public.subscriptions
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- POLÍTICAS: desserts
-- ===========================================

-- Usuários podem ver suas próprias sobremesas
CREATE POLICY "Users can view own desserts"
    ON public.desserts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Usuários podem criar sobremesas
CREATE POLICY "Users can create desserts"
    ON public.desserts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas sobremesas (favoritos)
CREATE POLICY "Users can update own desserts"
    ON public.desserts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar suas sobremesas
CREATE POLICY "Users can delete own desserts"
    ON public.desserts
    FOR DELETE
    USING (auth.uid() = user_id);

-- Service role tem acesso total
CREATE POLICY "Service role has full access to desserts"
    ON public.desserts
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- POLÍTICAS: usage_logs
-- ===========================================

-- Usuários podem ver seus próprios logs
CREATE POLICY "Users can view own usage logs"
    ON public.usage_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Apenas service role pode inserir logs
CREATE POLICY "Service role can manage usage logs"
    ON public.usage_logs
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Permitir inserção via funções
CREATE POLICY "Functions can insert usage logs"
    ON public.usage_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- POLÍTICAS: refresh_tokens
-- ===========================================

-- Usuários podem ver seus próprios tokens
CREATE POLICY "Users can view own refresh tokens"
    ON public.refresh_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role gerencia tokens
CREATE POLICY "Service role can manage refresh tokens"
    ON public.refresh_tokens
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- POLÍTICAS: cache
-- ===========================================

-- Cache é público para leitura (otimização)
CREATE POLICY "Cache is readable by all authenticated users"
    ON public.cache
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Apenas service role pode modificar cache
CREATE POLICY "Service role can manage cache"
    ON public.cache
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- POLÍTICAS: subscription_products
-- ===========================================

-- Produtos são públicos para leitura
CREATE POLICY "Products are readable by all"
    ON public.subscription_products
    FOR SELECT
    USING (TRUE);

-- Apenas service role pode modificar produtos
CREATE POLICY "Service role can manage products"
    ON public.subscription_products
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- POLÍTICAS: purchase_history
-- ===========================================

-- Usuários podem ver seu histórico de compras
CREATE POLICY "Users can view own purchase history"
    ON public.purchase_history
    FOR SELECT
    USING (auth.uid() = user_id);

-- Apenas service role pode inserir histórico
CREATE POLICY "Service role can manage purchase history"
    ON public.purchase_history
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- GRANTS PARA FUNÇÕES
-- ===========================================

-- Conceder permissões para funções executarem operações

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Selects
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.desserts TO authenticated;
GRANT SELECT ON public.usage_logs TO authenticated;
GRANT SELECT ON public.subscription_products TO authenticated, anon;
GRANT SELECT ON public.purchase_history TO authenticated;
GRANT SELECT ON public.cache TO authenticated;

-- Inserts
GRANT INSERT ON public.desserts TO authenticated;
GRANT INSERT ON public.usage_logs TO authenticated;

-- Updates
GRANT UPDATE ON public.profiles TO authenticated;
GRANT UPDATE ON public.desserts TO authenticated;

-- Deletes
GRANT DELETE ON public.desserts TO authenticated;

-- Views
GRANT SELECT ON public.user_subscription_status TO authenticated;
GRANT SELECT ON public.dessert_stats TO authenticated;

-- Sequences (para IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Funções
GRANT EXECUTE ON FUNCTION public.decrement_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_subscription_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_renew_credits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_usage(UUID, TEXT, INTEGER, JSONB, INET) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_cache_key(TEXT, app_theme, app_language) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stats(UUID) TO authenticated;

-- Funções admin (apenas service role)
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_cache() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_tokens() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_logs(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_monthly_usage() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_revenuecat_subscription(UUID, TEXT, TEXT, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TEXT) TO service_role;
