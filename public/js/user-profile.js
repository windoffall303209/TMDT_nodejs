// User Profile JavaScript

// Show developing alert for verify buttons
function showDevelopingAlert() {
    alert('🚧 Tính năng này đang được phát triển. Vui lòng quay lại sau!');
}

// Show alert message
function showProfileAlert(message, type = 'success') {
    const alertHtml = `
        <div class="profile-alert profile-alert--${type}" id="profileAlert">
            <span>${type === 'success' ? '✅' : '❌'}</span>
            <span>${message}</span>
        </div>
    `;
    
    // Remove existing alert
    const existingAlert = document.getElementById('profileAlert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Insert new alert
    const container = document.querySelector('.profile-content');
    if (container) {
        container.insertAdjacentHTML('afterbegin', alertHtml);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById('profileAlert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }
}

// Handle avatar upload
function initAvatarUpload() {
    const avatarInput = document.getElementById('avatarInput');
    const avatarImage = document.getElementById('avatarImage');
    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
    
    if (avatarInput) {
        avatarInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                showProfileAlert('File ảnh phải nhỏ hơn 5MB', 'error');
                return;
            }
            
            // Preview image
            const reader = new FileReader();
            reader.onload = function(event) {
                if (avatarImage) {
                    avatarImage.src = event.target.result;
                    avatarImage.style.display = 'block';
                }
                if (avatarPlaceholder) {
                    avatarPlaceholder.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
            
            // Upload to server
            const formData = new FormData();
            formData.append('avatar', file);
            
            try {
                const response = await fetch('/auth/profile/avatar', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showProfileAlert('Cập nhật ảnh đại diện thành công');
                } else {
                    showProfileAlert(result.message || 'Lỗi upload ảnh', 'error');
                }
            } catch (error) {
                console.error('Avatar upload error:', error);
                showProfileAlert('Lỗi kết nối server', 'error');
            }
        });
    }
}

// Handle profile form submit
function initProfileForm() {
    const profileForm = document.getElementById('profileForm');
    
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang lưu...';
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/auth/profile/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showProfileAlert('Cập nhật thông tin thành công');
                    
                    // Update sidebar name
                    const sidebarName = document.querySelector('.profile-sidebar__name');
                    if (sidebarName && data.full_name) {
                        sidebarName.textContent = data.full_name;
                    }
                } else {
                    showProfileAlert(result.message || 'Lỗi cập nhật', 'error');
                }
            } catch (error) {
                console.error('Profile update error:', error);
                showProfileAlert('Lỗi kết nối server', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
}

// Handle password change form
function initPasswordForm() {
    const passwordForm = document.getElementById('passwordForm');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang đổi...';
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            
            // Client-side validation
            if (data.new_password !== data.confirm_password) {
                showProfileAlert('Xác nhận mật khẩu không khớp', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            
            if (data.new_password.length < 6) {
                showProfileAlert('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            
            try {
                const response = await fetch('/auth/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showProfileAlert('Đổi mật khẩu thành công');
                    this.reset();
                } else {
                    showProfileAlert(result.message || 'Lỗi đổi mật khẩu', 'error');
                }
            } catch (error) {
                console.error('Password change error:', error);
                showProfileAlert('Lỗi kết nối server', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initAvatarUpload();
    initProfileForm();
    initPasswordForm();
});
