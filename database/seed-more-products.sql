-- =============================================================================
-- THÊM NHIỀU SẢN PHẨM - MORE PRODUCTS SEED
-- =============================================================================
-- Chạy file này sau khi đã chạy seed.sql
-- mysql -u root -p tmdt_ecommerce < database/seed-more-products.sql

USE tmdt_ecommerce;

-- =============================================================================
-- LẤY CATEGORY IDs (động, không dùng số cứng)
-- =============================================================================
SET @cat_nam = (SELECT id FROM categories WHERE slug = 'nam' LIMIT 1);
SET @cat_nu = (SELECT id FROM categories WHERE slug = 'nu' LIMIT 1);
SET @cat_treem = (SELECT id FROM categories WHERE slug = 'tre-em' LIMIT 1);

-- Kiểm tra categories tồn tại
SELECT IF(@cat_nam IS NULL, 'ERROR: Category Nam không tồn tại!', CONCAT('Category Nam ID: ', @cat_nam)) as check_nam;
SELECT IF(@cat_nu IS NULL, 'ERROR: Category Nữ không tồn tại!', CONCAT('Category Nữ ID: ', @cat_nu)) as check_nu;
SELECT IF(@cat_treem IS NULL, 'ERROR: Category Trẻ Em không tồn tại!', CONCAT('Category Trẻ Em ID: ', @cat_treem)) as check_treem;

-- =============================================================================
-- THÊM KHUYẾN MÃI MỚI
-- =============================================================================
INSERT INTO sales (name, description, type, value, start_date, end_date, is_active) VALUES
('Flash Sale 30%', 'Giảm giá flash sale', 'percentage', 30, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), TRUE),
('Giảm 100K', 'Giảm trực tiếp 100.000đ', 'fixed', 100000, NOW(), DATE_ADD(NOW(), INTERVAL 20 DAY), TRUE);

-- Lấy ID của các sales
SET @sale_flash = (SELECT id FROM sales WHERE name = 'Flash Sale 30%' LIMIT 1);
SET @sale_100k = (SELECT id FROM sales WHERE name = 'Giảm 100K' LIMIT 1);
SET @sale_cuoi_mua = (SELECT id FROM sales WHERE name = 'Sale Cuối Mùa' LIMIT 1);
SET @sale_21 = (SELECT id FROM sales WHERE name = 'Giảm Giá 21%' LIMIT 1);

-- =============================================================================
-- SẢN PHẨM NAM - THÊM 15 SẢN PHẨM MỚI
-- =============================================================================
INSERT INTO products (category_id, name, slug, description, price, stock_quantity, sku, sale_id, is_featured) VALUES
-- Áo
(@cat_nam, 'Áo Polo Pique Nam', 'ao-polo-pique-nam', 'Áo polo pique cotton 100%, form regular fit thoải mái', 380000, 120, 'APM002', NULL, FALSE),
(@cat_nam, 'Áo Thun Oversize Nam', 'ao-thun-oversize-nam', 'Áo thun oversize phong cách streetwear', 290000, 200, 'ATM003', @sale_flash, TRUE),
(@cat_nam, 'Áo Sơ Mi Linen Nam', 'ao-so-mi-linen-nam', 'Áo sơ mi linen thoáng mát mùa hè', 620000, 80, 'ASM002', NULL, FALSE),
(@cat_nam, 'Áo Sơ Mi Kẻ Sọc', 'ao-so-mi-ke-soc-nam', 'Áo sơ mi kẻ sọc công sở lịch lãm', 480000, 90, 'ASM003', @sale_21, FALSE),
(@cat_nam, 'Áo Hoodie Basic Nam', 'ao-hoodie-basic-nam', 'Áo hoodie cotton french terry ấm áp', 550000, 75, 'AHM001', NULL, TRUE),
(@cat_nam, 'Áo Khoác Bomber Nam', 'ao-khoac-bomber-nam', 'Áo khoác bomber phong cách trẻ trung', 890000, 50, 'AKM001', @sale_flash, TRUE),
(@cat_nam, 'Áo Thun Polo Sport', 'ao-thun-polo-sport-nam', 'Áo polo thể thao thoát mồ hôi', 420000, 100, 'APM003', NULL, FALSE),
(@cat_nam, 'Áo Vest Nam Công Sở', 'ao-vest-nam-cong-so', 'Áo vest nam form slim cao cấp', 1200000, 40, 'AVM001', @sale_100k, TRUE),
-- Quần
(@cat_nam, 'Quần Jeans Rách Gối', 'quan-jeans-rach-goi-nam', 'Quần jeans rách gối phong cách', 720000, 60, 'QJM002', NULL, FALSE),
(@cat_nam, 'Quần Jogger Nam', 'quan-jogger-nam', 'Quần jogger thể thao năng động', 380000, 150, 'QGM001', @sale_flash, FALSE),
(@cat_nam, 'Quần Short Kaki Nam', 'quan-short-kaki-nam', 'Quần short kaki mùa hè thoải mái', 320000, 180, 'QSM001', NULL, FALSE),
(@cat_nam, 'Quần Tây Âu Nam', 'quan-tay-au-nam', 'Quần tây âu công sở thanh lịch', 650000, 70, 'QTM001', NULL, TRUE),
(@cat_nam, 'Quần Dài Thể Thao', 'quan-dai-the-thao-nam', 'Quần dài thể thao co giãn 4 chiều', 450000, 90, 'QDM001', NULL, FALSE),
(@cat_nam, 'Quần Linen Nam', 'quan-linen-nam', 'Quần linen thoáng mát phong cách', 520000, 65, 'QLM001', @sale_21, FALSE),
(@cat_nam, 'Quần Jeans Skinny Nam', 'quan-jeans-skinny-nam', 'Quần jeans skinny fit ôm chân', 680000, 85, 'QJM003', NULL, FALSE);

-- =============================================================================
-- SẢN PHẨM NỮ - THÊM 15 SẢN PHẨM MỚI
-- =============================================================================
INSERT INTO products (category_id, name, slug, description, price, stock_quantity, sku, sale_id, is_featured) VALUES
-- Áo
(@cat_nu, 'Áo Blouse Nữ Thanh Lịch', 'ao-blouse-nu-thanh-lich', 'Áo blouse nữ chất liệu voan mềm mại', 420000, 100, 'ABN001', NULL, FALSE),
(@cat_nu, 'Áo Croptop Nữ', 'ao-croptop-nu', 'Áo croptop nữ trẻ trung năng động', 280000, 150, 'ACN001', @sale_flash, TRUE),
(@cat_nu, 'Áo Thun Basic Nữ', 'ao-thun-basic-nu', 'Áo thun basic nữ cotton mềm mại', 220000, 200, 'ATN001', NULL, FALSE),
(@cat_nu, 'Áo Len Dệt Kim Nữ', 'ao-len-det-kim-nu', 'Áo len dệt kim mùa đông ấm áp', 580000, 60, 'ALN001', @sale_100k, FALSE),
(@cat_nu, 'Áo Cardigan Nữ', 'ao-cardigan-nu', 'Áo cardigan len mỏng phong cách Hàn Quốc', 490000, 80, 'ACN002', NULL, TRUE),
(@cat_nu, 'Áo Peplum Nữ Công Sở', 'ao-peplum-nu-cong-so', 'Áo peplum nữ sang trọng công sở', 380000, 90, 'APN001', @sale_21, FALSE),
(@cat_nu, 'Áo Khoác Jean Nữ', 'ao-khoac-jean-nu', 'Áo khoác jean nữ vintage cá tính', 650000, 55, 'AKN002', NULL, TRUE),
-- Váy/Đầm
(@cat_nu, 'Đầm Suông Công Sở', 'dam-suong-cong-so', 'Đầm suông công sở thanh lịch', 620000, 70, 'DSN001', NULL, FALSE),
(@cat_nu, 'Váy Midi Xòe', 'vay-midi-xoe-nu', 'Váy midi xòe họa tiết vintage', 480000, 85, 'VMN001', @sale_flash, TRUE),
(@cat_nu, 'Đầm Dự Tiệc', 'dam-du-tiec-nu', 'Đầm dự tiệc sang trọng lộng lẫy', 1100000, 35, 'DDN001', NULL, TRUE),
(@cat_nu, 'Váy Jeans Mini', 'vay-jeans-mini-nu', 'Váy jeans mini trẻ trung năng động', 380000, 120, 'VJN001', NULL, FALSE),
(@cat_nu, 'Đầm Hoa Nhí', 'dam-hoa-nhi-nu', 'Đầm hoa nhí phong cách vintage', 520000, 75, 'DHN001', @sale_21, FALSE),
-- Quần
(@cat_nu, 'Quần Culottes Nữ', 'quan-culottes-nu', 'Quần culottes ống rộng thanh lịch', 420000, 95, 'QCN001', NULL, FALSE),
(@cat_nu, 'Quần Legging Nữ', 'quan-legging-nu', 'Quần legging co giãn tập gym', 280000, 180, 'QLN001', @sale_flash, FALSE),
(@cat_nu, 'Quần Baggy Nữ', 'quan-baggy-nu', 'Quần baggy jeans phong cách', 550000, 70, 'QBN001', NULL, TRUE);

-- =============================================================================
-- SẢN PHẨM TRẺ EM - THÊM 12 SẢN PHẨM MỚI
-- =============================================================================
INSERT INTO products (category_id, name, slug, description, price, stock_quantity, sku, sale_id, is_featured) VALUES
-- Bé Trai
(@cat_treem, 'Áo Polo Bé Trai', 'ao-polo-be-trai', 'Áo polo cotton cho bé trai năng động', 180000, 120, 'APT001', NULL, FALSE),
(@cat_treem, 'Quần Jeans Bé Trai', 'quan-jeans-be-trai', 'Quần jeans co giãn thoải mái cho bé', 250000, 100, 'QJT001', @sale_flash, FALSE),
(@cat_treem, 'Bộ Thể Thao Bé Trai', 'bo-the-thao-be-trai', 'Bộ thể thao năng động cho bé trai', 320000, 90, 'BTT001', NULL, TRUE),
(@cat_treem, 'Áo Hoodie Bé Trai', 'ao-hoodie-be-trai', 'Áo hoodie ấm áp cho bé trai', 280000, 80, 'AHT001', @sale_21, FALSE),
(@cat_treem, 'Áo Khoác Gió Bé Trai', 'ao-khoac-gio-be-trai', 'Áo khoác gió nhẹ cho bé trai', 350000, 70, 'AKT001', NULL, FALSE),
(@cat_treem, 'Quần Short Thể Thao Bé Trai', 'quan-short-the-thao-be-trai', 'Quần short thể thao mùa hè', 150000, 150, 'QST001', NULL, FALSE),
-- Bé Gái
(@cat_treem, 'Váy Đầm Bé Gái Hoa', 'vay-dam-be-gai-hoa', 'Váy đầm hoa xinh xắn cho bé gái', 280000, 100, 'VDG001', @sale_flash, TRUE),
(@cat_treem, 'Áo Thun Bé Gái', 'ao-thun-be-gai', 'Áo thun cotton in hình dễ thương', 150000, 180, 'ATG001', NULL, FALSE),
(@cat_treem, 'Quần Legging Bé Gái', 'quan-legging-be-gai', 'Quần legging co giãn cho bé gái', 120000, 200, 'QLG001', NULL, FALSE),
(@cat_treem, 'Bộ Đồ Ngủ Bé Gái', 'bo-do-ngu-be-gai', 'Bộ đồ ngủ cotton mềm mại', 220000, 90, 'BNG001', @sale_21, FALSE),
(@cat_treem, 'Áo Khoác Len Bé Gái', 'ao-khoac-len-be-gai', 'Áo khoác len ấm cho bé gái', 320000, 60, 'AKG001', NULL, TRUE),
(@cat_treem, 'Chân Váy Bé Gái', 'chan-vay-be-gai', 'Chân váy xòe đáng yêu', 180000, 110, 'CVG001', @sale_flash, FALSE);

-- =============================================================================
-- THÊM ẢNH CHO SẢN PHẨM MỚI (dùng slug để tìm product_id)
-- =============================================================================
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1625910513413-5fc5e6b80d21?w=600', TRUE, 0 FROM products WHERE slug = 'ao-polo-pique-nam';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600', TRUE, 0 FROM products WHERE slug = 'ao-thun-oversize-nam';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600', TRUE, 0 FROM products WHERE slug = 'ao-so-mi-linen-nam';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600', TRUE, 0 FROM products WHERE slug = 'ao-so-mi-ke-soc-nam';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600', TRUE, 0 FROM products WHERE slug = 'ao-hoodie-basic-nam';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600', TRUE, 0 FROM products WHERE slug = 'ao-khoac-bomber-nam';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1585858229735-cd08d8cb510d?w=600', TRUE, 0 FROM products WHERE slug = 'ao-thun-polo-sport-nam';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600', TRUE, 0 FROM products WHERE slug = 'ao-vest-nam-cong-so';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=600', TRUE, 0 FROM products WHERE slug = 'quan-jeans-rach-goi-nam';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600', TRUE, 0 FROM products WHERE slug = 'quan-jogger-nam';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=600', TRUE, 0 FROM products WHERE slug = 'quan-short-kaki-nam';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600', TRUE, 0 FROM products WHERE slug = 'quan-tay-au-nam';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=600', TRUE, 0 FROM products WHERE slug = 'quan-dai-the-thao-nam';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1519211975560-4ca611f5a72a?w=600', TRUE, 0 FROM products WHERE slug = 'quan-linen-nam';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600', TRUE, 0 FROM products WHERE slug = 'quan-jeans-skinny-nam';

-- Nữ
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600', TRUE, 0 FROM products WHERE slug = 'ao-blouse-nu-thanh-lich';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600', TRUE, 0 FROM products WHERE slug = 'ao-croptop-nu';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600', TRUE, 0 FROM products WHERE slug = 'ao-thun-basic-nu';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600', TRUE, 0 FROM products WHERE slug = 'ao-len-det-kim-nu';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600', TRUE, 0 FROM products WHERE slug = 'ao-cardigan-nu';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1583496661160-fb5886a0ebb3?w=600', TRUE, 0 FROM products WHERE slug = 'ao-peplum-nu-cong-so';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600', TRUE, 0 FROM products WHERE slug = 'ao-khoac-jean-nu';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600', TRUE, 0 FROM products WHERE slug = 'dam-suong-cong-so';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600', TRUE, 0 FROM products WHERE slug = 'vay-midi-xoe-nu';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=600', TRUE, 0 FROM products WHERE slug = 'dam-du-tiec-nu';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1562137369-1a1a0bc66744?w=600', TRUE, 0 FROM products WHERE slug = 'vay-jeans-mini-nu';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600', TRUE, 0 FROM products WHERE slug = 'dam-hoa-nhi-nu';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600', TRUE, 0 FROM products WHERE slug = 'quan-culottes-nu';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1548369735-f548cbe6a294?w=600', TRUE, 0 FROM products WHERE slug = 'quan-legging-nu';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600', TRUE, 0 FROM products WHERE slug = 'quan-baggy-nu';

-- Trẻ Em
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600', TRUE, 0 FROM products WHERE slug = 'ao-polo-be-trai';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=600', TRUE, 0 FROM products WHERE slug = 'quan-jeans-be-trai';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600', TRUE, 0 FROM products WHERE slug = 'bo-the-thao-be-trai';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=600', TRUE, 0 FROM products WHERE slug = 'ao-hoodie-be-trai';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=600', TRUE, 0 FROM products WHERE slug = 'ao-khoac-gio-be-trai';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600', TRUE, 0 FROM products WHERE slug = 'quan-short-the-thao-be-trai';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600', TRUE, 0 FROM products WHERE slug = 'vay-dam-be-gai-hoa';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1476234251651-f353703a034d?w=600', TRUE, 0 FROM products WHERE slug = 'ao-thun-be-gai';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600', TRUE, 0 FROM products WHERE slug = 'quan-legging-be-gai';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600', TRUE, 0 FROM products WHERE slug = 'bo-do-ngu-be-gai';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600', TRUE, 0 FROM products WHERE slug = 'ao-khoac-len-be-gai';
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT id, 'https://images.unsplash.com/photo-1476234251651-f353703a034d?w=600', TRUE, 0 FROM products WHERE slug = 'chan-vay-be-gai';

-- =============================================================================
-- CẬP NHẬT SỐ LƯỢNG BÁN ĐỂ CÓ BEST SELLERS
-- =============================================================================
UPDATE products SET sold_count = 45 WHERE slug IN ('ao-thun-oversize-nam', 'ao-croptop-nu', 'bo-the-thao-be-trai');
UPDATE products SET sold_count = 35 WHERE slug IN ('ao-hoodie-basic-nam', 'ao-cardigan-nu', 'vay-dam-be-gai-hoa');
UPDATE products SET sold_count = 25 WHERE slug IN ('ao-vest-nam-cong-so', 'vay-midi-xoe-nu', 'ao-polo-be-trai');
UPDATE products SET sold_count = 15 WHERE slug IN ('quan-jogger-nam', 'dam-du-tiec-nu', 'quan-legging-be-gai');

-- =============================================================================
-- THÊM BANNER
-- =============================================================================
INSERT INTO banners (title, subtitle, image_url, link_url, display_order, is_active) VALUES
('Flash Sale Cuối Tuần', 'Giảm đến 50% tất cả sản phẩm', NULL, '/products?sale=true', 1, TRUE),
('BST Thu Đông 2024', 'Khám phá xu hướng mới nhất', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800', '/products', 2, TRUE);

SELECT 'Đã thêm thành công 42 sản phẩm mới!' as message;
