// Cart page JavaScript - Optimized without page reload

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
        showNotification('Vui lòng chọn ít nhất một sản phẩm để thanh toán', 'error');
        return;
    }

    const selectedIds = Array.from(checkboxes).map(cb => cb.value);

    // Store selected items and redirect to checkout
    sessionStorage.setItem('selectedCartItems', JSON.stringify(selectedIds));
    window.location.href = '/orders/checkout?items=' + selectedIds.join(',');
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'success') {
    // Remove existing notification
    const existing = document.querySelector('.cart-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `cart-notification cart-notification--${type}`;
    notification.innerHTML = `
        <span>${type === 'success' ? '✓' : '✕'}</span>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);

    // Remove after 2 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

/**
 * Update item quantity in cart (AJAX - no reload)
 * @param {number} itemId - Cart item ID
 * @param {number} newQuantity - New quantity
 */
function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) {
        removeItem(itemId);
        return;
    }

    const cartItem = document.querySelector(`.cart-item[data-item-id="${itemId}"]`);
    if (!cartItem) return;

    // Disable buttons while updating
    const buttons = cartItem.querySelectorAll('.cart-item__qty-btn');
    buttons.forEach(btn => btn.disabled = true);

    fetch('/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ cart_item_id: itemId, quantity: newQuantity })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Update UI without reload - no notification needed
            updateCartItemUI(itemId, newQuantity, data.item);
            updateCartCount();
        } else {
            showNotification(data.message || 'Có lỗi xảy ra', 'error');
        }
    })
    .catch(err => {
        console.error(err);
        showNotification('Có lỗi xảy ra', 'error');
    })
    .finally(() => {
        buttons.forEach(btn => btn.disabled = false);
    });
}

/**
 * Update cart item UI after quantity change
 */
function updateCartItemUI(itemId, newQuantity, itemData) {
    const cartItem = document.querySelector(`.cart-item[data-item-id="${itemId}"]`);
    if (!cartItem) return;

    // Get unit price from the item
    const unitPriceEl = cartItem.querySelector('.cart-item__unit-price');
    const unitPriceText = unitPriceEl.textContent.replace(/[^\d]/g, '');
    const unitPrice = parseInt(unitPriceText) || 0;

    // Calculate new subtotal
    const newSubtotal = itemData?.subtotal || (unitPrice * newQuantity);

    // Update quantity input
    const qtyInput = cartItem.querySelector('.cart-item__qty-input');
    qtyInput.value = newQuantity;

    // Update quantity buttons
    const minusBtn = cartItem.querySelector('.cart-item__qty-btn');
    const plusBtn = cartItem.querySelectorAll('.cart-item__qty-btn')[1];

    minusBtn.onclick = () => updateQuantity(itemId, newQuantity - 1);
    plusBtn.onclick = () => updateQuantity(itemId, newQuantity + 1);

    // Update subtotal display
    const subtotalEl = cartItem.querySelector('.cart-item__subtotal-price');
    subtotalEl.textContent = newSubtotal.toLocaleString('vi-VN') + 'đ';

    // Update data attributes
    cartItem.dataset.price = newSubtotal;
    const checkbox = cartItem.querySelector('.item-checkbox');
    if (checkbox) {
        checkbox.dataset.price = newSubtotal;
    }

    // Recalculate selected total
    updateSelectedTotal();
}

/**
 * Remove item from cart (AJAX - no reload)
 * @param {number} itemId - Cart item ID
 */
function removeItem(itemId) {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;

    const cartItem = document.querySelector(`.cart-item[data-item-id="${itemId}"]`);
    if (!cartItem) return;

    // Add removing animation
    cartItem.style.opacity = '0.5';
    cartItem.style.pointerEvents = 'none';

    fetch('/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ cart_item_id: itemId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Animate and remove item
            cartItem.style.transition = 'all 0.3s ease';
            cartItem.style.transform = 'translateX(-100%)';
            cartItem.style.opacity = '0';
            cartItem.style.height = cartItem.offsetHeight + 'px';

            setTimeout(() => {
                cartItem.style.height = '0';
                cartItem.style.padding = '0';
                cartItem.style.margin = '0';
                cartItem.style.overflow = 'hidden';
            }, 200);

            setTimeout(() => {
                cartItem.remove();
                updateCartCount();
                updateSelectedTotal();
                updateSelectAllText();
                checkEmptyCart();
                showNotification('Đã xóa sản phẩm');
            }, 400);
        } else {
            cartItem.style.opacity = '1';
            cartItem.style.pointerEvents = 'auto';
            showNotification(data.message || 'Có lỗi xảy ra', 'error');
        }
    })
    .catch(err => {
        console.error(err);
        cartItem.style.opacity = '1';
        cartItem.style.pointerEvents = 'auto';
        showNotification('Có lỗi xảy ra', 'error');
    });
}

/**
 * Update cart count in header
 */
function updateCartCount() {
    fetch('/cart/count', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(res => res.json())
    .then(data => {
        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            cartCountEl.textContent = data.count || 0;
        }
    })
    .catch(err => console.error(err));
}

/**
 * Update select all text with item count
 */
function updateSelectAllText() {
    const items = document.querySelectorAll('.cart-item');
    const selectAllText = document.querySelector('.cart-select-all__text');
    if (selectAllText) {
        selectAllText.textContent = `Chọn tất cả (${items.length} sản phẩm)`;
    }
}

/**
 * Check if cart is empty and show empty state
 */
function checkEmptyCart() {
    const items = document.querySelectorAll('.cart-item');
    if (items.length === 0) {
        const cartGrid = document.querySelector('.cart-grid');
        if (cartGrid) {
            cartGrid.innerHTML = `
                <div class="cart-empty" style="grid-column: 1 / -1;">
                    <span class="cart-empty__icon">🛒</span>
                    <h2 class="cart-empty__title">Giỏ hàng trống</h2>
                    <p class="cart-empty__text">Thêm sản phẩm vào giỏ hàng để mua sắm</p>
                    <a href="/products" class="cart-empty__btn">Tiếp tục mua sắm</a>
                </div>
            `;
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateSelectedTotal();

    // Add notification styles if not exists
    if (!document.getElementById('cart-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'cart-notification-styles';
        style.textContent = `
            .cart-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                background: #333;
                color: white;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                z-index: 10000;
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .cart-notification.show {
                transform: translateY(0);
                opacity: 1;
            }
            .cart-notification--success {
                background: #10b981;
            }
            .cart-notification--error {
                background: #ef4444;
            }
        `;
        document.head.appendChild(style);
    }
});
