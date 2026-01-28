# 🍭 Magic Sweet Maker

Gerador de Sobremesas Mágicas Infantis com IA - App React Native + API Node.js

## ✨ Funcionalidades

- 🤖 **Geração com IA**: Receitas criativas usando Google Gemini
- 🖼️ **Imagens Mágicas**: Personagens 3D estilo Pixar/Disney
- 👶 **Para Crianças**: Interface divertida e segura
- 🎭 **2 Temas**: Doces Fofos 🧁 ou Super-Heróis ⚡
- 🌍 **Bilíngue**: Português e Inglês
- 💳 **Assinatura**: $9.99/mês = 150 gerações (paywall antes de gerar)
- 🔐 **Autenticação JWT**: Login seguro com refresh tokens
- 📱 **100% Nativo**: Android e iOS com React Native/Expo

## 📁 Estrutura

```
magic-sweet-maker/
├── backend/              # API Node.js/Express
│   ├── src/
│   │   ├── config/       # Database, migrations
│   │   ├── controllers/  # Auth, Desserts, Users, Admin
│   │   ├── middleware/   # Auth, Rate Limiter, Validation
│   │   ├── models/       # User, Dessert, UsageLog
│   │   ├── routes/       # API routes
│   │   ├── services/     # AI (Gemini), Cache, Credits
│   │   └── server.js
│   └── package.json
│
└── mobile/               # App React Native/Expo
    ├── src/
    │   ├── components/   # Button, Input, LoadingAnimation
    │   ├── context/      # Auth, Language/Theme
    │   ├── screens/      # Auth, Home, Generation, Result, Profile, History
    │   ├── services/     # API client (Axios)
    │   └── utils/        # Theme (Pixar/Disney style)
    ├── App.tsx
    └── package.json
```

## 🚀 Como Executar

### Backend

```bash
cd backend
cp .env.example .env
# Edite .env e adicione sua GEMINI_API_KEY

npm install
npm run migrate
npm run seed
npm run dev
```

### Mobile

```bash
cd mobile
npm install
npx expo start

# Android
npx expo start --android

# iOS
npx expo start --ios
```

## ⚙️ Variáveis de Ambiente

Crie um arquivo `backend/.env`:

```env
# Servidor
PORT=3000
NODE_ENV=development

# JWT (gere uma chave segura!)
JWT_SECRET=sua-chave-super-secreta-aqui
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Banco de Dados
DATABASE_PATH=./database.sqlite

# Google Gemini API
GEMINI_API_KEY=sua-api-key-do-gemini

# Sistema de Créditos (0 = paywall obrigatório)
FREE_CREDITS=0
PREMIUM_CREDITS=150
CREDIT_RENEWAL_DAYS=30

# Cache
CACHE_MAX_SIZE=500
CACHE_TTL_SECONDS=86400

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10
```

### Obter API Key do Gemini

1. Acesse: https://aistudio.google.com/apikey
2. Crie uma nova API key
3. Adicione no arquivo `.env`

## 📱 Telas do App

| Tela | Descrição |
|------|-----------|
| **Auth** | Login/Cadastro com seleção de tema e idioma |
| **Home** | Seleção de ingredientes com sugestões populares |
| **Generation** | Animação de varinha mágica durante geração |
| **Result** | Receita com imagem do personagem 3D |
| **Profile** | Créditos, plano, configurações |
| **History** | Histórico de sobremesas criadas |

## 🎨 Design Pixar/Disney

- **Gradientes vibrantes**: Céu azul → Rosa → Dourado
- **Sombras coloridas**: Efeito glow rosa/roxo
- **Bordas arredondadas**: Estilo suave e amigável
- **Fontes bold**: Peso 800-900 para títulos
- **Text shadows**: Profundidade 3D nos títulos

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
POST /api/desserts/generate  - Gerar sobremesa (1 crédito)
GET  /api/desserts/history   - Histórico
GET  /api/desserts/:id       - Detalhes
DELETE /api/desserts/:id     - Remover
```

### Usuário
```
GET  /api/users/profile  - Perfil
GET  /api/users/credits  - Créditos
POST /api/users/upgrade  - Upgrade Premium
```

## 🔒 Segurança

- ✅ Helmet.js para headers HTTP
- ✅ Rate limiting global e por rota
- ✅ CORS configurável
- ✅ Bcrypt para senhas (12 rounds)
- ✅ JWT com refresh tokens
- ✅ Validação de ingredientes
- ✅ Validação com express-validator
- ✅ Proteção contra device fraud

## 👥 Usuários de Teste

Após rodar `npm run seed`, usuários de teste são criados automaticamente.
Consulte o arquivo `backend/src/config/seed.js` para detalhes.

> **Nota de Segurança**: Nunca use os usuários de teste em produção.
> Altere todas as credenciais antes do deploy.

## 🚀 Build para Produção

### Android
```bash
cd mobile
eas build --platform android
```

### iOS
```bash
cd mobile
eas build --platform ios
```

## 📄 Licença

MIT
