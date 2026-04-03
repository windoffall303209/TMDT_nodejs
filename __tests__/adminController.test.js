process.env.NODE_ENV = 'test';

jest.mock('../models/Order', () => ({
    getStatistics: jest.fn(),
    findAll: jest.fn()
}));

jest.mock('../models/Product', () => ({
    findAll: jest.fn(),
    count: jest.fn()
}));

jest.mock('../models/User', () => ({
    getMarketingList: jest.fn()
}));

jest.mock('../models/Category', () => ({
    findAllForAdmin: jest.fn(),
    findRootCategories: jest.fn(),
    findBySlugAny: jest.fn(),
    findById: jest.fn(),
    findByIdAny: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    getUsageStats: jest.fn(),
    delete: jest.fn(),
    createsCircularReference: jest.fn()
}));

jest.mock('../models/Banner', () => ({
    findAll: jest.fn(),
    create: jest.fn()
}));

jest.mock('../models/Sale', () => ({
    getAssignedProductsMap: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    assignProducts: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
}));

jest.mock('../models/Voucher', () => ({
    getApplicableProductsMap: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateStatus: jest.fn()
}));

jest.mock('../services/emailService', () => ({
    sendMarketingEmail: jest.fn()
}));

jest.mock('../services/adminProductVariantService', () => ({
    attachUploadedImagesToProduct: jest.fn(),
    parseVariantsPayload: jest.fn(() => []),
    syncVariants: jest.fn(),
    validateVariants: jest.fn()
}));

jest.mock('../middleware/upload', () => ({}));

const Category = require('../models/Category');
const adminController = require('../controllers/adminController');

function createRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    res.render = jest.fn().mockReturnValue(res);
    return res;
}

describe('adminController category management', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy?.mockRestore();
    });

    it('renders the categories page with aggregated stats', async () => {
        const rootCategories = [
            { id: 1, name: 'Nu', parent_id: null, product_count: 5, child_count: 1 }
        ];
        const filteredCategories = [
            { id: 2, name: 'Ao khoac nu', parent_id: 1, product_count: 2, child_count: 0 }
        ];

        Category.findAllForAdmin.mockResolvedValue(filteredCategories);
        Category.findRootCategories.mockResolvedValue(rootCategories);

        const req = {
            query: { search: 'ao khoac' },
            user: { id: 1, role: 'admin' }
        };
        const res = createRes();

        await adminController.getCategories(req, res);

        expect(res.render).toHaveBeenCalledWith('admin/categories', expect.objectContaining({
            categories: filteredCategories,
            parentCategories: rootCategories,
            categoryStats: {
                total: 1,
                root: 0,
                children: 1,
                assignedProducts: 2
            },
            searchQuery: 'ao khoac',
            currentPage: 'categories'
        }));
    });

    it('creates a category and auto-generates the slug when omitted', async () => {
        Category.findBySlugAny.mockResolvedValue(null);
        Category.create.mockResolvedValue({ id: 3 });

        const req = {
            body: {
                name: 'Ao Khoac Nu',
                slug: '',
                description: 'Ao khoac cho mua lanh',
                parent_id: '',
                image_url: '',
                display_order: '4'
            }
        };
        const res = createRes();

        await adminController.createCategory(req, res);

        expect(Category.create).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Ao Khoac Nu',
            slug: 'ao-khoac-nu',
            parent_id: null,
            display_order: 4
        }));
        expect(res.redirect).toHaveBeenCalledWith('/admin/categories');
    });

    it('rejects updating a category to use itself as the parent', async () => {
        Category.findByIdAny.mockResolvedValue({
            id: 5,
            name: 'Ao khoac',
            slug: 'ao-khoac',
            description: '',
            parent_id: null,
            image_url: '',
            display_order: 0
        });
        Category.createsCircularReference.mockResolvedValue(true);

        const req = {
            params: { id: '5' },
            body: {
                name: 'Ao khoac',
                slug: 'ao-khoac',
                parent_id: '5',
                display_order: '1'
            }
        };
        const res = createRes();

        await adminController.updateCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Không thể tạo vòng lặp danh mục cha-con'
        });
        expect(Category.update).not.toHaveBeenCalled();
    });

    it('rejects deleting categories that still contain products', async () => {
        Category.getUsageStats.mockResolvedValue({ product_count: 3, child_count: 0 });

        const req = { params: { id: '8' } };
        const res = createRes();

        await adminController.deleteCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Không thể xóa: danh mục đang có 3 sản phẩm và 0 danh mục con'
        });
        expect(Category.delete).not.toHaveBeenCalled();
    });
});
