/**
 * Agregador de Rotas
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const dessertRoutes = require('./desserts');
const userRoutes = require('./users');
const adminRoutes = require('./admin');

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Supabase health check (keep-alive)
router.get('/health/supabase', async (req, res) => {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({
      status: 'error',
      message: 'Supabase env vars missing'
    });
  }

  const healthUrl = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/health`;

  try {
    const response = await fetch(healthUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      return res.status(response.status).json({
        status: 'error',
        supabase: data
      });
    }

    return res.json({
      status: 'ok',
      supabase: data
    });
  } catch {
    return res.status(500).json({
      status: 'error',
      message: 'Supabase health check failed'
    });
  }
});

// Rotas da API
router.use('/auth', authRoutes);
router.use('/desserts', dessertRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
