// File public/js/login.js: xử lý tương tác giao diện phía trình duyệt cho module login.
function toggleLoginPassword(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input || !button) {
        return;
    }

    const eyeOpen = button.querySelector('.eye-open');
    const eyeClosed = button.querySelector('.eye-closed');
    const isHidden = input.type === 'password';

    input.type = isHidden ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(isHidden));
    if (eyeOpen) eyeOpen.hidden = isHidden;
    if (eyeClosed) eyeClosed.hidden = !isHidden;
}

// Gan su kien nguoi dung cho thanh phan giao dien lien quan.
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-password-target]').forEach((button) => {
        // Gan su kien nguoi dung cho thanh phan giao dien lien quan.
        button.addEventListener('click', () => {
            toggleLoginPassword(button.dataset.passwordTarget, button);
        });
    });
});
