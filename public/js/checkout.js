// Checkout page JavaScript
// Extracted from views/checkout/index.ejs

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
            alert('✅ Đã lưu địa chỉ thành công!');
            location.reload();
        } else {
            alert('❌ ' + (data.message || 'Có lỗi xảy ra'));
        }
    } catch (error) {
        console.error('Save address error:', error);
        alert('❌ Có lỗi xảy ra khi lưu địa chỉ');
    }
}

/**
 * Apply voucher/promo code
 * Calls API to validate voucher from database
 */
async function applyVoucher() {
    const code = document.getElementById('voucherCode').value.trim();
    const messageEl = document.getElementById('voucherMessage');
    const discountRowEl = document.getElementById('discountRow');
    const discountAmountEl = document.getElementById('discountAmount');
    const discountInput = document.getElementById('discountInput');
    const totalEl = document.getElementById('totalAmount');

    const checkoutSubtotal = window.checkoutData?.subtotal || 0;
    const checkoutShippingFee = window.checkoutData?.shippingFee || 30000;

    let currentDiscount = 0;

    if (!code) {
        messageEl.innerHTML = '<span style="color: #f44336;">Vui lòng nhập mã giảm giá</span>';
        return;
    }

    try {
        // Call API to validate voucher
        const response = await fetch('/orders/validate-voucher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                code: code,
                order_amount: checkoutSubtotal
            })
        });

        const data = await response.json();

        if (data.success) {
            currentDiscount = data.discount_amount;
            messageEl.innerHTML = '<span style="color: #2e7d32;">✅ ' + data.message + ' - Giảm ' + currentDiscount.toLocaleString('vi-VN') + 'đ</span>';
        } else {
            messageEl.innerHTML = '<span style="color: #f44336;">' + data.message + '</span>';
            currentDiscount = 0;
        }
    } catch (error) {
        console.error('Voucher validation error:', error);
        messageEl.innerHTML = '<span style="color: #f44336;">Có lỗi xảy ra khi kiểm tra voucher</span>';
        currentDiscount = 0;
    }

    // Update UI
    if (currentDiscount > 0) {
        discountRowEl.style.display = 'flex';
        discountAmountEl.textContent = '-' + currentDiscount.toLocaleString('vi-VN') + 'đ';
    } else {
        discountRowEl.style.display = 'none';
    }

    // Update hidden input
    discountInput.value = currentDiscount;

    // Update total
    const total = checkoutSubtotal + checkoutShippingFee - currentDiscount;
    totalEl.textContent = total.toLocaleString('vi-VN') + 'đ';
}

/**
 * Initialize checkout page
 */
function initCheckout() {
    // Handle payment method selection styling
    document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('input[name="payment_method"]').forEach(r => {
                r.closest('label').style.borderColor = '#e0e0e0';
            });
            this.closest('label').style.borderColor = '#667eea';
        });
    });

    // Handle address selection styling
    document.querySelectorAll('input[name="address_id"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('input[name="address_id"]').forEach(r => {
                r.closest('label').style.borderColor = '#e0e0e0';
            });
            this.closest('label').style.borderColor = '#667eea';
        });
    });

    // Form validation
    document.getElementById('checkoutForm')?.addEventListener('submit', function(e) {
        const addressSelected = document.querySelector('input[name="address_id"]:checked');
        if (!addressSelected) {
            e.preventDefault();
            alert('Vui lòng chọn hoặc thêm địa chỉ giao hàng');
            return;
        }
        
        // Show loading
        const btn = document.getElementById('submitBtn');
        btn.textContent = 'Đang xử lý...';
        btn.disabled = true;
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initCheckout);
