// Admin Products page JavaScript

// Use global toast from toast.js
function showToast(message, type = 'success') {
    if (typeof showGlobalToast === 'function') showGlobalToast(message, type);
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
async function openEditModal(id, name, categoryId, price, stock, description) {
    document.getElementById('editProductId').value = id;
    document.getElementById('editName').value = name;
    document.getElementById('editCategoryId').value = categoryId || '';
    document.getElementById('editPrice').value = price;
    document.getElementById('editStock').value = stock;
    document.getElementById('editDescription').value = description || '';
    document.getElementById('editModal').style.display = 'flex';

    // Load existing variants
    const variantsList = document.getElementById('editVariantsList');
    variantsList.innerHTML = '';
    try {
        const response = await fetch(`/admin/products/${id}/variants`, { credentials: 'same-origin' });
        const data = await response.json();
        if (data.success && data.variants.length > 0) {
            data.variants.forEach(v => addVariantRow('edit', v));
        }
    } catch (e) {
        console.error('Load variants error:', e);
    }
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
            showGlobalToast('Đã xóa ảnh!', 'success');
            await loadProductImages(productId);
        } else {
            showGlobalToast('Lỗi xóa ảnh', 'error');
        }
    } catch (error) {
        showGlobalToast('Lỗi: ' + error.message, 'error');
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
            showGlobalToast('Đã đặt làm ảnh chính!', 'success');
            await loadProductImages(productId);
        } else {
            showGlobalToast('Lỗi đặt ảnh chính', 'error');
        }
    } catch (error) {
        showGlobalToast('Lỗi: ' + error.message, 'error');
    }
}

async function addImageByUrl() {
    const url = document.getElementById('newImageUrl').value;
    if (!url) {
        showGlobalToast('Vui lòng nhập URL ảnh', 'warning');
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
            showGlobalToast('Đã thêm ảnh!', 'success');
            document.getElementById('newImageUrl').value = '';
            await loadProductImages(productId);
        } else {
            showGlobalToast('Lỗi thêm ảnh', 'error');
        }
    } catch (error) {
        showGlobalToast('Lỗi: ' + error.message, 'error');
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
            description: document.getElementById('editDescription').value,
            variants: document.getElementById('editVariantsJson').value
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
            showGlobalToast('Vui lòng chọn file ảnh', 'warning');
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
                showGlobalToast('Đã tải lên ảnh!', 'success');
                fileInput.value = '';
                await loadProductImages(productId);
            } else {
                showGlobalToast('Lỗi tải lên ảnh', 'error');
            }
        } catch (error) {
            showGlobalToast('Lỗi: ' + error.message, 'error');
        }
    });

    // Close image modal on outside click
    document.getElementById('imageModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeImageModal();
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAdminProducts);

// =============================================================================
// VARIANT MANAGEMENT - QUẢN LÝ BIẾN THỂ
// =============================================================================

function addVariantRow(mode, data = {}) {
    const container = document.getElementById(`${mode}VariantsList`);
    const row = document.createElement('div');
    row.className = 'variant-row';
    row.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px; align-items: center; flex-wrap: wrap;';
    row.innerHTML = `
        <select class="variant-size" style="width: 100px; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; background: white;">
            <option value="" ${!data.size ? 'selected' : ''}>-- Size --</option>
            <option value="S" ${data.size === 'S' ? 'selected' : ''}>S</option>
            <option value="M" ${data.size === 'M' ? 'selected' : ''}>M</option>
            <option value="L" ${data.size === 'L' ? 'selected' : ''}>L</option>
            <option value="XL" ${data.size === 'XL' ? 'selected' : ''}>XL</option>
            <option value="XXL" ${data.size === 'XXL' ? 'selected' : ''}>XXL</option>
            <option value="Free Size" ${data.size === 'Free Size' ? 'selected' : ''}>Free Size</option>
        </select>
        <select class="variant-color" style="width: 120px; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; background: white;">
            <option value="" ${!data.color ? 'selected' : ''}>-- Màu --</option>
            <option value="Đen" ${data.color === 'Đen' ? 'selected' : ''}>Đen</option>
            <option value="Trắng" ${data.color === 'Trắng' ? 'selected' : ''}>Trắng</option>
            <option value="Đỏ" ${data.color === 'Đỏ' ? 'selected' : ''}>Đỏ</option>
            <option value="Xanh dương" ${data.color === 'Xanh dương' ? 'selected' : ''}>Xanh dương</option>
            <option value="Xanh lá" ${data.color === 'Xanh lá' ? 'selected' : ''}>Xanh lá</option>
            <option value="Vàng" ${data.color === 'Vàng' ? 'selected' : ''}>Vàng</option>
            <option value="Hồng" ${data.color === 'Hồng' ? 'selected' : ''}>Hồng</option>
            <option value="Tím" ${data.color === 'Tím' ? 'selected' : ''}>Tím</option>
            <option value="Cam" ${data.color === 'Cam' ? 'selected' : ''}>Cam</option>
            <option value="Nâu" ${data.color === 'Nâu' ? 'selected' : ''}>Nâu</option>
            <option value="Xám" ${data.color === 'Xám' ? 'selected' : ''}>Xám</option>
            <option value="Be" ${data.color === 'Be' ? 'selected' : ''}>Be</option>
            <option value="Kem" ${data.color === 'Kem' ? 'selected' : ''}>Kem</option>
        </select>
        <input type="number" placeholder="Giá thêm" value="${data.additional_price || 0}"
               class="variant-price" style="width: 100px; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;" min="0">
        <input type="number" placeholder="Tồn kho" value="${data.stock_quantity || 0}"
               class="variant-stock" style="width: 80px; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;" min="0">
        <input type="text" placeholder="SKU" value="${data.sku || ''}"
               class="variant-sku" style="width: 100px; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">
        <button type="button" onclick="this.parentElement.remove(); collectVariants('${mode}')"
                style="padding: 6px 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; line-height: 1;">×</button>
    `;
    container.appendChild(row);

    row.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => collectVariants(mode));
    });
    row.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', () => collectVariants(mode));
    });

    collectVariants(mode);
}

function collectVariants(mode) {
    const container = document.getElementById(`${mode}VariantsList`);
    const rows = container.querySelectorAll('.variant-row');
    const variants = [];
    rows.forEach(row => {
        const size = row.querySelector('.variant-size').value.trim();
        const color = row.querySelector('.variant-color').value.trim();
        if (size || color) {
            variants.push({
                size,
                color,
                additional_price: parseFloat(row.querySelector('.variant-price').value) || 0,
                stock_quantity: parseInt(row.querySelector('.variant-stock').value) || 0,
                sku: row.querySelector('.variant-sku').value.trim()
            });
        }
    });
    document.getElementById(`${mode}VariantsJson`).value = JSON.stringify(variants);
}
