const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');
const Banner = require('../models/Banner');
const Sale = require('../models/Sale');
const emailService = require('../services/emailService');
const upload = require('../middleware/upload');

// Dashboard
exports.getDashboard = async (req, res) => {
    try {
        let stats = {
            total_orders: 0,
            pending_orders: 0,
            delivered_orders: 0,
            cancelled_orders: 0,
            total_revenue: 0,
            today_revenue: 0,
            month_revenue: 0
        };
        let recentOrders = [];
        
        try {
            stats = await Order.getStatistics() || stats;
            recentOrders = await Order.findAll({ limit: 10, offset: 0 }) || [];
        } catch (err) {
            console.error('Dashboard data error:', err);
            // Use default empty values
        }

        res.render('admin/dashboard', {
            stats,
            recentOrders,
            user: req.user,
            currentPage: 'dashboard'
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).render('error', { message: 'Lỗi tải dashboard: ' + error.message, user: req.user });
    }
};

// Products Management
exports.getProducts = async (req, res) => {
    try {
        let products = [];
        let categories = [];
        try {
            products = await Product.findAll({ limit: 50, offset: 0 });
            categories = await Category.findAll();
        } catch (err) {
            console.error('Products data error:', err);
        }

        res.render('admin/products', {
            products,
            categories,
            user: req.user,
            currentPage: 'products'
        });
    } catch (error) {
        res.status(500).render('error', { message: 'Lỗi tải sản phẩm: ' + error.message, user: req.user });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { category_id, name, description, price, stock_quantity, sku, sale_id, is_featured } = req.body;
        let { slug } = req.body;

        // Auto-generate slug if not provided
        if (!slug || slug.trim() === '') {
            slug = name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'D')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
                + '-' + Date.now();
        }

        console.log('Creating product:', { name, slug, category_id, price });

        const product = await Product.create({
            category_id: parseInt(category_id),
            name,
            slug,
            description,
            price: parseFloat(price),
            stock_quantity: parseInt(stock_quantity) || 0,
            sku,
            sale_id: sale_id || null,
            is_featured: is_featured === 'on'
        });

        console.log('Product created:', product);

        // Handle image uploads
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                await Product.addImage(
                    product.id,
                    `/uploads/${req.files[i].filename}`,
                    i === 0, // First image is primary
                    i
                );
            }
        } else {
            // Add default image
            await Product.addImage(
                product.id,
                'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
                true,
                0
            );
        }

        res.redirect('/admin/products');
    } catch (error) {
        console.error('Create product error:', error);
        res.redirect('/admin/products?error=' + encodeURIComponent(error.message));
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, name, slug, description, price, stock_quantity, sku, sale_id, is_featured } = req.body;

        await Product.update(id, {
            category_id,
            name,
            slug,
            description,
            price: parseFloat(price),
            stock_quantity: parseInt(stock_quantity) || 0,
            sku,
            sale_id: sale_id || null,
            is_featured: is_featured === 'on'
        });

        res.redirect('/admin/products');
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await Product.delete(id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Orders Management
exports.getOrders = async (req, res) => {
    try {
        let orders = [];
        try {
            orders = await Order.findAll({ limit: 50, offset: 0 });
        } catch (err) {
            console.error('Orders data error:', err);
        }

        res.render('admin/orders', {
            orders,
            user: req.user,
            currentPage: 'orders'
        });
    } catch (error) {
        res.status(500).render('error', { message: 'Lỗi tải đơn hàng: ' + error.message, user: req.user });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await Order.updateStatus(id, status);
        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Users Management
exports.getUsers = async (req, res) => {
    try {
        let users = [];
        try {
            users = await User.findAll({ limit: 50, offset: 0 });
        } catch (err) {
            console.error('Users data error:', err);
        }

        res.render('admin/users', {
            users,
            user: req.user,
            currentPage: 'users'
        });
    } catch (error) {
        res.status(500).render('error', { message: 'Lỗi tải người dùng: ' + error.message, user: req.user });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        await User.updateStatus(id, is_active === 'true');
        res.json({ message: 'User status updated successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Banners Management
exports.getBanners = async (req, res) => {
    try {
        let banners = [];
        try {
            banners = await Banner.findAll();
        } catch (err) {
            console.error('Banners data error:', err);
        }

        res.render('admin/banners', {
            banners,
            user: req.user,
            currentPage: 'banners'
        });
    } catch (error) {
        res.status(500).render('error', { message: 'Lỗi tải banners: ' + error.message, user: req.user });
    }
};

exports.createBanner = async (req, res) => {
    try {
        const { title, subtitle, description, link_url, button_text, display_order, start_date, end_date } = req.body;
        
        let image_url = '';
        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
        }

        await Banner.create({
            title,
            subtitle,
            description,
            image_url,
            link_url,
            button_text,
            display_order: parseInt(display_order) || 0,
            start_date: start_date || null,
            end_date: end_date || null
        });

        res.redirect('/admin/banners');
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteBanner = async (req, res) => {
    try {
        const pool = require('../config/database');
        await pool.execute('DELETE FROM banners WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Banner deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Sales Management
exports.getSales = async (req, res) => {
    try {
        let sales = [];
        try {
            sales = await Sale.findAll();
        } catch (err) {
            console.error('Sales data error:', err);
        }

        res.render('admin/sales', {
            sales,
            user: req.user,
            currentPage: 'sales'
        });
    } catch (error) {
        res.status(500).render('error', { message: 'Lỗi tải khuyến mãi: ' + error.message, user: req.user });
    }
};

exports.createSale = async (req, res) => {
    try {
        const { name, description, type, value, start_date, end_date } = req.body;

        await Sale.create({
            name,
            description,
            type,
            value: parseFloat(value),
            start_date,
            end_date
        });

        res.redirect('/admin/sales');
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Email Marketing
exports.sendMarketingEmail = async (req, res) => {
    try {
        const { subject, content } = req.body;

        const users = await User.getMarketingList();

        const result = await emailService.sendMarketingEmail(users, {
            subject,
            content
        });

        res.json({
            message: `Email sent to ${result.success}/${result.total} users`
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Product Images Management
exports.getProductImages = async (req, res) => {
    try {
        const pool = require('../config/database');
        const [images] = await pool.execute(
            'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id ASC',
            [req.params.id]
        );
        res.json({ images });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addProductImageUrl = async (req, res) => {
    try {
        const pool = require('../config/database');
        const { image_url, is_primary } = req.body;
        const productId = req.params.id;

        if (is_primary) {
            // Remove primary from other images
            await pool.execute(
                'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
                [productId]
            );
        }

        await pool.execute(
            'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
            [productId, image_url, is_primary || false]
        );

        res.json({ success: true, message: 'Image added' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.uploadProductImage = async (req, res) => {
    try {
        const pool = require('../config/database');
        const productId = req.params.id;
        const is_primary = req.body.is_primary === 'true';

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const image_url = '/uploads/' + req.file.filename;

        if (is_primary) {
            await pool.execute(
                'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
                [productId]
            );
        }

        await pool.execute(
            'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
            [productId, image_url, is_primary]
        );

        res.json({ success: true, message: 'Image uploaded' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteProductImage = async (req, res) => {
    try {
        const pool = require('../config/database');
        await pool.execute('DELETE FROM product_images WHERE id = ?', [req.params.imageId]);
        res.json({ success: true, message: 'Image deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.setPrimaryImage = async (req, res) => {
    try {
        const pool = require('../config/database');
        const imageId = req.params.imageId;

        // Get product_id for this image
        const [image] = await pool.execute(
            'SELECT product_id FROM product_images WHERE id = ?',
            [imageId]
        );

        if (image.length === 0) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const productId = image[0].product_id;

        // Remove primary from all images of this product
        await pool.execute(
            'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
            [productId]
        );

        // Set this image as primary
        await pool.execute(
            'UPDATE product_images SET is_primary = TRUE WHERE id = ?',
            [imageId]
        );

        res.json({ success: true, message: 'Primary image set' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
