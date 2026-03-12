// Product Detail page JavaScript
// Extracted from views/products/detail.ejs

// Gallery state - will be initialized from EJS data
let currentImageIndex = 0;
let productImages = [];

/**
 * Initialize the product gallery
 * @param {string[]} images - Array of image URLs
 */
function initProductGallery(images) {
    productImages = images || [];
}

/**
 * Select image by index
 * @param {number} index - Image index
 * @param {string} imageUrl - Image URL
 */
function selectImage(index, imageUrl) {
    currentImageIndex = index;
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.src = imageUrl;
    }
    
    // Update thumbnail borders
    document.querySelectorAll('.gallery-thumb').forEach((thumb, i) => {
        thumb.style.borderColor = i === index ? '#667eea' : 'transparent';
    });
    
    // Update counter
    const counter = document.getElementById('currentIndex');
    if (counter) counter.textContent = index + 1;
}

/**
 * Show previous image
 */
function prevImage() {
    if (productImages.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + productImages.length) % productImages.length;
    selectImage(currentImageIndex, productImages[currentImageIndex]);
}

/**
 * Show next image
 */
function nextImage() {
    if (productImages.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % productImages.length;
    selectImage(currentImageIndex, productImages[currentImageIndex]);
}

/**
 * Buy now - redirect to buy now page
 * @param {number} productId - Product ID
 */
function buyNow(productId) {
    window.location.href = '/orders/buy-now/' + productId;
}

// =============================================================================
// VARIANT SELECTION - CHỌN BIẾN THỂ SẢN PHẨM
// =============================================================================

let selectedColor = null;
let selectedSize = null;
let selectedVariantId = null;

function selectColor(btn, color) {
    document.querySelectorAll('.color-btn').forEach(b => {
        b.style.borderColor = '#ddd';
        b.style.background = '#fff';
        b.style.color = '#333';
    });
    btn.style.borderColor = '#667eea';
    btn.style.background = '#f0f2ff';
    btn.style.color = '#667eea';
    selectedColor = color;
    resolveVariant();
}

function selectSize(btn, size) {
    document.querySelectorAll('.size-btn').forEach(b => {
        b.style.borderColor = '#ddd';
        b.style.background = '#fff';
        b.style.color = '#333';
    });
    btn.style.borderColor = '#667eea';
    btn.style.background = '#f0f2ff';
    btn.style.color = '#667eea';
    selectedSize = size;
    resolveVariant();
}

function resolveVariant() {
    const variants = window.productVariants || [];
    if (variants.length === 0) return;

    const colors = [...new Set(variants.filter(v => v.color).map(v => v.color))];
    const sizes = [...new Set(variants.filter(v => v.size).map(v => v.size))];
    const hasColors = colors.length > 0;
    const hasSizes = sizes.length > 0;

    // Find matching variant
    const match = variants.find(v => {
        const colorMatch = !hasColors || v.color === selectedColor;
        const sizeMatch = !hasSizes || v.size === selectedSize;
        return colorMatch && sizeMatch;
    });

    if (match) {
        selectedVariantId = match.id;

        // Update displayed price
        const newPrice = window.productBasePrice + (match.additional_price || 0);
        const priceEl = document.getElementById('productPrice');
        if (priceEl) {
            priceEl.textContent = newPrice.toLocaleString('vi-VN') + 'đ';
        }

        // Show stock for this variant
        const stockEl = document.getElementById('variantStock');
        if (stockEl) {
            if (match.stock_quantity > 0) {
                stockEl.textContent = 'Còn ' + match.stock_quantity + ' sản phẩm';
                stockEl.style.color = '#2e7d32';
            } else {
                stockEl.textContent = 'Hết hàng';
                stockEl.style.color = '#c62828';
            }
        }
    } else {
        selectedVariantId = null;
        const stockEl = document.getElementById('variantStock');
        if (stockEl) stockEl.textContent = '';
    }
}

function addToCartWithVariant(productId) {
    const variants = window.productVariants || [];
    if (variants.length > 0 && !selectedVariantId) {
        showNotification('Vui lòng chọn phân loại sản phẩm', 'warning');
        return;
    }
    // main.js addToCart(productId, variantId) — 2-arg path maps productId→arg1, variantId→arg2
    addToCart(productId, selectedVariantId);
}

function buyNowWithVariant(productId) {
    const variants = window.productVariants || [];
    if (variants.length > 0 && !selectedVariantId) {
        showNotification('Vui lòng chọn phân loại sản phẩm', 'warning');
        return;
    }
    const variantParam = selectedVariantId ? '?variant_id=' + selectedVariantId : '';
    window.location.href = '/orders/buy-now/' + productId + variantParam;
}
