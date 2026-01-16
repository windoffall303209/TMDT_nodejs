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
