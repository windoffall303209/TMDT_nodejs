const Category = require('../models/Category');

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
