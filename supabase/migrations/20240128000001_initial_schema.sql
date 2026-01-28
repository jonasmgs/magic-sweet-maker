-- ============================================
-- Magic Sweet Maker - Supabase Database Schema
-- ============================================
-- Migração inicial: Tabelas principais
-- Data: 2024-01-28
-- ============================================

-- ===========================================
-- EXTENSÕES
-- ===========================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crypto functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- TIPOS ENUM
-- ===========================================

-- Planos de usuário
CREATE TYPE user_plan AS ENUM ('free', 'basic', 'premium');

-- Status de assinatura
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial', 'paused');

-- Temas do app
CREATE TYPE app_theme AS ENUM ('feminine', 'masculine');

-- Idiomas suportados
CREATE TYPE app_language AS ENUM ('en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh', 'ru', 'ar', 'hi');

-- ===========================================
-- TABELA: profiles (extensão do auth.users)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    device_id TEXT,

    -- Plano e créditos
    plan user_plan DEFAULT 'free' NOT NULL,
    credits INTEGER DEFAULT 3 NOT NULL CHECK (credits >= 0),
    credits_renewed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Preferências
    preferred_theme app_theme DEFAULT 'feminine',
    preferred_language app_language DEFAULT 'pt',

    -- RevenueCat
    revenuecat_id TEXT UNIQUE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_device_id ON public.profiles(device_id);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_revenuecat_id ON public.profiles(revenuecat_id);

-- Comentários
COMMENT ON TABLE public.profiles IS 'Perfis de usuários do Magic Sweet Maker';
COMMENT ON COLUMN public.profiles.credits IS 'Créditos disponíveis para geração de receitas';
COMMENT ON COLUMN public.profiles.revenuecat_id IS 'ID do usuário no RevenueCat para sincronização';

-- ===========================================
-- TABELA: subscriptions (Assinaturas RevenueCat)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Dados do RevenueCat
    revenuecat_subscription_id TEXT UNIQUE,
    product_id TEXT NOT NULL, -- 'candycandy_monthly', 'candycandy_basic_monthly'
    entitlement_id TEXT DEFAULT 'premium',

    -- Status
    status subscription_status DEFAULT 'active' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    will_renew BOOLEAN DEFAULT TRUE,

    -- Limites
    monthly_limit INTEGER NOT NULL DEFAULT 150,
    used_this_month INTEGER DEFAULT 0 CHECK (used_this_month >= 0),

    -- Datas
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    -- Preço (armazenar para histórico)
    price_amount DECIMAL(10, 2),
    price_currency TEXT DEFAULT 'USD',

    -- Plataforma
    store TEXT CHECK (store IN ('app_store', 'play_store', 'stripe', 'web')),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraint: apenas uma assinatura ativa por usuário
    CONSTRAINT unique_active_subscription UNIQUE (user_id, is_active)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_product_id ON public.subscriptions(product_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions(expires_at);

-- Comentários
COMMENT ON TABLE public.subscriptions IS 'Assinaturas de usuários sincronizadas com RevenueCat';
COMMENT ON COLUMN public.subscriptions.monthly_limit IS 'Limite de receitas por mês (150 para premium, 60 para basic)';

-- ===========================================
-- TABELA: desserts (Sobremesas geradas)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.desserts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Conteúdo
    name TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    recipe JSONB NOT NULL, -- Armazenado como JSONB para queries
    image_url TEXT,

    -- Configurações
    theme app_theme DEFAULT 'feminine',
    language app_language DEFAULT 'pt',

    -- Cache
    cache_key TEXT UNIQUE,

    -- Favoritos
    is_favorite BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_desserts_user_id ON public.desserts(user_id);
CREATE INDEX IF NOT EXISTS idx_desserts_cache_key ON public.desserts(cache_key);
CREATE INDEX IF NOT EXISTS idx_desserts_created_at ON public.desserts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_desserts_name ON public.desserts(name);
CREATE INDEX IF NOT EXISTS idx_desserts_is_favorite ON public.desserts(user_id, is_favorite) WHERE is_favorite = TRUE;

-- Índice GIN para busca em JSONB
CREATE INDEX IF NOT EXISTS idx_desserts_recipe ON public.desserts USING GIN (recipe);

-- Comentários
COMMENT ON TABLE public.desserts IS 'Sobremesas geradas pelos usuários';
COMMENT ON COLUMN public.desserts.recipe IS 'Receita completa em formato JSON com steps, tips, etc.';

-- ===========================================
-- TABELA: usage_logs (Logs de uso)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Ação
    action TEXT NOT NULL,
    credits_used INTEGER DEFAULT 0 CHECK (credits_used >= 0),

    -- Detalhes
    details JSONB,
    ip_address INET,
    user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON public.usage_logs(action);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);

-- Particionamento por data (opcional, para alta escala)
-- CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at_brin ON public.usage_logs USING BRIN (created_at);

-- Comentários
COMMENT ON TABLE public.usage_logs IS 'Logs de todas as ações dos usuários';

-- ===========================================
-- TABELA: refresh_tokens
-- ===========================================

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,

    -- Device info
    device_id TEXT,
    device_name TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON public.refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON public.refresh_tokens(expires_at);

-- Auto-limpeza de tokens expirados
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_cleanup ON public.refresh_tokens(expires_at) WHERE revoked = FALSE;

-- ===========================================
-- TABELA: cache (Cache de resultados)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key TEXT UNIQUE NOT NULL,
    data JSONB NOT NULL,
    hits INTEGER DEFAULT 0 CHECK (hits >= 0),

    -- TTL
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cache_key ON public.cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON public.cache(expires_at);

-- Comentários
COMMENT ON TABLE public.cache IS 'Cache de receitas para evitar chamadas repetidas à API';

-- ===========================================
-- TABELA: subscription_products (Catálogo de produtos)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.subscription_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identificadores
    product_id TEXT UNIQUE NOT NULL, -- 'candycandy_monthly', 'candycandy_basic_monthly'
    name TEXT NOT NULL,

    -- Configuração
    monthly_limit INTEGER NOT NULL,
    plan_type user_plan NOT NULL,

    -- Preço base (referência, RevenueCat tem o preço real)
    base_price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',

    -- Features
    features JSONB DEFAULT '[]'::JSONB,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Inserir produtos padrão
INSERT INTO public.subscription_products (product_id, name, monthly_limit, plan_type, base_price, is_popular, display_order, features) VALUES
    ('candycandy_monthly', 'CandyCandy', 150, 'premium', 9.99, TRUE, 1,
     '[{"key": "recipes", "value": 150}, {"key": "hdImages", "value": true}, {"key": "detailedSteps", "value": true}, {"key": "noAds", "value": true}, {"key": "prioritySupport", "value": true}]'::JSONB),
    ('candycandy_basic_monthly', 'CandyCandy Basic', 60, 'basic', 4.99, FALSE, 2,
     '[{"key": "recipes", "value": 60}, {"key": "hdImages", "value": true}, {"key": "detailedSteps", "value": true}, {"key": "reducedAds", "value": true}]'::JSONB)
ON CONFLICT (product_id) DO NOTHING;

-- Comentários
COMMENT ON TABLE public.subscription_products IS 'Catálogo de produtos de assinatura disponíveis';

-- ===========================================
-- TABELA: purchase_history (Histórico de compras)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.purchase_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,

    -- Detalhes da transação
    transaction_id TEXT,
    product_id TEXT NOT NULL,
    store TEXT CHECK (store IN ('app_store', 'play_store', 'stripe', 'web')),

    -- Valores
    price_amount DECIMAL(10, 2),
    price_currency TEXT,

    -- Tipo
    purchase_type TEXT CHECK (purchase_type IN ('initial', 'renewal', 'upgrade', 'downgrade', 'restore')),

    -- Status
    status TEXT CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),

    -- Timestamps
    purchased_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_purchase_history_user_id ON public.purchase_history(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_subscription_id ON public.purchase_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_purchased_at ON public.purchase_history(purchased_at DESC);

-- Comentários
COMMENT ON TABLE public.purchase_history IS 'Histórico de todas as transações de compra';

-- ===========================================
-- VIEW: user_subscription_status
-- ===========================================

CREATE OR REPLACE VIEW public.user_subscription_status AS
SELECT
    p.id AS user_id,
    p.email,
    p.name,
    p.plan,
    p.credits,
    s.id AS subscription_id,
    s.product_id,
    s.status AS subscription_status,
    s.is_active,
    s.monthly_limit,
    s.used_this_month,
    (s.monthly_limit - s.used_this_month) AS remaining_this_month,
    s.current_period_end,
    s.will_renew,
    sp.name AS plan_name,
    sp.base_price
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id AND s.is_active = TRUE
LEFT JOIN public.subscription_products sp ON s.product_id = sp.product_id;

-- Comentários
COMMENT ON VIEW public.user_subscription_status IS 'View consolidada do status de assinatura do usuário';

-- ===========================================
-- VIEW: dessert_stats
-- ===========================================

CREATE OR REPLACE VIEW public.dessert_stats AS
SELECT
    name,
    COUNT(*) AS generation_count,
    COUNT(DISTINCT user_id) AS unique_users,
    MAX(created_at) AS last_generated
FROM public.desserts
GROUP BY name
ORDER BY generation_count DESC;

-- Comentários
COMMENT ON VIEW public.dessert_stats IS 'Estatísticas de sobremesas mais geradas';
