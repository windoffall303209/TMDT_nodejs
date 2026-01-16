const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { optionalAuth } = require('../middleware/auth');

// Import route modules
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const adminRoutes = require('./adminRoutes');

// Homepage
router.get('/', optionalAuth, productController.getHomePage);

// Mount route modules
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
