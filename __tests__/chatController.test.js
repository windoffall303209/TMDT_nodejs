process.env.NODE_ENV = 'test';

jest.mock('../models/Chat', () => ({
    findOrCreateConversation: jest.fn(),
    getMessages: jest.fn(),
    addMessage: jest.fn(),
    updateConversationState: jest.fn(),
    getDefaultConversationState: jest.fn(() => ({
        intent: 'unknown',
        gender: null,
        category: null,
        color: null,
        price_range: null,
        sku: null,
        allow_recommendation: false,
        confirmed: false
    }))
}));

jest.mock('../models/Product', () => ({
    getActiveChatCatalog: jest.fn(),
    getOptimizedCardImageUrl: jest.fn((value) => value)
}));

jest.mock('../services/chatVisionService', () => ({
    describeProductFromImage: jest.fn().mockResolvedValue(null)
}));

jest.mock('../services/chatRagService', () => ({
    retrieveChatRagContext: jest.fn().mockResolvedValue({
        products: [],
        knowledge: []
    })
}));

const Chat = require('../models/Chat');
const Product = require('../models/Product');
const { describeProductFromImage } = require('../services/chatVisionService');
const chatController = require('../controllers/chatController');

function createRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function buildConversationState(overrides = {}) {
    return {
        intent: 'unknown',
        gender: null,
        category: null,
        color: null,
        price_range: null,
        sku: null,
        allow_recommendation: false,
        confirmed: false,
        ...overrides
    };
}

function buildProduct(overrides = {}) {
    return {
        id: 1,
        slug: 'ao-polo-nam-vang',
        name: 'Ao Polo Nam Vang',
        description: 'Ao polo nam mau vang',
        category_name: 'Ao Polo',
        category_slug: 'ao-polo',
        variant_colors: 'vang',
        price: 369000,
        final_price: 369000,
        sold_count: 20,
        stock_quantity: 5,
        primary_image: 'https://example.com/ao-polo-nam-vang.jpg',
        ...overrides
    };
}

describe('chatController.sendMessage stateful commerce flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        Chat.addMessage.mockImplementation(async (conversationId, senderType, senderId, message, options = {}) => ({
            id: senderType === 'customer' ? 301 : 302,
            conversation_id: conversationId,
            sender_type: senderType,
            sender_id: senderId,
            message,
            message_type: options.messageType || 'text',
            message_metadata: options.metadata || null
        }));

        Chat.updateConversationState.mockResolvedValue(null);
        Chat.getMessages.mockResolvedValue([]);
        Product.getActiveChatCatalog.mockResolvedValue([]);
    });

    it('does not recommend products immediately for a browse-style request', async () => {
        Chat.findOrCreateConversation.mockResolvedValue({
            id: 21,
            handling_mode: 'ai',
            conversation_state: buildConversationState()
        });

        const req = {
            body: { message: 'toi can ao polo nam mau vang' },
            uploadedChatMedia: [],
            user: null,
            sessionID: 'guest-session'
        };
        const res = createRes();

        await chatController.sendMessage(req, res);

        const botCall = Chat.addMessage.mock.calls[1];
        expect(botCall[3]).toContain('Bạn muốn mình gợi ý sản phẩm luôn không');
        expect(botCall[4].messageType).toBe('text');
        expect(botCall[4].metadata).toBeNull();
        expect(Chat.updateConversationState).toHaveBeenCalledWith(
            21,
            expect.objectContaining({
                intent: 'browse',
                gender: 'male',
                category: 'shirt-polo',
                color: 'yellow',
                allow_recommendation: false
            })
        );
    });

    it('does not confuse the verb "tim" with the color purple', async () => {
        Chat.findOrCreateConversation.mockResolvedValue({
            id: 21,
            handling_mode: 'ai',
            conversation_state: buildConversationState()
        });

        const req = {
            body: { message: 'minh can tim san pham cho tre em' },
            uploadedChatMedia: [],
            user: null,
            sessionID: 'guest-session'
        };
        const res = createRes();

        await chatController.sendMessage(req, res);

        const botCall = Chat.addMessage.mock.calls[1];
        expect(botCall[3]).not.toContain('mau tim');
        expect(botCall[3]).toContain('trẻ em');
        expect(Chat.updateConversationState).toHaveBeenCalledWith(
            21,
            expect.objectContaining({
                gender: 'kids',
                color: null,
                allow_recommendation: false
            })
        );
    });

    it('does not confuse "do nam" with the color red', async () => {
        Chat.findOrCreateConversation.mockResolvedValue({
            id: 21,
            handling_mode: 'ai',
            conversation_state: buildConversationState()
        });

        const req = {
            body: { message: 'toi can do nam' },
            uploadedChatMedia: [],
            user: null,
            sessionID: 'guest-session'
        };
        const res = createRes();

        await chatController.sendMessage(req, res);

        const botCall = Chat.addMessage.mock.calls[1];
        expect(botCall[3]).not.toContain('mau Ä‘á»');
        expect(Chat.updateConversationState).toHaveBeenCalledWith(
            21,
            expect.objectContaining({
                gender: 'male',
                color: null,
                allow_recommendation: false
            })
        );
    });

    it('respects "chưa cần gợi ý" and keeps recommendations off on the next turn', async () => {
        Chat.findOrCreateConversation
            .mockResolvedValueOnce({
                id: 21,
                handling_mode: 'ai',
                conversation_state: buildConversationState({
                    intent: 'want_product',
                    gender: 'male',
                    category: 'shirt-polo',
                    allow_recommendation: true,
                    confirmed: true
                })
            })
            .mockResolvedValueOnce({
                id: 21,
                handling_mode: 'ai',
                conversation_state: buildConversationState({
                    intent: 'ask_info',
                    gender: 'male',
                    category: 'shirt-polo',
                    allow_recommendation: false,
                    confirmed: false
                })
            });

        const firstReq = {
            body: { message: 'chua can goi y' },
            uploadedChatMedia: [],
            user: null,
            sessionID: 'guest-session'
        };
        const firstRes = createRes();

        await chatController.sendMessage(firstReq, firstRes);

        let botCall = Chat.addMessage.mock.calls[1];
        expect(botCall[4].messageType).toBe('text');
        expect(botCall[4].metadata).toBeNull();
        expect(Chat.updateConversationState).toHaveBeenCalledWith(
            21,
            expect.objectContaining({
                allow_recommendation: false,
                confirmed: false
            })
        );

        Chat.getMessages.mockResolvedValueOnce([
            { sender_type: 'customer', message: 'chua can goi y' }
        ]);

        const secondReq = {
            body: { message: 'toi can mau vang' },
            uploadedChatMedia: [],
            user: null,
            sessionID: 'guest-session'
        };
        const secondRes = createRes();

        await chatController.sendMessage(secondReq, secondRes);

        botCall = Chat.addMessage.mock.calls[3];
        expect(botCall[3]).toContain('Bạn muốn mình gợi ý sản phẩm luôn không');
        expect(botCall[4].messageType).toBe('text');
        expect(botCall[4].metadata).toBeNull();
    });

    it('returns product cards only after an explicit recommendation request', async () => {
        Chat.findOrCreateConversation.mockResolvedValue({
            id: 21,
            handling_mode: 'ai',
            conversation_state: buildConversationState({
                intent: 'browse',
                gender: 'male',
                category: 'shirt-polo',
                color: 'yellow'
            })
        });
        Product.getActiveChatCatalog.mockResolvedValue([
            buildProduct(),
            buildProduct({
                id: 2,
                slug: 'ao-polo-nam-xam',
                name: 'Ao Polo Nam Xam',
                description: 'Ao polo nam mau xam',
                variant_colors: 'xam',
                primary_image: 'https://example.com/ao-polo-nam-xam.jpg'
            }),
            buildProduct({
                id: 3,
                slug: 'quan-kaki-kid-vang',
                name: 'Quan Kaki Kid Vang',
                description: 'Quan kaki tre em mau vang',
                category_name: 'Quan',
                category_slug: 'quan',
                variant_colors: 'vang',
                primary_image: 'https://example.com/quan-kaki-kid-vang.jpg'
            })
        ]);

        const req = {
            body: { message: 'co mau nao khong?' },
            uploadedChatMedia: [],
            user: null,
            sessionID: 'guest-session'
        };
        const res = createRes();

        await chatController.sendMessage(req, res);

        const botCall = Chat.addMessage.mock.calls[1];
        expect(botCall[4].messageType).toBe('product_cards');
        expect(botCall[4].metadata.products).toEqual([
            expect.objectContaining({
                name: 'Ao Polo Nam Vang',
                url: '/products/ao-polo-nam-vang',
                final_price: 369000
            })
        ]);
        expect(Chat.updateConversationState).toHaveBeenCalledWith(
            21,
            expect.objectContaining({
                intent: 'want_product',
                allow_recommendation: true,
                confirmed: true
            })
        );
    });

    it('never mixes kids products into a men request', async () => {
        Chat.findOrCreateConversation.mockResolvedValue({
            id: 21,
            handling_mode: 'ai',
            conversation_state: buildConversationState()
        });
        Product.getActiveChatCatalog.mockResolvedValue([
            buildProduct(),
            buildProduct({
                id: 11,
                slug: 'quan-kaki-kid',
                name: 'Quan Kaki Kid',
                description: 'Quan kaki tre em co ban',
                category_name: 'Quan',
                category_slug: 'quan',
                variant_colors: 'xam',
                primary_image: 'https://example.com/quan-kaki-kid.jpg'
            }),
            buildProduct({
                id: 12,
                slug: 'dam-midi-nu',
                name: 'Dam Midi Nu',
                description: 'Dam midi nu di choi',
                category_name: 'Dam',
                category_slug: 'dam',
                variant_colors: 'do',
                primary_image: 'https://example.com/dam-midi-nu.jpg'
            })
        ]);

        const req = {
            body: { message: 'goi y san pham nam' },
            uploadedChatMedia: [],
            user: null,
            sessionID: 'guest-session'
        };
        const res = createRes();

        await chatController.sendMessage(req, res);

        const botCall = Chat.addMessage.mock.calls[1];
        expect(botCall[4].messageType).toBe('product_cards');
        expect(botCall[4].metadata.products).toEqual([
            expect.objectContaining({
                name: 'Ao Polo Nam Vang'
            })
        ]);
    });

    it('answers availability correctly without recommending when the user only asks for information', async () => {
        Chat.findOrCreateConversation.mockResolvedValue({
            id: 21,
            handling_mode: 'ai',
            conversation_state: buildConversationState()
        });
        Product.getActiveChatCatalog.mockResolvedValue([
            buildProduct()
        ]);

        const req = {
            body: { message: 'co ao polo nam mau vang khong' },
            uploadedChatMedia: [],
            user: null,
            sessionID: 'guest-session'
        };
        const res = createRes();

        await chatController.sendMessage(req, res);

        const botCall = Chat.addMessage.mock.calls[1];
        expect(botCall[3]).toContain('hiện có 1');
        expect(botCall[4].messageType).toBe('text');
        expect(botCall[4].metadata).toBeNull();
    });

    it('uses image analysis as a strict recommendation input instead of guessing unrelated products', async () => {
        describeProductFromImage.mockResolvedValueOnce({
            description: 'Ao polo nu mau vang',
            searchQuery: 'ao polo nu vang',
            matchSummary: 'Dua tren anh ban gui, minh da loc duoc cac mau gan nhat trong catalog.'
        });
        Chat.findOrCreateConversation.mockResolvedValue({
            id: 21,
            handling_mode: 'ai',
            conversation_state: buildConversationState()
        });
        Product.getActiveChatCatalog.mockResolvedValue([
            buildProduct({
                id: 21,
                slug: 'ao-polo-nu-vang',
                name: 'Ao Polo Nu Vang',
                description: 'Ao polo nu mau vang',
                category_name: 'Ao Polo',
                category_slug: 'ao-polo',
                variant_colors: 'vang',
                primary_image: 'https://example.com/ao-polo-nu-vang.jpg'
            }),
            buildProduct({
                id: 22,
                slug: 'ao-polo-nam-vang',
                name: 'Ao Polo Nam Vang',
                description: 'Ao polo nam mau vang',
                category_name: 'Ao Polo',
                category_slug: 'ao-polo',
                variant_colors: 'vang',
                primary_image: 'https://example.com/ao-polo-nam-vang.jpg'
            })
        ]);

        const req = {
            body: { message: '' },
            uploadedChatMedia: [
                {
                    mediaType: 'image',
                    mediaUrl: 'https://example.com/reference.jpg'
                }
            ],
            user: null,
            sessionID: 'guest-session'
        };
        const res = createRes();

        await chatController.sendMessage(req, res);

        const botCall = Chat.addMessage.mock.calls[1];
        expect(botCall[4].messageType).toBe('product_cards');
        expect(botCall[4].metadata.products).toEqual([
            expect.objectContaining({
                name: 'Ao Polo Nu Vang'
            })
        ]);
    });
});
