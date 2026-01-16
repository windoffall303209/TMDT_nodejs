// Admin Banners page JavaScript
// Extracted from views/admin/banners.ejs

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
            <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: white; font-size: 18px; cursor: pointer; opacity: 0.8;">×</button>
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
 * @returns {Promise<boolean>}
 */
function showConfirm(message, title = 'Xác nhận') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
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
 * Delete banner
 * @param {number} bannerId - Banner ID
 */
async function deleteBanner(bannerId) {
    const confirmed = await showConfirm('Bạn có chắc muốn xóa banner này?', 'Xóa Banner');
    if (!confirmed) return;
    
    try {
        const response = await fetch(`/admin/banners/${bannerId}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            showToast('Đã xóa banner thành công!', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            const result = await response.json();
            showToast('Lỗi: ' + (result.message || 'Không thể xóa banner'), 'error');
        }
    } catch (error) {
        showToast('Lỗi: ' + error.message, 'error');
    }
}
