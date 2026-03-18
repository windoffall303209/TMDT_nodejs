// Buy Now page JavaScript
// Address functions (loadProvinces, loadDistricts, loadWards, saveNewAddress, 
// toggleAddressForm, initAddressMap) are loaded from checkout.js

// Track discount state
let currentDiscount = 0;

/**
 * Apply voucher code
 */
async function applyVoucher() {
    const codeInput = document.getElementById('voucherCode');
    const messageDiv = document.getElementById('voucherMessage');
    const code = codeInput.value.trim();

    if (!code) {
        messageDiv.innerHTML = '<span style="color: #c62828;">Vui lòng nhập mã giảm giá</span>';
        return;
    }

    const data = window.buyNowData;

    try {
        const response = await fetch('/orders/validate-voucher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                code,
                order_amount: data.subtotal,
                mode: 'buy-now',
                product_id: data.productId,
                quantity: data.quantity,
                variant_id: data.variantId || null
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            currentDiscount = 0;
            messageDiv.innerHTML = `<span style="color: #c62828;">${result.message || 'Mã giảm giá không hợp lệ'}</span>`;
            updateTotals();
            return;
        }

        currentDiscount = result.discount_amount || 0;
        messageDiv.innerHTML = `<span style="color: #2e7d32;">${result.message} - Giảm ${currentDiscount.toLocaleString('vi-VN')}đ</span>`;
    } catch (error) {
        console.error('Buy now voucher validation error:', error);
        currentDiscount = 0;
        messageDiv.innerHTML = '<span style="color: #c62828;">Có lỗi xảy ra khi kiểm tra voucher</span>';
    }

    updateTotals();
}

/**
 * Update total amounts
 */
function updateTotals() {
    const data = window.buyNowData;
    const subtotal = data.subtotal;
    const shippingFee = data.shippingFee;
    
    // Update discount input
    document.getElementById('discountInput').value = currentDiscount;
    document.getElementById('discountAmount').textContent = `-${currentDiscount.toLocaleString('vi-VN')}đ`;
    
    // Show/hide discount row
    const discountRow = document.getElementById('discountRow');
    discountRow.style.display = currentDiscount > 0 ? 'flex' : 'none';
    
    // Calculate final total
    const total = subtotal + shippingFee - currentDiscount;
    document.getElementById('totalAmount').textContent = total.toLocaleString('vi-VN') + 'đ';
}

/**
 * Initialize buy now page
 */
function initBuyNow() {
    // Payment method selection styling
    document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.payment-option').forEach(opt => {
                opt.classList.remove('payment-option--selected');
            });
            this.closest('label').classList.add('payment-option--selected');
        });
    });

    // Address selection styling
    document.querySelectorAll('input[name="address_id"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.address-card').forEach(card => {
                card.classList.remove('address-card--selected');
            });
            this.closest('label').classList.add('address-card--selected');
        });
    });

    // Form validation
    document.getElementById('buyNowForm')?.addEventListener('submit', function(e) {
        const addressSelected = document.querySelector('input[name="address_id"]:checked');
        if (!addressSelected) {
            e.preventDefault();
            showGlobalToast('Vui lòng chọn địa chỉ giao hàng', 'warning');
            return;
        }
        
        const btn = document.getElementById('submitBtn');
        btn.textContent = '⏳ Đang xử lý...';
        btn.disabled = true;
    });
    
    // Voucher enter key
    document.getElementById('voucherCode')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyVoucher();
        }
    });
    
    // Hide discount row initially
    const discountRow = document.getElementById('discountRow');
    if (discountRow) {
        discountRow.style.display = 'none';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initBuyNow);
