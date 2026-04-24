// File controllers/admin/orderController.js: điều phối handler admin cho module orderController.
const legacy = require('./legacy');

// Xử lý danh sách, chi tiết và cập nhật trạng thái đơn hàng.
module.exports = {
    getOrders: legacy.getOrders,
    getOrderDetail: legacy.getOrderDetail,
    updateOrderStatus: legacy.updateOrderStatus
};
