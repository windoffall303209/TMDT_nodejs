const pool = require('../config/database');

class Address {
    // Create address
    static async create(userId, addressData) {
        const { full_name, phone, address_line, ward, district, city, is_default } = addressData;
        
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // If this is default, unset other default addresses
            if (is_default) {
                await connection.execute(
                    'UPDATE addresses SET is_default = FALSE WHERE user_id = ?',
                    [userId]
                );
            }

            const query = `
                INSERT INTO addresses (user_id, full_name, phone, address_line, ward, district, city, is_default)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const [result] = await connection.execute(query, [
                userId,
                full_name,
                phone,
                address_line,
                ward || null,
                district || null,
                city,
                is_default || false
            ]);

            await connection.commit();
            return { id: result.insertId, ...addressData };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get user addresses
    static async findByUser(userId) {
        const query = 'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC';
        const [rows] = await pool.execute(query, [userId]);
        return rows;
    }

    // Get address by ID
    static async findById(id) {
        const query = 'SELECT * FROM addresses WHERE id = ?';
        const [rows] = await pool.execute(query, [id]);
        return rows[0] || null;
    }

    // Get default address
    static async getDefault(userId) {
        const query = 'SELECT * FROM addresses WHERE user_id = ? AND is_default = TRUE LIMIT 1';
        const [rows] = await pool.execute(query, [userId]);
        return rows[0] || null;
    }

    // Update address
    static async update(id, userId, addressData) {
        const { full_name, phone, address_line, ward, district, city, is_default } = addressData;
        
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // If this is default, unset other default addresses
            if (is_default) {
                await connection.execute(
                    'UPDATE addresses SET is_default = FALSE WHERE user_id = ?',
                    [userId]
                );
            }

            const query = `
                UPDATE addresses 
                SET full_name = ?, phone = ?, address_line = ?, ward = ?, district = ?, city = ?, is_default = ?
                WHERE id = ? AND user_id = ?
            `;
            
            await connection.execute(query, [
                full_name,
                phone,
                address_line,
                ward || null,
                district || null,
                city,
                is_default || false,
                id,
                userId
            ]);

            await connection.commit();
            return await this.findById(id);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Delete address
    static async delete(id, userId) {
        const query = 'DELETE FROM addresses WHERE id = ? AND user_id = ?';
        await pool.execute(query, [id, userId]);
    }
}

module.exports = Address;
