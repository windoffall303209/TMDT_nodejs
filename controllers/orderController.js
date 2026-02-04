/**
 * =============================================================================
 * ORDER CONTROLLER - Điều khiển đơn hàng
 * =============================================================================
 * File này chứa các hàm xử lý logic liên quan đến đơn hàng:
 * - Hiển thị trang thanh toán (checkout)
 * - Tạo đơn hàng mới
 * - Xác nhận đơn hàng
 * - Lịch sử đơn hàng
 * - Xử lý callback thanh toán (VNPay, MoMo)
 * - Mua ngay (Buy Now)
 * =============================================================================
 */

const Order = require('../models/Order');
const Address = require('../models/Address');
const Cart = require('../models/Cart');
const Voucher = require('../models/Voucher');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');

// =============================================================================
// CHECKOUT - THANH TOÁN
// =============================================================================

/**
 * Hiển thị trang thanh toán
 *
 * @description Lấy thông tin giỏ hàng và địa chỉ giao hàng
 *              để hiển thị trên trang checkout
 *
 * @param {Object} req - Request object từ Express
 * @param {Object} res - Response object từ Express
 *
 * @returns {Render|Redirect} Render trang checkout hoặc redirect nếu chưa đăng nhập
 */
exports.showCheckout = async (req, res) => {
    try {
        // Kiểm tra đăng nhập
        if (!req.user) {
            return res.redirect('/auth/login');
        }

        // Lấy giỏ hàng của user
        const cart = await Cart.getOrCreate(req.user.id);
        const cartData = await Cart.calculateTotal(cart.id);

        // Redirect về giỏ hàng nếu trống
        if (cartData.items.length === 0) {
            return res.redirect('/cart');
        }

        // Lấy danh sách địa chỉ giao hàng của user
        const addresses = await Address.findByUser(req.user.id);

        // Lấy danh sách vouchers khả dụng
        const allVouchers = await Voucher.findAll({ is_active: true });
        const now = new Date();

        // Lọc vouchers còn hiệu lực, đủ điều kiện và chỉ lấy voucher giảm giá (không lấy freeship)
        const availableVouchers = allVouchers.filter(v => {
            const startDate = new Date(v.start_date);
            const endDate = new Date(v.end_date);
            const isValid = now >= startDate && now <= endDate &&
                   (v.usage_limit === null || v.used_count < v.usage_limit);

            // Loại bỏ voucher freeship (kiểm tra theo code hoặc name)
            const isFreeship = v.code.toLowerCase().includes('freeship') ||
                               v.code.toLowerCase().includes('ship') ||
                               (v.name && v.name.toLowerCase().includes('freeship'));

            return isValid && !isFreeship;
        });

        console.log('All vouchers:', allVouchers.length);
        console.log('Available vouchers:', availableVouchers.length, availableVouchers.map(v => v.code));

        // Render trang checkout
        res.render('checkout/index', {
            cart: cartData,
            addresses,
            vouchers: availableVouchers,
            user: req.user
        });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).render('error', { message: 'Unable to load checkout' });
    }
};

/**
 * Tạo đơn hàng mới
 *
 * @description Tạo đơn hàng từ giỏ hàng, gửi email xác nhận,
 *              và xử lý thanh toán theo phương thức được chọn
 *
 * @param {Object} req - Request object từ Express
 * @param {Object} req.body - Thông tin đơn hàng
 * @param {number} req.body.address_id - ID địa chỉ giao hàng (bắt buộc)
 * @param {string} req.body.payment_method - Phương thức thanh toán (bắt buộc)
 *                                          'cod' | 'vnpay' | 'momo'
 * @param {string} [req.body.notes] - Ghi chú đơn hàng
 * @param {number} [req.body.shipping_fee] - Phí vận chuyển
 * @param {number} [req.body.discount_amount] - Số tiền giảm giá
 * @param {string} [req.body.voucher_code] - Mã voucher
 * @param {Object} res - Response object từ Express
 *
 * @returns {Redirect} Redirect đến trang xác nhận hoặc trang thanh toán
 */
exports.createOrder = async (req, res) => {
    try {
        // Kiểm tra đăng nhập
        if (!req.user) {
            return res.status(401).json({ message: 'Please login to place order' });
        }

        // Lấy thông tin đơn hàng từ request
        const { address_id, payment_method, notes, shipping_fee, discount_amount, voucher_code } = req.body;

        // Validate dữ liệu bắt buộc
        if (!address_id || !payment_method) {
            return res.status(400).json({ message: 'Address and payment method are required' });
        }

        // Parse giá trị số
        const shippingFee = parseInt(shipping_fee) || 0;
        const discountAmount = parseInt(discount_amount) || 0;

        // Tạo đơn hàng trong database
        const orderResult = await Order.create(req.user.id, address_id, payment_method, notes, shippingFee, discountAmount, voucher_code);

        // Lấy thông tin đầy đủ của đơn hàng
        const order = await Order.findById(orderResult.id);

        // Gửi email xác nhận đơn hàng (async)
        emailService.sendOrderConfirmation(order).catch(err => console.error('Email error:', err));

        // Xử lý thanh toán theo phương thức
        if (payment_method === 'cod') {
            // COD (Thanh toán khi nhận hàng) - Redirect đến trang xác nhận
            return res.redirect(`/orders/${order.order_code}/confirmation`);
        } else if (payment_method === 'vnpay') {
            // VNPay - Tạo link thanh toán và redirect
            const payment = await paymentService.createVNPayPayment(order);
            return res.redirect(payment.paymentUrl);
        } else if (payment_method === 'momo') {
            // MoMo - Hiển thị trang QR code
            const payment = await paymentService.createMoMoPayment(order);
            return res.render('checkout/momo-payment', {
                payment,
                order,
                user: req.user
            });
        }

        // Mặc định redirect đến trang xác nhận
        res.redirect(`/orders/${order.order_code}/confirmation`);
    } catch (error) {
        console.error('Create order error:', error);
        res.status(400).json({ message: error.message });
    }
};

/**
 * Trang xác nhận đơn hàng
 *
 * @description Hiển thị thông tin đơn hàng sau khi đặt thành công
 *
 * @param {Object} req - Request object từ Express
 * @param {Object} req.params.orderCode - Mã đơn hàng
 * @param {Object} res - Response object từ Express
 *
 * @returns {Render} Render trang xác nhận đơn hàng
 */
exports.orderConfirmation = async (req, res) => {
    try {
        const { orderCode } = req.params;

        // Tìm đơn hàng theo mã
        const order = await Order.findByOrderCode(orderCode);

        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }

        // Kiểm tra quyền xem đơn hàng (phải là chủ đơn hàng)
        if (req.user && order.user_id !== req.user.id) {
            return res.status(403).render('error', { message: 'Access denied' });
        }

        // Render trang xác nhận
        res.render('checkout/confirmation', {
            order,
            user: req.user || null
        });
    } catch (error) {
        console.error('Order confirmation error:', error);
        res.status(500).render('error', { message: 'Unable to load order confirmation' });
    }
};

// =============================================================================
// LỊCH SỬ ĐƠN HÀNG
// =============================================================================

/**
 * Lấy lịch sử đơn hàng của người dùng
 *
 * @description Hiển thị danh sách các đơn hàng đã đặt
 *
 * @param {Object} req - Request object từ Express
 * @param {Object} res - Response object từ Express
 *
 * @returns {Render|Redirect} Render trang lịch sử đơn hàng
 */
exports.getOrderHistory = async (req, res) => {
    try {
        // Kiểm tra đăng nhập
        if (!req.user) {
            return res.redirect('/auth/login');
        }

        // Lấy 20 đơn hàng gần nhất của user
        const orders = await Order.findByUser(req.user.id, 20, 0);

        // Render trang lịch sử
        res.render('user/orders', {
            orders,
            user: req.user
        });
    } catch (error) {
        console.error('Order history error:', error);
        res.status(500).render('error', { message: 'Unable to load order history' });
    }
};

// =============================================================================
// CALLBACK THANH TOÁN - PAYMENT CALLBACKS
// =============================================================================

/**
 * Xử lý callback từ VNPay
 *
 * @description Xác minh kết quả thanh toán từ VNPay
 *              và cập nhật trạng thái đơn hàng
 *
 * @param {Object} req - Request object từ Express
 * @param {Object} req.query - Tham số callback từ VNPay
 * @param {Object} res - Response object từ Express
 *
 * @returns {Redirect|Render} Redirect đến trang xác nhận hoặc trang lỗi
 */
exports.vnpayReturn = async (req, res) => {
    try {
        // Xác minh chữ ký và kết quả thanh toán
        const result = await paymentService.verifyVNPayPayment(req.query);

        if (result.success) {
            // Thanh toán thành công - cập nhật trạng thái
            const order = await Order.findByOrderCode(result.orderId);
            await Order.updatePaymentStatus(order.id, 'paid');

            // Redirect đến trang xác nhận
            res.redirect(`/orders/${result.orderId}/confirmation`);
        } else {
            // Thanh toán thất bại
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

/**
 * Xử lý callback từ MoMo
 *
 * @description Xác minh kết quả thanh toán từ MoMo
 *              và cập nhật trạng thái đơn hàng
 *
 * @param {Object} req - Request object từ Express
 * @param {Object} req.body - Dữ liệu callback từ MoMo
 * @param {Object} res - Response object từ Express
 *
 * @returns {Redirect|Render} Redirect đến trang xác nhận hoặc trang lỗi
 */
exports.momoReturn = async (req, res) => {
    try {
        // Xác minh kết quả thanh toán
        const result = await paymentService.verifyMoMoPayment(req.body);

        if (result.success) {
            // Thanh toán thành công
            const order = await Order.findByOrderCode(result.orderId);
            await Order.updatePaymentStatus(order.id, 'paid');

            res.redirect(`/orders/${result.orderId}/confirmation`);
        } else {
            // Thanh toán thất bại
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

// =============================================================================
// MUA NGAY - BUY NOW
// =============================================================================

/**
 * Hiển thị trang mua ngay (checkout cho 1 sản phẩm)
 *
 * @description Cho phép mua trực tiếp 1 sản phẩm mà không cần thêm vào giỏ hàng
 *
 * @param {Object} req - Request object từ Express
 * @param {Object} req.params.productId - ID sản phẩm cần mua
 * @param {Object} res - Response object từ Express
 *
 * @returns {Render|Redirect} Render trang mua ngay hoặc redirect nếu chưa đăng nhập
 */
exports.showBuyNow = async (req, res) => {
    try {
        // Kiểm tra đăng nhập, lưu redirect URL để quay lại sau khi login
        if (!req.user) {
            return res.redirect('/auth/login?redirect=/orders/buy-now/' + req.params.productId);
        }

        const { productId } = req.params;
        const Product = require('../models/Product');

        // Lấy thông tin sản phẩm
        const product = await Product.findById(parseInt(productId));

        if (!product) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy sản phẩm',
                user: req.user
            });
        }

        // Lấy địa chỉ giao hàng của user
        const addresses = await Address.findByUser(req.user.id);

        // Tạo cấu trúc giỏ hàng giả cho trang checkout
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

        // Render trang mua ngay
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

/**
 * Tạo đơn hàng mua ngay (1 sản phẩm)
 *
 * @description Tạo đơn hàng trực tiếp từ 1 sản phẩm mà không qua giỏ hàng
 *
 * @param {Object} req - Request object từ Express
 * @param {Object} req.body - Thông tin đơn hàng
 * @param {number} req.body.product_id - ID sản phẩm (bắt buộc)
 * @param {number} [req.body.quantity=1] - Số lượng mua
 * @param {number} req.body.address_id - ID địa chỉ giao hàng (bắt buộc)
 * @param {string} req.body.payment_method - Phương thức thanh toán (bắt buộc)
 * @param {string} [req.body.notes] - Ghi chú đơn hàng
 * @param {Object} res - Response object từ Express
 *
 * @returns {Redirect|JSON} Redirect đến trang thanh toán hoặc trả về JSON lỗi
 */
exports.createBuyNowOrder = async (req, res) => {
    try {
        // Kiểm tra đăng nhập
        if (!req.user) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập' });
        }

        const { product_id, quantity, address_id, payment_method, notes } = req.body;

        // Validate dữ liệu bắt buộc
        if (!product_id || !address_id || !payment_method) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        }

        // Lấy thông tin sản phẩm
        const Product = require('../models/Product');
        const product = await Product.findById(parseInt(product_id));

        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        // Tạo đơn hàng trực tiếp từ sản phẩm (không qua giỏ hàng)
        const orderResult = await Order.createFromProduct(
            req.user.id,
            address_id,
            product,
            parseInt(quantity) || 1,
            payment_method,
            notes
        );

        // Lấy thông tin đầy đủ đơn hàng
        const order = await Order.findById(orderResult.id);

        // Gửi email xác nhận
        emailService.sendOrderConfirmation(order).catch(err => console.error('Email error:', err));

        // Xử lý thanh toán theo phương thức
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

// =============================================================================
// VOUCHER - MÃ GIẢM GIÁ
// =============================================================================

/**
 * Kiểm tra và áp dụng voucher
 *
 * @description Validate mã voucher và trả về số tiền giảm giá
 *
 * @param {Object} req - Request object từ Express
 * @param {Object} req.body.code - Mã voucher
 * @param {Object} req.body.order_amount - Tổng tiền đơn hàng
 * @param {Object} res - Response object từ Express
 *
 * @returns {JSON} Trả về thông tin voucher và số tiền giảm
 */
exports.validateVoucher = async (req, res) => {
    try {
        const { code, order_amount } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mã voucher'
            });
        }

        const orderAmount = parseFloat(order_amount) || 0;
        const userId = req.user ? req.user.id : null;

        // Validate voucher
        const result = await Voucher.validate(code, userId, orderAmount);

        if (!result.valid) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        // Trả về thông tin voucher hợp lệ
        res.json({
            success: true,
            message: 'Áp dụng mã giảm giá thành công',
            voucher: {
                code: result.voucher.code,
                name: result.voucher.name,
                type: result.voucher.type,
                value: result.voucher.value
            },
            discount_amount: result.discountAmount
        });
    } catch (error) {
        console.error('Validate voucher error:', error);
        res.status(400).json({
            success: false,
            message: 'Có lỗi xảy ra khi kiểm tra voucher'
        });
    }
};
