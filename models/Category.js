const pool = require('../config/database');

class Category {
    // Get all categories
    static async findAll() {
        const query = `
            SELECT c.*, 
                   (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = TRUE) as product_count
            FROM categories c
            WHERE c.is_active = TRUE
            ORDER BY c.display_order ASC, c.name ASC
        `;
        const [rows] = await pool.query(query);
        return rows;
    }

    // Get category by ID
    static async findById(id) {
        const query = 'SELECT * FROM categories WHERE id = ? AND is_active = TRUE';
        const [rows] = await pool.execute(query, [id]);
        return rows[0] || null;
    }

    // Get category by slug
    static async findBySlug(slug) {
        const query = 'SELECT * FROM categories WHERE slug = ? AND is_active = TRUE';
        const [rows] = await pool.execute(query, [slug]);
        return rows[0] || null;
    }

    // Get category with products
    static async findWithProducts(categoryId, limit = 10) {
        const category = await this.findById(categoryId);
        if (!category) return null;

        const query = `
            SELECT p.*, 
                   (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as primary_image,
                   s.type as sale_type,
                   s.value as sale_value
            FROM products p
            LEFT JOIN sales s ON p.sale_id = s.id AND s.is_active = TRUE 
                AND NOW() BETWEEN s.start_date AND s.end_date
            WHERE p.category_id = ? AND p.is_active = TRUE
            ORDER BY p.created_at DESC
            LIMIT ?
        `;
        const [products] = await pool.execute(query, [categoryId, limit]);
        
        category.products = products;
        return category;
    }

    // Create category
    static async create(categoryData) {
        const { name, slug, description, parent_id, image_url, display_order } = categoryData;
        
        const query = `
            INSERT INTO categories (name, slug, description, parent_id, image_url, display_order)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.execute(query, [
            name,
            slug,
            description || null,
            parent_id || null,
            image_url || null,
            display_order || 0
        ]);
        
        return { id: result.insertId, ...categoryData };
    }

    // Update category
    static async update(id, categoryData) {
        const { name, slug, description, parent_id, image_url, display_order } = categoryData;
        
        const query = `
            UPDATE categories 
            SET name = ?, slug = ?, description = ?, parent_id = ?, image_url = ?, display_order = ?
            WHERE id = ?
        `;
        
        await pool.execute(query, [
            name,
            slug,
            description || null,
            parent_id || null,
            image_url || null,
            display_order || 0,
            id
        ]);
        
        return await this.findById(id);
    }

    // Delete category (soft delete)
    static async delete(id) {
        const query = 'UPDATE categories SET is_active = FALSE WHERE id = ?';
        await pool.execute(query, [id]);
    }

    // Get top categories for homepage
    static async getTopCategories(limit = 3) {
        const query = `
            SELECT c.*, 
                   (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = TRUE) as product_count
            FROM categories c 
            WHERE c.is_active = TRUE AND c.parent_id IS NULL
            ORDER BY c.display_order ASC
            LIMIT ${parseInt(limit)}
        `;
        const [rows] = await pool.query(query);
        return rows;
    }
}

module.exports = Category;
