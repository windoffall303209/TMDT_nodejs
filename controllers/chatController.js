const Chat = require('../models/Chat');
const Product = require('../models/Product');

// ============================================================================
// AI INTEGRATION (Hỗ trợ OpenAI + Gemini, tự chọn theo .env)
// ============================================================================

// Lấy system prompt + product context
async function getSystemPrompt() {
    let productContext = '';
    try {
        const products = await Product.findAll({ limit: 10, page: 1 });
        if (products.products && products.products.length > 0) {
            productContext = '\n\nDanh sách sản phẩm hiện có:\n' +
                products.products.map(p => `- ${p.name}: ${Number(p.price).toLocaleString('vi-VN')}đ (Còn ${p.stock_quantity} sản phẩm)`).join('\n');
        }
    } catch (e) {}

    return `Bạn là trợ lý bán hàng AI của cửa hàng thời trang "WIND OF FALL".
Nhiệm vụ: tư vấn sản phẩm, hỗ trợ mua hàng, trả lời thắc mắc về đơn hàng.

Quy tắc:
- Trả lời bằng tiếng Việt, thân thiện, ngắn gọn (tối đa 3-4 câu)
- Tư vấn phù hợp với khách hàng
- Nếu không biết câu trả lời, hãy đề nghị khách liên hệ admin
- Không bịa thông tin về giá cả hoặc chính sách
- Website: windoffall3k32k9.online

Thông tin cửa hàng:
- Chuyên thời trang nam nữ
- Hỗ trợ thanh toán: COD, VNPay, MoMo
- Giao hàng toàn quốc${productContext}`;
}

// Gọi OpenAI API (hoặc proxy tương thích OpenAI)
async function callOpenAI(systemPrompt, messages, userMessage) {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

    const chatMessages = [{ role: 'system', content: systemPrompt }];
    const recentMessages = messages.slice(-10);
    for (const msg of recentMessages) {
        if (msg.sender_type === 'customer') {
            chatMessages.push({ role: 'user', content: msg.message });
        } else if (msg.sender_type === 'bot' || msg.sender_type === 'admin') {
            chatMessages.push({ role: 'assistant', content: msg.message });
        }
    }
    chatMessages.push({ role: 'user', content: userMessage });

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: chatMessages,
            max_tokens: 300,
            temperature: 0.7
        })
    });

    const data = await response.json();
    if (!response.ok) {
        console.error('OpenAI API error:', response.status, JSON.stringify(data));
        return null;
    }
    if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
    }
    return null;
}

// Gọi Gemini API
async function callGemini(systemPrompt, messages, userMessage) {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    const contents = [];
    const recentMessages = messages.slice(-10);
    for (const msg of recentMessages) {
        if (msg.sender_type === 'customer') {
            contents.push({ role: 'user', parts: [{ text: msg.message }] });
        } else if (msg.sender_type === 'bot' || msg.sender_type === 'admin') {
            contents.push({ role: 'model', parts: [{ text: msg.message }] });
        }
    }
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: contents,
                generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
            })
        }
    );

    const data = await response.json();
    if (!response.ok) {
        console.error('Gemini API error:', response.status, JSON.stringify(data));
        return null;
    }
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
    }
    return null;
}

// Hàm chính: tự chọn provider theo .env
async function callAI(messages, userMessage) {
    const provider = process.env.AI_PROVIDER || 'openai'; // 'openai' hoặc 'gemini'

    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGemini = !!process.env.GEMINI_API_KEY;

    if (!hasOpenAI && !hasGemini) {
        return 'Xin lỗi, hệ thống AI đang bảo trì. Vui lòng đợi admin hỗ trợ bạn!';
    }

    try {
        const systemPrompt = await getSystemPrompt();

        // Thử provider chính trước
        if (provider === 'gemini' && hasGemini) {
            const result = await callGemini(systemPrompt, messages, userMessage);
            if (result) return result;
            // Fallback sang OpenAI nếu Gemini lỗi
            if (hasOpenAI) {
                const fallback = await callOpenAI(systemPrompt, messages, userMessage);
                if (fallback) return fallback;
            }
        } else if (hasOpenAI) {
            const result = await callOpenAI(systemPrompt, messages, userMessage);
            if (result) return result;
            // Fallback sang Gemini nếu OpenAI lỗi
            if (hasGemini) {
                const fallback = await callGemini(systemPrompt, messages, userMessage);
                if (fallback) return fallback;
            }
        }

        return 'Xin lỗi, tôi không thể xử lý yêu cầu này. Bạn có thể thử lại hoặc đợi admin hỗ trợ!';
    } catch (error) {
        console.error('AI API error:', error);
        return 'Xin lỗi, hệ thống đang bận. Vui lòng đợi admin hỗ trợ bạn!';
    }
}

// ============================================================================
// CUSTOMER ENDPOINTS
// ============================================================================

// POST /chat/send - Khách gửi tin nhắn
exports.sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Tin nhắn không được trống' });
        }

        const userId = req.user ? req.user.id : null;
        const sessionId = req.sessionID;
        const guestName = req.user ? req.user.email : 'Khách';

        // Tìm hoặc tạo conversation
        const conversation = await Chat.findOrCreateConversation(userId, sessionId, guestName);

        // Lưu tin nhắn khách
        const customerMsg = await Chat.addMessage(conversation.id, 'customer', userId, message.trim());

        // Gọi AI trả lời
        const previousMessages = await Chat.getMessages(conversation.id);
        const aiResponse = await callAI(previousMessages, message.trim());

        // Lưu tin nhắn bot
        const botMsg = await Chat.addMessage(conversation.id, 'bot', null, aiResponse);

        res.json({
            success: true,
            customerMessage: customerMsg,
            botMessage: botMsg
        });
    } catch (error) {
        console.error('Chat send error:', error);
        res.status(500).json({ success: false, message: 'Lỗi gửi tin nhắn' });
    }
};

// GET /chat/messages - Lấy lịch sử chat
exports.getMessages = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const sessionId = req.sessionID;

        let query, params;
        if (userId) {
            query = 'SELECT * FROM chat_conversations WHERE user_id = ? AND status = "active" ORDER BY updated_at DESC LIMIT 1';
            params = [userId];
        } else {
            query = 'SELECT * FROM chat_conversations WHERE session_id = ? AND user_id IS NULL AND status = "active" ORDER BY updated_at DESC LIMIT 1';
            params = [sessionId];
        }

        const pool = require('../config/database');
        const [convRows] = await pool.execute(query, params);

        if (convRows.length === 0) {
            return res.json({ success: true, messages: [] });
        }

        const messages = await Chat.getMessages(convRows[0].id);

        // Đánh dấu đã đọc tin nhắn từ admin/bot
        await Chat.markAsRead(convRows[0].id, 'customer');

        res.json({ success: true, messages, conversationId: convRows[0].id });
    } catch (error) {
        console.error('Chat getMessages error:', error);
        res.status(500).json({ success: false, message: 'Lỗi tải tin nhắn' });
    }
};

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

// GET /admin/chat - Trang quản lý chat
exports.adminChatPage = async (req, res) => {
    try {
        const { conversations, total } = await Chat.getAllConversations(1, 50);
        const unreadCount = await Chat.getUnreadCount();

        res.render('admin/chat', {
            currentPage: 'chat',
            conversations,
            total,
            unreadCount,
            user: req.user
        });
    } catch (error) {
        console.error('Admin chat page error:', error);
        res.status(500).render('error', { message: 'Lỗi tải trang chat', user: req.user });
    }
};

// GET /admin/chat/:id/messages - Lấy tin nhắn của conversation
exports.adminGetMessages = async (req, res) => {
    try {
        const conversationId = req.params.id;
        const messages = await Chat.getMessages(conversationId, 100);
        const conversation = await Chat.getConversationById(conversationId);

        // Đánh dấu đã đọc
        await Chat.markAsRead(conversationId, 'admin');

        res.json({ success: true, messages, conversation });
    } catch (error) {
        console.error('Admin getMessages error:', error);
        res.status(500).json({ success: false, message: 'Lỗi tải tin nhắn' });
    }
};

// POST /admin/chat/:id/reply - Admin trả lời
exports.adminReply = async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Tin nhắn không được trống' });
        }

        const adminMsg = await Chat.addMessage(conversationId, 'admin', req.user.id, message.trim());

        res.json({ success: true, message: adminMsg });
    } catch (error) {
        console.error('Admin reply error:', error);
        res.status(500).json({ success: false, message: 'Lỗi gửi tin nhắn' });
    }
};

// PUT /admin/chat/:id/close - Đóng conversation
exports.adminCloseConversation = async (req, res) => {
    try {
        await Chat.closeConversation(req.params.id);
        res.json({ success: true, message: 'Đã đóng cuộc trò chuyện' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /admin/chat/:id/reopen - Mở lại conversation
exports.adminReopenConversation = async (req, res) => {
    try {
        await Chat.reopenConversation(req.params.id);
        res.json({ success: true, message: 'Đã mở lại cuộc trò chuyện' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /admin/chat/unread-count - Đếm tin chưa đọc (cho polling)
exports.adminUnreadCount = async (req, res) => {
    try {
        const count = await Chat.getUnreadCount();
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, count: 0 });
    }
};

// GET /admin/chat/conversations - API lấy danh sách conversations (cho polling refresh)
exports.adminGetConversations = async (req, res) => {
    try {
        const { conversations, total } = await Chat.getAllConversations(1, 50);
        res.json({ success: true, conversations, total });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
