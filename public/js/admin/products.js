// Admin Products page JavaScript
// Extracted from views/admin/products.ejs

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

// Edit Modal Functions
function openEditModal(id, name, categoryId, price, stock, description) {
    document.getElementById('editProductId').value = id;
    document.getElementById('editName').value = name;
    document.getElementById('editCategoryId').value = categoryId || '';
    document.getElementById('editPrice').value = price;
    document.getElementById('editStock').value = stock;
    document.getElementById('editDescription').value = description || '';
    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

/**
 * Delete product
 * @param {number} productId - Product ID
 */
async function deleteProduct(productId) {
    const confirmed = await showConfirm('Bạn có chắc muốn xóa sản phẩm này?', 'Xóa Sản Phẩm', 'Xóa', '#f44336');
    if (!confirmed) return;
    
    try {
        const response = await fetch(`/admin/products/${productId}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        if (response.ok) {
            showToast('Xóa sản phẩm thành công!', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            const result = await response.json();
            showToast('Lỗi xóa sản phẩm: ' + (result.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        showToast('Lỗi: ' + error.message, 'error');
    }
}

// Image Modal Functions
async function openImageModal(productId, productName) {
    document.getElementById('imageModalProductId').value = productId;
    document.getElementById('imageModalProductName').textContent = productName;
    document.getElementById('imageModal').style.display = 'flex';
    
    // Load product images
    await loadProductImages(productId);
}

function closeImageModal() {
    document.getElementById('imageModal').style.display = 'none';
}

async function loadProductImages(productId) {
    const grid = document.getElementById('imagesGrid');
    grid.innerHTML = '<p style="color: #999;">Đang tải...</p>';
    
    try {
        const response = await fetch(`/admin/products/${productId}/images`, { credentials: 'same-origin' });
        const data = await response.json();
        
        if (data.images && data.images.length > 0) {
            grid.innerHTML = data.images.map(img => `
                <div style="position: relative; border: 2px solid ${img.is_primary ? '#667eea' : '#eee'}; border-radius: 8px; overflow: hidden;">
                    <img src="${img.image_url}" alt="" style="width: 100%; height: 120px; object-fit: cover;">
                    ${img.is_primary ? '<span style="position: absolute; top: 5px; left: 5px; background: #667eea; color: white; padding: 2px 6px; font-size: 10px; border-radius: 4px;">Chính</span>' : ''}
                    <div style="position: absolute; bottom: 5px; right: 5px; display: flex; gap: 5px;">
                        ${!img.is_primary ? `<button onclick="setPrimaryImage(${img.id})" style="padding: 3px 8px; font-size: 10px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer;">★</button>` : ''}
                        <button onclick="deleteImage(${img.id})" style="padding: 3px 8px; font-size: 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">×</button>
                    </div>
                </div>
            `).join('');
        } else {
            grid.innerHTML = '<p style="color: #999;">Chưa có ảnh nào</p>';
        }
    } catch (error) {
        grid.innerHTML = '<p style="color: #f44336;">Lỗi tải ảnh</p>';
    }
}

async function deleteImage(imageId) {
    if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;
    
    const productId = document.getElementById('imageModalProductId').value;
    
    try {
        const response = await fetch(`/admin/products/images/${imageId}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            alert('✅ Đã xóa ảnh!');
            await loadProductImages(productId);
        } else {
            alert('❌ Lỗi xóa ảnh');
        }
    } catch (error) {
        alert('❌ Lỗi: ' + error.message);
    }
}

async function setPrimaryImage(imageId) {
    const productId = document.getElementById('imageModalProductId').value;
    
    try {
        const response = await fetch(`/admin/products/images/${imageId}/primary`, {
            method: 'PUT',
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            alert('✅ Đã đặt làm ảnh chính!');
            await loadProductImages(productId);
        } else {
            alert('❌ Lỗi');
        }
    } catch (error) {
        alert('❌ Lỗi: ' + error.message);
    }
}

async function addImageByUrl() {
    const url = document.getElementById('newImageUrl').value;
    if (!url) {
        alert('❌ Vui lòng nhập URL ảnh');
        return;
    }
    
    const productId = document.getElementById('imageModalProductId').value;
    const isPrimary = document.getElementById('isPrimaryImage').checked;
    
    try {
        const response = await fetch(`/admin/products/${productId}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ image_url: url, is_primary: isPrimary })
        });
        
        if (response.ok) {
            alert('✅ Đã thêm ảnh!');
            document.getElementById('newImageUrl').value = '';
            await loadProductImages(productId);
        } else {
            alert('❌ Lỗi thêm ảnh');
        }
    } catch (error) {
        alert('❌ Lỗi: ' + error.message);
    }
}

/**
 * Initialize admin products page
 */
function initAdminProducts() {
    // Edit form submit handler
    document.getElementById('editForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const id = document.getElementById('editProductId').value;
        const data = {
            name: document.getElementById('editName').value,
            category_id: document.getElementById('editCategoryId').value,
            price: document.getElementById('editPrice').value,
            stock_quantity: document.getElementById('editStock').value,
            description: document.getElementById('editDescription').value
        };
        
        try {
            const response = await fetch(`/admin/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                showToast('Cập nhật sản phẩm thành công!', 'success');
                setTimeout(() => location.reload(), 1500);
            } else {
                const result = await response.json();
                showToast('Lỗi: ' + (result.message || 'Không thể cập nhật sản phẩm'), 'error');
            }
        } catch (error) {
            showToast('Lỗi: ' + error.message, 'error');
        }
    });

    // Close edit modal on outside click
    document.getElementById('editModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeEditModal();
    });

    // Add image form handler
    document.getElementById('addImageForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('newImageFile');
        if (!fileInput.files[0]) {
            alert('❌ Vui lòng chọn file ảnh');
            return;
        }
        
        const productId = document.getElementById('imageModalProductId').value;
        const isPrimary = document.getElementById('isPrimaryImage').checked;
        
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('is_primary', isPrimary);
        
        try {
            const response = await fetch(`/admin/products/${productId}/images/upload`, {
                method: 'POST',
                credentials: 'same-origin',
                body: formData
            });
            
            if (response.ok) {
                alert('✅ Đã tải lên ảnh!');
                fileInput.value = '';
                await loadProductImages(productId);
            } else {
                alert('❌ Lỗi tải lên ảnh');
            }
        } catch (error) {
            alert('❌ Lỗi: ' + error.message);
        }
    });

    // Close image modal on outside click
    document.getElementById('imageModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeImageModal();
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAdminProducts);
