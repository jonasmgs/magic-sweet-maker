-- ============================================
-- Magic Sweet Maker - Functions & Triggers
-- ============================================
-- Funções auxiliares e triggers automáticos
-- Data: 2024-01-28
-- ============================================

-- ===========================================
-- FUNÇÃO: updated_at trigger
-- ===========================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_subscriptions
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_subscription_products
    BEFORE UPDATE ON public.subscription_products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ===========================================
-- FUNÇÃO: Criar perfil automaticamente
-- ===========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil quando usuário se registra
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- FUNÇÃO: Decrementar crédito
-- ===========================================

CREATE OR REPLACE FUNCTION public.decrement_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_credits INTEGER;
BEGIN
    -- Verificar créditos atuais
    SELECT credits INTO v_credits
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_credits > 0 THEN
        UPDATE public.profiles
        SET credits = credits - 1,
            updated_at = NOW()
        WHERE id = p_user_id;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- FUNÇÃO: Incrementar uso de assinatura
-- ===========================================

CREATE OR REPLACE FUNCTION public.increment_subscription_usage(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_subscription RECORD;
    v_result JSONB;
BEGIN
    -- Buscar assinatura ativa
    SELECT * INTO v_subscription
    FROM public.subscriptions
    WHERE user_id = p_user_id AND is_active = TRUE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'no_active_subscription'
        );
    END IF;

    -- Verificar se atingiu o limite
    IF v_subscription.used_this_month >= v_subscription.monthly_limit THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'limit_reached',
            'used', v_subscription.used_this_month,
            'limit', v_subscription.monthly_limit
        );
    END IF;

    -- Incrementar uso
    UPDATE public.subscriptions
    SET used_this_month = used_this_month + 1,
        updated_at = NOW()
    WHERE id = v_subscription.id
    RETURNING
        jsonb_build_object(
            'success', TRUE,
            'used', used_this_month,
            'limit', monthly_limit,
            'remaining', monthly_limit - used_this_month
        ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- FUNÇÃO: Resetar uso mensal
-- ===========================================

CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Resetar uso de assinaturas cujo período atual expirou
    UPDATE public.subscriptions
    SET used_this_month = 0,
        current_period_start = NOW(),
        current_period_end = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE is_active = TRUE
      AND current_period_end < NOW()
      AND will_renew = TRUE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- FUNÇÃO: Verificar e renovar créditos
-- ===========================================

CREATE OR REPLACE FUNCTION public.check_and_renew_credits(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_days_since_renewal INTEGER;
    v_renewal_days INTEGER := 30;
    v_premium_credits INTEGER := 100;
BEGIN
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'user_not_found');
    END IF;

    -- Apenas premium tem renovação de créditos
    IF v_profile.plan != 'premium' THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'renewed', FALSE,
            'credits', v_profile.credits
        );
    END IF;

    -- Calcular dias desde última renovação
    v_days_since_renewal := EXTRACT(DAY FROM NOW() - v_profile.credits_renewed_at);

    IF v_days_since_renewal >= v_renewal_days THEN
        UPDATE public.profiles
        SET credits = v_premium_credits,
            credits_renewed_at = NOW(),
            updated_at = NOW()
        WHERE id = p_user_id;

        RETURN jsonb_build_object(
            'success', TRUE,
            'renewed', TRUE,
            'credits', v_premium_credits
        );
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'renewed', FALSE,
        'credits', v_profile.credits,
        'days_until_renewal', v_renewal_days - v_days_since_renewal
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- FUNÇÃO: Registrar log de uso
-- ===========================================

CREATE OR REPLACE FUNCTION public.log_usage(
    p_user_id UUID,
    p_action TEXT,
    p_credits_used INTEGER DEFAULT 0,
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.usage_logs (user_id, action, credits_used, details, ip_address)
    VALUES (p_user_id, p_action, p_credits_used, p_details, p_ip_address)
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- FUNÇÃO: Gerar cache key
-- ===========================================

CREATE OR REPLACE FUNCTION public.generate_cache_key(
    p_ingredients TEXT,
    p_theme app_theme,
    p_language app_language
)
RETURNS TEXT AS $$
DECLARE
    v_normalized TEXT;
BEGIN
    -- Normalizar ingredientes (lowercase, ordenar, remover espaços extras)
    v_normalized := array_to_string(
        (SELECT array_agg(trim(elem) ORDER BY trim(elem))
         FROM unnest(string_to_array(lower(p_ingredients), ',')) AS elem),
        ','
    );

    -- Gerar hash SHA256
    RETURN encode(
        digest(v_normalized || '-' || p_theme || '-' || p_language, 'sha256'),
        'hex'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ===========================================
-- FUNÇÃO: Limpar cache expirado
-- ===========================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM public.cache
    WHERE expires_at < NOW();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- FUNÇÃO: Limpar tokens expirados
-- ===========================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM public.refresh_tokens
    WHERE expires_at < NOW() OR revoked = TRUE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- FUNÇÃO: Limpar logs antigos
-- ===========================================

CREATE OR REPLACE FUNCTION public.cleanup_old_logs(p_days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM public.usage_logs
    WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- FUNÇÃO: Obter estatísticas do usuário
-- ===========================================

CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_subscription RECORD;
    v_desserts_count INTEGER;
    v_desserts_this_month INTEGER;
    v_favorite_count INTEGER;
BEGIN
    -- Dados do perfil
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'user_not_found');
    END IF;

    -- Dados da assinatura
    SELECT * INTO v_subscription
    FROM public.subscriptions
    WHERE user_id = p_user_id AND is_active = TRUE;

    -- Contagens
    SELECT COUNT(*) INTO v_desserts_count
    FROM public.desserts WHERE user_id = p_user_id;

    SELECT COUNT(*) INTO v_desserts_this_month
    FROM public.desserts
    WHERE user_id = p_user_id
      AND created_at >= date_trunc('month', NOW());

    SELECT COUNT(*) INTO v_favorite_count
    FROM public.desserts
    WHERE user_id = p_user_id AND is_favorite = TRUE;

    RETURN jsonb_build_object(
        'user', jsonb_build_object(
            'id', v_profile.id,
            'email', v_profile.email,
            'name', v_profile.name,
            'plan', v_profile.plan,
            'credits', v_profile.credits
        ),
        'subscription', CASE WHEN v_subscription IS NOT NULL THEN
            jsonb_build_object(
                'product_id', v_subscription.product_id,
                'status', v_subscription.status,
                'monthly_limit', v_subscription.monthly_limit,
                'used_this_month', v_subscription.used_this_month,
                'remaining', v_subscription.monthly_limit - v_subscription.used_this_month,
                'expires_at', v_subscription.expires_at
            )
        ELSE NULL END,
        'stats', jsonb_build_object(
            'total_desserts', v_desserts_count,
            'desserts_this_month', v_desserts_this_month,
            'favorites', v_favorite_count
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- FUNÇÃO: Obter estatísticas gerais (admin)
-- ===========================================

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB AS $$
DECLARE
    v_total_users INTEGER;
    v_premium_users INTEGER;
    v_basic_users INTEGER;
    v_free_users INTEGER;
    v_active_subscriptions INTEGER;
    v_total_desserts INTEGER;
    v_desserts_today INTEGER;
    v_desserts_this_week INTEGER;
    v_total_credits_used INTEGER;
BEGIN
    -- Contagem de usuários
    SELECT COUNT(*) INTO v_total_users FROM public.profiles;
    SELECT COUNT(*) INTO v_premium_users FROM public.profiles WHERE plan = 'premium';
    SELECT COUNT(*) INTO v_basic_users FROM public.profiles WHERE plan = 'basic';
    SELECT COUNT(*) INTO v_free_users FROM public.profiles WHERE plan = 'free';

    -- Assinaturas ativas
    SELECT COUNT(*) INTO v_active_subscriptions
    FROM public.subscriptions WHERE is_active = TRUE;

    -- Sobremesas
    SELECT COUNT(*) INTO v_total_desserts FROM public.desserts;
    SELECT COUNT(*) INTO v_desserts_today
    FROM public.desserts WHERE created_at >= NOW() - INTERVAL '1 day';
    SELECT COUNT(*) INTO v_desserts_this_week
    FROM public.desserts WHERE created_at >= NOW() - INTERVAL '7 days';

    -- Créditos usados
    SELECT COALESCE(SUM(credits_used), 0) INTO v_total_credits_used
    FROM public.usage_logs;

    RETURN jsonb_build_object(
        'users', jsonb_build_object(
            'total', v_total_users,
            'premium', v_premium_users,
            'basic', v_basic_users,
            'free', v_free_users
        ),
        'subscriptions', jsonb_build_object(
            'active', v_active_subscriptions
        ),
        'desserts', jsonb_build_object(
            'total', v_total_desserts,
            'today', v_desserts_today,
            'this_week', v_desserts_this_week
        ),
        'credits', jsonb_build_object(
            'total_used', v_total_credits_used
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- FUNÇÃO: Sincronizar com RevenueCat
-- ===========================================

CREATE OR REPLACE FUNCTION public.sync_revenuecat_subscription(
    p_user_id UUID,
    p_product_id TEXT,
    p_revenuecat_subscription_id TEXT,
    p_is_active BOOLEAN,
    p_will_renew BOOLEAN,
    p_expires_at TIMESTAMPTZ,
    p_store TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_product RECORD;
    v_subscription RECORD;
    v_new_plan user_plan;
BEGIN
    -- Buscar produto
    SELECT * INTO v_product
    FROM public.subscription_products
    WHERE product_id = p_product_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'product_not_found');
    END IF;

    v_new_plan := v_product.plan_type;

    -- Verificar se já existe assinatura
    SELECT * INTO v_subscription
    FROM public.subscriptions
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
        -- Atualizar assinatura existente
        UPDATE public.subscriptions
        SET product_id = p_product_id,
            revenuecat_subscription_id = p_revenuecat_subscription_id,
            status = CASE WHEN p_is_active THEN 'active' ELSE 'expired' END,
            is_active = p_is_active,
            will_renew = p_will_renew,
            expires_at = p_expires_at,
            monthly_limit = v_product.monthly_limit,
            store = p_store,
            updated_at = NOW()
        WHERE id = v_subscription.id;
    ELSE
        -- Criar nova assinatura
        INSERT INTO public.subscriptions (
            user_id, product_id, revenuecat_subscription_id,
            status, is_active, will_renew, expires_at,
            monthly_limit, store
        ) VALUES (
            p_user_id, p_product_id, p_revenuecat_subscription_id,
            CASE WHEN p_is_active THEN 'active' ELSE 'expired' END,
            p_is_active, p_will_renew, p_expires_at,
            v_product.monthly_limit, p_store
        );
    END IF;

    -- Atualizar plano do perfil
    UPDATE public.profiles
    SET plan = CASE WHEN p_is_active THEN v_new_plan ELSE 'free' END,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'plan', v_new_plan,
        'monthly_limit', v_product.monthly_limit,
        'is_active', p_is_active
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
