const pool = require('../config/database');

class Chat {
    // Tìm hoặc tạo conversation cho user/guest
    static async findOrCreateConversation(userId, sessionId, guestName = 'Khách') {
        // Tìm conversation active
        let query, params;
        if (userId) {
            query = 'SELECT * FROM chat_conversations WHERE user_id = ? AND status = "active" ORDER BY updated_at DESC LIMIT 1';
            params = [userId];
        } else {
            query = 'SELECT * FROM chat_conversations WHERE session_id = ? AND user_id IS NULL AND status = "active" ORDER BY updated_at DESC LIMIT 1';
            params = [sessionId];
        }

        const [rows] = await pool.execute(query, params);
        if (rows.length > 0) return rows[0];

        // Tạo mới
        const [result] = await pool.execute(
            'INSERT INTO chat_conversations (user_id, session_id, guest_name) VALUES (?, ?, ?)',
            [userId || null, sessionId || null, guestName]
        );
        return { id: result.insertId, user_id: userId, session_id: sessionId, guest_name: guestName, status: 'active' };
    }

    // Lấy conversation theo ID
    static async getConversationById(conversationId) {
        const [rows] = await pool.execute('SELECT * FROM chat_conversations WHERE id = ?', [conversationId]);
        return rows[0] || null;
    }

    // Lấy messages của conversation
    static async getMessages(conversationId, limit = 50) {
        const [rows] = await pool.execute(
            `SELECT cm.*, u.full_name as sender_name, u.avatar_url as sender_avatar
             FROM chat_messages cm
             LEFT JOIN users u ON cm.sender_id = u.id
             WHERE cm.conversation_id = ?
             ORDER BY cm.created_at ASC
             LIMIT ${parseInt(limit)}`,
            [conversationId]
        );
        return rows;
    }

    // Thêm message
    static async addMessage(conversationId, senderType, senderId, message) {
        const [result] = await pool.execute(
            'INSERT INTO chat_messages (conversation_id, sender_type, sender_id, message) VALUES (?, ?, ?, ?)',
            [conversationId, senderType, senderId || null, message]
        );

        // Cập nhật last_message_at
        await pool.execute(
            'UPDATE chat_conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = ?',
            [conversationId]
        );

        return { id: result.insertId, conversation_id: conversationId, sender_type: senderType, sender_id: senderId, message };
    }

    // Đánh dấu đã đọc
    static async markAsRead(conversationId, readerType) {
        const senderCondition = readerType === 'admin' ? "sender_type = 'customer'" : "sender_type IN ('admin', 'bot')";
        await pool.execute(
            `UPDATE chat_messages SET is_read = TRUE WHERE conversation_id = ? AND ${senderCondition} AND is_read = FALSE`,
            [conversationId]
        );
    }

    // Lấy danh sách conversations cho admin (có last message)
    static async getAllConversations(page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const [rows] = await pool.execute(
            `SELECT cc.*,
                    u.full_name as user_name, u.email as user_email, u.avatar_url as user_avatar,
                    (SELECT message FROM chat_messages WHERE conversation_id = cc.id ORDER BY created_at DESC LIMIT 1) as last_message,
                    (SELECT sender_type FROM chat_messages WHERE conversation_id = cc.id ORDER BY created_at DESC LIMIT 1) as last_sender,
                    (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = cc.id AND sender_type = 'customer' AND is_read = FALSE) as unread_count
             FROM chat_conversations cc
             LEFT JOIN users u ON cc.user_id = u.id
             ORDER BY cc.last_message_at DESC
             LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`
        );

        const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM chat_conversations');
        return { conversations: rows, total: countResult[0].total };
    }

    // Đếm tin nhắn chưa đọc (cho admin badge)
    static async getUnreadCount() {
        const [rows] = await pool.execute(
            `SELECT COUNT(DISTINCT cm.conversation_id) as count
             FROM chat_messages cm
             JOIN chat_conversations cc ON cm.conversation_id = cc.id
             WHERE cm.sender_type = 'customer' AND cm.is_read = FALSE AND cc.status = 'active'`
        );
        return rows[0].count;
    }

    // Đóng conversation
    static async closeConversation(conversationId) {
        await pool.execute('UPDATE chat_conversations SET status = "closed" WHERE id = ?', [conversationId]);
    }

    // Mở lại conversation
    static async reopenConversation(conversationId) {
        await pool.execute('UPDATE chat_conversations SET status = "active" WHERE id = ?', [conversationId]);
    }
}

module.exports = Chat;
