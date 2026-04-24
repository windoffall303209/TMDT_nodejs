// File controllers/admin/bannerController.js: điều phối handler admin cho module bannerController.
const legacy = require('./legacy');

// Xử lý banner quảng cáo và sắp xếp thứ tự hiển thị.
module.exports = {
    getBanners: legacy.getBanners,
    createBanner: legacy.createBanner,
    deleteBanner: legacy.deleteBanner,
    toggleBannerActive: legacy.toggleBannerActive,
    reorderBanners: legacy.reorderBanners,
    updateBanner: legacy.updateBanner
};
