const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // Create new user with hashed password
    static async create(userData) {
        const { email, password, full_name, phone, marketing_consent } = userData;
        
        // Hash password with bcrypt
        const password_hash = await bcrypt.hash(password, 10);
        
        const query = `
            INSERT INTO users (email, password_hash, full_name, phone, marketing_consent)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        try {
            const [result] = await pool.execute(query, [
                email,
                password_hash,
                full_name,
                phone || null,
                marketing_consent || false
            ]);
            
            return { id: result.insertId, email, full_name };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Email already exists');
            }
            throw error;
        }
    }

    // Find user by email (for login - includes locked accounts)
    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await pool.execute(query, [email]);
        return rows[0] || null;
    }

    // Find user by ID
    static async findById(id) {
        const query = 'SELECT id, email, full_name, phone, role, email_verified, marketing_consent, created_at FROM users WHERE id = ? AND is_active = TRUE';
        const [rows] = await pool.execute(query, [id]);
        return rows[0] || null;
    }

    // Verify password
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Update user profile
    static async updateProfile(id, data) {
        const { full_name, phone } = data;
        const query = 'UPDATE users SET full_name = ?, phone = ? WHERE id = ?';
        await pool.execute(query, [full_name, phone, id]);
        return await this.findById(id);
    }

    // Update marketing consent
    static async updateMarketingConsent(userId, consent) {
        const query = 'UPDATE users SET marketing_consent = ? WHERE id = ?';
        await pool.execute(query, [consent, userId]);
    }

    // Verify email
    static async verifyEmail(userId) {
        const query = 'UPDATE users SET email_verified = TRUE WHERE id = ?';
        await pool.execute(query, [userId]);
    }

    // Get all users with marketing consent
    static async getMarketingList() {
        const query = 'SELECT id, email, full_name FROM users WHERE marketing_consent = TRUE AND email_verified = TRUE AND is_active = TRUE';
        const [rows] = await pool.execute(query);
        return rows;
    }

    // Get all users (admin)
    static async findAll(filters = {}) {
        let query = 'SELECT id, email, full_name, phone, role, email_verified, marketing_consent, is_active, created_at FROM users WHERE 1=1';
        const params = [];

        if (filters.role) {
            query += ' AND role = ?';
            params.push(filters.role);
        }

        if (filters.search) {
            query += ' AND (email LIKE ? OR full_name LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        query += ' ORDER BY created_at DESC';

        if (filters.limit) {
            const limit = parseInt(filters.limit) || 50;
            const offset = parseInt(filters.offset) || 0;
            query += ` LIMIT ${limit} OFFSET ${offset}`;
        }

        const [rows] = await pool.query(query, params);
        return rows;
    }

    // Update user status (admin)
    static async updateStatus(id, isActive) {
        const query = 'UPDATE users SET is_active = ? WHERE id = ?';
        await pool.execute(query, [isActive, id]);
    }

    // Update user role (admin)
    static async updateRole(id, role) {
        const query = 'UPDATE users SET role = ? WHERE id = ?';
        await pool.execute(query, [role, id]);
    }
}

module.exports = User;
