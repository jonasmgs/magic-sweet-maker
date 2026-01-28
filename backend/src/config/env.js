/**
 * Validação de Variáveis de Ambiente
 *
 * Valida variáveis obrigatórias na inicialização.
 * Falha rápido se variáveis críticas não estiverem definidas.
 */

const crypto = require('crypto');

/**
 * Variáveis obrigatórias em produção
 */
const REQUIRED_IN_PRODUCTION = [
  'JWT_SECRET',
  'GEMINI_API_KEY',
  'CORS_ORIGIN',
];

/**
 * Variáveis obrigatórias em qualquer ambiente
 */
const REQUIRED_ALWAYS = [
  'JWT_SECRET',
];

/**
 * Valida se a variável está definida e não é um placeholder
 */
function isValidValue(value, name) {
  if (!value) return false;

  // Detectar placeholders comuns
  const placeholders = [
    'your-', 'sua-', 'change-me', 'mude-', 'replace-', 'substitua-',
    'xxx', 'TODO', 'FIXME', 'example', 'exemplo'
  ];

  const lowerValue = value.toLowerCase();
  for (const placeholder of placeholders) {
    if (lowerValue.includes(placeholder)) {
      console.warn(`⚠️  AVISO: ${name} parece conter um placeholder: "${value.substring(0, 20)}..."`);
      return false;
    }
  }

  return true;
}

/**
 * Valida força do JWT_SECRET
 */
function validateJwtSecret(secret) {
  if (!secret) {
    throw new Error('❌ JWT_SECRET não está definido. Gere uma chave com: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  }

  if (secret.length < 32) {
    throw new Error('❌ JWT_SECRET muito curto. Use pelo menos 32 caracteres.');
  }

  // Verificar se não é uma string simples repetitiva
  if (/^(.)\1+$/.test(secret)) {
    throw new Error('❌ JWT_SECRET não pode ser uma string repetitiva.');
  }

  // Verificar entropia básica
  const uniqueChars = new Set(secret).size;
  if (uniqueChars < 10) {
    console.warn('⚠️  AVISO: JWT_SECRET tem baixa entropia. Considere usar uma chave mais complexa.');
  }
}

/**
 * Valida todas as variáveis de ambiente
 */
function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';
  const errors = [];
  const warnings = [];

  console.log('\n🔐 Validando variáveis de ambiente...\n');

  // Verificar variáveis obrigatórias sempre
  for (const varName of REQUIRED_ALWAYS) {
    if (!process.env[varName]) {
      errors.push(`${varName} é obrigatório`);
    }
  }

  // Verificar variáveis obrigatórias em produção
  if (isProd) {
    for (const varName of REQUIRED_IN_PRODUCTION) {
      if (!process.env[varName]) {
        errors.push(`${varName} é obrigatório em produção`);
      } else if (!isValidValue(process.env[varName], varName)) {
        warnings.push(`${varName} pode estar com valor de placeholder`);
      }
    }
  }

  // Validar JWT_SECRET especificamente
  try {
    validateJwtSecret(process.env.JWT_SECRET);
    console.log('✅ JWT_SECRET válido');
  } catch (err) {
    errors.push(err.message);
  }

  // Validar CORS em produção
  if (isProd && process.env.CORS_ORIGIN === '*') {
    errors.push('CORS_ORIGIN não pode ser "*" em produção. Defina os domínios permitidos.');
  }

  // Mostrar warnings
  for (const warning of warnings) {
    console.warn(`⚠️  ${warning}`);
  }

  // Mostrar erros e falhar se houver
  if (errors.length > 0) {
    console.error('\n❌ Erros de configuração encontrados:\n');
    for (const error of errors) {
      console.error(`   • ${error}`);
    }
    console.error('\n');

    if (isProd) {
      throw new Error('Configuração inválida. Corrija os erros acima antes de iniciar em produção.');
    } else {
      console.warn('⚠️  Continuando em modo de desenvolvimento, mas corrija estes problemas antes do deploy.\n');
    }
  } else {
    console.log('✅ Todas as variáveis de ambiente válidas\n');
  }
}

/**
 * Gera uma chave segura para JWT_SECRET
 */
function generateSecureSecret() {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Obtém JWT_SECRET com validação
 * NÃO usa fallback - requer configuração explícita
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    const generatedSecret = generateSecureSecret();
    console.error(`
❌ JWT_SECRET não está configurado!

Para desenvolvimento, adicione ao seu .env:
JWT_SECRET=${generatedSecret}

Para produção, gere uma nova chave segura:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    `);
    throw new Error('JWT_SECRET é obrigatório');
  }

  return secret;
}

/**
 * Obtém configuração de CORS segura
 */
function getCorsOrigin() {
  const origin = process.env.CORS_ORIGIN;
  const isProd = process.env.NODE_ENV === 'production';

  if (!origin && isProd) {
    throw new Error('CORS_ORIGIN é obrigatório em produção');
  }

  // Em desenvolvimento, permitir localhost
  if (!origin || origin === '*') {
    if (isProd) {
      throw new Error('CORS_ORIGIN não pode ser "*" em produção');
    }
    // Em desenvolvimento, permitir apenas localhost
    return ['http://localhost:3000', 'http://localhost:8081', 'http://10.0.2.2:3000'];
  }

  // Parsear múltiplas origens separadas por vírgula
  return origin.split(',').map(o => o.trim());
}

module.exports = {
  validateEnv,
  getJwtSecret,
  getCorsOrigin,
  generateSecureSecret
};
