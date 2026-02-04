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

    // Initialize newsletter form
    initNewsletterForm();

    // Initialize mobile menu
    initMobileMenu();
});

// Mobile Menu functionality
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileNavClose = document.getElementById('mobileNavClose');

    if (!mobileMenuBtn || !mobileNav || !mobileNavOverlay) return;

    // Toggle mobile menu
    function openMobileMenu() {
        mobileMenuBtn.classList.add('active');
        mobileNav.classList.add('active');
        mobileNavOverlay.classList.add('active');
        document.body.classList.add('mobile-menu-open');
    }

    function closeMobileMenu() {
        mobileMenuBtn.classList.remove('active');
        mobileNav.classList.remove('active');
        mobileNavOverlay.classList.remove('active');
        document.body.classList.remove('mobile-menu-open');
    }

    // Event listeners
    mobileMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (mobileNav.classList.contains('active')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    if (mobileNavClose) {
        mobileNavClose.addEventListener('click', closeMobileMenu);
    }

    mobileNavOverlay.addEventListener('click', closeMobileMenu);

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // Close menu when clicking on a link
    const mobileNavLinks = mobileNav.querySelectorAll('a');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    // Handle window resize - close menu if resizing to desktop
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768 && mobileNav.classList.contains('active')) {
                closeMobileMenu();
            }
        }, 100);
    });
}

// Newsletter form handling
function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    const successMsg = document.getElementById('newsletter-success');
    const errorMsg = document.getElementById('newsletter-error');

    if (!form) return;

    // Check if user already subscribed
    checkNewsletterStatus();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('newsletter-email');
        const submitBtn = document.getElementById('newsletter-btn');
        const email = emailInput.value.trim();

        if (!email) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang xử lý...';

        try {
            const response = await fetch('/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                form.style.display = 'none';
                successMsg.style.display = 'flex';
                if (errorMsg) errorMsg.style.display = 'none';

                // Save to localStorage
                localStorage.setItem('newsletter_subscribed', 'true');
                localStorage.setItem('newsletter_email', email);
            } else {
                if (errorMsg) {
                    errorMsg.textContent = data.message;
                    errorMsg.style.display = 'block';
                }
                showNotification(data.message, 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Đăng ký';
            }
        } catch (error) {
            console.error('Newsletter error:', error);
            showNotification('Đã xảy ra lỗi. Vui lòng thử lại.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Đăng ký';
        }
    });
}

// Check newsletter subscription status
async function checkNewsletterStatus() {
    const form = document.getElementById('newsletter-form');
    const successMsg = document.getElementById('newsletter-success');
    const newsletterSection = document.getElementById('newsletter-section');

    if (!form || !successMsg || !newsletterSection) return;

    // Check if already subscribed
    if (localStorage.getItem('newsletter_subscribed') === 'true') {
        form.style.display = 'none';
        successMsg.style.display = 'flex';
        return;
    }

    // Check if banner was dismissed and should still be hidden (12 hours = 43200000 ms)
    const dismissedTime = localStorage.getItem('newsletter_dismissed_at');
    if (dismissedTime) {
        const timeSinceDismissed = Date.now() - parseInt(dismissedTime);
        const twelveHours = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

        if (timeSinceDismissed < twelveHours) {
            // Still within 12 hours, hide the banner
            newsletterSection.style.display = 'none';
            return;
        } else {
            // 12 hours passed, clear the dismissed flag and show banner
            localStorage.removeItem('newsletter_dismissed_at');
        }
    }

    // Check if this is first visit in this session (mark as seen)
    const hasSeenBanner = sessionStorage.getItem('newsletter_banner_seen');
    if (!hasSeenBanner) {
        // First time seeing banner in this browser session
        sessionStorage.setItem('newsletter_banner_seen', 'true');
        // Mark the time banner was first shown (for 12-hour reset)
        if (!localStorage.getItem('newsletter_first_shown')) {
            localStorage.setItem('newsletter_first_shown', Date.now().toString());
        }
    }

    // Check server for logged-in users
    try {
        const response = await fetch('/newsletter/status');
        const data = await response.json();

        if (data.subscribed) {
            form.style.display = 'none';
            successMsg.style.display = 'flex';
            localStorage.setItem('newsletter_subscribed', 'true');
        }
    } catch (error) {
        // Ignore - user might not be logged in
    }
}

// Dismiss newsletter banner (hide for 12 hours)
function dismissNewsletterBanner() {
    const newsletterSection = document.getElementById('newsletter-section');
    if (newsletterSection) {
        newsletterSection.style.display = 'none';
        localStorage.setItem('newsletter_dismissed_at', Date.now().toString());
    }
}
