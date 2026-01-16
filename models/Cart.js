const pool = require('../config/database');

class Cart {
    // Get or create cart for user (persistent cart like Shopee)
    static async getOrCreate(userId, sessionId = null) {
        // Try to find existing cart
        let query = 'SELECT * FROM cart WHERE ';
        let params = [];

        if (userId) {
            query += 'user_id = ?';
            params = [userId];
        } else if (sessionId) {
            query += 'session_id = ?';
            params = [sessionId];
        } else {
            throw new Error('Either userId or sessionId must be provided');
        }

        const [carts] = await pool.execute(query, params);

        if (carts.length > 0) {
            return carts[0];
        }

        // Create new cart
        const insertQuery = 'INSERT INTO cart (user_id, session_id) VALUES (?, ?)';
        const [result] = await pool.execute(insertQuery, [userId || null, sessionId || null]);
        
        return { id: result.insertId, user_id: userId, session_id: sessionId };
    }

    // Merge guest cart with user cart on login
    static async mergeGuestCart(userId, sessionId) {
        // Get guest cart
        const [guestCarts] = await pool.execute(
            'SELECT id FROM cart WHERE session_id = ? AND user_id IS NULL',
            [sessionId]
        );

        if (guestCarts.length === 0) return;

        const guestCartId = guestCarts[0].id;

        // Get or create user cart
        const userCart = await this.getOrCreate(userId);

        // Get guest cart items
        const [guestItems] = await pool.execute(
            'SELECT * FROM cart_items WHERE cart_id = ?',
            [guestCartId]
        );

        // Merge items to user cart
        for (const item of guestItems) {
            await this.addItem(userCart.id, item.product_id, item.quantity, item.variant_id);
        }

        // Delete guest cart
        await pool.execute('DELETE FROM cart WHERE id = ?', [guestCartId]);
    }

    // Add item to cart
    static async addItem(cartId, productId, quantity = 1, variantId = null) {
        // Check if item already exists in cart
        const checkQuery = `
            SELECT * FROM cart_items 
            WHERE cart_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))
        `;
        const [existing] = await pool.execute(checkQuery, [cartId, productId, variantId, variantId]);

        if (existing.length > 0) {
            // Update quantity
            const updateQuery = 'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?';
            await pool.execute(updateQuery, [quantity, existing[0].id]);
            return { id: existing[0].id, updated: true };
        } else {
            // Insert new item
            const insertQuery = `
                INSERT INTO cart_items (cart_id, product_id, variant_id, quantity)
                VALUES (?, ?, ?, ?)
            `;
            const [result] = await pool.execute(insertQuery, [cartId, productId, variantId || null, quantity]);
            
            // Update cart timestamp
            await pool.execute('UPDATE cart SET updated_at = NOW() WHERE id = ?', [cartId]);
            
            return { id: result.insertId, updated: false };
        }
    }

    // Get cart items with product details
    static async getItems(cartId) {
        const query = `
            SELECT ci.*,
                   p.name as product_name,
                   p.price as product_price,
                   p.slug as product_slug,
                   p.stock_quantity,
                   (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as product_image,
                   s.type as sale_type,
                   s.value as sale_value,
                   pv.size,
                   pv.color,
                   pv.additional_price
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            LEFT JOIN sales s ON p.sale_id = s.id AND s.is_active = TRUE 
                AND NOW() BETWEEN s.start_date AND s.end_date
            LEFT JOIN product_variants pv ON ci.variant_id = pv.id
            WHERE ci.cart_id = ? AND p.is_active = TRUE
            ORDER BY ci.added_at DESC
        `;
        
        const [items] = await pool.execute(query, [cartId]);

        // Calculate final price for each item
        const Product = require('./Product');
        items.forEach(item => {
            let basePrice = item.product_price + (item.additional_price || 0);
            item.unit_price = Product.calculateFinalPrice(basePrice, item.sale_type, item.sale_value);
            item.subtotal = item.unit_price * item.quantity;
        });

        return items;
    }

    // Update cart item quantity
    static async updateQuantity(cartItemId, quantity) {
        if (quantity <= 0) {
            return await this.removeItem(cartItemId);
        }

        const query = 'UPDATE cart_items SET quantity = ? WHERE id = ?';
        await pool.execute(query, [quantity, cartItemId]);
        
        // Update cart timestamp
        const [item] = await pool.execute('SELECT cart_id FROM cart_items WHERE id = ?', [cartItemId]);
        if (item.length > 0) {
            await pool.execute('UPDATE cart SET updated_at = NOW() WHERE id = ?', [item[0].cart_id]);
        }
    }

    // Remove item from cart
    static async removeItem(cartItemId) {
        // Get cart_id first
        const [item] = await pool.execute('SELECT cart_id FROM cart_items WHERE id = ?', [cartItemId]);
        
        const query = 'DELETE FROM cart_items WHERE id = ?';
        await pool.execute(query, [cartItemId]);
        
        // Update cart timestamp
        if (item.length > 0) {
            await pool.execute('UPDATE cart SET updated_at = NOW() WHERE id = ?', [item[0].cart_id]);
        }
    }

    // Clear cart
    static async clear(cartId) {
        const query = 'DELETE FROM cart_items WHERE cart_id = ?';
        await pool.execute(query, [cartId]);
        
        await pool.execute('UPDATE cart SET updated_at = NOW() WHERE id = ?', [cartId]);
    }

    // Calculate cart total
    static async calculateTotal(cartId) {
        const items = await this.getItems(cartId);
        
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

        return {
            subtotal,
            itemCount,
            items
        };
    }

    // Get cart count for user (only count items with active products)
    static async getCartCount(cartId) {
        const query = `
            SELECT COALESCE(SUM(ci.quantity), 0) as count 
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = ? AND p.is_active = TRUE
        `;
        const [result] = await pool.execute(query, [cartId]);
        return result[0].count;
    }
}

module.exports = Cart;
