// File controllers/admin/userController.js: điều phối handler admin cho module userController.
const legacy = require('./legacy');

// Xử lý danh sách, chi tiết và khóa/mở khóa tài khoản người dùng.
module.exports = {
    getUsers: legacy.getUsers,
    getUserDetail: legacy.getUserDetail,
    updateUserStatus: legacy.updateUserStatus
};
