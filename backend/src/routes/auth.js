/**
 * Auth routes
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Deprecated endpoints (Supabase handles auth)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/apple', authController.appleAuth);
router.post('/refresh', authController.refreshToken);

// Current session/profile
router.get('/me', authenticate, authController.me);

// Logout
router.post('/logout', authenticate, authController.logout);

module.exports = router;
