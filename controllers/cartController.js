/**
 * =============================================================================
 * CART CONTROLLER - Điều khiển giỏ hàng
 * =============================================================================
 * File này chứa các hàm xử lý logic liên quan đến giỏ hàng:
 * - Xem giỏ hàng
 * - Thêm sản phẩm vào giỏ
 * - Cập nhật số lượng sản phẩm
 * - Xóa sản phẩm khỏi giỏ
 * - Lấy số lượng sản phẩm trong giỏ
 * =============================================================================
 */

const Cart = require('../models/Cart');

/**
 * Hiển thị trang giỏ hàng
 *
 * @description Lấy thông tin giỏ hàng của người dùng (đăng nhập hoặc khách)
 *              và render ra trang giỏ hàng với danh sách sản phẩm
 *
 * @param {Object} req - Request object từ Express
 * @param {Object} req.user - Thông tin user đã đăng nhập (nếu có)
 * @param {Object} req.session - Session của người dùng (cho khách)
 * @param {Object} res - Response object từ Express
 *
 * @returns {void} Render trang cart/index với dữ liệu giỏ hàng
 */
exports.viewCart = async (req, res) => {
    try {
        // Lấy userId từ user đã đăng nhập, hoặc null nếu là khách
        const userId = req.user ? req.user.id : null;
        // Lấy sessionId để hỗ trợ giỏ hàng cho khách chưa đăng nhập
        const sessionId = req.session ? req.session.id : null;

        // Lấy hoặc tạo mới giỏ hàng dựa trên userId hoặc sessionId
        const cart = await Cart.getOrCreate(userId, sessionId);
        // Tính tổng tiền và lấy danh sách sản phẩm trong giỏ
        const cartData = await Cart.calculateTotal(cart.id);

        // Render trang giỏ hàng với dữ liệu
        res.render('cart/index', {
            cart: cartData,
            user: req.user || null
        });
    } catch (error) {
        console.error('Cart view error:', error);
        res.status(500).render('error', { message: 'Lỗi tải giỏ hàng: ' + error.message, user: req.user || null });
    }
};

/**
 * Thêm sản phẩm vào giỏ hàng
 *
 * @description Nhận thông tin sản phẩm từ request body và thêm vào giỏ hàng.
 *              Hỗ trợ cả người dùng đã đăng nhập và khách (dùng session)
 *
 * @param {Object} req - Request object từ Express
 * @param {Object} req.body - Dữ liệu từ form/API
 * @param {number} req.body.product_id - ID của sản phẩm cần thêm (bắt buộc)
 * @param {number} [req.body.quantity=1] - Số lượng sản phẩm (mặc định: 1)
 * @param {number} [req.body.variant_id] - ID biến thể sản phẩm (size, màu...)
 * @param {Object} res - Response object từ Express
 *
 * @returns {JSON} Trả về JSON với trạng thái thành công và số lượng giỏ hàng mới
 */
exports.addToCart = async (req, res) => {
    try {
        // Lấy thông tin sản phẩm từ request body
        const { product_id, quantity = 1, variant_id } = req.body;

        // Kiểm tra product_id có được cung cấp không
        if (!product_id) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        // Xác định người dùng: đăng nhập (userId) hoặc khách (sessionId)
        const userId = req.user ? req.user.id : null;
        const sessionId = req.session ? req.session.id : null;

        // Cần ít nhất một trong hai để xác định giỏ hàng
        if (!userId && !sessionId) {
            return res.status(400).json({ success: false, message: 'No session available' });
        }

        // Lấy hoặc tạo giỏ hàng cho người dùng/khách
        const cart = await Cart.getOrCreate(userId, sessionId);

        // Thêm sản phẩm vào giỏ hàng
        await Cart.addItem(cart.id, parseInt(product_id), parseInt(quantity), variant_id);

        // Lấy số lượng sản phẩm mới trong giỏ để cập nhật UI
        const cartCount = await Cart.getCartCount(cart.id);

        // Trả về kết quả thành công
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

/**
 * Cập nhật số lượng sản phẩm trong giỏ hàng
 *
 * @description Thay đổi số lượng của một sản phẩm đã có trong giỏ.
 *              Nếu quantity = 0, sản phẩm sẽ bị xóa khỏi giỏ
 *
 * @param {Object} req - Request object từ Express
 * @param {Object} req.body - Dữ liệu cập nhật
 * @param {number} req.body.cart_item_id - ID của item trong giỏ hàng (bắt buộc)
 * @param {number} req.body.quantity - Số lượng mới (bắt buộc)
 * @param {Object} res - Response object từ Express
 *
 * @returns {JSON|Redirect} Trả về JSON hoặc redirect về trang giỏ hàng
 */
exports.updateCart = async (req, res) => {
    try {
        // Lấy thông tin cập nhật từ request body
        const { cart_item_id, quantity } = req.body;

        // Validate: cần có cả cart_item_id và quantity
        if (!cart_item_id || quantity === undefined) {
            return res.status(400).json({ success: false, message: 'Cart item ID and quantity are required' });
        }

        // Cập nhật số lượng sản phẩm trong database
        await Cart.updateQuantity(cart_item_id, parseInt(quantity));

        // Lấy thông tin item đã cập nhật
        const updatedItem = await Cart.getItemById(cart_item_id);

        // Nếu request chấp nhận JSON, trả về JSON với thông tin item
        if (req.accepts('json')) {
            return res.json({
                success: true,
                item: updatedItem
            });
        }

        // Nếu không, redirect về trang giỏ hàng
        res.redirect('/cart');
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * Xóa sản phẩm khỏi giỏ hàng
 *
 * @description Xóa hoàn toàn một sản phẩm khỏi giỏ hàng dựa trên cart_item_id
 *
 * @param {Object} req - Request object từ Express
 * @param {Object} req.body - Dữ liệu xóa
 * @param {number} req.body.cart_item_id - ID của item cần xóa (bắt buộc)
 * @param {Object} res - Response object từ Express
 *
 * @returns {JSON|Redirect} Trả về JSON hoặc redirect về trang giỏ hàng
 */
exports.removeFromCart = async (req, res) => {
    try {
        // Lấy cart_item_id từ request body
        const { cart_item_id } = req.body;

        // Validate: cần có cart_item_id
        if (!cart_item_id) {
            return res.status(400).json({ success: false, message: 'Cart item ID is required' });
        }

        // Xóa sản phẩm khỏi giỏ hàng
        await Cart.removeItem(cart_item_id);

        // Trả về JSON nếu request chấp nhận
        if (req.accepts('json')) {
            return res.json({ success: true });
        }

        // Redirect về trang giỏ hàng
        res.redirect('/cart');
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * Lấy số lượng sản phẩm trong giỏ hàng (cho header)
 *
 * @description API endpoint để lấy số lượng sản phẩm trong giỏ,
 *              thường được gọi bằng AJAX để cập nhật icon giỏ hàng trên header
 *
 * @param {Object} req - Request object từ Express
 * @param {Object} res - Response object từ Express
 *
 * @returns {JSON} Trả về JSON với số lượng sản phẩm: { count: number }
 */
exports.getCartCount = async (req, res) => {
    try {
        // Xác định người dùng
        const userId = req.user ? req.user.id : null;
        const sessionId = req.session ? req.session.id : null;

        // Lấy giỏ hàng
        const cart = await Cart.getOrCreate(userId, sessionId);
        // Đếm số lượng sản phẩm
        const count = await Cart.getCartCount(cart.id);

        // Trả về số lượng
        res.json({ count });
    } catch (error) {
        // Nếu lỗi, trả về 0
        res.json({ count: 0 });
    }
};
