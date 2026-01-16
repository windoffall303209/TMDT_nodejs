-- Update admin password to: admin123
USE tmdt_ecommerce;

UPDATE users 
SET password_hash = '$2a$10$xNXeR0yq9KVH.V3zvwOD9eFmkL.cW0ZLg9zKvX7yx8cZ22uQq9mCu',
    role = 'admin',
    email_verified = TRUE
WHERE email = 'admin@fashionstore.vn';

-- Check if updated
SELECT email, role, email_verified FROM users WHERE email = 'admin@fashionstore.vn';
