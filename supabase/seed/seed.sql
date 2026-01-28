-- ============================================
-- Magic Sweet Maker - Seed Data
-- ============================================
-- Dados de teste para desenvolvimento
-- ATENÇÃO: Não usar em produção!
-- Data: 2024-01-28
-- ============================================

-- ===========================================
-- NOTA SOBRE USUÁRIOS DE TESTE
-- ===========================================
-- Os usuários de teste devem ser criados através do
-- Supabase Auth Dashboard ou via API.
--
-- Após criar os usuários no Auth, execute os
-- comandos abaixo para configurar os perfis.
-- ===========================================

-- ===========================================
-- PRODUTOS DE ASSINATURA (já inseridos na migração)
-- ===========================================

-- Garantir que os produtos existem
INSERT INTO public.subscription_products (product_id, name, monthly_limit, plan_type, base_price, is_popular, display_order, features)
VALUES
    ('candycandy_monthly', 'CandyCandy', 150, 'premium', 9.99, TRUE, 1,
     '[{"key": "recipes", "value": 150}, {"key": "hdImages", "value": true}, {"key": "detailedSteps", "value": true}, {"key": "noAds", "value": true}, {"key": "prioritySupport", "value": true}]'::JSONB),
    ('candycandy_basic_monthly', 'CandyCandy Basic', 60, 'basic', 4.99, FALSE, 2,
     '[{"key": "recipes", "value": 60}, {"key": "hdImages", "value": true}, {"key": "detailedSteps", "value": true}, {"key": "reducedAds", "value": true}]'::JSONB)
ON CONFLICT (product_id) DO UPDATE SET
    name = EXCLUDED.name,
    monthly_limit = EXCLUDED.monthly_limit,
    base_price = EXCLUDED.base_price,
    features = EXCLUDED.features,
    updated_at = NOW();

-- ===========================================
-- SOBREMESAS DE EXEMPLO (para cache)
-- ===========================================

-- Inserir algumas sobremesas em cache para demonstração
INSERT INTO public.cache (cache_key, data, expires_at)
VALUES
    (
        'chocolate_morango_feminine_pt',
        '{
            "name": "Bolo Mágico de Chocolate com Morangos",
            "description": "Um bolo fofo e delicioso que parece ter saído de um conto de fadas!",
            "ingredients": ["chocolate", "morangos", "farinha", "açúcar", "ovos", "leite"],
            "steps": [
                "Pré-aqueça o forno a 180°C",
                "Misture os ingredientes secos",
                "Adicione os ovos e o leite",
                "Derreta o chocolate e adicione à massa",
                "Despeje na forma e leve ao forno por 35 minutos",
                "Decore com morangos frescos"
            ],
            "tips": ["Use chocolate meio amargo para mais sabor", "Decore com chantilly rosa"],
            "difficulty": "fácil",
            "time": "45 minutos"
        }'::JSONB,
        NOW() + INTERVAL '30 days'
    ),
    (
        'banana_canela_feminine_pt',
        '{
            "name": "Cupcakes de Banana com Canela Encantados",
            "description": "Cupcakes fofos com sabor de banana e canela que vão fazer magia na sua cozinha!",
            "ingredients": ["bananas", "canela", "farinha", "açúcar", "manteiga", "ovos"],
            "steps": [
                "Amasse as bananas maduras",
                "Misture com açúcar e canela",
                "Adicione farinha e ovos",
                "Distribua nas forminhas",
                "Asse por 25 minutos",
                "Decore com glacê de canela"
            ],
            "tips": ["Use bananas bem maduras", "Polvilhe canela extra por cima"],
            "difficulty": "fácil",
            "time": "35 minutos"
        }'::JSONB,
        NOW() + INTERVAL '30 days'
    ),
    (
        'chocolate_strawberry_masculine_en',
        '{
            "name": "Super Hero Chocolate Strawberry Cake",
            "description": "A powerful cake that will give you superhero energy!",
            "ingredients": ["chocolate", "strawberries", "flour", "sugar", "eggs", "milk"],
            "steps": [
                "Preheat oven to 350°F",
                "Mix dry ingredients",
                "Add eggs and milk",
                "Melt chocolate and add to batter",
                "Pour into pan and bake for 35 minutes",
                "Decorate with fresh strawberries"
            ],
            "tips": ["Use dark chocolate for more power", "Add superhero sprinkles"],
            "difficulty": "easy",
            "time": "45 minutes"
        }'::JSONB,
        NOW() + INTERVAL '30 days'
    )
ON CONFLICT (cache_key) DO NOTHING;

-- ===========================================
-- SCRIPT PARA CRIAR USUÁRIOS DE TESTE
-- ===========================================

/*
Para criar usuários de teste, use a API do Supabase Auth ou o Dashboard.

Exemplo via API:

-- Usuário Free
curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/signup' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email": "free@test.com", "password": "teste123"}'

-- Usuário Premium
curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/signup' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email": "premium@test.com", "password": "teste123"}'

Depois de criar, atualize os perfis:
*/

-- ===========================================
-- FUNÇÃO PARA CONFIGURAR USUÁRIO DE TESTE
-- ===========================================

CREATE OR REPLACE FUNCTION public.setup_test_user(
    p_email TEXT,
    p_plan user_plan,
    p_credits INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Buscar usuário pelo email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email;

    IF FOUND THEN
        -- Atualizar perfil
        UPDATE public.profiles
        SET plan = p_plan,
            credits = p_credits,
            updated_at = NOW()
        WHERE id = v_user_id;

        -- Se premium/basic, criar assinatura
        IF p_plan IN ('premium', 'basic') THEN
            INSERT INTO public.subscriptions (
                user_id,
                product_id,
                status,
                is_active,
                monthly_limit,
                current_period_end
            ) VALUES (
                v_user_id,
                CASE WHEN p_plan = 'premium' THEN 'candycandy_monthly' ELSE 'candycandy_basic_monthly' END,
                'active',
                TRUE,
                CASE WHEN p_plan = 'premium' THEN 150 ELSE 60 END,
                NOW() + INTERVAL '30 days'
            )
            ON CONFLICT (user_id, is_active) DO UPDATE SET
                product_id = EXCLUDED.product_id,
                monthly_limit = EXCLUDED.monthly_limit,
                current_period_end = EXCLUDED.current_period_end;

            RAISE NOTICE 'Usuário % configurado como % com assinatura', p_email, p_plan;
        ELSE
            RAISE NOTICE 'Usuário % configurado como free', p_email;
        END IF;
    ELSE
        RAISE NOTICE 'Usuário % não encontrado. Crie primeiro via Supabase Auth.', p_email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- EXEMPLOS DE USO
-- ===========================================

-- Após criar usuários via Auth, execute:
-- SELECT public.setup_test_user('free@test.com', 'free', 3);
-- SELECT public.setup_test_user('basic@test.com', 'basic', 60);
-- SELECT public.setup_test_user('premium@test.com', 'premium', 150);

-- ===========================================
-- DADOS PARA ANALYTICS (opcional)
-- ===========================================

-- Inserir alguns logs de uso para demonstração de analytics
-- Estes logs serão associados a um usuário quando ele for criado

/*
-- Exemplo de como inserir logs após ter um user_id:

INSERT INTO public.usage_logs (user_id, action, credits_used, details)
SELECT
    p.id,
    'generate_dessert',
    1,
    jsonb_build_object(
        'ingredients', 'chocolate, morango',
        'theme', 'feminine',
        'language', 'pt'
    )
FROM public.profiles p
WHERE p.email = 'premium@test.com';
*/
