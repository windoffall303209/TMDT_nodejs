const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Show forms
router.get('/register', authController.showRegister);
router.get('/login', authController.showLogin);

// Authentication actions
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/logout', authController.logout);

// Protected routes
router.get('/profile', verifyToken, authController.getProfile);
router.post('/profile', verifyToken, authController.updateProfile);

// Address management
router.post('/address', verifyToken, authController.createAddress);

module.exports = router;
