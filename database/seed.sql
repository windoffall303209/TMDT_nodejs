-- Sample Data với ảnh demo từ Unsplash

USE tmdt_ecommerce;

-- Clear existing data
DELETE FROM cart_items;
DELETE FROM cart;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM product_images;
DELETE FROM product_variants;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM sales;
DELETE FROM banners;
DELETE FROM addresses;
DELETE FROM users WHERE email != 'admin@fashionstore.vn';

-- Insert admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, phone, role, email_verified) VALUES
('admin@fashionstore.vn', '$2a$10$xNXeR0yq9KVH.V3zvwOD9eFmkL.cW0ZLg9zKvX7yx8cZ22uQq9mCu', 'Admin', '0123456789', 'admin', TRUE);

-- Insert categories
INSERT INTO categories (name, slug, description, image_url, display_order) VALUES
('Thời Trang Nam', 'nam', 'Quần áo và phụ kiện nam', 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=800', 1),
('Thời Trang Nữ', 'nu', 'Quần áo và phụ kiện nữ', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800', 2),
('Thời Trang Trẻ Em', 'tre-em', 'Quần áo trẻ em', 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800', 3);

-- Insert sales
INSERT INTO sales (name, description, type, value, start_date, end_date, is_active) VALUES
('Sale Cuối Mùa', 'Giảm giá cuối mùa lên đến 50%', 'percentage', 50, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), TRUE),
('Giảm Giá 21%', 'Khuyến mãi đặc biệt', 'percentage', 21, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY), TRUE);

-- Insert products - Nam
INSERT INTO products (category_id, name, slug, description, price, stock_quantity, sku, sale_id, is_featured) VALUES
(1, 'Áo Polo Classic Nam', 'ao-polo-classic-nam', 'Áo polo nam chất liệu cotton cao cấp, thoáng mát', 450000, 100, 'APM001', 1, TRUE),
(1, 'Áo Thun Basic Nam', 'ao-thun-basic-nam', 'Áo thun nam form rộng thoải mái', 250000, 150, 'ATM002', NULL, FALSE),
(1, 'Quần Jeans Slim Fit', 'quan-jeans-slim-fit', 'Quần jeans nam form slim hiện đại', 680000, 90, 'QJM001', NULL, FALSE),
(1, 'Áo Sơ Mi Oxford', 'ao-so-mi-oxford', 'Áo sơ mi nam Oxford cao cấp', 520000, 60, 'ASM001', 2, TRUE),
(1, 'Quần Kaki Nam', 'quan-kaki-nam', 'Quần kaki nam công sở lịch sự', 380000, 120, 'QKM001', NULL, FALSE);

-- Insert products - Nữ
INSERT INTO products (category_id, name, slug, description, price, stock_quantity, sku, sale_id, is_featured) VALUES
(2, 'Đầm Maxi Hoa', 'dam-maxi-hoa', 'Đầm maxi họa tiết hoa thanh lịch', 750000, 50, 'DMN001', 2, TRUE),
(2, 'Áo Sơ Mi Lụa Nữ', 'ao-so-mi-lua-nu', 'Áo sơ mi lụa nữ cao cấp', 520000, 60, 'ASN002', NULL, TRUE),
(2, 'Váy Công Sở', 'vay-cong-so', 'Váy công sở thanh lịch tự tin', 420000, 80, 'VCS001', NULL, FALSE),
(2, 'Quần Jean Nữ', 'quan-jean-nu', 'Quần jean nữ co giãn thoải mái', 580000, 70, 'QJN001', 1, FALSE),
(2, 'Áo Kiểu Công Sở', 'ao-kieu-cong-so', 'Áo kiểu nữ lịch sự sang trọng', 350000, 90, 'AKN001', NULL, TRUE);

-- Insert products - Trẻ Em
INSERT INTO products (category_id, name, slug, description, price, stock_quantity, sku, sale_id, is_featured) VALUES
(3, 'Bộ Đồ Bé Trai', 'bo-do-be-trai', 'Bộ đồ cotton mềm mại cho bé trai', 320000, 80, 'BTE001', NULL, FALSE),
(3, 'Váy Công Chúa Bé Gái', 'vay-cong-chua-be-gai', 'Váy công chúa xinh xắn cho bé gái', 450000, 40, 'VTE002', 1, TRUE),
(3, 'Áo Thun Trẻ Em', 'ao-thun-tre-em', 'Áo thun trẻ em nhiều màu sắc', 180000, 150, 'ATE001', NULL, FALSE),
(3, 'Quần Short Bé Trai', 'quan-short-be-trai', 'Quần short thể thao cho bé trai', 220000, 100, 'QTE001', NULL, FALSE);

-- Insert product images với Unsplash
INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES
-- Nam
(1, 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600', TRUE, 0),
(2, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', TRUE, 0),
(3, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600', TRUE, 0),
(4, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600', TRUE, 0),
(5, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600', TRUE, 0),

-- Nữ
(6, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600', TRUE, 0),
(7, 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600', TRUE, 0),
(8, 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600', TRUE, 0),
(9, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600', TRUE, 0),
(10, 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=600', TRUE, 0),

-- Trẻ em
(11, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600', TRUE, 0),
(12, 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600', TRUE, 0),
(13, 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600', TRUE, 0),
(14, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600', TRUE, 0);

-- Insert sample address
INSERT INTO addresses (user_id, full_name, phone, address_line, district, city, is_default) VALUES
(1, 'Admin', '0123456789', '123 Nguyễn Huệ', 'Quận 1', 'TP. Hồ Chí Minh', TRUE);

-- Update sold count để có best sellers
UPDATE products SET sold_count = 50 WHERE id IN (1, 6, 12);
UPDATE products SET sold_count = 30 WHERE id IN (2, 7);
UPDATE products SET sold_count = 20 WHERE id IN (4, 10);
