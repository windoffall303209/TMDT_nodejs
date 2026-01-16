// Add to cart function - handles both onclick="addToCart(event, productId)" and onclick="addToCart(productId)"
async function addToCart(eventOrProductId, productId = null, variantId = null) {
    // Detect if first argument is an event or a productId
    let actualProductId, actualVariantId;
    
    if (eventOrProductId && typeof eventOrProductId === 'object' && eventOrProductId.preventDefault) {
        // Called with event: addToCart(event, productId, variantId)
        eventOrProductId.preventDefault();
        eventOrProductId.stopPropagation();
        actualProductId = productId;
        actualVariantId = variantId;
    } else {
        // Called without event: addToCart(productId, variantId)
        actualProductId = eventOrProductId;
        actualVariantId = productId; // second arg becomes variantId when no event
    }
    
    if (!actualProductId) {
        showNotification('Không tìm thấy sản phẩm', 'error');
        return;
    }
    
    try {
        const response = await fetch('/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                product_id: actualProductId,
                variant_id: actualVariantId,
                quantity: 1
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update cart count
            updateCartCount();
            
            // Show success message
            showNotification(data.message || 'Đã thêm vào giỏ hàng!', 'success');
        } else {
            showNotification(data.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        showNotification('Có lỗi xảy ra khi thêm vào giỏ hàng', 'error');
    }
}

// Update cart count in header
async function updateCartCount() {
    try {
        const response = await fetch('/cart/count');
        const data = await response.json();
        
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = data.count || 0;
        }
    } catch (error) {
        console.error('Update cart count error:', error);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4caf50' : '#f44336'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Update cart count on page load
    updateCartCount();
});
