// Product Detail page JavaScript
// Extracted from views/products/detail.ejs

let currentImageIndex = 0;
let productImages = [];

function normalizeImageUrl(imageUrl) {
    if (!imageUrl) return '';

    try {
        return new URL(imageUrl, window.location.origin).href;
    } catch (error) {
        return String(imageUrl);
    }
}

function getMainImageElement() {
    return document.getElementById('mainImage');
}

function getFallbackElement() {
    return document.getElementById('fallbackIcon');
}

function showMainImage() {
    const mainImage = getMainImageElement();
    const fallback = getFallbackElement();

    if (mainImage) {
        mainImage.style.display = 'block';
    }
    if (fallback) {
        fallback.style.display = 'none';
    }
}

function showGalleryFallback() {
    const mainImage = getMainImageElement();
    const fallback = getFallbackElement();

    if (mainImage) {
        mainImage.style.display = 'none';
    }
    if (fallback) {
        fallback.style.display = 'flex';
    }
}

function scrollActiveThumbIntoView(index) {
    const activeThumb = document.querySelectorAll('.product-gallery__thumb')[index];
    activeThumb?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'smooth'
    });
}

function initProductGallery(images) {
    productImages = Array.isArray(images) ? images.filter(Boolean) : [];

    bindGalleryEvents();

    const mainImage = getMainImageElement();
    if (!mainImage || productImages.length === 0) {
        return;
    }

    const currentSrc = normalizeImageUrl(
        mainImage.getAttribute('src') || mainImage.src || window.productInitialImage
    );

    const initialIndex = productImages.findIndex(imageUrl => normalizeImageUrl(imageUrl) === currentSrc);
    currentImageIndex = initialIndex >= 0 ? initialIndex : 0;

    if (initialIndex === -1 && productImages[currentImageIndex]) {
        mainImage.src = productImages[currentImageIndex];
    }

    updateGalleryThumbState(currentImageIndex);

    if (mainImage.complete) {
        if (mainImage.naturalWidth > 0) {
            showMainImage();
        } else {
            showGalleryFallback();
        }
    }
}

function updateGalleryThumbState(index) {
    document.querySelectorAll('.product-gallery__thumb').forEach((thumb, thumbIndex) => {
        thumb.classList.toggle('product-gallery__thumb--active', thumbIndex === index);
    });

    const counter = document.getElementById('currentIndex');
    if (counter) counter.textContent = index + 1;

    scrollActiveThumbIntoView(index);
}

function selectImage(index, imageUrl) {
    if (productImages.length === 0) return;

    const normalizedTarget = normalizeImageUrl(imageUrl || productImages[index]);
    const resolvedIndex = Number.isInteger(index) && index >= 0 && index < productImages.length
        ? index
        : productImages.findIndex(url => normalizeImageUrl(url) === normalizedTarget);

    const nextIndex = resolvedIndex >= 0 ? resolvedIndex : 0;
    const nextImageUrl = productImages[nextIndex] || imageUrl;

    currentImageIndex = nextIndex;
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        if (normalizeImageUrl(mainImage.getAttribute('src') || mainImage.src) !== normalizeImageUrl(nextImageUrl)) {
            mainImage.src = nextImageUrl;
        }
        showMainImage();
    }

    updateGalleryThumbState(nextIndex);
}

function switchGalleryToImage(imageUrl) {
    if (!imageUrl || !productImages.length) return;
    const normalizedTarget = normalizeImageUrl(imageUrl);
    const index = productImages.findIndex(url => normalizeImageUrl(url) === normalizedTarget);
    if (index >= 0) {
        selectImage(index, productImages[index]);
    }
}

function prevImage() {
    if (productImages.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + productImages.length) % productImages.length;
    selectImage(currentImageIndex, productImages[currentImageIndex]);
}

function nextImage() {
    if (productImages.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % productImages.length;
    selectImage(currentImageIndex, productImages[currentImageIndex]);
}

function buyNow(productId) {
    window.location.href = '/orders/buy-now/' + productId;
}

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

    const match = variants.find(v => {
        const colorMatch = !hasColors || v.color === selectedColor;
        const sizeMatch = !hasSizes || v.size === selectedSize;
        return colorMatch && sizeMatch;
    });

    if (match) {
        selectedVariantId = match.id;

        const newPrice = window.productBasePrice + (match.additional_price || 0);
        const priceEl = document.getElementById('productPrice');
        if (priceEl) {
            priceEl.textContent = newPrice.toLocaleString('vi-VN') + 'đ';
        }

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

        if (match.variant_image_url) {
            switchGalleryToImage(match.variant_image_url);
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

function bindGalleryEvents() {
    const mainImage = getMainImageElement();
    if (mainImage && mainImage.dataset.galleryBound !== 'true') {
        mainImage.dataset.galleryBound = 'true';
        mainImage.addEventListener('load', showMainImage);
        mainImage.addEventListener('error', showGalleryFallback);
    }

    document.querySelectorAll('.product-gallery__thumb').forEach((thumb, thumbIndex) => {
        if (thumb.dataset.galleryBound === 'true') return;

        thumb.dataset.galleryBound = 'true';
        thumb.addEventListener('click', () => {
            const thumbIndexValue = parseInt(thumb.dataset.index, 10);
            const imageUrl = thumb.dataset.imageUrl || productImages[thumbIndex] || thumb.getAttribute('src');
            selectImage(Number.isNaN(thumbIndexValue) ? thumbIndex : thumbIndexValue, imageUrl);
        });
    });

    document.querySelectorAll('[data-gallery-nav]').forEach(button => {
        if (button.dataset.galleryBound === 'true') return;

        button.dataset.galleryBound = 'true';
        button.addEventListener('click', () => {
            if (button.dataset.galleryNav === 'prev') {
                prevImage();
            } else {
                nextImage();
            }
        });
    });
}

window.selectImage = selectImage;
window.prevImage = prevImage;
window.nextImage = nextImage;

document.addEventListener('DOMContentLoaded', () => {
    initProductGallery(window.productImageUrls || []);
});
