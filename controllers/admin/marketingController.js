// File controllers/admin/marketingController.js: điều phối handler admin cho module marketingController.
const legacy = require('./legacy');

// Xử lý khuyến mãi, voucher và email marketing trong admin.
module.exports = {
    getSales: legacy.getSales,
    createSale: legacy.createSale,
    updateSale: legacy.updateSale,
    deleteSale: legacy.deleteSale,
    sendSaleAnnouncementEmail: legacy.sendSaleAnnouncementEmail,
    sendMarketingEmail: legacy.sendMarketingEmail,
    getVouchers: legacy.getVouchers,
    createVoucher: legacy.createVoucher,
    updateVoucher: legacy.updateVoucher,
    deleteVoucher: legacy.deleteVoucher,
    updateVoucherStatus: legacy.updateVoucherStatus,
    sendVoucherAnnouncementEmail: legacy.sendVoucherAnnouncementEmail
};
