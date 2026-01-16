const Cart = require('../models/Cart');

// View cart
exports.viewCart = async (req, res) => {
    try {
        // Get or create cart
        const userId = req.user ? req.user.id : null;
        const sessionId = req.session ? req.session.id : null;
        
        console.log('viewCart - userId:', userId, 'sessionId:', sessionId);
        
        const cart = await Cart.getOrCreate(userId, sessionId);
        const cartData = await Cart.calculateTotal(cart.id);

        res.render('cart/index', {
            cart: cartData,
            user: req.user || null
        });
    } catch (error) {
        console.error('Cart view error:', error);
        res.status(500).render('error', { message: 'Lỗi tải giỏ hàng: ' + error.message, user: req.user || null });
    }
};

// Add to cart
exports.addToCart = async (req, res) => {
    try {
        const { product_id, quantity = 1, variant_id } = req.body;
        
        console.log('addToCart - body:', req.body);
        console.log('addToCart - user:', req.user ? req.user.id : 'guest');
        console.log('addToCart - session:', req.session ? req.session.id : 'no session');

        if (!product_id) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        // Get or create cart
        const userId = req.user ? req.user.id : null;
        const sessionId = req.session ? req.session.id : null;
        
        if (!userId && !sessionId) {
            return res.status(400).json({ success: false, message: 'No session available' });
        }
        
        const cart = await Cart.getOrCreate(userId, sessionId);
        console.log('addToCart - cart:', cart);
        
        // Add item to cart
        await Cart.addItem(cart.id, parseInt(product_id), parseInt(quantity), variant_id);
        
        // Get updated cart count
        const cartCount = await Cart.getCartCount(cart.id);
        console.log('addToCart - success, cartCount:', cartCount);

        return res.json({
            success: true,
            message: 'Đã thêm vào giỏ hàng!',
            cartCount
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(400).json({ success: false, message: 'Lỗi thêm giỏ hàng: ' + error.message });
    }
};

// Update cart item quantity
exports.updateCart = async (req, res) => {
    try {
        const { cart_item_id, quantity } = req.body;

        if (!cart_item_id || quantity === undefined) {
            return res.status(400).json({ message: 'Cart item ID and quantity are required' });
        }

        await Cart.updateQuantity(cart_item_id, parseInt(quantity));

        if (req.accepts('json')) {
            return res.json({ message: 'Cart updated successfully' });
        }

        res.redirect('/cart');
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(400).json({ message: error.message });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const { cart_item_id } = req.body;

        if (!cart_item_id) {
            return res.status(400).json({ message: 'Cart item ID is required' });
        }

        await Cart.removeItem(cart_item_id);

        if (req.accepts('json')) {
            return res.json({ message: 'Item removed from cart' });
        }

        res.redirect('/cart');
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(400).json({ message: error.message });
    }
};

// Get cart count (for header)
exports.getCartCount = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const sessionId = req.session ? req.session.id : null;
        
        const cart = await Cart.getOrCreate(userId, sessionId);
        const count = await Cart.getCartCount(cart.id);

        res.json({ count });
    } catch (error) {
        res.json({ count: 0 });
    }
};
