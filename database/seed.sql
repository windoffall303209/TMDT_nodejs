-- =============================================================================
-- WIND OF FALL - Sample Data Seed
-- =============================================================================
-- Complete seed data including admin, products, vouchers
-- Run after schema.sql: mysql -u root -p tmdt_ecommerce < database/seed.sql
-- =============================================================================

USE tmdt_ecommerce;

-- =============================================================================
-- ADMIN USER (password: admin123)
-- =============================================================================
INSERT INTO users (email, password_hash, full_name, phone, role, email_verified, is_active) VALUES
('admin@fashionstore.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', '0123456789', 'admin', TRUE, TRUE);

-- =============================================================================
-- CATEGORIES
-- =============================================================================
INSERT INTO categories (name, slug, description, image_url, display_order) VALUES
('Thời Trang Nam', 'nam', 'Quần áo và phụ kiện nam', 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=800', 1),
('Thời Trang Nữ', 'nu', 'Quần áo và phụ kiện nữ', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800', 2),
('Thời Trang Trẻ Em', 'tre-em', 'Quần áo trẻ em', 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800', 3);

-- =============================================================================
-- SALES / PROMOTIONS
-- =============================================================================
INSERT INTO sales (name, description, type, value, start_date, end_date, is_active) VALUES
('Sale Cuối Mùa', 'Giảm giá cuối mùa lên đến 50%', 'percentage', 50, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), TRUE),
('Giảm Giá 21%', 'Khuyến mãi đặc biệt', 'percentage', 21, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY), TRUE),
('Flash Sale 30%', 'Giảm giá flash sale', 'percentage', 30, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), TRUE),
('Giảm 100K', 'Giảm trực tiếp 100.000đ', 'fixed', 100000, NOW(), DATE_ADD(NOW(), INTERVAL 20 DAY), TRUE);

-- =============================================================================
-- VOUCHERS
-- =============================================================================
INSERT INTO vouchers (code, name, description, type, value, min_order_amount, max_discount_amount, usage_limit, start_date, end_date, is_active) VALUES
('WELCOME10', 'Chào mừng thành viên mới', 'Giảm 10% cho đơn hàng đầu tiên', 'percentage', 10, 100000, 50000, 1000, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), TRUE),
('FREESHIP', 'Miễn phí vận chuyển', 'Giảm 30.000đ phí vận chuyển', 'fixed', 30000, 200000, NULL, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), TRUE),
('SALE20', 'Sale cuối tuần', 'Giảm 20% cho tất cả sản phẩm', 'percentage', 20, 300000, 100000, 500, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), TRUE),
('VIP50', 'Ưu đãi VIP', 'Giảm 50.000đ cho khách VIP', 'fixed', 50000, 500000, NULL, 100, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), TRUE);

-- =============================================================================
-- PRODUCTS - NAM
-- =============================================================================
INSERT INTO products (category_id, name, slug, description, price, stock_quantity, sku, sale_id, is_featured) VALUES
(1, 'Áo Polo Classic Nam', 'ao-polo-classic-nam', 'Áo polo nam chất liệu cotton cao cấp, thoáng mát', 450000, 100, 'APM001', 1, TRUE),
(1, 'Áo Thun Basic Nam', 'ao-thun-basic-nam', 'Áo thun nam form rộng thoải mái', 250000, 150, 'ATM002', NULL, FALSE),
(1, 'Quần Jeans Slim Fit', 'quan-jeans-slim-fit', 'Quần jeans nam form slim hiện đại', 680000, 90, 'QJM001', NULL, FALSE),
(1, 'Áo Sơ Mi Oxford', 'ao-so-mi-oxford', 'Áo sơ mi nam Oxford cao cấp', 520000, 60, 'ASM001', 2, TRUE),
(1, 'Quần Kaki Nam', 'quan-kaki-nam', 'Quần kaki nam công sở lịch sự', 380000, 120, 'QKM001', NULL, FALSE),
(1, 'Áo Polo Pique Nam', 'ao-polo-pique-nam', 'Áo polo pique cotton 100%, form regular fit thoải mái', 380000, 120, 'APM002', NULL, FALSE),
(1, 'Áo Thun Oversize Nam', 'ao-thun-oversize-nam', 'Áo thun oversize phong cách streetwear', 290000, 200, 'ATM003', 3, TRUE),
(1, 'Áo Hoodie Basic Nam', 'ao-hoodie-basic-nam', 'Áo hoodie cotton french terry ấm áp', 550000, 75, 'AHM001', NULL, TRUE),
(1, 'Áo Khoác Bomber Nam', 'ao-khoac-bomber-nam', 'Áo khoác bomber phong cách trẻ trung', 890000, 50, 'AKM001', 3, TRUE),
(1, 'Quần Jogger Nam', 'quan-jogger-nam', 'Quần jogger thể thao năng động', 380000, 150, 'QGM001', 3, FALSE);

-- =============================================================================
-- PRODUCTS - NỮ
-- =============================================================================
INSERT INTO products (category_id, name, slug, description, price, stock_quantity, sku, sale_id, is_featured) VALUES
(2, 'Đầm Maxi Hoa', 'dam-maxi-hoa', 'Đầm maxi họa tiết hoa thanh lịch', 750000, 50, 'DMN001', 2, TRUE),
(2, 'Áo Sơ Mi Lụa Nữ', 'ao-so-mi-lua-nu', 'Áo sơ mi lụa nữ cao cấp', 520000, 60, 'ASN002', NULL, TRUE),
(2, 'Váy Công Sở', 'vay-cong-so', 'Váy công sở thanh lịch tự tin', 420000, 80, 'VCS001', NULL, FALSE),
(2, 'Quần Jean Nữ', 'quan-jean-nu', 'Quần jean nữ co giãn thoải mái', 580000, 70, 'QJN001', 1, FALSE),
(2, 'Áo Kiểu Công Sở', 'ao-kieu-cong-so', 'Áo kiểu nữ lịch sự sang trọng', 350000, 90, 'AKN001', NULL, TRUE),
(2, 'Áo Croptop Nữ', 'ao-croptop-nu', 'Áo croptop nữ trẻ trung năng động', 280000, 150, 'ACN001', 3, TRUE),
(2, 'Áo Cardigan Nữ', 'ao-cardigan-nu', 'Áo cardigan len mỏng phong cách Hàn Quốc', 490000, 80, 'ACN002', NULL, TRUE),
(2, 'Váy Midi Xòe', 'vay-midi-xoe-nu', 'Váy midi xòe họa tiết vintage', 480000, 85, 'VMN001', 3, TRUE),
(2, 'Đầm Dự Tiệc', 'dam-du-tiec-nu', 'Đầm dự tiệc sang trọng lộng lẫy', 1100000, 35, 'DDN001', NULL, TRUE),
(2, 'Quần Baggy Nữ', 'quan-baggy-nu', 'Quần baggy jeans phong cách', 550000, 70, 'QBN001', NULL, TRUE);

-- =============================================================================
-- PRODUCTS - TRẺ EM
-- =============================================================================
INSERT INTO products (category_id, name, slug, description, price, stock_quantity, sku, sale_id, is_featured) VALUES
(3, 'Bộ Đồ Bé Trai', 'bo-do-be-trai', 'Bộ đồ cotton mềm mại cho bé trai', 320000, 80, 'BTE001', NULL, FALSE),
(3, 'Váy Công Chúa Bé Gái', 'vay-cong-chua-be-gai', 'Váy công chúa xinh xắn cho bé gái', 450000, 40, 'VTE002', 1, TRUE),
(3, 'Áo Thun Trẻ Em', 'ao-thun-tre-em', 'Áo thun trẻ em nhiều màu sắc', 180000, 150, 'ATE001', NULL, FALSE),
(3, 'Quần Short Bé Trai', 'quan-short-be-trai', 'Quần short thể thao cho bé trai', 220000, 100, 'QTE001', NULL, FALSE),
(3, 'Bộ Thể Thao Bé Trai', 'bo-the-thao-be-trai', 'Bộ thể thao năng động cho bé trai', 320000, 90, 'BTT001', NULL, TRUE),
(3, 'Váy Đầm Bé Gái Hoa', 'vay-dam-be-gai-hoa', 'Váy đầm hoa xinh xắn cho bé gái', 280000, 100, 'VDG001', 3, TRUE);

-- =============================================================================
-- PRODUCT IMAGES
-- =============================================================================
INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES
-- Nam
(1, 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600', TRUE, 0),
(2, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', TRUE, 0),
(3, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600', TRUE, 0),
(4, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600', TRUE, 0),
(5, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600', TRUE, 0),
(6, 'https://images.unsplash.com/photo-1625910513413-5fc5e6b80d21?w=600', TRUE, 0),
(7, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600', TRUE, 0),
(8, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600', TRUE, 0),
(9, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600', TRUE, 0),
(10, 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600', TRUE, 0),
-- Nữ
(11, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600', TRUE, 0),
(12, 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600', TRUE, 0),
(13, 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600', TRUE, 0),
(14, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600', TRUE, 0),
(15, 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=600', TRUE, 0),
(16, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600', TRUE, 0),
(17, 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600', TRUE, 0),
(18, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600', TRUE, 0),
(19, 'https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=600', TRUE, 0),
(20, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600', TRUE, 0),
-- Trẻ em
(21, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600', TRUE, 0),
(22, 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600', TRUE, 0),
(23, 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600', TRUE, 0),
(24, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600', TRUE, 0),
(25, 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600', TRUE, 0),
(26, 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600', TRUE, 0);

-- =============================================================================
-- ADMIN ADDRESS
-- =============================================================================
INSERT INTO addresses (user_id, full_name, phone, address_line, district, city, is_default) VALUES
(1, 'Admin', '0123456789', '123 Nguyễn Huệ', 'Quận 1', 'TP. Hồ Chí Minh', TRUE);

-- =============================================================================
-- UPDATE SOLD COUNT FOR BEST SELLERS
-- =============================================================================
UPDATE products SET sold_count = 50 WHERE slug IN ('ao-polo-classic-nam', 'dam-maxi-hoa', 'vay-cong-chua-be-gai');
UPDATE products SET sold_count = 45 WHERE slug IN ('ao-thun-oversize-nam', 'ao-croptop-nu', 'bo-the-thao-be-trai');
UPDATE products SET sold_count = 35 WHERE slug IN ('ao-hoodie-basic-nam', 'ao-cardigan-nu', 'vay-dam-be-gai-hoa');
UPDATE products SET sold_count = 30 WHERE slug IN ('ao-thun-basic-nam', 'ao-so-mi-lua-nu');
UPDATE products SET sold_count = 20 WHERE slug IN ('ao-so-mi-oxford', 'ao-kieu-cong-so');

-- =============================================================================
-- BANNERS
-- =============================================================================
INSERT INTO banners (title, subtitle, image_url, link_url, display_order, is_active) VALUES
('Flash Sale Cuối Tuần', 'Giảm đến 50% tất cả sản phẩm', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200', '/products?sale=true', 1, TRUE),
('BST Thu Đông 2024', 'Khám phá xu hướng mới nhất', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200', '/products', 2, TRUE);

-- =============================================================================
-- END
-- =============================================================================
SELECT 'Seed data imported successfully!' AS Status;
SELECT 'Admin login: admin@fashionstore.vn / admin123' AS Credentials;
