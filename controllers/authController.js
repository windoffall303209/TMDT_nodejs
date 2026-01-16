const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const emailService = require('../services/emailService');

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
