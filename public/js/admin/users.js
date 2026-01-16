// Admin Users page JavaScript
// Extracted from views/admin/users.ejs

/**
 * Show toast notification
 * @param {string} message - Message to show
 * @param {string} type - Type: 'success', 'error', or 'info'
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'linear-gradient(135deg, #4caf50, #45a049)' : 
                    type === 'error' ? 'linear-gradient(135deg, #f44336, #d32f2f)' : 
                    'linear-gradient(135deg, #2196f3, #1976d2)';
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; background: ${bgColor}; color: white; padding: 16px 24px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.25); margin-bottom: 10px; min-width: 280px; animation: slideInRight 0.3s ease;">
            <span style="font-size: 20px;">${icon}</span>
            <span style="font-size: 14px; font-weight: 500;">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Show confirm modal
 * @param {string} message - Confirmation message
 * @param {string} title - Modal title
 * @param {string} yesText - Confirm button text
 * @param {string} yesColor - Confirm button color
 * @returns {Promise<boolean>}
 */
function showConfirm(message, title = 'Xác nhận', yesText = 'Xác nhận', yesColor = '#f44336') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmYes').textContent = yesText;
        document.getElementById('confirmYes').style.background = yesColor;
        modal.style.display = 'flex';
        
        document.getElementById('confirmYes').onclick = () => {
            modal.style.display = 'none';
            resolve(true);
        };
        document.getElementById('confirmNo').onclick = () => {
            modal.style.display = 'none';
            resolve(false);
        };
    });
}

/**
 * Toggle user status (lock/unlock)
 * @param {number} userId - User ID
 * @param {boolean} currentStatus - Current is_active status
 */
async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'khóa' : 'mở khóa';
    const yesColor = currentStatus ? '#f44336' : '#4caf50';
    const confirmed = await showConfirm(
        `Bạn có chắc muốn ${action} người dùng này?`, 
        currentStatus ? 'Xác nhận Khóa người dùng' : 'Xác nhận Mở khóa người dùng',
        currentStatus ? 'Khóa' : 'Mở khóa',
        yesColor
    );
    if (!confirmed) return;
    
    try {
        const response = await fetch(`/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ is_active: String(!currentStatus) })
        });
        if (response.ok) {
            showToast(`Đã ${action} người dùng thành công!`, 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            const result = await response.json();
            showToast('Lỗi: ' + (result.message || 'Không thể cập nhật trạng thái'), 'error');
        }
    } catch (error) {
        showToast('Lỗi: ' + error.message, 'error');
    }
}
