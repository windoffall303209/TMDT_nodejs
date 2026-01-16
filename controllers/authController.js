const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const emailService = require('../services/emailService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for avatar upload
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'public/uploads/avatars';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `avatar_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'));
    }
}).single('avatar');
// Register new user
exports.register = async (req, res) => {
    try {
        const { email, password, full_name, phone, marketing_consent } = req.body;

        // Basic validation
        if (!email || !password || !full_name) {
            return res.status(400).json({ message: 'Email, password and full name are required' });
        }

        // Create user
        const user = await User.create({
            email,
            password,
            full_name,
            phone,
            marketing_consent: marketing_consent === 'on' || marketing_consent === true
        });

        // Send welcome email
        emailService.sendWelcomeEmail(user).catch(err => console.error('Email error:', err));

        // Generate token
        const token = generateToken(user);

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Redirect or respond
        if (req.accepts('html')) {
            return res.redirect('/');
        }
        
        res.status(201).json({
            message: 'Registration successful',
            user: { id: user.id, email: user.email, full_name: user.full_name },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        if (req.accepts('html')) {
            return res.render('auth/register', {
                error: error.message,
                formData: req.body
            });
        }
        
        res.status(400).json({ message: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            throw new Error('Email hoặc mật khẩu không đúng');
        }

        // Verify password
        const isValid = await User.verifyPassword(password, user.password_hash);
        if (!isValid) {
            throw new Error('Email hoặc mật khẩu không đúng');
        }

        // Check if account is locked
        if (user.is_active === false || user.is_active === 0) {
            throw new Error('Tài khoản của bạn đã bị khóa do vi phạm điều khoản sử dụng. Vui lòng liên hệ hỗ trợ.');
        }

        // Generate token
        const token = generateToken(user);

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Merge guest cart if exists
        if (req.session && req.session.id) {
            const Cart = require('../models/Cart');
            await Cart.mergeGuestCart(user.id, req.session.id).catch(err => {
                console.error('Cart merge error:', err);
            });
        }

        // Redirect or respond
        if (req.accepts('html')) {
            return res.redirect('/');
        }
        
        res.json({
            message: 'Login successful',
            user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        
        if (req.accepts('html')) {
            return res.render('auth/login', {
                error: error.message,
                email: req.body.email
            });
        }
        
        res.status(401).json({ message: error.message });
    }
};

// Logout user
exports.logout = (req, res) => {
    res.clearCookie('token');
    
    if (req.accepts('html')) {
        return res.redirect('/');
    }
    
    res.json({ message: 'Logout successful' });
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (req.accepts('html')) {
            return res.render('user/profile', { user });
        }
        
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { full_name, phone } = req.body;
        
        const updatedUser = await User.updateProfile(req.user.id, {
            full_name,
            phone
        });

        if (req.accepts('html')) {
            return res.redirect('/user/profile');
        }
        
        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Render register page
exports.showRegister = (req, res) => {
    res.render('auth/register', { error: null, formData: {} });
};

// Render login page
exports.showLogin = (req, res) => {
    res.render('auth/login', { error: null, email: '' });
};

// Create address
exports.createAddress = async (req, res) => {
    try {
        const Address = require('../models/Address');
        const { full_name, phone, address_line, ward, district, city, is_default } = req.body;
        
        if (!full_name || !phone || !address_line || !city) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc' 
            });
        }
        
        const address = await Address.create(req.user.id, {
            full_name,
            phone,
            address_line,
            ward,
            district,
            city,
            is_default: is_default || true
        });
        
        res.json({
            success: true,
            message: 'Đã lưu địa chỉ thành công',
            address
        });
    } catch (error) {
        console.error('Create address error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update full profile (name, phone, birthday)
exports.updateFullProfile = async (req, res) => {
    try {
        const { full_name, phone, birthday } = req.body;
        
        if (!full_name || full_name.trim().length < 2) {
            return res.status(400).json({ 
                success: false, 
                message: 'Họ tên phải có ít nhất 2 ký tự' 
            });
        }

        const updatedUser = await User.updateFullProfile(req.user.id, {
            full_name: full_name.trim(),
            phone: phone?.trim() || null,
            birthday: birthday || null
        });

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password, confirm_password } = req.body;
        
        // Validation
        if (!current_password || !new_password || !confirm_password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng điền đầy đủ thông tin' 
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự' 
            });
        }

        if (new_password !== confirm_password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Xác nhận mật khẩu không khớp' 
            });
        }

        await User.changePassword(req.user.id, current_password, new_password);

        res.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Upload avatar
exports.handleAvatarUpload = (req, res) => {
    uploadAvatar(req, res, async (err) => {
        if (err) {
            console.error('Avatar upload error:', err);
            return res.status(400).json({ 
                success: false, 
                message: err.message || 'Lỗi upload ảnh' 
            });
        }

        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng chọn file ảnh' 
            });
        }

        try {
            const avatarUrl = `/uploads/avatars/${req.file.filename}`;
            const updatedUser = await User.updateAvatar(req.user.id, avatarUrl);

            res.json({
                success: true,
                message: 'Cập nhật ảnh đại diện thành công',
                avatar_url: avatarUrl,
                user: updatedUser
            });
        } catch (error) {
            console.error('Update avatar error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
};
