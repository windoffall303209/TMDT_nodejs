const pool = require('../config/database');

class Product {
    // Get all products with filters and pagination
    static async findAll(filters = {}) {
        let query = `
            SELECT p.*,
                   c.name as category_name,
                   c.slug as category_slug,
                   (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as primary_image,
                   (SELECT COUNT(*) FROM product_images WHERE product_id = p.id) as image_count,
                   s.type as sale_type,
                   s.value as sale_value,
                   s.name as sale_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN sales s ON p.sale_id = s.id AND s.is_active = TRUE 
                AND NOW() BETWEEN s.start_date AND s.end_date
            WHERE p.is_active = TRUE
        `;
        
        const params = [];

        // Category filter
        if (filters.category_id) {
            query += ' AND p.category_id = ?';
            params.push(filters.category_id);
        }

        // Price range filter
        if (filters.min_price) {
            query += ' AND p.price >= ?';
            params.push(filters.min_price);
        }
        if (filters.max_price) {
            query += ' AND p.price <= ?';
            params.push(filters.max_price);
        }

        // Search filter (SQL injection safe)
        if (filters.search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Featured filter
        if (filters.is_featured) {
            query += ' AND p.is_featured = TRUE';
        }

        // Sorting
        const sortField = filters.sort_by || 'created_at';
        const sortOrder = filters.sort_order || 'DESC';
        const allowedSortFields = ['created_at', 'price', 'name', 'sold_count', 'view_count'];
        const allowedSortOrders = ['ASC', 'DESC'];
        
        if (allowedSortFields.includes(sortField) && allowedSortOrders.includes(sortOrder.toUpperCase())) {
            query += ` ORDER BY p.${sortField} ${sortOrder}`;
        }

        // Pagination
        const limit = parseInt(filters.limit) || 12;
        const offset = parseInt(filters.offset) || 0;
        query += ` LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await pool.query(query, params);
        
        // Calculate final price with sales
        rows.forEach(product => {
            product.final_price = this.calculateFinalPrice(product.price, product.sale_type, product.sale_value);
        });

        return rows;
    }

    // Get product by ID with full details
    static async findById(id) {
        const query = `
            SELECT p.*,
                   c.name as category_name,
                   c.slug as category_slug,
                   s.type as sale_type,
                   s.value as sale_value,
                   s.name as sale_name,
                   s.end_date as sale_end_date
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN sales s ON p.sale_id = s.id AND s.is_active = TRUE 
                AND NOW() BETWEEN s.start_date AND s.end_date
            WHERE p.id = ? AND p.is_active = TRUE
        `;
        
        const [rows] = await pool.execute(query, [id]);
        const product = rows[0];
        
        if (!product) return null;

        // Get all images
        const [images] = await pool.execute(
            'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, display_order ASC',
            [id]
        );
        product.images = images;

        // Get variants
        const [variants] = await pool.execute(
            'SELECT * FROM product_variants WHERE product_id = ?',
            [id]
        );
        product.variants = variants;

        // Get reviews with user info
        const [reviews] = await pool.execute(`
            SELECT r.*, u.full_name as user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = ? AND r.is_approved = TRUE
            ORDER BY r.created_at DESC
            LIMIT 10
        `, [id]);
        product.reviews = reviews;

        // Calculate average rating
        if (reviews.length > 0) {
            product.average_rating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            product.review_count = reviews.length;
        } else {
            product.average_rating = 0;
            product.review_count = 0;
        }

        // Calculate final price
        product.final_price = this.calculateFinalPrice(product.price, product.sale_type, product.sale_value);

        // Increment view count
        await pool.execute('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [id]);

        return product;
    }

    // Get product by slug
    static async findBySlug(slug) {
        const query = 'SELECT id FROM products WHERE slug = ? AND is_active = TRUE';
        const [rows] = await pool.execute(query, [slug]);
        if (rows[0]) {
            return await this.findById(rows[0].id);
        }
        return null;
    }

    // Search products (SQL injection protected)
    static async search(searchQuery, limit = 20) {
        const searchTerm = `%${searchQuery}%`;
        const exactSearchTerm = `${searchQuery}%`;
        const limitNum = parseInt(limit) || 20;
        
        const query = `
            SELECT p.*,
                   (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as primary_image,
                   s.type as sale_type,
                   s.value as sale_value
            FROM products p
            LEFT JOIN sales s ON p.sale_id = s.id AND s.is_active = TRUE 
                AND NOW() BETWEEN s.start_date AND s.end_date
            WHERE p.is_active = TRUE
              AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)
            ORDER BY CASE 
                WHEN p.name LIKE ? THEN 1
                WHEN p.description LIKE ? THEN 2
                ELSE 3
            END, p.sold_count DESC
            LIMIT ${limitNum}
        `;
        
        const [rows] = await pool.query(query, [
            searchTerm, searchTerm, searchTerm,
            exactSearchTerm, exactSearchTerm
        ]);

        rows.forEach(product => {
            product.final_price = this.calculateFinalPrice(product.price, product.sale_type, product.sale_value);
        });

        return rows;
    }

    // Calculate final price with sale
    static calculateFinalPrice(originalPrice, saleType, saleValue) {
        if (!saleType || !saleValue) return originalPrice;

        switch (saleType) {
            case 'percentage':
                return originalPrice * (1 - saleValue / 100);
            case 'fixed':
                return Math.max(0, originalPrice - saleValue);
            case 'bogo':
                return originalPrice; // BOGO handled at cart level
            default:
                return originalPrice;
        }
    }

    // Get best sellers
    static async getBestSellers(limit = 8) {
        return await this.findAll({
            sort_by: 'sold_count',
            sort_order: 'DESC',
            limit
        });
    }

    // Get new products
    static async getNewProducts(limit = 8) {
        return await this.findAll({
            sort_by: 'created_at',
            sort_order: 'DESC',
            limit
        });
    }

    // Get featured products
    static async getFeaturedProducts(limit = 8) {
        return await this.findAll({
            is_featured: true,
            limit
        });
    }

    // Create product
    static async create(productData) {
        const { category_id, name, slug, description, price, stock_quantity, sku, sale_id, is_featured } = productData;
        
        const query = `
            INSERT INTO products (category_id, name, slug, description, price, stock_quantity, sku, sale_id, is_featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.execute(query, [
            category_id,
            name,
            slug,
            description || null,
            price,
            stock_quantity || 0,
            sku || null,
            sale_id || null,
            is_featured || false
        ]);
        
        return { id: result.insertId, ...productData };
    }

    // Update product
    static async update(id, productData) {
        const { category_id, name, slug, description, price, stock_quantity, sku, sale_id, is_featured } = productData;
        
        const query = `
            UPDATE products 
            SET category_id = ?, name = ?, slug = ?, description = ?, price = ?, 
                stock_quantity = ?, sku = ?, sale_id = ?, is_featured = ?
            WHERE id = ?
        `;
        
        await pool.execute(query, [
            category_id,
            name,
            slug,
            description || null,
            price,
            stock_quantity || 0,
            sku || null,
            sale_id || null,
            is_featured || false,
            id
        ]);
        
        return await this.findById(id);
    }

    // Delete product (soft delete)
    static async delete(id) {
        const query = 'UPDATE products SET is_active = FALSE WHERE id = ?';
        await pool.execute(query, [id]);
    }

    // Add product image
    static async addImage(productId, imageUrl, isPrimary = false, displayOrder = 0) {
        // If this is primary, unset other primary images
        if (isPrimary) {
            await pool.execute(
                'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
                [productId]
            );
        }

        const query = `
            INSERT INTO product_images (product_id, image_url, is_primary, display_order)
            VALUES (?, ?, ?, ?)
        `;
        
        const [result] = await pool.execute(query, [productId, imageUrl, isPrimary, displayOrder]);
        return { id: result.insertId, product_id: productId, image_url: imageUrl };
    }

    // Update stock after order
    static async updateStock(productId, quantity) {
        const query = 'UPDATE products SET stock_quantity = stock_quantity - ?, sold_count = sold_count + ? WHERE id = ?';
        await pool.execute(query, [quantity, quantity, productId]);
    }
}

module.exports = Product;
