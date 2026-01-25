# 🍭 Magic Sweet Maker - Gerador de Sobremesas Mágicas Infantis

Aplicativo completo para gerar sobremesas mágicas infantis usando IA, com:
- **Web App**: React + Vite + Supabase (raiz do projeto)
- **Backend**: Node.js + Express (pasta `/backend`)
- **Mobile**: React Native + Expo (pasta `/mobile`)

## 📁 Estrutura do Projeto

```
magic-sweet-maker/
├── src/                        # Web App (React + Vite)
├── backend/                    # API Node.js/Express
│   ├── src/
│   │   ├── config/            # Configurações (DB, JWT)
│   │   ├── controllers/       # Controladores das rotas
│   │   ├── middleware/        # Auth, rate limit, etc
│   │   ├── models/            # Models do banco de dados
│   │   ├── routes/            # Definição das rotas
│   │   ├── services/          # Serviços (AI, Cache, Credits)
│   │   └── utils/             # Utilitários
│   ├── package.json
│   └── .env.example
├── mobile/                     # App React Native (Expo)
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── screens/           # Telas do app
│   │   ├── services/          # APIs e serviços
│   │   ├── context/           # Context API
│   │   └── utils/             # Utilitários
│   ├── App.tsx
│   └── package.json
└── README.md
```

## 🚀 Funcionalidades

### Autenticação
- ✅ Cadastro por email e senha
- ✅ Login seguro com JWT
- ✅ Persistência de sessão
- ✅ Prevenção de múltiplas contas por dispositivo

### Sistema de Planos
- ✅ **Modo Grátis**: 3 créditos iniciais
- ✅ **Premium**: 100 créditos/mês com renovação automática

### Sistema de Créditos
- ✅ Cada geração consome 1 crédito
- ✅ Bloqueio quando créditos acabam
- ✅ Dashboard de uso

### Geração com IA
- ✅ Geração de receita com IA de texto
- ✅ Geração de personagem 3D com IA de imagem
- ✅ Cache de resultados para otimização
- ✅ Logs de uso por usuário
- ✅ Temas: Doces Fofos 🧁 e Super-Heróis 🦸

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Expo CLI (para mobile)

### 1. Web App (Raiz)

```bash
# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev
```

### 2. Backend

```bash
cd backend
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Rodar migrations
npm run migrate

# Seed com dados de teste
npm run seed

# Iniciar servidor
npm run dev
```

### 3. Mobile (Expo)

```bash
cd mobile
npm install

# Iniciar com Expo
npx expo start

# Android
npx expo run:android

# iOS
npx expo run:ios
```

## 🔧 Variáveis de Ambiente

### Backend (.env)
```env
PORT=3000
NODE_ENV=development

JWT_SECRET=sua-chave-secreta
JWT_EXPIRES_IN=7d

DATABASE_PATH=./database.sqlite

OPENAI_API_KEY=sk-sua-api-key
OPENAI_TEXT_MODEL=gpt-4
OPENAI_IMAGE_MODEL=dall-e-3

FREE_CREDITS=3
PREMIUM_CREDITS=100
```

### Mobile
Configure em `mobile/src/services/api.ts` a URL do backend.

## 📱 Telas do App Mobile

1. **Login/Cadastro** - Autenticação com troca de tema/idioma
2. **Home** - Seleção de ingredientes com sugestões
3. **Geração** - Loading animado com varinha mágica ✨
4. **Resultado** - Receita completa + imagem do personagem
5. **Histórico** - Lista de sobremesas criadas
6. **Perfil** - Créditos, plano e configurações

## 📊 API Endpoints

### Autenticação
```
POST /api/auth/register - Cadastro
POST /api/auth/login    - Login
GET  /api/auth/me       - Dados do usuário
POST /api/auth/refresh  - Renovar token
POST /api/auth/logout   - Logout
```

### Sobremesas
```
POST /api/desserts/generate  - Gerar sobremesa (consome 1 crédito)
GET  /api/desserts/history   - Histórico do usuário
GET  /api/desserts/:id       - Detalhes de uma sobremesa
DELETE /api/desserts/:id     - Remover do histórico
```

### Usuário
```
GET  /api/users/profile  - Perfil completo
GET  /api/users/credits  - Consultar créditos
POST /api/users/upgrade  - Upgrade para Premium
```

### Admin
```
GET  /api/admin/stats        - Estatísticas
GET  /api/admin/users        - Lista usuários
PUT  /api/admin/users/:id/credits - Atualizar créditos
```

## 🎨 Prompts de IA

### Texto (Receita)
```
Crie uma sobremesa infantil mágica usando: {INGREDIENTES}.
- Nome criativo baseado em doce real
- Receita em 3 passos simples
```

### Imagem (Personagem 3D)
```
A charismatic 3D anthropomorphic character inspired by "{NOME}".
Dessert-shaped body, Disney-Pixar style.
Big joyful eyes, candy magical background.
```

## 🔐 Segurança

- Senhas hasheadas com bcrypt (10 rounds)
- JWT para autenticação
- Rate limiting por IP e usuário
- Validação de inputs com express-validator
- Device ID para prevenir múltiplas contas
- Helmet + CORS configurados

## 💰 Otimização de Custos

- Cache LRU em memória + SQLite
- Limite de tamanho de prompt (500 chars)
- Fallback para mock em desenvolvimento
- Logs detalhados de uso

## 🚀 Deploy

### Backend (Railway/Render)
1. Configure variáveis de ambiente
2. Deploy via Git
3. Configure PostgreSQL em produção

### Mobile (EAS Build)
```bash
# Android
eas build --platform android

# iOS
eas build --platform ios
```

## 👥 Usuários de Teste

Após rodar `npm run seed`:

| Email | Senha | Plano |
|-------|-------|-------|
| teste@email.com | teste123 | Free (3 créditos) |
| premium@email.com | teste123 | Premium (100 créditos) |
| admin@email.com | admin123 | Admin |

## 📝 Licença

MIT License
