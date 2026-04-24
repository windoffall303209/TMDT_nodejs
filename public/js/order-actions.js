// Gắn hộp xác nhận cho các form thao tác đơn hàng cần người dùng xác nhận.

/**
 * Bind một lần cho các form có data-confirm-submit để tránh lặp listener sau khi DOM được cập nhật.
 */
function bindConfirmSubmitForms(root = document) {
    root.querySelectorAll('[data-confirm-submit]').forEach((form) => {
        if (form.dataset.confirmSubmitBound === 'true') {
            return;
        }

        form.dataset.confirmSubmitBound = 'true';
        form.addEventListener('submit', (event) => {
            // Thông báo xác nhận nằm trong data attribute để EJS không cần inline JavaScript.
            const message = form.dataset.confirmMessage || 'Ban chac chan muon thuc hien thao tac nay?';
            if (!window.confirm(message)) {
                event.preventDefault();
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    bindConfirmSubmitForms(document);
});
