// Buy Now page JavaScript

// Track discount state
let currentDiscount = 0;

/**
 * Toggle new address form visibility
 */
function toggleAddressForm() {
    const form = document.getElementById('newAddressForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

/**
 * Save new shipping address
 */
async function saveNewAddress() {
    const fullName = document.getElementById('newFullName').value;
    const phone = document.getElementById('newPhone').value;
    const addressLine = document.getElementById('newAddressLine').value;
    const ward = document.getElementById('newWard').value;
    const district = document.getElementById('newDistrict').value;
    const city = document.getElementById('newCity').value;
    
    if (!fullName || !phone || !addressLine || !city) {
        alert('❌ Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
    }
    
    try {
        const response = await fetch('/auth/address', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                full_name: fullName,
                phone: phone,
                address_line: addressLine,
                ward: ward,
                district: district,
                city: city,
                is_default: true
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Đã lưu địa chỉ!');
            location.reload();
        } else {
            alert('❌ ' + (data.message || 'Có lỗi xảy ra'));
        }
    } catch (error) {
        alert('❌ Có lỗi xảy ra');
    }
}

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
