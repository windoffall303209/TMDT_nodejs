-- Migration: Add user profile fields
-- Run this SQL to add new columns to users table

ALTER TABLE users 
ADD COLUMN avatar_url VARCHAR(500) DEFAULT NULL AFTER phone,
ADD COLUMN birthday DATE DEFAULT NULL AFTER avatar_url,
ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE AFTER birthday,
ADD COLUMN email_verified_at DATETIME DEFAULT NULL AFTER phone_verified;

-- Optional: Add verification tokens columns (for future verification feature)
-- ALTER TABLE users 
-- ADD COLUMN phone_verification_code VARCHAR(6) DEFAULT NULL,
-- ADD COLUMN phone_verification_expires DATETIME DEFAULT NULL;
