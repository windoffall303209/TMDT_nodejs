// Buy Now page JavaScript
// Address functions (loadProvinces, loadDistricts, loadWards, saveNewAddress, 
// toggleAddressForm, initAddressMap) are loaded from checkout.js

// Track discount state
let currentDiscount = 0;

/**
 * Apply voucher code
 */
function applyVoucher() {
    const codeInput = document.getElementById('voucherCode');
    const messageDiv = document.getElementById('voucherMessage');
    const code = codeInput.value.trim().toUpperCase();
    
    if (!code) {
        messageDiv.innerHTML = '<span style="color: #c62828;">❌ Vui lòng nhập mã giảm giá</span>';
        return;
    }
    
    const data = window.buyNowData;
    const vouchers = data.validVouchers;
    
    if (!vouchers[code]) {
        messageDiv.innerHTML = '<span style="color: #c62828;">❌ Mã giảm giá không hợp lệ</span>';
        currentDiscount = 0;
        updateTotals();
        return;
    }
    
    const voucher = vouchers[code];
    
    // Check minimum order
    if (voucher.minOrder && data.subtotal < voucher.minOrder) {
        messageDiv.innerHTML = `<span style="color: #ef6c00;">⚠️ Đơn hàng tối thiểu ${voucher.minOrder.toLocaleString('vi-VN')}đ để sử dụng mã này</span>`;
        currentDiscount = 0;
        updateTotals();
        return;
    }
    
    // Calculate discount
    if (voucher.type === 'percent') {
        currentDiscount = Math.floor(data.subtotal * voucher.value / 100);
        if (voucher.maxDiscount && currentDiscount > voucher.maxDiscount) {
            currentDiscount = voucher.maxDiscount;
        }
    } else {
        currentDiscount = voucher.value;
    }
    
    messageDiv.innerHTML = `<span style="color: #2e7d32;">✅ Áp dụng thành công! Giảm ${currentDiscount.toLocaleString('vi-VN')}đ</span>`;
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
            alert('❌ Vui lòng chọn địa chỉ giao hàng');
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
