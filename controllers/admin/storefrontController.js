// File controllers/admin/storefrontController.js: điều phối handler admin cho module storefrontController.
const legacy = require('./legacy');

// Xử lý cấu hình giao diện storefront trong admin.
module.exports = {
    getStorefrontSettings: legacy.getStorefrontSettings,
    updateStorefrontSettings: legacy.updateStorefrontSettings
};
