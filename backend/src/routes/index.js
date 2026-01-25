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

// Rotas da API
router.use('/auth', authRoutes);
router.use('/desserts', dessertRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
