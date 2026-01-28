/**
 * =============================================================================
 * ORDER MODEL - Mô hình đơn hàng
 * =============================================================================
 * File này chứa các phương thức xử lý đơn hàng:
 * - Tạo đơn hàng từ giỏ hàng hoặc mua ngay
 * - Tìm kiếm đơn hàng theo ID, mã đơn, user
 * - Cập nhật trạng thái đơn hàng và thanh toán
 * - Thống kê đơn hàng (admin)
 * =============================================================================
 */

const pool = require('../config/database');

class Order {
    // =========================================================================
    // TẠO ĐƠN HÀNG
    // =========================================================================

    /**
     * Tạo đơn hàng từ giỏ hàng
     *
     * @description Tạo đơn hàng mới từ các sản phẩm trong giỏ hàng của user.
     *              Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
     *
     * @param {number} userId - ID người dùng
     * @param {number} addressId - ID địa chỉ giao hàng
     * @param {string} paymentMethod - Phương thức thanh toán (cod/vnpay/momo)
     * @param {string|null} notes - Ghi chú đơn hàng
     * @param {number|null} shippingFeeFromUI - Phí ship từ frontend (null = tự tính)
     * @param {number} discountAmount - Số tiền giảm giá từ voucher
     * @param {string|null} voucherCode - Mã voucher đã áp dụng
     *
     * @returns {Object} { id, order_code, final_amount }
     * @throws {Error} Nếu giỏ hàng trống hoặc không tìm thấy
     */
    static async create(userId, addressId, paymentMethod, notes = null, shippingFeeFromUI = null, discountAmount = 0, voucherCode = null) {
        // Lấy connection để sử dụng transaction
        const connection = await pool.getConnection();

        try {
            // Bắt đầu transaction
            await connection.beginTransaction();

            // Lấy giỏ hàng của user
            const Cart = require('./Cart');
            const [carts] = await connection.execute(
                'SELECT id FROM cart WHERE user_id = ?',
                [userId]
            );

            if (carts.length === 0) {
                throw new Error('Cart not found');
            }

            const cartId = carts[0].id;
            const cartData = await Cart.calculateTotal(cartId);

            // Kiểm tra giỏ hàng không rỗng
            if (cartData.items.length === 0) {
                throw new Error('Cart is empty');
            }

            // Tạo mã đơn hàng unique: ORD + timestamp + random
            const orderCode = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

            // Tính phí ship: miễn phí nếu đơn >= 500k, còn lại 30k
            const shippingFee = shippingFeeFromUI !== null ? shippingFeeFromUI : (cartData.subtotal >= 500000 ? 0 : 30000);

            // Tính tổng tiền cuối: tổng sản phẩm + ship - giảm giá
            const finalAmount = cartData.subtotal + shippingFee - discountAmount;

            // Tạo đơn hàng trong database
            const orderQuery = `
                INSERT INTO orders (user_id, address_id, order_code, total_amount, shipping_fee, final_amount, payment_method, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [orderResult] = await connection.execute(orderQuery, [
                userId,
                addressId,
                orderCode,
                cartData.subtotal,
                shippingFee,
                finalAmount,
                paymentMethod,
                notes
            ]);

            const orderId = orderResult.insertId;

            // Tạo các order_items từ giỏ hàng
            for (const item of cartData.items) {
                const orderItemQuery = `
                    INSERT INTO order_items (order_id, product_id, variant_id, product_name, product_image, price, sale_applied, quantity, subtotal)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                // Tính số tiền đã giảm từ sale
                const saleDiscount = item.product_price - item.unit_price;

                await connection.execute(orderItemQuery, [
                    orderId,
                    item.product_id,
                    item.variant_id || null,
                    item.product_name,
                    item.product_image,
                    item.product_price,
                    saleDiscount,
                    item.quantity,
                    item.subtotal
                ]);

                // Cập nhật tồn kho: giảm stock, tăng sold_count
                await connection.execute(
                    'UPDATE products SET stock_quantity = stock_quantity - ?, sold_count = sold_count + ? WHERE id = ?',
                    [item.quantity, item.quantity, item.product_id]
                );
            }

            // Xóa giỏ hàng sau khi đặt hàng thành công
            await connection.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

            // Commit transaction
            await connection.commit();

            return { id: orderId, order_code: orderCode, final_amount: finalAmount };
        } catch (error) {
            // Rollback nếu có lỗi
            await connection.rollback();
            throw error;
        } finally {
            // Giải phóng connection
            connection.release();
        }
    }

    /**
     * Tạo đơn hàng từ một sản phẩm (Mua ngay)
     *
     * @description Tạo đơn hàng trực tiếp từ 1 sản phẩm mà không qua giỏ hàng
     *
     * @param {number} userId - ID người dùng
     * @param {number} addressId - ID địa chỉ giao hàng
     * @param {Object} product - Object sản phẩm (từ Product.findById)
     * @param {number} quantity - Số lượng mua
     * @param {string} paymentMethod - Phương thức thanh toán
     * @param {string|null} notes - Ghi chú
     *
     * @returns {Object} { id, order_code, final_amount }
     */
    static async createFromProduct(userId, addressId, product, quantity, paymentMethod, notes = null) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Tạo mã đơn hàng
            const orderCode = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

            // Tính giá (ưu tiên giá sau sale)
            const price = product.final_price || product.price;
            const subtotal = price * quantity;
            // Phí ship: miễn phí nếu >= 500k
            const shippingFee = subtotal >= 500000 ? 0 : 30000;
            const finalAmount = subtotal + shippingFee;

            // Tạo đơn hàng
            const orderQuery = `
                INSERT INTO orders (user_id, address_id, order_code, total_amount, shipping_fee, final_amount, payment_method, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [orderResult] = await connection.execute(orderQuery, [
                userId,
                addressId,
                orderCode,
                subtotal,
                shippingFee,
                finalAmount,
                paymentMethod,
                notes
            ]);

            const orderId = orderResult.insertId;

            // Tạo order item
            const orderItemQuery = `
                INSERT INTO order_items (order_id, product_id, variant_id, product_name, product_image, price, sale_applied, quantity, subtotal)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            // Lấy ảnh sản phẩm
            const productImage = product.images && product.images.length > 0 ? product.images[0].image_url : null;
            const saleDiscount = product.price - price;

            await connection.execute(orderItemQuery, [
                orderId,
                product.id,
                null,
                product.name,
                productImage,
                product.price,
                saleDiscount,
                quantity,
                subtotal
            ]);

            // Cập nhật tồn kho
            await connection.execute(
                'UPDATE products SET stock_quantity = stock_quantity - ?, sold_count = sold_count + ? WHERE id = ?',
                [quantity, quantity, product.id]
            );

            await connection.commit();

            return { id: orderId, order_code: orderCode, final_amount: finalAmount };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // =========================================================================
    // TÌM KIẾM ĐƠN HÀNG
    // =========================================================================

    /**
     * Lấy đơn hàng theo ID với đầy đủ thông tin
     *
     * @description Lấy thông tin chi tiết đơn hàng bao gồm:
     *              - Thông tin đơn hàng
     *              - Địa chỉ giao hàng
     *              - Thông tin user
     *              - Danh sách sản phẩm
     *              - Thông tin thanh toán
     *
     * @param {number} orderId - ID đơn hàng
     *
     * @returns {Object|null} Đơn hàng đầy đủ hoặc null nếu không tìm thấy
     */
    static async findById(orderId) {
        // Query lấy thông tin đơn hàng kèm địa chỉ và user
        const query = `
            SELECT o.*,
                   a.full_name as shipping_name,
                   a.phone as shipping_phone,
                   a.address_line, a.ward, a.district, a.city,
                   u.email as user_email,
                   u.full_name as user_name
            FROM orders o
            JOIN addresses a ON o.address_id = a.id
            JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
        `;

        const [orders] = await pool.execute(query, [orderId]);
        const order = orders[0];

        if (!order) return null;

        // Lấy danh sách sản phẩm trong đơn
        const [items] = await pool.execute(
            'SELECT * FROM order_items WHERE order_id = ?',
            [orderId]
        );
        order.items = items;

        // Lấy thông tin thanh toán gần nhất
        const [payments] = await pool.execute(
            'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
            [orderId]
        );
        order.payment = payments[0] || null;

        return order;
    }

    /**
     * Lấy đơn hàng theo mã đơn hàng
     *
     * @param {string} orderCode - Mã đơn hàng (VD: ORD1234567890123)
     *
     * @returns {Object|null} Đơn hàng đầy đủ hoặc null
     */
    static async findByOrderCode(orderCode) {
        const [orders] = await pool.execute('SELECT id FROM orders WHERE order_code = ?', [orderCode]);
        if (orders.length > 0) {
            return await this.findById(orders[0].id);
        }
        return null;
    }

    /**
     * Lấy danh sách đơn hàng của user
     *
     * @description Lấy lịch sử đơn hàng của người dùng với phân trang
     *
     * @param {number} userId - ID người dùng
     * @param {number} limit - Số lượng đơn hàng tối đa (mặc định: 20)
     * @param {number} offset - Vị trí bắt đầu (mặc định: 0)
     *
     * @returns {Array} Danh sách đơn hàng kèm sản phẩm
     */
    static async findByUser(userId, limit = 20, offset = 0) {
        // Lấy danh sách đơn hàng
        const query = `
            SELECT o.*
            FROM orders o
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [orders] = await pool.execute(query, [userId, String(limit), String(offset)]);

        // Lấy sản phẩm cho từng đơn hàng
        for (let order of orders) {
            const [items] = await pool.execute(`
                SELECT oi.*, p.name as product_name,
                       (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = oi.product_id AND pi.is_primary = TRUE LIMIT 1) as image_url
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [order.id]);
            order.items = items;
        }

        return orders;
    }

    // =========================================================================
    // CẬP NHẬT TRẠNG THÁI
    // =========================================================================

    /**
     * Cập nhật trạng thái đơn hàng
     *
     * @description Thay đổi trạng thái đơn hàng:
     *              pending -> confirmed -> shipping -> delivered
     *              hoặc cancelled
     *
     * @param {number} orderId - ID đơn hàng
     * @param {string} status - Trạng thái mới
     *
     * @returns {Object} Đơn hàng đã cập nhật
     */
    static async updateStatus(orderId, status) {
        const query = 'UPDATE orders SET status = ? WHERE id = ?';
        await pool.execute(query, [status, orderId]);
        return await this.findById(orderId);
    }

    /**
     * Cập nhật trạng thái thanh toán
     *
     * @description Thay đổi trạng thái thanh toán:
     *              pending -> paid hoặc failed
     *
     * @param {number} orderId - ID đơn hàng
     * @param {string} paymentStatus - Trạng thái thanh toán mới
     *
     * @returns {void}
     */
    static async updatePaymentStatus(orderId, paymentStatus) {
        const query = 'UPDATE orders SET payment_status = ? WHERE id = ?';
        await pool.execute(query, [paymentStatus, orderId]);
    }

    // =========================================================================
    // ADMIN - QUẢN LÝ ĐƠN HÀNG
    // =========================================================================

    /**
     * Lấy tất cả đơn hàng với bộ lọc (Admin)
     *
     * @description Lấy danh sách đơn hàng cho trang quản trị với các bộ lọc
     *
     * @param {Object} filters - Bộ lọc
     * @param {string} [filters.status] - Lọc theo trạng thái đơn hàng
     * @param {string} [filters.payment_status] - Lọc theo trạng thái thanh toán
     * @param {string} [filters.search] - Tìm theo mã đơn, tên, email
     * @param {number} [filters.limit] - Giới hạn số lượng
     * @param {number} [filters.offset] - Vị trí bắt đầu
     *
     * @returns {Array} Danh sách đơn hàng
     */
    static async findAll(filters = {}) {
        let query = `
            SELECT o.*,
                   u.full_name as user_name,
                   u.email as user_email,
                   (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        // Lọc theo trạng thái đơn hàng
        if (filters.status) {
            query += ' AND o.status = ?';
            params.push(filters.status);
        }

        // Lọc theo trạng thái thanh toán
        if (filters.payment_status) {
            query += ' AND o.payment_status = ?';
            params.push(filters.payment_status);
        }

        // Tìm kiếm theo mã đơn, tên, email
        if (filters.search) {
            query += ' AND (o.order_code LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Sắp xếp theo thời gian mới nhất
        query += ' ORDER BY o.created_at DESC';

        // Phân trang
        if (filters.limit) {
            const limit = parseInt(filters.limit) || 50;
            const offset = parseInt(filters.offset) || 0;
            query += ` LIMIT ${limit} OFFSET ${offset}`;
        }

        const [orders] = await pool.query(query, params);
        return orders;
    }

    /**
     * Lấy thống kê đơn hàng (Admin Dashboard)
     *
     * @description Lấy các số liệu thống kê tổng quan:
     *              - Tổng số đơn hàng
     *              - Số đơn theo trạng thái
     *              - Doanh thu tổng, hôm nay, tháng này
     *
     * @returns {Object} Thống kê đơn hàng
     */
    static async getStatistics() {
        const [stats] = await pool.execute(`
            SELECT
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
                SUM(final_amount) as total_revenue,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN final_amount ELSE 0 END) as today_revenue,
                SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) THEN final_amount ELSE 0 END) as month_revenue
            FROM orders
        `);

        return stats[0];
    }
}

module.exports = Order;
