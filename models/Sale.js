const pool = require('../config/database');

class Sale {
    // Get all sales
    static async findAll(activeOnly = false) {
        let query = 'SELECT * FROM sales WHERE 1=1';
        
        if (activeOnly) {
            query += ' AND is_active = TRUE AND NOW() BETWEEN start_date AND end_date';
        }
        
        query += ' ORDER BY created_at DESC';
        
        const [rows] = await pool.execute(query);
        return rows;
    }

    // Get sale by ID
    static async findById(id) {
        const query = 'SELECT * FROM sales WHERE id = ?';
        const [rows] = await pool.execute(query, [id]);
        return rows[0] || null;
    }

    // Get active sales
    static async getActiveSales() {
        return await this.findAll(true);
    }

    // Create sale
    static async create(saleData) {
        const { name, description, type, value, start_date, end_date } = saleData;
        
        const query = `
            INSERT INTO sales (name, description, type, value, start_date, end_date)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.execute(query, [
            name,
            description || null,
            type,
            value,
            start_date,
            end_date
        ]);
        
        return { id: result.insertId, ...saleData };
    }

    // Update sale
    static async update(id, saleData) {
        const { name, description, type, value, start_date, end_date, is_active } = saleData;
        
        const query = `
            UPDATE sales 
            SET name = ?, description = ?, type = ?, value = ?, start_date = ?, end_date = ?, is_active = ?
            WHERE id = ?
        `;
        
        await pool.execute(query, [
            name,
            description || null,
            type,
            value,
            start_date,
            end_date,
            is_active !== undefined ? is_active : true,
            id
        ]);
        
        return await this.findById(id);
    }

    // Delete sale
    static async delete(id) {
        // Don't actually delete, just deactivate
        const query = 'UPDATE sales SET is_active = FALSE WHERE id = ?';
        await pool.execute(query, [id]);
    }

    // Check and activate scheduled sales
    static async activateScheduledSales() {
        const query = `
            UPDATE sales 
            SET is_active = TRUE 
            WHERE is_active = FALSE AND NOW() >= start_date AND NOW() <= end_date
        `;
        const [result] = await pool.execute(query);
        return result.affectedRows;
    }

    // Check and deactivate expired sales
    static async deactivateExpiredSales() {
        const query = `
            UPDATE sales 
            SET is_active = FALSE 
            WHERE is_active = TRUE AND NOW() > end_date
        `;
        const [result] = await pool.execute(query);
        return result.affectedRows;
    }
}

module.exports = Sale;
