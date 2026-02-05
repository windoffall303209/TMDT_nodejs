const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToCloud } = require('../middleware/upload');

// All admin routes require authentication and admin role
router.use(verifyToken, isAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);
router.get('/', (req, res) => res.redirect('/admin/dashboard'));

// Products
router.get('/products', adminController.getProducts);
router.post('/products', upload.array('images', 5), uploadToCloud, adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Product Images
router.get('/products/:id/images', adminController.getProductImages);
router.post('/products/:id/images', adminController.addProductImageUrl);
router.post('/products/:id/images/upload', upload.single('image'), uploadToCloud, adminController.uploadProductImage);
router.delete('/products/images/:imageId', adminController.deleteProductImage);
router.put('/products/images/:imageId/primary', adminController.setPrimaryImage);

// Orders
router.get('/orders', adminController.getOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);

// Users
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);

// Banners
router.get('/banners', adminController.getBanners);
router.post('/banners', upload.single('image'), uploadToCloud, adminController.createBanner);
router.delete('/banners/:id', adminController.deleteBanner);

// Sales
router.get('/sales', adminController.getSales);
router.post('/sales', adminController.createSale);

// Vouchers
router.get('/vouchers', adminController.getVouchers);
router.post('/vouchers', adminController.createVoucher);
router.put('/vouchers/:id', adminController.updateVoucher);
router.delete('/vouchers/:id', adminController.deleteVoucher);
router.put('/vouchers/:id/status', adminController.updateVoucherStatus);

// Email Marketing
router.post('/email/send', adminController.sendMarketingEmail);

module.exports = router;
