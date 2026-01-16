// Buy Now page JavaScript
// Extracted from views/checkout/buy-now.ejs

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
 * Initialize buy now page
 */
function initBuyNow() {
    // Payment method selection styling
    document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('input[name="payment_method"]').forEach(r => {
                r.closest('label').style.borderColor = '#e0e0e0';
            });
            this.closest('label').style.borderColor = '#667eea';
        });
    });

    // Address selection styling
    document.querySelectorAll('input[name="address_id"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('input[name="address_id"]').forEach(r => {
                r.closest('label').style.borderColor = '#e0e0e0';
            });
            this.closest('label').style.borderColor = '#667eea';
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
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initBuyNow);
