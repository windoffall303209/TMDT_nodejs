// Cart page JavaScript
// Extracted from views/cart/index.ejs

/**
 * Toggle select all checkboxes
 */
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.item-checkbox');
    checkboxes.forEach(cb => cb.checked = selectAll.checked);
    updateSelectedTotal();
}

/**
 * Update the selected items total and UI
 */
function updateSelectedTotal() {
    const checkboxes = document.querySelectorAll('.item-checkbox:checked');
    let total = 0;
    let count = 0;
    
    checkboxes.forEach(cb => {
        total += parseInt(cb.dataset.price) || 0;
        count++;
    });
    
    const shippingFee = total >= 500000 ? 0 : 30000;
    const grandTotal = total + shippingFee;
    
    document.getElementById('selectedCount').textContent = count;
    document.getElementById('selectedSubtotal').textContent = total.toLocaleString('vi-VN') + 'đ';
    document.getElementById('shippingFee').textContent = shippingFee === 0 ? 'Miễn phí' : '30.000đ';
    document.getElementById('selectedTotal').textContent = grandTotal.toLocaleString('vi-VN') + 'đ';
    document.getElementById('checkoutCount').textContent = count;
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = count === 0;
    checkoutBtn.style.opacity = count === 0 ? '0.5' : '1';
    
    // Update select all checkbox
    const allCheckboxes = document.querySelectorAll('.item-checkbox');
    document.getElementById('selectAll').checked = checkboxes.length === allCheckboxes.length && allCheckboxes.length > 0;
}

/**
 * Proceed to checkout with selected items
 */
function checkoutSelected() {
    const checkboxes = document.querySelectorAll('.item-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('❌ Vui lòng chọn ít nhất một sản phẩm để thanh toán');
        return;
    }
    
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);
    
    // Store selected items and redirect to checkout
    sessionStorage.setItem('selectedCartItems', JSON.stringify(selectedIds));
    window.location.href = '/orders/checkout?items=' + selectedIds.join(',');
}

/**
 * Update item quantity in cart
 * @param {number} itemId - Cart item ID
 * @param {number} newQuantity - New quantity
 */
function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) {
        removeItem(itemId);
        return;
    }
    
    fetch('/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ cart_item_id: itemId, quantity: newQuantity })
    })
    .then(res => res.json())
    .then(() => location.reload())
    .catch(err => console.error(err));
}

/**
 * Remove item from cart
 * @param {number} itemId - Cart item ID
 */
function removeItem(itemId) {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    
    fetch('/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ cart_item_id: itemId })
    })
    .then(res => res.json())
    .then(() => location.reload())
    .catch(err => console.error(err));
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', updateSelectedTotal);
