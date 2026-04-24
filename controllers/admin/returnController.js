// File controllers/admin/returnController.js: điều phối handler admin cho module returnController.
const legacy = require('./legacy');

// Xử lý danh sách, chi tiết và duyệt yêu cầu hoàn hàng.
module.exports = {
    getReturnRequests: legacy.getReturnRequests,
    getReturnRequestDetail: legacy.getReturnRequestDetail,
    updateReturnRequestStatus: legacy.updateReturnRequestStatus
};
