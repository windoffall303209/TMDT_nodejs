// File controllers/admin/index.js: điều phối handler admin cho module index.
module.exports = {
    ...require('./dashboardController'),
    ...require('./categoryController'),
    ...require('./productController'),
    ...require('./orderController'),
    ...require('./returnController'),
    ...require('./userController'),
    ...require('./bannerController'),
    ...require('./marketingController'),
    ...require('./storefrontController')
};
