const Product = require('../models/Product');
const Category = require('../models/Category');
const Banner = require('../models/Banner');

// Show homepage
exports.getHomePage = async (req, res) => {
    try {
        // Get active banners for carousel
        const banners = await Banner.getActiveBanners().catch(err => {
            console.error('Banner error:', err);
            return [];
        });
        
        // Get top categories
        const categories = await Category.getTopCategories(3).catch(err => {
            console.error('Category error:', err);
            // Mock data fallback
            return [
                { id: 1, name: 'Thời Trang Nam', slug: 'nam', product_count: 5 },
                { id: 2, name: 'Thời Trang Nữ', slug: 'nu', product_count: 5 },
                { id: 3, name: 'Thời Trang Trẻ Em', slug: 'tre-em', product_count: 4 }
            ];
        });
        
        // Get new products
        const newProducts = await Product.getNewProducts(8).catch(err => {
            console.error('New products error:', err);
            // Mock data fallback
            return [
                { id: 1, name: 'Áo Polo Classic Nam', slug: 'ao-polo-classic', price: 450000, final_price: 225000, primary_image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600' },
                { id: 2, name: 'Đầm Maxi Hoa', slug: 'dam-maxi-hoa', price: 750000, final_price: 592500, primary_image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600' },
                { id: 3, name: 'Áo Thun Basic', slug: 'ao-thun-basic', price: 250000, final_price: 250000, primary_image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600' },
                { id: 4, name: 'Váy Công Sở', slug: 'vay-cong-so', price: 420000, final_price: 420000, primary_image: 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600' }
            ];
        });
        
        // Get best sellers
        const bestSellers = await Product.getBestSellers(8).catch(err => {
            console.error('Best sellers error:', err);
            // Mock data fallback
            return [
                { id: 5, name: 'Quần Jeans Slim Fit', slug: 'quan-jeans', price: 680000, final_price: 680000, primary_image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600' },
                { id: 6, name: 'Áo Sơ Mi Lụa', slug: 'ao-so-mi-lua', price: 520000, final_price: 520000, primary_image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600' },
                { id: 7, name: 'Bộ Đồ Bé Trai', slug: 'bo-do-be-trai', price: 320000, final_price: 320000, primary_image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600' },
                { id: 8, name: 'Áo Sơ Mi Oxford', slug: 'ao-so-mi-oxford', price: 520000, final_price: 410800, primary_image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600' }
            ];
        });

        res.render('home/index', {
            banners,
            categories,
            newProducts,
            bestSellers,
            user: req.user || null
        });
    } catch (error) {
        console.error('Homepage error:', error);
        res.status(500).render('error', { message: 'Unable to load homepage', user: req.user || null });
    }
};

// Show product listing page
exports.getProducts = async (req, res) => {
    try {
        const {
            category,
            search,
            min_price,
            max_price,
            sort_by,
            sort_order,
            page = 1
        } = req.query;

        const limit = 12;
        const offset = (page - 1) * limit;

        // Build filters
        const filters = {
            limit,
            offset,
            sort_by: sort_by || 'created_at',
            sort_order: sort_order || 'DESC'
        };

        if (category) {
            const cat = await Category.findBySlug(category).catch(() => null);
            if (cat) filters.category_id = cat.id;
        }

        if (search) filters.search = search;
        if (min_price) filters.min_price = parseFloat(min_price);
        if (max_price) filters.max_price = parseFloat(max_price);

        // Get products with error handling
        let products = [];
        let categories = [];
        
        try {
            products = await Product.findAll(filters);
        } catch (err) {
            console.error('Product findAll error:', err);
            // Mock data fallback
            products = [
                { id: 1, name: 'Áo Polo Classic Nam', slug: 'ao-polo-classic', price: 450000, final_price: 225000, primary_image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600' },
                { id: 2, name: 'Đầm Maxi Hoa', slug: 'dam-maxi-hoa', price: 750000, final_price: 592500, primary_image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600' },
                { id: 3, name: 'Áo Thun Basic', slug: 'ao-thun-basic', price: 250000, final_price: 250000, primary_image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600' },
                { id: 4, name: 'Váy Công Sở', slug: 'vay-cong-so', price: 420000, final_price: 420000, primary_image: 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600' }
            ];
        }
        
        try {
            categories = await Category.findAll();
        } catch (err) {
            console.error('Category findAll error:', err);
            categories = [
                { id: 1, name: 'Thời Trang Nam', slug: 'nam', product_count: 5 },
                { id: 2, name: 'Thời Trang Nữ', slug: 'nu', product_count: 5 },
                { id: 3, name: 'Thời Trang Trẻ Em', slug: 'tre-em', product_count: 4 }
            ];
        }

        res.render('products/list', {
            products,
            categories,
            filters: req.query,
            currentPage: parseInt(page),
            user: req.user || null
        });
    } catch (error) {
        console.error('Product listing error:', error);
        res.status(500).render('error', { message: 'Lỗi tải danh sách sản phẩm: ' + error.message, user: req.user || null });
    }
};

// Show product detail page
exports.getProductDetail = async (req, res) => {
    try {
        const { slug } = req.params;
        
        let product = null;
        try {
            product = await Product.findBySlug(slug);
        } catch (err) {
            console.error('Product findBySlug error:', err);
        }
        
        if (!product) {
            return res.status(404).render('error', { 
                message: 'Không tìm thấy sản phẩm: ' + slug,
                user: req.user || null 
            });
        }

        // Get related products from same category
        let relatedProducts = [];
        try {
            relatedProducts = await Product.findAll({
                category_id: product.category_id,
                limit: 4,
                offset: 0
            });
            relatedProducts = relatedProducts.filter(p => p.id !== product.id);
        } catch (err) {
            console.error('Related products error:', err);
        }

        res.render('products/detail', {
            product,
            relatedProducts,
            user: req.user || null
        });
    } catch (error) {
        console.error('Product detail error:', error);
        res.status(500).render('error', { message: 'Lỗi tải chi tiết sản phẩm: ' + error.message, user: req.user || null });
    }
};

// Search products
exports.searchProducts = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.redirect('/products');
        }

        const products = await Product.search(q, 20);

        res.render('products/search-results', {
            products,
            query: q,
            user: req.user || null
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).render('error', { message: 'Search failed' });
    }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
    try {
        const { slug } = req.params;
        
        let category = await Category.findBySlug(slug);
        
        // Mock category data if not found in database (for demo/testing)
        if (!category) {
            const categoryMap = {
                'nam': { id: 1, name: 'Thời Trang Nam', slug: 'nam', description: 'Quần áo và phụ kiện nam' },
                'nu': { id: 2, name: 'Thời Trang Nữ', slug: 'nu', description: 'Quần áo và phụ kiện nữ' },
                'tre-em': { id: 3, name: 'Thời Trang Trẻ Em', slug: 'tre-em', description: 'Quần áo trẻ em' }
            };
            category = categoryMap[slug] || null;
        }
        
        if (!category) {
            return res.status(404).render('error', { 
                message: 'Không tìm thấy danh mục: ' + slug,
                user: req.user || null 
            });
        }

        let products = [];
        try {
            products = await Product.findAll({
                category_id: category.id,
                limit: 12,
                offset: 0
            });
        } catch (err) {
            console.error('Product findAll error:', err);
            // Return empty products array on error
            products = [];
        }

        res.render('products/category', {
            category,
            products,
            user: req.user || null
        });
    } catch (error) {
        console.error('Category products error:', error);
        res.status(500).render('error', { 
            message: 'Lỗi tải sản phẩm theo danh mục: ' + error.message,
            user: req.user || null 
        });
    }
};
