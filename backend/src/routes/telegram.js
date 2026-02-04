/**
 * Telegram bot webhook
 */

const express = require('express');
const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const SUPABASE_HEALTH_PATH = '/auth/v1/health';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const checkSupabase = async () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, message: 'Supabase env vars missing' };
  }

  const url = `${SUPABASE_URL.replace(/\/$/, '')}${SUPABASE_HEALTH_PATH}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { ok: false, message: `Supabase status ${response.status}` };
    }

    return { ok: true, message: 'Supabase OK' };
  } catch (err) {
    clearTimeout(timeout);
    return { ok: false, message: 'Supabase unreachable' };
  }
};

const sendTelegramMessage = async (chatId, text, replyMarkup) => {
  if (!TELEGRAM_BOT_TOKEN) {
    return;
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: replyMarkup
    })
  });
};

const buildKeyboard = () => ({
  inline_keyboard: [
    [{ text: 'Testar Supabase', callback_data: 'status' }]
  ]
});

router.post('/webhook', async (req, res) => {
  const update = req.body || {};

  // Messages (/start, /status)
  if (update.message && update.message.chat && update.message.text) {
    const chatId = update.message.chat.id;
    const text = update.message.text.trim();

    if (text === '/start') {
      await sendTelegramMessage(
        chatId,
        'Pronto! Use o botao abaixo para testar o Supabase.',
        buildKeyboard()
      );
      return res.json({ ok: true });
    }

    if (text === '/status') {
      const result = await checkSupabase();
      const reply = result.ok
        ? `✅ Supabase OK — ${SUPABASE_URL}`
        : `🚨 Supabase offline — ${SUPABASE_URL} (${result.message})`;
      await sendTelegramMessage(chatId, reply, buildKeyboard());
      return res.json({ ok: true });
    }
  }

  // Button click
  if (update.callback_query && update.callback_query.message) {
    const chatId = update.callback_query.message.chat.id;
    if (update.callback_query.data === 'status') {
      const result = await checkSupabase();
      const reply = result.ok
        ? `✅ Supabase OK — ${SUPABASE_URL}`
        : `🚨 Supabase offline — ${SUPABASE_URL} (${result.message})`;
      await sendTelegramMessage(chatId, reply, buildKeyboard());
      return res.json({ ok: true });
    }
  }

  // Ignore other updates
  await sleep(10);
  return res.json({ ok: true });
});

module.exports = router;
