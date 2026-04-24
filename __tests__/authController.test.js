// File __tests__/authController.test.js: kiểm thử tự động cho module authController.test.
process.env.NODE_ENV = 'test';

jest.mock('../models/User', () => ({
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    verifyPassword: jest.fn(),
    generateVerificationCode: jest.fn(),
    verifyEmailCode: jest.fn()
}));

jest.mock('../models/Cart', () => ({
    mergeGuestCart: jest.fn()
}));

jest.mock('../models/Address', () => ({
    create: jest.fn()
}));

jest.mock('../middleware/auth', () => ({
    generateToken: jest.fn(() => 'test-token')
}));

jest.mock('../services/emailService', () => ({
    sendWelcomeEmail: jest.fn(() => Promise.resolve()),
    sendVerificationEmail: jest.fn(() => Promise.resolve(true))
}));

jest.mock('../config/cloudinary', () => ({
    uploadToCloudinary: jest.fn()
}));

jest.mock('multer', () => {
    const multer = jest.fn(() => ({
        single: jest.fn(() => (req, res, next) => {
            if (typeof next === 'function') {
                next();
            }
        })
    }));
    multer.diskStorage = jest.fn(() => ({}));
    return multer;
});

const User = require('../models/User');
const Cart = require('../models/Cart');
const Address = require('../models/Address');
const emailService = require('../services/emailService');
const authController = require('../controllers/authController');

// Tạo response giả lập cho test.
function createRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.render = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
}

describe('authController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('sets hardened auth cookie options during registration', async () => {
        User.create.mockResolvedValue({
            id: 1,
            email: 'user@example.com',
            full_name: 'Test User',
            email_verified: false
        });
        User.findByEmail.mockResolvedValue(null);
        User.generateVerificationCode.mockResolvedValue('123456');

        const req = {
            body: {
                email: 'user@example.com',
                password: 'Secret123',
                confirm_password: 'Secret123',
                full_name: 'Test User'
            },
            accepts: jest.fn().mockReturnValue(false)
        };
        const res = createRes();

        await authController.register(req, res);

        expect(res.cookie).toHaveBeenCalledWith('token', 'test-token', expect.objectContaining({
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: 24 * 60 * 60 * 1000
        }));
        expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('uses sessionID when merging a guest cart on login', async () => {
        User.findByEmail.mockResolvedValue({
            id: 7,
            email: 'user@example.com',
            password_hash: 'hash',
            role: 'user',
            is_active: true,
            email_verified: true
        });
        User.verifyPassword.mockResolvedValue(true);
        Cart.mergeGuestCart.mockResolvedValue();

        const req = {
            body: {
                email: 'user@example.com',
                password: 'secret123'
            },
            sessionID: 'session-123',
            accepts: jest.fn().mockReturnValue(false)
        };
        const res = createRes();

        await authController.login(req, res);

        expect(Cart.mergeGuestCart).toHaveBeenCalledWith(7, 'session-123');
        expect(res.cookie).toHaveBeenCalledWith('token', 'test-token', expect.objectContaining({
            sameSite: 'lax',
            secure: false
        }));
    });

    it('keeps unverified accounts out of the app and redirects them to verification on login', async () => {
        User.findByEmail.mockResolvedValue({
            id: 8,
            email: 'pending@example.com',
            password_hash: 'hash',
            role: 'customer',
            is_active: true,
            email_verified: false
        });
        User.verifyPassword.mockResolvedValue(true);
        User.generateVerificationCode.mockResolvedValue('654321');

        const req = {
            body: {
                email: 'pending@example.com',
                password: 'secret123'
            },
            sessionID: 'session-456',
            accepts: jest.fn().mockReturnValue(true)
        };
        const res = createRes();

        await authController.login(req, res);

        expect(res.cookie).toHaveBeenCalledWith('token', 'test-token', expect.any(Object));
        expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'pending@example.com' }),
            '654321'
        );
        expect(Cart.mergeGuestCart).not.toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/auth/verify-email?sent=1');
    });

    it('does not force new addresses to become default', async () => {
        Address.create.mockResolvedValue({ id: 3 });

        const req = {
            user: { id: 9 },
            body: {
                full_name: 'Receiver',
                phone: '0123456789',
                address_line: '123 Street',
                city: 'HCM'
            }
        };
        const res = createRes();

        await authController.createAddress(req, res);

        expect(Address.create).toHaveBeenCalledWith(9, expect.objectContaining({
            is_default: false
        }));
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true
        }));
    });
});
