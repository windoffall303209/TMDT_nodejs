// Checkout page JavaScript
// Extracted from views/checkout/index.ejs

// Map variables
let addressMap = null;
let addressMarker = null;

// Provinces data cache
let provincesData = [];
let districtsData = [];
let wardsData = [];

/**
 * Load provinces list from API
 */
async function loadProvinces() {
    try {
        const response = await fetch('/api/provinces');
        provincesData = await response.json();

        const select = document.getElementById('newCity');
        if (!select) return;

        select.innerHTML = '<option value="">-- Chọn Tỉnh/TP --</option>';
        provincesData.forEach(p => {
            const option = document.createElement('option');
            option.value = p.code;
            option.textContent = p.name;
            option.dataset.name = p.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Load provinces error:', error);
    }
}

/**
 * Load districts based on selected province
 */
async function loadDistricts() {
    const citySelect = document.getElementById('newCity');
    const districtSelect = document.getElementById('newDistrict');
    const wardSelect = document.getElementById('newWard');

    const cityCode = citySelect.value;
    const cityName = citySelect.options[citySelect.selectedIndex]?.dataset?.name || '';
    document.getElementById('newCityName').value = cityName;

    // Reset district and ward
    districtSelect.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';
    districtSelect.disabled = true;
    wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
    wardSelect.disabled = true;
    document.getElementById('newDistrictName').value = '';
    document.getElementById('newWardName').value = '';

    if (!cityCode) return;

    try {
        const response = await fetch(`/api/provinces/${cityCode}/districts`);
        districtsData = await response.json();

        districtsData.forEach(d => {
            const option = document.createElement('option');
            option.value = d.code;
            option.textContent = d.name;
            option.dataset.name = d.name;
            districtSelect.appendChild(option);
        });

        districtSelect.disabled = false;
    } catch (error) {
        console.error('Load districts error:', error);
    }
}

/**
 * Load wards based on selected district
 */
async function loadWards() {
    const districtSelect = document.getElementById('newDistrict');
    const wardSelect = document.getElementById('newWard');

    const districtCode = districtSelect.value;
    const districtName = districtSelect.options[districtSelect.selectedIndex]?.dataset?.name || '';
    document.getElementById('newDistrictName').value = districtName;

    // Reset ward
    wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
    wardSelect.disabled = true;
    document.getElementById('newWardName').value = '';

    if (!districtCode) return;

    try {
        const response = await fetch(`/api/districts/${districtCode}/wards`);
        wardsData = await response.json();

        wardsData.forEach(w => {
            const option = document.createElement('option');
            option.value = w.code;
            option.textContent = w.name;
            option.dataset.name = w.name;
            wardSelect.appendChild(option);
        });

        wardSelect.disabled = false;

        // Add change listener to save ward name
        wardSelect.onchange = function() {
            const wardName = wardSelect.options[wardSelect.selectedIndex]?.dataset?.name || '';
            document.getElementById('newWardName').value = wardName;
        };
    } catch (error) {
        console.error('Load wards error:', error);
    }
}

/**
 * Toggle new address form visibility
 */
function toggleAddressForm() {
    const form = document.getElementById('newAddressForm');
    const isHidden = form.style.display === 'none';
    form.style.display = isHidden ? 'block' : 'none';

    // Initialize map when form is shown
    if (isHidden && !addressMap) {
        setTimeout(initAddressMap, 100);
    }
}

/**
 * Initialize Leaflet map for address selection
 */
function initAddressMap() {
    const mapContainer = document.getElementById('addressMap');
    if (!mapContainer || addressMap) return;

    // Check if container is visible and has dimensions
    if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
        // Retry after a short delay
        setTimeout(initAddressMap, 200);
        return;
    }

    // Fix default marker icon paths
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/images/marker-icon-2x.png',
        iconUrl: '/images/marker-icon.png',
        shadowUrl: '/images/marker-shadow.png'
    });

    // Default center: Ho Chi Minh City
    const defaultLat = 10.8231;
    const defaultLng = 106.6297;

    try {
        addressMap = L.map('addressMap', {
            center: [defaultLat, defaultLng],
            zoom: 13
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(addressMap);

        // Add locate button
        const locateBtn = L.control({ position: 'topleft' });
        locateBtn.onAdd = function() {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            div.innerHTML = '<a href="#" title="Vị trí của tôi" style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:#fff;font-size:18px;">📍</a>';
            div.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                locateUser();
            };
            return div;
        };
        locateBtn.addTo(addressMap);

        // Force map to recalculate its size
        setTimeout(() => {
            addressMap.invalidateSize();
        }, 100);

        // Add click handler to place marker
        addressMap.on('click', function(e) {
            const { lat, lng } = e.latlng;
            placeMarker(lat, lng);
            updateAddressFromCoords(lat, lng);
        });

        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

/**
 * Place or move marker on map
 */
function placeMarker(lat, lng) {
    if (addressMarker) {
        addressMarker.setLatLng([lat, lng]);
    } else {
        addressMarker = L.marker([lat, lng], { draggable: true }).addTo(addressMap);

        // Handle marker drag
        addressMarker.on('dragend', function(e) {
            const pos = e.target.getLatLng();
            updateAddressFromCoords(pos.lat, pos.lng);
        });
    }
}

/**
 * Locate user's current position
 */
function locateUser() {
    if (!navigator.geolocation) {
        alert('Trình duyệt không hỗ trợ định vị');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            addressMap.setView([latitude, longitude], 16);
            placeMarker(latitude, longitude);
            updateAddressFromCoords(latitude, longitude);
            addressMap.invalidateSize();
        },
        (error) => {
            console.error('Geolocation error:', error);
            alert('Không thể lấy vị trí. Vui lòng cho phép truy cập vị trí.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

/**
 * Update address fields from coordinates using reverse geocoding (via proxy)
 */
async function updateAddressFromCoords(lat, lng) {
    document.getElementById('newLatitude').value = lat;
    document.getElementById('newLongitude').value = lng;

    try {
        // Use local proxy to bypass CSP
        const response = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lng}`);
        const data = await response.json();

        if (data && data.address) {
            const addr = data.address;

            // Auto-fill address line (street)
            if (addr.road || addr.house_number) {
                const addressLine = [addr.house_number, addr.road].filter(Boolean).join(' ');
                document.getElementById('newAddressLine').value = addressLine;
            }

            // For province/district/ward - we can't auto-select from dropdown
            // but we can show a hint or try to match
            console.log('Geocoded address:', addr);
        }
    } catch (error) {
        console.error('Reverse geocoding error:', error);
    }
}

/**
 * Select a voucher card
 */
function selectVoucher(card) {
    // Remove selected class from all cards
    document.querySelectorAll('.voucher-card').forEach(c => {
        c.classList.remove('voucher-card--selected');
    });

    // Add selected class to clicked card
    card.classList.add('voucher-card--selected');

    // Get voucher code and apply it
    const code = card.dataset.code;
    document.getElementById('voucherCode').value = code;

    // Automatically apply the voucher
    applyVoucher();
}

/**
 * Save new shipping address
 */
async function saveNewAddress() {
    const fullName = document.getElementById('newFullName').value;
    const phone = document.getElementById('newPhone').value;
    const addressLine = document.getElementById('newAddressLine').value;

    // Get names from hidden fields (populated by select onchange)
    const ward = document.getElementById('newWardName').value ||
                 document.getElementById('newWard').options[document.getElementById('newWard').selectedIndex]?.text || '';
    const district = document.getElementById('newDistrictName').value ||
                     document.getElementById('newDistrict').options[document.getElementById('newDistrict').selectedIndex]?.text || '';
    const city = document.getElementById('newCityName').value ||
                 document.getElementById('newCity').options[document.getElementById('newCity').selectedIndex]?.text || '';

    if (!fullName || !phone || !addressLine || !city || !district || !ward) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
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
            alert('Đã lưu địa chỉ thành công!');
            location.reload();
        } else {
            alert(data.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        console.error('Save address error:', error);
        alert('Có lỗi xảy ra khi lưu địa chỉ');
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
    // Load provinces for address form
    loadProvinces();

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

    // Initialize map if address form is already visible (no existing addresses)
    const addressForm = document.getElementById('newAddressForm');
    if (addressForm && addressForm.style.display !== 'none') {
        setTimeout(initAddressMap, 300);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initCheckout);
