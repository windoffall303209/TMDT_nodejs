// Admin Orders page JavaScript
// Extracted from views/admin/orders.ejs

/**
 * Update order status
 * @param {number} orderId - Order ID
 * @param {string} status - New status
 */
async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (response.ok) {
            alert('Cập nhật trạng thái thành công!');
        } else {
            alert('Lỗi cập nhật trạng thái');
        }
    } catch (error) {
        alert('Lỗi: ' + error.message);
    }
}

/**
 * View order detail
 * @param {number} orderId - Order ID
 */
function viewOrderDetail(orderId) {
    alert('Chi tiết đơn hàng #' + orderId + ' - Chức năng đang phát triển');
}
