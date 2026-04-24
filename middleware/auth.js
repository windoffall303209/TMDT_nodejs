// File middleware/auth.js: middleware xử lý request cho module auth.
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config();

// Kiểm tra email verification route.
function isEmailVerificationRoute(req) {
    const path = (req.originalUrl || req.path || '').split('?')[0];
    return path === '/auth/verify-email' || path === '/auth/send-verification';
}

// Tạo dữ liệu đăng nhập điều hướng.
function buildLoginRedirect(req) {
    const redirectTarget = req.originalUrl || req.path || '/';
    return `/auth/login?redirect=${encodeURIComponent(redirectTarget)}`;
}

// Tạo dữ liệu verify email điều hướng.
function buildVerifyEmailRedirect(req) {
    const redirectTarget = req.originalUrl || req.path || '/';
    return `/auth/verify-email?redirect=${encodeURIComponent(redirectTarget)}`;
}

// Chuẩn hóa authenticated người dùng.
function normalizeAuthenticatedUser(decoded, userRow) {
    return {
        ...decoded,
        id: userRow.id,
        email: userRow.email,
        role: userRow.role || decoded.role || 'customer',
        email_verified: userRow.email_verified === true || userRow.email_verified === 1
    };
}

// Tìm đang bật xác thực người dùng.
async function findActiveAuthUser(userId) {
    const [rows] = await pool.execute(
        'SELECT id, email, role, email_verified, is_active FROM users WHERE id = ? LIMIT 1',
        [userId]
    );

    const user = rows[0];
    if (!user || user.is_active === false || user.is_active === 0) {
        return null;
    }

    return user;
}

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        let token = req.cookies?.token;

        if (!token) {
            const authHeader = req.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            // Redirect to login for HTML requests
            if (req.accepts('html')) {
                return res.redirect(buildLoginRedirect(req));
            }
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const activeUser = await findActiveAuthUser(decoded.id);

        if (!activeUser) {
            const { maxAge, ...cookieOptions } = {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production'
            };
            res.clearCookie('token', cookieOptions);

            if (req.accepts('html')) {
                return res.redirect(buildLoginRedirect(req));
            }

            return res.status(401).json({ message: 'Account is inactive or no longer exists.' });
        }

        req.user = normalizeAuthenticatedUser(decoded, activeUser);

        if (!req.user.email_verified && !isEmailVerificationRoute(req)) {
            if (req.accepts('html')) {
                return res.redirect(buildVerifyEmailRedirect(req));
            }

            return res.status(403).json({
                message: 'Email verification is required before using this account.',
                code: 'EMAIL_NOT_VERIFIED',
                redirect: buildVerifyEmailRedirect(req)
            });
        }

        next();
    } catch (error) {
        // Clear invalid token cookie
        res.clearCookie('token');

        // Redirect to login for HTML requests
        if (req.accepts('html')) {
            return res.redirect(buildLoginRedirect(req));
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin only.' });
    }
};

// Optional authentication (for features like guest cart)
const optionalAuth = async (req, res, next) => {
    try {
        let token = req.cookies?.token;
        
        if (!token) {
            const authHeader = req.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        }
    } catch (error) {
        // Token is invalid or expired, but we allow guest access
        req.user = null;
    }
    next();
};

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role || 'customer',
            email_verified: user.email_verified === true || user.email_verified === 1
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE || '1h'
        }
    );
};

module.exports = {
    verifyToken,
    isAdmin,
    optionalAuth,
    generateToken
};
