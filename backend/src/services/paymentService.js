/**
 * Serviço de Pagamento
 *
 * Cria sessões de pagamento com Stripe Checkout.
 */

const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const STRIPE_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL;
const STRIPE_CANCEL_URL = process.env.STRIPE_CANCEL_URL;

let stripe = null;
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
}

function ensureStripeConfigured() {
  if (!stripe || !STRIPE_PRICE_ID || !STRIPE_SUCCESS_URL || !STRIPE_CANCEL_URL) {
    const missing = [];
    if (!STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
    if (!STRIPE_PRICE_ID) missing.push('STRIPE_PRICE_ID');
    if (!STRIPE_SUCCESS_URL) missing.push('STRIPE_SUCCESS_URL');
    if (!STRIPE_CANCEL_URL) missing.push('STRIPE_CANCEL_URL');

    const message = `Stripe não configurado. Variáveis ausentes: ${missing.join(', ')}`;
    const error = new Error(message);
    error.code = 'STRIPE_NOT_CONFIGURED';
    throw error;
  }
}

async function createCheckoutSession({ userId, email }) {
  ensureStripeConfigured();

  return stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: STRIPE_PRICE_ID,
        quantity: 1
      }
    ],
    customer_email: email,
    success_url: STRIPE_SUCCESS_URL,
    cancel_url: STRIPE_CANCEL_URL,
    metadata: {
      userId: String(userId),
      product: 'premium_upgrade'
    }
  });
}

module.exports = {
  createCheckoutSession
};
