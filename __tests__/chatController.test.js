process.env.NODE_ENV = 'test';

jest.mock('../models/Chat', () => ({
    findOrCreateConversation: jest.fn(),
    getMessages: jest.fn(),
    addMessage: jest.fn()
}));

jest.mock('../models/Product', () => ({
    findAll: jest.fn(),
    search: jest.fn(),
    getBestSellers: jest.fn(),
    getFeaturedProducts: jest.fn(),
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
const { retrieveChatRagContext } = require('../services/chatRagService');
const chatController = require('../controllers/chatController');

function createRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('chatController.sendMessage product cards', () => {
    const originalOpenAIKey = process.env.OPENAI_API_KEY;
    const originalGeminiKey = process.env.GEMINI_API_KEY;
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.OPENAI_API_KEY;
        delete process.env.GEMINI_API_KEY;

        Chat.findOrCreateConversation.mockResolvedValue({
            id: 21,
            handling_mode: 'ai'
        });

        Chat.addMessage.mockImplementation(async (conversationId, senderType, senderId, message, options = {}) => ({
            id: senderType === 'customer' ? 301 : 302,
            conversation_id: conversationId,
            sender_type: senderType,
            sender_id: senderId,
            message,
            message_type: options.messageType || 'text',
            message_metadata: options.metadata || null
        }));

        Product.findAll.mockResolvedValue([
            {
                id: 101,
                slug: 'dam-midi-nu',
                name: 'Dam Midi Nu',
                description: 'Dam midi danh cho nu mac di choi',
                category_name: 'Dam',
                category_slug: 'dam',
                primary_image: 'https://example.com/dam-midi.jpg',
                price: 450000,
                final_price: 450000,
                sold_count: 24,
                stock_quantity: 8
            }
        ]);
        Product.search.mockResolvedValue([]);
        Product.getBestSellers.mockResolvedValue([]);
        Product.getFeaturedProducts.mockResolvedValue([]);
    });

    afterAll(() => {
        process.env.OPENAI_API_KEY = originalOpenAIKey;
        process.env.GEMINI_API_KEY = originalGeminiKey;
        global.fetch = originalFetch;
    });

    it('keeps vague gender-only requests as text without product cards', async () => {
        Chat.getMessages.mockResolvedValue([]);

        const req = {
            body: { message: 'toi can tim cac san pham danh cho nu' },
            uploadedChatMedia: [],
            user: null,
            sessionID: 'guest-session'
        };
        const res = createRes();

        await chatController.sendMessage(req, res);

        const botCall = Chat.addMessage.mock.calls[1];
        expect(botCall[4].messageType).toBe('text');
        expect(botCall[4].metadata).toBeNull();
    });

    it('returns product cards when the follow-up message adds budget to an existing gender intent', async () => {
        Chat.getMessages.mockResolvedValue([
            {
                sender_type: 'customer',
                message: 'toi can tim cac san pham danh cho nu'
            }
        ]);

        const req = {
            body: { message: 'tren 300k va duoi 500k' },
            uploadedChatMedia: [],
            user: null,
            sessionID: 'guest-session'
        };
        const res = createRes();

        await chatController.sendMessage(req, res);

        const botCall = Chat.addMessage.mock.calls[1];
        expect(botCall[4].messageType).toBe('product_cards');
        expect(botCall[4].metadata).toEqual(expect.objectContaining({
            products: [
                expect.objectContaining({
                    name: 'Dam Midi Nu',
                    url: '/products/dam-midi-nu',
                    final_price: 450000
                })
            ]
        }));
    });

    it('understands shorthand budget ranges without the k suffix', async () => {
        Chat.getMessages.mockResolvedValue([
            {
                sender_type: 'customer',
                message: 'tim cho toi cac san pham danh cho nu'
            }
        ]);

        const req = {
            body: { message: 'toi can cac san pham danh cho nu o shop cua ban trong khoang gia 300-500' },
            uploadedChatMedia: [],
            user: null,
            sessionID: 'guest-session'
        };
        const res = createRes();

        await chatController.sendMessage(req, res);

        const botCall = Chat.addMessage.mock.calls[1];
        expect(botCall[4].messageType).toBe('product_cards');
        expect(botCall[4].metadata).toEqual(expect.objectContaining({
            products: [
                expect.objectContaining({
                    name: 'Dam Midi Nu',
                    final_price: 450000
                })
            ]
        }));
    });

    it('filters out male and kids products from RAG results when the user asks for women products', async () => {
        retrieveChatRagContext.mockResolvedValueOnce({
            products: [
                {
                    id: 201,
                    slug: 'ao-hoodie-basic-nam',
                    name: 'Ao Hoodie Basic Nam',
                    description: 'Ao hoodie basic danh cho nam',
                    category_name: 'Nam',
                    category_slug: 'nam',
                    primary_image: 'https://example.com/hoodie-nam.jpg',
                    price: 550000,
                    final_price: 550000,
                    sold_count: 80,
                    stock_quantity: 6
                },
                {
                    id: 202,
                    slug: 'bo-do-be-trai',
                    name: 'Bo Do Be Trai',
                    description: 'Do tre em cho be trai',
                    category_name: 'Tre Em',
                    category_slug: 'tre-em',
                    primary_image: 'https://example.com/be-trai.jpg',
                    price: 320000,
                    final_price: 320000,
                    sold_count: 90,
                    stock_quantity: 9
                },
                {
                    id: 203,
                    slug: 'dam-midi-nu',
                    name: 'Dam Midi Nu',
                    description: 'Dam midi danh cho nu mac di choi',
                    category_name: 'Dam',
                    category_slug: 'dam',
                    primary_image: 'https://example.com/dam-midi.jpg',
                    price: 450000,
                    final_price: 450000,
                    sold_count: 12,
                    stock_quantity: 8
                }
            ],
            knowledge: []
        });
        Chat.getMessages.mockResolvedValue([
            {
                sender_type: 'customer',
                message: 'xin chao'
            }
        ]);

        const req = {
            body: { message: 'toi can ban de xuat cho toi cac san pham danh cho nu trong khoang 300-500' },
            uploadedChatMedia: [],
            user: null,
            sessionID: 'guest-session'
        };
        const res = createRes();

        await chatController.sendMessage(req, res);

        const botCall = Chat.addMessage.mock.calls[1];
        expect(botCall[4].messageType).toBe('product_cards');
        expect(botCall[4].metadata.products).toHaveLength(1);
        expect(botCall[4].metadata.products[0]).toEqual(expect.objectContaining({
            name: 'Dam Midi Nu',
            url: '/products/dam-midi-nu',
            final_price: 450000
        }));
    });

    it('pulls additional women products from the broader catalog when search only finds part of the range', async () => {
        retrieveChatRagContext.mockResolvedValueOnce({
            products: [],
            knowledge: []
        });
        Product.getBestSellers.mockResolvedValueOnce([]);
        Product.getFeaturedProducts.mockResolvedValueOnce([]);
        Product.findAll.mockImplementation(async (filters = {}) => {
            if (filters.search) {
                return [
                    {
                        id: 301,
                        slug: 'ao-kieu-cong-so',
                        name: 'Ao Kieu Cong So',
                        description: 'Ao nu cong so',
                        category_name: 'Nu',
                        category_slug: 'nu',
                        primary_image: 'https://example.com/ao-kieu-cong-so.jpg',
                        price: 350000,
                        final_price: 350000,
                        sold_count: 10,
                        stock_quantity: 9
                    },
                    {
                        id: 302,
                        slug: 'ao-cardigan-nu',
                        name: 'Ao Cardigan Nu',
                        description: 'Ao cardigan nu',
                        category_name: 'Nu',
                        category_slug: 'nu',
                        primary_image: 'https://example.com/ao-cardigan-nu.jpg',
                        price: 490000,
                        final_price: 490000,
                        sold_count: 8,
                        stock_quantity: 8
                    }
                ];
            }

            if (filters.sort_by === 'created_at') {
                return [
                    {
                        id: 303,
                        slug: 'vay-cong-so',
                        name: 'Vay Cong So',
                        description: 'Vay nu cong so',
                        category_name: 'Nu',
                        category_slug: 'nu',
                        primary_image: 'https://example.com/vay-cong-so.jpg',
                        price: 420000,
                        final_price: 420000,
                        sold_count: 5,
                        stock_quantity: 7
                    },
                    {
                        id: 304,
                        slug: 'vay-midi-xoe',
                        name: 'Vay Midi Xoe',
                        description: 'Vay midi nu',
                        category_name: 'Nu',
                        category_slug: 'nu',
                        primary_image: 'https://example.com/vay-midi-xoe.jpg',
                        price: 480000,
                        final_price: 480000,
                        sold_count: 4,
                        stock_quantity: 6
                    }
                ];
            }

            return [];
        });
        Chat.getMessages.mockResolvedValue([
            {
                sender_type: 'customer',
                message: 'xin chao'
            }
        ]);

        const req = {
            body: { message: 'tim cho toi 5 san pham danh cho nu trong khoang 300-500, neu ko du 5 san pham thi co the de xuat san pham gan khoang gia nay' },
            uploadedChatMedia: [],
            user: null,
            sessionID: 'guest-session'
        };
        const res = createRes();

        await chatController.sendMessage(req, res);

        const botCall = Chat.addMessage.mock.calls[1];
        expect(botCall[4].messageType).toBe('product_cards');
        expect(botCall[4].metadata.products).toEqual([
            expect.objectContaining({ name: 'Ao Kieu Cong So', final_price: 350000 }),
            expect.objectContaining({ name: 'Ao Cardigan Nu', final_price: 490000 }),
            expect.objectContaining({ name: 'Vay Cong So', final_price: 420000 }),
            expect.objectContaining({ name: 'Vay Midi Xoe', final_price: 480000 })
        ]);
    });

    it('keeps the closest image match even when it falls slightly outside the remembered budget', async () => {
        process.env.OPENAI_API_KEY = 'test-openai-key';
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    {
                        message: {
                            content: 'Hien shop chua co mau that su gan trong catalog, nen minh khong muon goi y sai cho ban.'
                        }
                    }
                ]
            })
        });
        describeProductFromImage.mockResolvedValueOnce({
            description: 'Ao croptop trang tay ngan co V',
            searchQuery: 'ao croptop nu',
            matchSummary: 'Dua tren anh ban gui, minh da loc cac mau gan nhat hien co ngay ben duoi de ban de so sanh.'
        });
        retrieveChatRagContext.mockResolvedValueOnce({
            products: [],
            knowledge: []
        });
        Product.findAll.mockImplementation(async (filters = {}) => {
            if (filters.search) {
                return [
                    {
                        id: 401,
                        slug: 'ao-croptop-nu',
                        name: 'Ao Croptop Nu',
                        description: 'Ao croptop nu toi gian',
                        category_name: 'Nu',
                        category_slug: 'nu',
                        primary_image: 'https://example.com/ao-croptop-nu.jpg',
                        price: 280000,
                        final_price: 280000,
                        sold_count: 16,
                        stock_quantity: 6
                    },
                    {
                        id: 402,
                        slug: 'ao-cardigan-nu',
                        name: 'Ao Cardigan Nu',
                        description: 'Ao cardigan nu',
                        category_name: 'Nu',
                        category_slug: 'nu',
                        primary_image: 'https://example.com/ao-cardigan-nu.jpg',
                        price: 490000,
                        final_price: 490000,
                        sold_count: 9,
                        stock_quantity: 7
                    }
                ];
            }

            return [];
        });
        Chat.getMessages.mockResolvedValue([
            {
                sender_type: 'customer',
                message: 'tim cho toi cac san pham danh cho nu trong khoang 300-500'
            }
        ]);

        const req = {
            body: { message: '' },
            uploadedChatMedia: [
                {
                    mediaType: 'image',
                    mediaUrl: 'https://example.com/croptop-reference.jpg'
                }
            ],
            user: null,
            sessionID: 'guest-session'
        };
        const res = createRes();

        await chatController.sendMessage(req, res);

        const botCall = Chat.addMessage.mock.calls[1];
        expect(botCall[3]).toBe('Dua tren anh ban gui, minh da loc cac mau gan nhat hien co ngay ben duoi de ban de so sanh.');
        expect(botCall[4].messageType).toBe('product_cards');
        expect(botCall[4].metadata.products).toHaveLength(1);
        expect(botCall[4].metadata.products[0]).toEqual(expect.objectContaining({
            name: 'Ao Croptop Nu',
            final_price: 280000
        }));
    });
});
