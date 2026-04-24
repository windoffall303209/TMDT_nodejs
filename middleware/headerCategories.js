// File middleware/headerCategories.js: middleware xử lý request cho module headerCategories.
const Category = require('../models/Category');

// Xử lý header danh mục.
async function headerCategories(req, res, next) {
    try {
        const categories = await Category.findAll();
        res.locals.headerCategories = Category.buildTree(categories);
    } catch (error) {
        console.error('Header categories error:', error);
        res.locals.headerCategories = [];
    }

    next();
}

module.exports = headerCategories;
