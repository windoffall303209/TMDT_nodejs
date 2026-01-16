const Order = require('../models/Order');
const Address = require('../models/Address');
const Cart = require('../models/Cart');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');

// Show checkout page
exports.showCheckout = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect('/auth/login');
        }

        // Get user's cart
        const cart = await Cart.getOrCreate(req.user.id);
        const cartData = await Cart.calculateTotal(cart.id);

        if (cartData.items.length === 0) {
            return res.redirect('/cart');
        }

        // Get user's addresses
        const addresses = await Address.findByUser(req.user.id);

        res.render('checkout/index', {
            cart: cartData,
            addresses,
            user: req.user
        });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).render('error', { message: 'Unable to load checkout' });
    }
};

// Create order
exports.createOrder = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please login to place order' });
        }

        const { address_id, payment_method, notes } = req.body;

        if (!address_id || !payment_method) {
            return res.status(400).json({ message: 'Address and payment method are required' });
        }

        // Create order
        const orderResult = await Order.create(req.user.id, address_id, payment_method, notes);
        
        // Get full order details
        const order = await Order.findById(orderResult.id);

        // Send order confirmation email

        emailService.sendOrderConfirmation(order).catch(err => console.error('Email error:', err));

        // Process payment based on method
        if (payment_method === 'cod') {
            // COD - redirect to confirmation page
            return res.redirect(`/orders/${order.order_code}/confirmation`);
        } else if (payment_method === 'vnpay') {
            // VNPay - redirect to payment URL
            const payment = await paymentService.createVNPayPayment(order);
            return res.redirect(payment.paymentUrl);
        } else if (payment_method === 'momo') {
            // MoMo - show QR code page
            const payment = await paymentService.createMoMoPayment(order);
            return res.render('checkout/momo-payment', {
                payment,
                order,
                user: req.user
            });
        }

        res.redirect(`/orders/${order.order_code}/confirmation`);
    } catch (error) {
        console.error('Create order error:', error);
        res.status(400).json({ message: error.message });
    }
};

// Order confirmation page
exports.orderConfirmation = async (req, res) => {
    try {
        const { orderCode } = req.params;
        
        const order = await Order.findByOrderCode(orderCode);
        
        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }

        // Check if order belongs to user
        if (req.user && order.user_id !== req.user.id) {
            return res.status(403).render('error', { message: 'Access denied' });
        }

        res.render('checkout/confirmation', {
            order,
            user: req.user || null
        });
    } catch (error) {
        console.error('Order confirmation error:', error);
        res.status(500).render('error', { message: 'Unable to load order confirmation' });
    }
};

// Get user order history
exports.getOrderHistory = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect('/auth/login');
        }

        const orders = await Order.findByUser(req.user.id, 20, 0);

        res.render('user/orders', {
            orders,
            user: req.user
        });
    } catch (error) {
        console.error('Order history error:', error);
        res.status(500).render('error', { message: 'Unable to load order history' });
    }
};

// VNPay return callback
exports.vnpayReturn = async (req, res) => {
    try {
        const result = await paymentService.verifyVNPayPayment(req.query);

        if (result.success) {
            // Update order payment status
            const order = await Order.findByOrderCode(result.orderId);
            await Order.updatePaymentStatus(order.id, 'paid');

            res.redirect(`/orders/${result.orderId}/confirmation`);
        } else {
            res.render('checkout/payment-failed', {
                message: 'Payment failed. Please try again.',
                user: req.user || null
            });
        }
    } catch (error) {
        console.error('VNPay callback error:', error);
        res.status(500).render('error', { message: 'Payment verification failed' });
    }
};

// MoMo return callback
exports.momoReturn = async (req, res) => {
    try {
        const result = await paymentService.verifyMoMoPayment(req.body);

        if (result.success) {
            // Update order payment status
            const order = await Order.findByOrderCode(result.orderId);
            await Order.updatePaymentStatus(order.id, 'paid');

            res.redirect(`/orders/${result.orderId}/confirmation`);
        } else {
            res.render('checkout/payment-failed', {
                message: 'Payment failed. Please try again.',
                user: req.user || null
            });
        }
    } catch (error) {
        console.error('MoMo callback error:', error);
        res.status(500).render('error', { message: 'Payment verification failed' });
    }
};

// Show buy now page (single product checkout)
exports.showBuyNow = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect('/auth/login?redirect=/orders/buy-now/' + req.params.productId);
        }

        const { productId } = req.params;
        const Product = require('../models/Product');
        
        const product = await Product.findById(parseInt(productId));
        
        if (!product) {
            return res.status(404).render('error', { 
                message: 'Không tìm thấy sản phẩm', 
                user: req.user 
            });
        }

        // Get user's addresses
        const addresses = await Address.findByUser(req.user.id);

        // Create a cart-like structure for the checkout view
        const buyNowItem = {
            product_id: product.id,
            product_name: product.name,
            product_slug: product.slug,
            product_image: product.images && product.images.length > 0 ? product.images[0].image_url : null,
            unit_price: product.final_price || product.price,
            quantity: 1,
            subtotal: product.final_price || product.price
        };

        const cart = {
            items: [buyNowItem],
            subtotal: buyNowItem.subtotal,
            itemCount: 1
        };

        res.render('checkout/buy-now', {
            cart,
            product,
            addresses,
            user: req.user,
            isBuyNow: true
        });
    } catch (error) {
        console.error('Buy now error:', error);
        res.status(500).render('error', { 
            message: 'Không thể tải trang mua hàng: ' + error.message, 
            user: req.user 
        });
    }
};

// Create buy now order (single product)
exports.createBuyNowOrder = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập' });
        }

        const { product_id, quantity, address_id, payment_method, notes } = req.body;

        if (!product_id || !address_id || !payment_method) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        }

        const Product = require('../models/Product');
        const product = await Product.findById(parseInt(product_id));
        
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        // Create order directly without cart
        const orderResult = await Order.createFromProduct(
            req.user.id,
            address_id,
            product,
            parseInt(quantity) || 1,
            payment_method,
            notes
        );
        
        const order = await Order.findById(orderResult.id);

        // Send order confirmation email
        emailService.sendOrderConfirmation(order).catch(err => console.error('Email error:', err));

        // Process payment based on method
        if (payment_method === 'cod') {
            return res.redirect(`/orders/${order.order_code}/confirmation`);
        } else if (payment_method === 'vnpay') {
            const payment = await paymentService.createVNPayPayment(order);
            return res.redirect(payment.paymentUrl);
        } else if (payment_method === 'momo') {
            const payment = await paymentService.createMoMoPayment(order);
            return res.render('checkout/momo-payment', {
                payment,
                order,
                user: req.user
            });
        }

        res.redirect(`/orders/${order.order_code}/confirmation`);
    } catch (error) {
        console.error('Create buy now order error:', error);
        res.status(400).json({ message: error.message });
    }
};
