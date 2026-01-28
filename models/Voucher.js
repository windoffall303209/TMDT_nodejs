/**
 * =============================================================================
 * VOUCHER MODEL - Mô hình mã giảm giá
 * =============================================================================
 */

const pool = require('../config/database');

class Voucher {
    /**
     * Lấy tất cả voucher (Admin)
     */
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM vouchers WHERE 1=1';
        const params = [];

        if (filters.is_active !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.is_active);
        }

        if (filters.search) {
            query += ' AND (code LIKE ? OR name LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        query += ' ORDER BY created_at DESC';

        if (filters.limit) {
            query += ` LIMIT ${parseInt(filters.limit)} OFFSET ${parseInt(filters.offset) || 0}`;
        }

        const [rows] = await pool.query(query, params);
        return rows;
    }

    /**
     * Tìm voucher theo ID
     */
    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM vouchers WHERE id = ?', [id]);
        return rows[0] || null;
    }

    /**
     * Tìm voucher theo code
     */
    static async findByCode(code) {
        const [rows] = await pool.execute('SELECT * FROM vouchers WHERE code = ?', [code.toUpperCase()]);
        return rows[0] || null;
    }

    /**
     * Tạo voucher mới
     */
    static async create(data) {
        const {
            code, name, description, type, value,
            min_order_amount, max_discount_amount, usage_limit,
            user_limit, start_date, end_date, is_active
        } = data;

        const query = `
            INSERT INTO vouchers (code, name, description, type, value, min_order_amount, max_discount_amount, usage_limit, user_limit, start_date, end_date, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(query, [
            code.toUpperCase(),
            name,
            description || null,
            type,
            value,
            min_order_amount || 0,
            max_discount_amount || null,
            usage_limit || null,
            user_limit || 1,
            start_date,
            end_date,
            is_active !== false
        ]);

        return { id: result.insertId, code: code.toUpperCase() };
    }

    /**
     * Cập nhật voucher
     */
    static async update(id, data) {
        const {
            code, name, description, type, value,
            min_order_amount, max_discount_amount, usage_limit,
            user_limit, start_date, end_date, is_active
        } = data;

        const query = `
            UPDATE vouchers SET
                code = ?, name = ?, description = ?, type = ?, value = ?,
                min_order_amount = ?, max_discount_amount = ?, usage_limit = ?,
                user_limit = ?, start_date = ?, end_date = ?, is_active = ?
            WHERE id = ?
        `;

        await pool.execute(query, [
            code.toUpperCase(),
            name,
            description || null,
            type,
            value,
            min_order_amount || 0,
            max_discount_amount || null,
            usage_limit || null,
            user_limit || 1,
            start_date,
            end_date,
            is_active !== false,
            id
        ]);

        return await this.findById(id);
    }

    /**
     * Xóa voucher
     */
    static async delete(id) {
        await pool.execute('DELETE FROM vouchers WHERE id = ?', [id]);
    }

    /**
     * Cập nhật trạng thái active
     */
    static async updateStatus(id, isActive) {
        await pool.execute('UPDATE vouchers SET is_active = ? WHERE id = ?', [isActive, id]);
    }

    /**
     * Kiểm tra voucher có hợp lệ không
     */
    static async validate(code, userId, orderAmount) {
        const voucher = await this.findByCode(code);

        if (!voucher) {
            return { valid: false, message: 'Mã giảm giá không tồn tại' };
        }

        if (!voucher.is_active) {
            return { valid: false, message: 'Mã giảm giá đã hết hiệu lực' };
        }

        const now = new Date();
        if (now < new Date(voucher.start_date) || now > new Date(voucher.end_date)) {
            return { valid: false, message: 'Mã giảm giá không trong thời gian hiệu lực' };
        }

        if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
            return { valid: false, message: 'Mã giảm giá đã hết lượt sử dụng' };
        }

        if (orderAmount < voucher.min_order_amount) {
            return {
                valid: false,
                message: `Đơn hàng tối thiểu ${voucher.min_order_amount.toLocaleString('vi-VN')}đ để sử dụng mã này`
            };
        }

        // Kiểm tra user đã dùng bao nhiêu lần
        if (userId && voucher.user_limit) {
            const [usage] = await pool.execute(
                'SELECT COUNT(*) as count FROM voucher_usage WHERE voucher_id = ? AND user_id = ?',
                [voucher.id, userId]
            );
            if (usage[0].count >= voucher.user_limit) {
                return { valid: false, message: 'Bạn đã sử dụng hết lượt cho mã này' };
            }
        }

        // Tính số tiền giảm
        let discountAmount = 0;
        if (voucher.type === 'percentage') {
            discountAmount = orderAmount * (voucher.value / 100);
            if (voucher.max_discount_amount && discountAmount > voucher.max_discount_amount) {
                discountAmount = voucher.max_discount_amount;
            }
        } else {
            discountAmount = voucher.value;
        }

        return {
            valid: true,
            voucher,
            discountAmount: Math.floor(discountAmount)
        };
    }

    /**
     * Ghi nhận sử dụng voucher
     */
    static async recordUsage(voucherId, userId, orderId, discountAmount) {
        await pool.execute(
            'INSERT INTO voucher_usage (voucher_id, user_id, order_id, discount_amount) VALUES (?, ?, ?, ?)',
            [voucherId, userId, orderId, discountAmount]
        );

        await pool.execute(
            'UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?',
            [voucherId]
        );
    }

    /**
     * Đếm tổng số voucher
     */
    static async count(filters = {}) {
        let query = 'SELECT COUNT(*) as total FROM vouchers WHERE 1=1';
        const params = [];

        if (filters.is_active !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.is_active);
        }

        const [rows] = await pool.query(query, params);
        return rows[0].total;
    }
}

module.exports = Voucher;
