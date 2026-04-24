// File public/js/admin/orders.js: xử lý tương tác giao diện admin cho module orders.
function showOrdersToast(message, type = 'success') {
    if (typeof showGlobalToast === 'function') {
        showGlobalToast(message, type);
    }
}

// Cập nhật đơn hàng trạng thái.
async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            showOrdersToast('Cập nhật trạng thái thành công!', 'success');
            setTimeout(() => location.reload(), 1000);
            return;
        }

        const data = await response.json().catch(() => ({}));
        showOrdersToast(data.message || 'Lỗi cập nhật trạng thái', 'error');
    } catch (error) {
        showOrdersToast(`Lỗi: ${error.message}`, 'error');
    }
}

// Đóng đơn hàng modal.
function closeOrderModal() {
    document.getElementById('orderDetailModal')?.style.setProperty('display', 'none');
}

// Xử lý print đơn hàng.
function printOrder(orderId) {
    window.open(`/admin/orders/${orderId}/print`, '_blank');
}

// Khởi tạo đơn hàng tabs.
function initOrderTabs() {
    document.querySelectorAll('.order-tab').forEach((tab) => {
        // Gan su kien nguoi dung cho thanh phan giao dien lien quan.
        tab.addEventListener('click', function() {
            document.querySelectorAll('.order-tab').forEach((item) => item.classList.remove('active'));
            this.classList.add('active');

            const status = this.dataset.status;
            document.querySelectorAll('tbody tr[data-status]').forEach((row) => {
                row.hidden = !(status === 'all' || row.dataset.status === status);
            });
        });
    });
}

// Khởi tạo đơn hàng actions.
function initOrderActions() {
    document.querySelectorAll('.order-status-select[data-order-id]').forEach((select) => {
        // Gan su kien nguoi dung cho thanh phan giao dien lien quan.
        select.addEventListener('change', () => {
            select.className = `order-status-select order-status-select--${select.value}`;
            updateOrderStatus(select.dataset.orderId, select.value);
        });
    });

    document.querySelectorAll('[data-order-action="print"]').forEach((button) => {
        // Gan su kien nguoi dung cho thanh phan giao dien lien quan.
        button.addEventListener('click', () => {
            printOrder(button.dataset.orderId);
        });
    });

    document.querySelectorAll('[data-order-modal-close]').forEach((button) => {
        // Gan su kien nguoi dung cho thanh phan giao dien lien quan.
        button.addEventListener('click', closeOrderModal);
    });

    document.getElementById('orderDetailModal')?.addEventListener('click', (event) => {
        if (event.target.id === 'orderDetailModal') {
            closeOrderModal();
        }
    });
}

// Khởi tạo quản trị đơn hàng trang.
function initAdminOrdersPage() {
    initOrderTabs();
    initOrderActions();
}

// Gan su kien nguoi dung cho thanh phan giao dien lien quan.
document.addEventListener('DOMContentLoaded', initAdminOrdersPage);
