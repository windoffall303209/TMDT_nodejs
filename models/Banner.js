const pool = require('../config/database');

class Banner {
    // Get all active banners
    static async getActiveBanners() {
        const query = `
            SELECT * FROM banners 
            WHERE is_active = TRUE 
              AND (start_date IS NULL OR NOW() >= start_date)
              AND (end_date IS NULL OR NOW() <= end_date)
            ORDER BY display_order ASC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }

    // Get all banners (admin)
    static async findAll() {
        const query = 'SELECT * FROM banners ORDER BY display_order ASC, created_at DESC';
        const [rows] = await pool.execute(query);
        return rows;
    }

    // Get banner by ID
    static async findById(id) {
        const query = 'SELECT * FROM banners WHERE id = ?';
        const [rows] = await pool.execute(query, [id]);
        return rows[0] || null;
    }

    // Create banner
    static async create(bannerData) {
        const { title, subtitle, description, image_url, link_url, button_text, display_order, start_date, end_date } = bannerData;
        
        const query = `
            INSERT INTO banners (title, subtitle, description, image_url, link_url, button_text, display_order, start_date, end_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.execute(query, [
            title,
            subtitle || null,
            description || null,
            image_url,
            link_url || null,
            button_text || 'Xem ngay',
            display_order || 0,
            start_date || null,
            end_date || null
        ]);
        
        return { id: result.insertId, ...bannerData };
    }

    // Update banner
    static async update(id, bannerData) {
        const { title, subtitle, description, image_url, link_url, button_text, display_order, is_active, start_date, end_date } = bannerData;
        
        const query = `
            UPDATE banners 
            SET title = ?, subtitle = ?, description = ?, image_url = ?, link_url = ?, 
                button_text = ?, display_order = ?, is_active = ?, start_date = ?, end_date = ?
            WHERE id = ?
        `;
        
        await pool.execute(query, [
            title,
            subtitle || null,
            description || null,
            image_url,
            link_url || null,
            button_text || 'Xem ngay',
            display_order || 0,
            is_active !== undefined ? is_active : true,
            start_date || null,
            end_date || null,
            id
        ]);
        
        return await this.findById(id);
    }

    // Delete banner
    static async delete(id) {
        const query = 'DELETE FROM banners WHERE id = ?';
        await pool.execute(query, [id]);
    }
}

module.exports = Banner;
