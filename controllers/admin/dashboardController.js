// File controllers/admin/dashboardController.js: điều phối handler admin cho module dashboardController.
const legacy = require('./legacy');

// Xử lý trang tổng quan quản trị và số liệu dashboard.
module.exports = {
    getDashboard: legacy.getDashboard
};
