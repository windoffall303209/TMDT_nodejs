const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, optionalAuth } = require('../middleware/auth');

// Checkout (requires login)
router.get('/checkout', verifyToken, orderController.showCheckout);
router.post('/create', verifyToken, orderController.createOrder);

// Buy now - single product checkout (requires login)
router.get('/buy-now/:productId', verifyToken, orderController.showBuyNow);
router.post('/buy-now/create', verifyToken, orderController.createBuyNowOrder);

// Order confirmation (public with order code)
router.get('/:orderCode/confirmation', optionalAuth, orderController.orderConfirmation);

// Order history (requires login)
router.get('/history', verifyToken, orderController.getOrderHistory);

// Payment callbacks
router.get('/payment/vnpay/callback', orderController.vnpayReturn);
router.post('/payment/momo/callback', orderController.momoReturn);

module.exports = router;
