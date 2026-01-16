const pool = require('../config/database');

class Order {
    // Create order from cart
    static async create(userId, addressId, paymentMethod, notes = null, shippingFeeFromUI = null, discountAmount = 0, voucherCode = null) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Get user's cart
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

            if (cartData.items.length === 0) {
                throw new Error('Cart is empty');
            }

            // Generate order code
            const orderCode = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

            // Use shipping fee from frontend if provided, otherwise calculate
            const shippingFee = shippingFeeFromUI !== null ? shippingFeeFromUI : (cartData.subtotal >= 500000 ? 0 : 30000);
            
            // Calculate final amount: subtotal + shipping - discount
            const finalAmount = cartData.subtotal + shippingFee - discountAmount;

            // Create order
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

            // Create order items from cart
            for (const item of cartData.items) {
                const orderItemQuery = `
                    INSERT INTO order_items (order_id, product_id, variant_id, product_name, product_image, price, sale_applied, quantity, subtotal)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
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

                // Update product stock
                await connection.execute(
                    'UPDATE products SET stock_quantity = stock_quantity - ?, sold_count = sold_count + ? WHERE id = ?',
                    [item.quantity, item.quantity, item.product_id]
                );
            }

            // Clear cart
            await connection.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

            await connection.commit();

            return { id: orderId, order_code: orderCode, final_amount: finalAmount };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Create order from single product (buy now)
    static async createFromProduct(userId, addressId, product, quantity, paymentMethod, notes = null) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Generate order code
            const orderCode = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

            // Calculate amounts
            const price = product.final_price || product.price;
            const subtotal = price * quantity;
            const shippingFee = subtotal >= 500000 ? 0 : 30000;
            const finalAmount = subtotal + shippingFee;

            // Create order
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

            // Create order item
            const orderItemQuery = `
                INSERT INTO order_items (order_id, product_id, variant_id, product_name, product_image, price, sale_applied, quantity, subtotal)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
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

            // Update product stock
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

    // Get order by ID with items
    static async findById(orderId) {
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

        // Get order items
        const [items] = await pool.execute(
            'SELECT * FROM order_items WHERE order_id = ?',
            [orderId]
        );
        order.items = items;

        // Get payment info
        const [payments] = await pool.execute(
            'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
            [orderId]
        );
        order.payment = payments[0] || null;

        return order;
    }

    // Get order by order code
    static async findByOrderCode(orderCode) {
        const [orders] = await pool.execute('SELECT id FROM orders WHERE order_code = ?', [orderCode]);
        if (orders.length > 0) {
            return await this.findById(orders[0].id);
        }
        return null;
    }

    // Get user orders with items
    static async findByUser(userId, limit = 20, offset = 0) {
        const query = `
            SELECT o.*
            FROM orders o
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const [orders] = await pool.execute(query, [userId, String(limit), String(offset)]);
        
        // Fetch items for each order
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

    // Update order status
    static async updateStatus(orderId, status) {
        const query = 'UPDATE orders SET status = ? WHERE id = ?';
        await pool.execute(query, [status, orderId]);
        return await this.findById(orderId);
    }

    // Update payment status
    static async updatePaymentStatus(orderId, paymentStatus) {
        const query = 'UPDATE orders SET payment_status = ? WHERE id = ?';
        await pool.execute(query, [paymentStatus, orderId]);
    }

    // Get all orders (admin)
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

        if (filters.status) {
            query += ' AND o.status = ?';
            params.push(filters.status);
        }

        if (filters.payment_status) {
            query += ' AND o.payment_status = ?';
            params.push(filters.payment_status);
        }

        if (filters.search) {
            query += ' AND (o.order_code LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY o.created_at DESC';

        if (filters.limit) {
            const limit = parseInt(filters.limit) || 50;
            const offset = parseInt(filters.offset) || 0;
            query += ` LIMIT ${limit} OFFSET ${offset}`;
        }

        const [orders] = await pool.query(query, params);
        return orders;
    }

    // Get order statistics
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
