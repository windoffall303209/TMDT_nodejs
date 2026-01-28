-- Add Vouchers Table and Reset Admin Account
USE tmdt_ecommerce;

-- Create vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2) NULL,
    usage_limit INT DEFAULT NULL,
    used_count INT DEFAULT 0,
    user_limit INT DEFAULT 1,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active_dates (is_active, start_date, end_date)
) ENGINE=InnoDB;

-- Create voucher_usage table to track user usage
CREATE TABLE IF NOT EXISTS voucher_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voucher_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_voucher (voucher_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- Add voucher_id to orders table if not exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_id INT NULL AFTER discount_amount;
ALTER TABLE orders ADD CONSTRAINT fk_order_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL;

-- Reset admin account (password: admin123)
DELETE FROM users WHERE email = 'admin@fashionstore.vn';
INSERT INTO users (email, password_hash, full_name, phone, role, email_verified, is_active) VALUES
('admin@fashionstore.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', '0123456789', 'admin', TRUE, TRUE);

-- Insert sample vouchers
INSERT INTO vouchers (code, name, description, type, value, min_order_amount, max_discount_amount, usage_limit, start_date, end_date, is_active) VALUES
('WELCOME10', 'Chào mừng thành viên mới', 'Giảm 10% cho đơn hàng đầu tiên', 'percentage', 10, 100000, 50000, 1000, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), TRUE),
('FREESHIP', 'Miễn phí vận chuyển', 'Giảm 30.000đ phí vận chuyển', 'fixed', 30000, 200000, NULL, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), TRUE),
('SALE20', 'Sale cuối tuần', 'Giảm 20% cho tất cả sản phẩm', 'percentage', 20, 300000, 100000, 500, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), TRUE);

SELECT 'Vouchers table created and admin account reset successfully!' AS message;
SELECT 'Admin login: admin@fashionstore.vn / admin123' AS credentials;
