// Chat Widget JavaScript
let chatOpen = false;
let chatLoaded = false;

function toggleChatWidget() {
    const box = document.getElementById('chatBox');
    const btn = document.getElementById('chatToggleBtn');
    chatOpen = !chatOpen;

    if (chatOpen) {
        box.style.display = 'flex';
        btn.style.display = 'none';
        if (!chatLoaded) {
            loadChatHistory();
            chatLoaded = true;
        }
        document.getElementById('chatInput').focus();
        // Start polling for new messages
        startChatPolling();
    } else {
        box.style.display = 'none';
        btn.style.display = 'flex';
        stopChatPolling();
    }
}

// Load chat history
async function loadChatHistory() {
    try {
        const response = await fetch('/chat/messages', { credentials: 'same-origin' });
        const data = await response.json();

        if (data.success && data.messages.length > 0) {
            const container = document.getElementById('chatMessages');
            // Keep welcome message, add history
            data.messages.forEach(msg => {
                appendMessage(msg.sender_type, msg.message, msg.created_at);
            });
            scrollToBottom();
        }
    } catch (error) {
        console.error('Load chat history error:', error);
    }
}

// Send message
async function sendChatMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const message = input.value.trim();

    if (!message) return;

    // Show customer message immediately
    appendMessage('customer', message);
    input.value = '';
    sendBtn.disabled = true;
    scrollToBottom();

    // Show typing indicator
    showTyping();

    try {
        const response = await fetch('/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        hideTyping();

        if (data.success && data.botMessage) {
            appendMessage(data.botMessage.sender_type, data.botMessage.message);
        }
    } catch (error) {
        hideTyping();
        appendMessage('bot', 'Xin loi, co loi xay ra. Vui long thu lai!');
    }

    sendBtn.disabled = false;
    input.focus();
    scrollToBottom();
}

// Append message to chat
function appendMessage(type, text, time) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `chat-msg chat-msg--${type}`;

    let label = '';
    if (type === 'admin') {
        label = '<div class="chat-msg__label">Admin</div>';
    }

    const timeStr = time ? formatChatTime(new Date(time)) : formatChatTime(new Date());
    div.innerHTML = `${label}<div>${escapeHtml(text)}</div><div class="chat-msg__time">${timeStr}</div>`;
    container.appendChild(div);
    scrollToBottom();
}

// Show typing indicator
function showTyping() {
    hideTyping();
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-typing';
    div.id = 'chatTypingIndicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(div);
    scrollToBottom();
}

function hideTyping() {
    const el = document.getElementById('chatTypingIndicator');
    if (el) el.remove();
}

// Scroll to bottom
function scrollToBottom() {
    const container = document.getElementById('chatMessages');
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 50);
}

// Format time
function formatChatTime(date) {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Polling for new admin messages
let chatPollInterval = null;
let lastMessageCount = 0;
let chatPollErrors = 0;

function startChatPolling() {
    if (chatPollInterval) return;
    chatPollErrors = 0;
    chatPollInterval = setInterval(pollNewMessages, 5000);
}

function stopChatPolling() {
    if (chatPollInterval) {
        clearInterval(chatPollInterval);
        chatPollInterval = null;
    }
}

async function pollNewMessages() {
    if (!chatOpen) return;
    // Stop polling after 3 consecutive errors
    if (chatPollErrors >= 3) {
        stopChatPolling();
        return;
    }
    try {
        const response = await fetch('/chat/messages', { credentials: 'same-origin' });
        if (!response.ok) {
            chatPollErrors++;
            return;
        }
        const data = await response.json();
        chatPollErrors = 0; // Reset on success

        if (data.success && data.messages.length > lastMessageCount) {
            const newMessages = data.messages.slice(lastMessageCount);
            newMessages.forEach(msg => {
                if (msg.sender_type === 'admin') {
                    appendMessage('admin', msg.message, msg.created_at);
                }
            });
            lastMessageCount = data.messages.length;
        }
    } catch (error) {
        chatPollErrors++;
    }
}
