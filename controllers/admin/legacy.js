/**
 * =============================================================================
 * ADMIN CONTROLLER - i�u khi�n trang qu�n tr�
 * =============================================================================
 * File n�y ch�a c�c h�m x� l� logic cho trang Admin:
 * - Dashboard: Th�ng k� t�ng quan
 * - Qu�n l� s�n ph�m: CRUD s�n ph�m, qu�n l� �nh
 * - Qu�n l� �n h�ng: Xem, c�p nh�t tr�ng th�i
 * - Qu�n l� ng��i d�ng: Xem, kh�a/m� kh�a t�i kho�n
 * - Qu�n l� banner: CRUD banner qu�ng c�o
 * - Qu�n l� khuy�n m�i: CRUD ch��ng tr�nh sale
 * - Email marketing: G�i email h�ng lo�t
 * =============================================================================
 */

const Order = require('../../models/Order');
const ReturnRequest = require('../../models/ReturnRequest');
const Product = require('../../models/Product');
const User = require('../../models/User');
const Category = require('../../models/Category');
const Banner = require('../../models/Banner');
const Sale = require('../../models/Sale');
const Voucher = require('../../models/Voucher');
const Newsletter = require('../../models/Newsletter');
const StorefrontSetting = require('../../models/StorefrontSetting');
const pool = require('../../config/database');
const emailService = require('../../services/emailService');
const { attachUploadedImagesToProduct, parseVariantsPayload, syncVariants, validateVariants } = require('../../services/adminProductVariantService');
const {
    createProductImportTemplateBuffer,
    exportProductsToWorkbookBuffer,
    importProductsFromWorkbook
} = require('../../services/productBulkImportService');
const {
    createCategoryImportTemplateBuffer,
    exportCategoriesToWorkbookBuffer,
    importCategoriesFromWorkbook
} = require('../../services/categoryBulkImportService');
const upload = require('../../middleware/upload');
const { invalidateStorefrontSettingsCache } = require('../../middleware/storefrontSettings');
const { scheduleProductVisualEmbeddingSync } = require('../../services/productVisualEmbeddingService');
const ProductImageEmbedding = require('../../models/ProductImageEmbedding');

const ADMIN_PRODUCT_SELECTION_LIMIT = 20000;

// Phân tích selected sản phẩm ids.
function parseSelectedProductIds(body) {
    const rawValues = body.product_ids ?? body['product_ids[]'] ?? [];
    const normalized = Array.isArray(rawValues)
        ? rawValues
        : (rawValues && typeof rawValues === 'object' ? Object.values(rawValues) : [rawValues]);

    return [...new Set(
        normalized
            .flatMap((value) => String(value).split(','))
            .map((value) => parseInt(value, 10))
            .filter((value) => Number.isInteger(value) && value > 0)
    )];
}

// Phân tích optional trimmed string.
function parseOptionalTrimmedString(value) {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    const normalized = String(value).trim();
    return normalized ? normalized : null;
}

// Phân tích optional decimal.
function parseOptionalDecimal(value, fieldName) {
    if (value === undefined) {
        return undefined;
    }

    if (value === null || value === '') {
        return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error(`${fieldName} is invalid`);
    }

    return parsed;
}

// Phân tích optional ngày.
function parseOptionalDate(value, fieldName) {
    if (value === undefined) {
        return undefined;
    }

    if (value === null || value === '') {
        return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`${fieldName} is invalid`);
    }

    return parsed;
}

// Phân tích checked.
function parseChecked(value) {
    return value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
}

// Chuẩn hóa discount value or throw.
function normalizeDiscountValueOrThrow(type, value, entityLabel = 'Gi� tr�') {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
        throw new Error(`${entityLabel} ph�i l�n h�n 0`);
    }

    if (type === 'percentage' && parsedValue >= 100) {
        throw new Error(`${entityLabel} ph�n trm ph�i nh� h�n 100%`);
    }

    return parsedValue;
}

// Xử lý assert ngày range valid.
function assertDateRangeValid(startDate, endDate, entityLabel = 'Kho�ng th�i gian') {
    if (!startDate || !endDate) {
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return;
    }

    if (start > end) {
        throw new Error(`${entityLabel} kh�ng h�p l�`);
    }
}

// Xử lý escape html.
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Định dạng currency vnd.
function formatCurrencyVnd(value) {
    const amount = Number(value) || 0;
    return `${amount.toLocaleString('vi-VN')}`;
}

// Định dạng ngày time vi.
function formatDateTimeVi(value) {
    if (!value) {
        return 'Kh�ng gi�i h�n';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Kh�ng gi�i h�n';
    }

    return date.toLocaleString('vi-VN');
}

// Tạo dữ liệu quản trị notice điều hướng.
function buildAdminNoticeRedirect(path, message, type = 'success') {
    const params = new URLSearchParams();
    params.set('notice', message);
    params.set('notice_type', type);
    return `${path}?${params.toString()}`;
}

// Dọn dẹp import upload tệp.
function cleanupImportUploadFiles(files) {
    const fs = require('fs');
    const fileList = Array.isArray(files)
        ? files
        : Object.values(files || {}).flat();

    fileList.forEach((file) => {
        if (!file?.path) {
            return;
        }

        try {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        } catch (error) {
            console.warn('Import upload cleanup warning:', error.message);
        }
    });
}

// Tạo dữ liệu đơn hàng theo dõi payload.
function buildOrderTrackingPayload(body = {}) {
    const payload = {
        source: 'admin'
    };

    if (Object.prototype.hasOwnProperty.call(body, 'carrier')) {
        payload.carrier = parseOptionalTrimmedString(body.carrier);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'tracking_code')) {
        payload.tracking_code = parseOptionalTrimmedString(body.tracking_code);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'tracking_url')) {
        payload.tracking_url = parseOptionalTrimmedString(body.tracking_url);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'current_location_text')) {
        payload.current_location_text = parseOptionalTrimmedString(body.current_location_text);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'current_lat')) {
        payload.current_lat = parseOptionalDecimal(body.current_lat, 'Current latitude');
    }

    if (Object.prototype.hasOwnProperty.call(body, 'current_lng')) {
        payload.current_lng = parseOptionalDecimal(body.current_lng, 'Current longitude');
    }

    if (Object.prototype.hasOwnProperty.call(body, 'estimated_delivery_at')) {
        payload.estimated_delivery_at = parseOptionalDate(body.estimated_delivery_at, 'Estimated delivery time');
    }

    if (Object.prototype.hasOwnProperty.call(body, 'status_title')) {
        payload.title = parseOptionalTrimmedString(body.status_title);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'status_note')) {
        payload.description = parseOptionalTrimmedString(body.status_note);
    }

    return payload;
}

// Xử lý attach khuyến mãi assignments.
async function attachSaleAssignments(sales, totalActiveProducts = 0) {
    const saleIds = Array.isArray(sales) ? sales.map((sale) => sale.id) : [];
    const assignments = await Sale.getAssignedProductsMap(saleIds);
    const now = new Date();

    return (sales || []).map((sale) => ({
        ...sale,
        assigned_products: assignments.get(sale.id) || [],
        assigned_product_count: (assignments.get(sale.id) || []).length,
        applies_to_all_products: totalActiveProducts > 0 && (assignments.get(sale.id) || []).length >= totalActiveProducts,
        status_meta: (() => {
            const assignedProductCount = (assignments.get(sale.id) || []).length;
            const startDate = sale.start_date ? new Date(sale.start_date) : null;
            const endDate = sale.end_date ? new Date(sale.end_date) : null;

            if (assignedProductCount === 0) {
                return { key: 'unassigned', label: 'Ch�a g�n s�n ph�m', tone: 'pending' };
            }

            if (!sale.is_active) {
                return { key: 'paused', label: 'T�m d�ng', tone: 'cancelled' };
            }

            if (startDate && !Number.isNaN(startDate.getTime()) && now < startDate) {
                return { key: 'upcoming', label: 'S�p di�n ra', tone: 'pending' };
            }

            if (endDate && !Number.isNaN(endDate.getTime()) && now > endDate) {
                return { key: 'expired', label: 'H�t h�n', tone: 'cancelled' };
            }

            return { key: 'active', label: 'ang di�n ra', tone: 'delivered' };
        })()
    }));
}

// Xử lý attach mã giảm giá assignments.
async function attachVoucherAssignments(vouchers) {
    const voucherIds = Array.isArray(vouchers) ? vouchers.map((voucher) => voucher.id) : [];
    const assignments = await Voucher.getApplicableProductsMap(voucherIds);

    return (vouchers || []).map((voucher) => ({
        ...voucher,
        applicable_products: assignments.get(voucher.id) || [],
        applicable_product_count: (assignments.get(voucher.id) || []).length
    }));
}

// Lấy announcement recipients.
async function getAnnouncementRecipients() {
    const subscribers = await Newsletter.getActiveSubscribers();
    const seenEmails = new Set();

    return subscribers.reduce((list, subscriber) => {
        const email = String(subscriber?.email || '').trim().toLowerCase();
        if (!email || seenEmails.has(email)) {
            return list;
        }

        seenEmails.add(email);
        const fallbackName = email.split('@')[0] || 'b�n';

        list.push({
            email,
            full_name: String(subscriber?.user_name || fallbackName).trim() || 'b�n'
        });

        return list;
    }, []);
}

// Tạo dữ liệu mã giảm giá announcement campaign.
function buildVoucherAnnouncementCampaign(voucher) {
    const baseUrl = String(process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const valueText = voucher.type === 'percentage'
        ? `Gi�m ${voucher.value}%${voucher.max_discount_amount ? `, t�i a ${formatCurrencyVnd(voucher.max_discount_amount)}` : ''}`
        : `Gi�m ${formatCurrencyVnd(voucher.value)}`;
    const minOrderText = Number(voucher.min_order_amount || 0) > 0
        ? `�n t�i thi�u ${formatCurrencyVnd(voucher.min_order_amount)}`
        : 'Kh�ng y�u c�u gi� tr� �n t�i thi�u';
    const scopeText = voucher.applicable_product_count > 0
        ? `�p d�ng cho ${voucher.applicable_product_count} s�n ph�m ��c ch�n`
        : '�p d�ng cho to�n b� s�n ph�m � i�u ki�n';
    const descriptionHtml = voucher.description
        ? `<p style="margin:0 0 18px;color:#65594d;line-height:1.7;">${escapeHtml(voucher.description)}</p>`
        : '';

    return {
        subject: `Voucher m�i t� WIND OF FALL: ${voucher.code}`,
        content: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #211d18;">
                <div style="text-align:center; margin-bottom: 24px;">
                    <h1 style="margin:0; font-size:28px; letter-spacing:0.04em;">WIND OF FALL</h1>
                    <p style="margin:8px 0 0; color:#7c6f60;">Th�ng b�o �u �i m�i d�nh cho {{name}}</p>
                </div>
                <div style="background: linear-gradient(135deg, #f8e3a2, #f4c95d); border-radius: 24px; padding: 28px; margin-bottom: 20px;">
                    <p style="margin:0 0 10px; font-size:13px; letter-spacing:0.14em; text-transform:uppercase; color:#7b5d1a;">Voucher m�i</p>
                    <h2 style="margin:0 0 14px; font-size:30px; color:#1f1a13;">${escapeHtml(voucher.code)}</h2>
                    <p style="margin:0; font-size:18px; font-weight:700; color:#402d05;">${escapeHtml(valueText)}</p>
                </div>
                ${descriptionHtml}
                <table style="width:100%; border-collapse:collapse; margin-bottom: 24px;">
                    <tr>
                        <td style="padding:10px 12px; border:1px solid #ead9b5; color:#7c6f60;">Ph�m vi</td>
                        <td style="padding:10px 12px; border:1px solid #ead9b5; font-weight:600;">${escapeHtml(scopeText)}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 12px; border:1px solid #ead9b5; color:#7c6f60;">i�u ki�n</td>
                        <td style="padding:10px 12px; border:1px solid #ead9b5; font-weight:600;">${escapeHtml(minOrderText)}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 12px; border:1px solid #ead9b5; color:#7c6f60;">Th�i gian �p d�ng</td>
                        <td style="padding:10px 12px; border:1px solid #ead9b5; font-weight:600;">${escapeHtml(formatDateTimeVi(voucher.start_date))} - ${escapeHtml(formatDateTimeVi(voucher.end_date))}</td>
                    </tr>
                </table>
                <div style="text-align:center;">
                    <a href="${baseUrl}" style="display:inline-block; padding:14px 28px; border-radius:999px; background:#17120c; color:#fff; text-decoration:none; font-weight:700;">Mua s�m ngay</a>
                </div>
            </div>
        `
    };
}

// Tạo dữ liệu khuyến mãi announcement campaign.
function buildSaleAnnouncementCampaign(sale) {
    const baseUrl = String(process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const valueText = sale.type === 'percentage'
        ? `Gi�m ${sale.value}%`
        : `Gi�m ${formatCurrencyVnd(sale.value)}`;
    const scopeText = sale.assigned_product_count > 0
        ? `ang �p d�ng cho ${sale.assigned_product_count} s�n ph�m`
        : 'Ch�a g�n s�n ph�m c� th�';
    const descriptionHtml = sale.description
        ? `<p style="margin:0 0 18px;color:#65594d;line-height:1.7;">${escapeHtml(sale.description)}</p>`
        : '';

    return {
        subject: `Khuy�n m�i m�i t� WIND OF FALL: ${sale.name}`,
        content: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #211d18;">
                <div style="text-align:center; margin-bottom: 24px;">
                    <h1 style="margin:0; font-size:28px; letter-spacing:0.04em;">WIND OF FALL</h1>
                    <p style="margin:8px 0 0; color:#7c6f60;">�u �i m�i d�nh cho {{name}}</p>
                </div>
                <div style="background: linear-gradient(135deg, #fde3b7, #f8b35b); border-radius: 24px; padding: 28px; margin-bottom: 20px;">
                    <p style="margin:0 0 10px; font-size:13px; letter-spacing:0.14em; text-transform:uppercase; color:#9a5412;">Ch��ng tr�nh khuy�n m�i</p>
                    <h2 style="margin:0 0 14px; font-size:30px; color:#1f1a13;">${escapeHtml(sale.name)}</h2>
                    <p style="margin:0; font-size:18px; font-weight:700; color:#6f2c12;">${escapeHtml(valueText)}</p>
                </div>
                ${descriptionHtml}
                <table style="width:100%; border-collapse:collapse; margin-bottom: 24px;">
                    <tr>
                        <td style="padding:10px 12px; border:1px solid #ead9b5; color:#7c6f60;">Ph�m vi</td>
                        <td style="padding:10px 12px; border:1px solid #ead9b5; font-weight:600;">${escapeHtml(scopeText)}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 12px; border:1px solid #ead9b5; color:#7c6f60;">Th�i gian �p d�ng</td>
                        <td style="padding:10px 12px; border:1px solid #ead9b5; font-weight:600;">${escapeHtml(formatDateTimeVi(sale.start_date))} - ${escapeHtml(formatDateTimeVi(sale.end_date))}</td>
                    </tr>
                </table>
                <div style="text-align:center;">
                    <a href="${baseUrl}" style="display:inline-block; padding:14px 28px; border-radius:999px; background:#17120c; color:#fff; text-decoration:none; font-weight:700;">Kh�m ph� b� s�u t�p</a>
                </div>
            </div>
        `
    };
}

// Gửi campaign vào subscribers.
async function sendCampaignToSubscribers(campaign) {
    const recipients = await getAnnouncementRecipients();
    if (recipients.length === 0) {
        return { total: 0, success: 0 };
    }

    return emailService.sendMarketingEmail(recipients, campaign);
}

// Gửi mã giảm giá announcement.
async function sendVoucherAnnouncement(voucher) {
    return sendCampaignToSubscribers(buildVoucherAnnouncementCampaign(voucher));
}

// Gửi khuyến mãi announcement.
async function sendSaleAnnouncement(sale) {
    return sendCampaignToSubscribers(buildSaleAnnouncementCampaign(sale));
}

// Lấy tổng quan analytics.
async function getDashboardAnalytics() {
    const [orderStatusRows, productRows, userRows] = await Promise.all([
        pool.query('SELECT status, COUNT(*) AS total FROM orders GROUP BY status'),
        pool.query(`
            SELECT
                SUM(CASE WHEN is_active = TRUE AND stock_quantity > 0 THEN 1 ELSE 0 END) AS live_products,
                SUM(CASE WHEN is_active = TRUE AND stock_quantity <= 0 THEN 1 ELSE 0 END) AS out_of_stock_products,
                SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) AS hidden_products
            FROM products
        `),
        pool.query('SELECT COUNT(*) AS total_users FROM users')
    ]);

    const orderStatusCounts = {
        pending_payment: 0,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipping: 0,
        delivered: 0,
        completed: 0,
        cancelled: 0
    };

    (orderStatusRows[0] || []).forEach((row) => {
        const status = Order.normalizeStatus(row.status);
        if (Object.prototype.hasOwnProperty.call(orderStatusCounts, status)) {
            orderStatusCounts[status] = Number(row.total || 0);
        }
    });

    const productStats = productRows[0]?.[0] || {};
    const productStatusCounts = {
        live: Number(productStats.live_products || 0),
        out_of_stock: Number(productStats.out_of_stock_products || 0),
        hidden: Number(productStats.hidden_products || 0)
    };

    return {
        orderStatusCounts,
        processingOrders: orderStatusCounts.pending_payment + orderStatusCounts.confirmed + orderStatusCounts.processing + orderStatusCounts.shipping,
        productStatusCounts,
        totalUsers: Number(userRows[0]?.[0]?.total_users || 0),
        totalProducts: productStatusCounts.live + productStatusCounts.out_of_stock + productStatusCounts.hidden
    };
}

// =============================================================================
// DASHBOARD - Trang t�ng quan
// =============================================================================

/**
 * Hi�n th� trang Dashboard (T�ng quan)
 *
 * @description L�y c�c th�ng k� t�ng quan v� �n h�ng, doanh thu
 *              v� danh s�ch �n h�ng g�n �y � hi�n th� tr�n dashboard
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} res - Response object t� Express
 *
 * @returns {void} Render trang admin/dashboard v�i d� li�u th�ng k�
 */
exports.getDashboard = async (req, res) => {
    try {
        const allowedRecentLimits = new Set([5, 10, 15]);
        const requestedRecentLimit = Number.parseInt(req.query.recent_limit, 10);
        const recentLimit = allowedRecentLimits.has(requestedRecentLimit) ? requestedRecentLimit : 10;
        let dashboardCharts = {
            orderStatus: {
                pending_payment: 0,
                pending: 0,
                processing: 0,
                delivered: 0,
                completed: 0,
                cancelled: 0
            },
            productStatus: {
                live: 0,
                out_of_stock: 0,
                hidden: 0
            }
        };

        // Kh�i t�o object th�ng k� v�i gi� tr� m�c �nh
        let stats = {
            total_orders: 0,        // T�ng s� �n h�ng
            pending_payment_orders: 0,
            pending_orders: 0,      // �n h�ng ch� x� l�
            delivered_orders: 0,    // �n h�ng � giao
            completed_orders: 0,    // �n h�ng � ho�n th�nh
            cancelled_orders: 0,    // �n h�ng � h�y
            total_revenue: 0,       // T�ng doanh thu
            today_revenue: 0,       // Doanh thu h�m nay
            month_revenue: 0        // Doanh thu th�ng n�y
        };
        let recentOrders = [];      // Danh s�ch �n h�ng g�n �y
        stats.total_users = 0;
        stats.total_products = 0;
        stats.processing_orders = 0;

        try {
            // L�y th�ng k� t� database
            const [orderStats, dashboardAnalytics, recentOrdersData] = await Promise.all([
                Order.getStatistics(),
                getDashboardAnalytics(),
                Order.findAll({ limit: 15, offset: 0 })
            ]);

            stats = {
                ...stats,
                ...(orderStats || {}),
                total_users: dashboardAnalytics.totalUsers,
                total_products: dashboardAnalytics.totalProducts,
                completed_orders: Number(orderStats?.completed_orders || 0),
                processing_orders: dashboardAnalytics.processingOrders
            };

            recentOrders = recentOrdersData || [];
            dashboardCharts = {
                orderStatus: {
                    pending_payment: dashboardAnalytics.orderStatusCounts.pending_payment,
                    pending: dashboardAnalytics.orderStatusCounts.pending,
                    processing: dashboardAnalytics.processingOrders,
                    delivered: dashboardAnalytics.orderStatusCounts.delivered,
                    completed: dashboardAnalytics.orderStatusCounts.completed,
                    cancelled: dashboardAnalytics.orderStatusCounts.cancelled
                },
                productStatus: dashboardAnalytics.productStatusCounts
            };
        } catch (err) {
            console.error('Dashboard data error:', err);
            // S� d�ng gi� tr� m�c �nh n�u l�i
        }

        // Render trang dashboard v�i d� li�u
        res.render('admin/dashboard', {
            stats,
            recentOrders,
            recentLimit,
            dashboardCharts,
            user: req.user,
            currentPage: 'dashboard'
        });
    } catch (error) {
        console.error('L�i trang qu�n tr�:', error);
        res.status(500).render('error', { message: 'L�i t�i dashboard: ' + error.message, user: req.user });
    }
};

// =============================================================================
// QU�N L� DANH M�C - Categories Management
// =============================================================================

exports.getCategories = async (req, res) => {
    try {
        const searchQuery = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const categories = await Category.findAllForAdmin(searchQuery ? { search: searchQuery } : {});
        const parentCategories = await Category.findRootCategories();

        // Compute stats from loaded categories
        const totalProducts = categories.reduce((sum, c) => sum + (c.product_count || 0), 0);
        const rootCount = categories.filter(c => !c.parent_id).length;
        const childCount = categories.filter(c => !!c.parent_id).length;
        const categoryStats = {
            total: categories.length,
            root: rootCount,
            children: childCount,
            assignedProducts: totalProducts
        };

        res.render('admin/categories', {
            categories,
            parentCategories,
            categoryStats,
            searchQuery,
            notice: typeof req.query.notice === 'string' ? req.query.notice : '',
            noticeType: typeof req.query.notice_type === 'string' ? req.query.notice_type : 'success',
            user: req.user,
            currentPage: 'categories'
        });
    } catch (error) {
        res.status(500).render('error', { message: 'L�i t�i danh m�c: ' + error.message, user: req.user });
    }
};

// Tạo danh mục.
exports.createCategory = async (req, res) => {
    try {
        const { name, description, parent_id, image_url, display_order } = req.body;
        const uploadedImageUrl = req.file?.cloudinaryUrl || null;
        let slug = req.body.slug;
        if (!slug || slug.trim() === '') {
            slug = name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\u0111/g, 'd')
                .replace(/\u0110/g, 'D')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }
        await Category.create({
            name,
            slug,
            description,
            parent_id: parent_id || null,
            image_url: uploadedImageUrl || image_url || null,
            display_order: parseInt(display_order) || 0
        });
        res.redirect('/admin/categories');
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Xử lý download danh mục import template.
exports.downloadCategoryImportTemplate = async (req, res) => {
    try {
        const buffer = createCategoryImportTemplateBuffer();
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="windoffall-category-import-template.xlsx"'
        );
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xuất danh mục.
exports.exportCategories = async (req, res) => {
    try {
        const buffer = await exportCategoriesToWorkbookBuffer({
            search: typeof req.query.search === 'string' ? req.query.search.trim() : ''
        });
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="windoffall-categories.xlsx"'
        );
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Nhập danh mục.
exports.importCategories = async (req, res) => {
    try {
        const workbookPath = req.file?.path;

        if (!workbookPath) {
            return res.redirect(buildAdminNoticeRedirect(
                '/admin/categories',
                'Vui l�ng t�i l�n file Excel danh m�c.',
                'error'
            ));
        }

        const result = await importCategoriesFromWorkbook({ workbookPath });
        const noticeMessage = result.failedCount > 0
            ? `� import ${result.createdCount} danh m�c m�i, c�p nh�t ${result.updatedCount} danh m�c, l�i ${result.failedCount} d�ng.`
            : `� import ${result.createdCount} danh m�c m�i v� c�p nh�t ${result.updatedCount} danh m�c.`;

        return res.redirect(buildAdminNoticeRedirect(
            '/admin/categories',
            noticeMessage,
            result.failedCount > 0 ? 'warning' : 'success'
        ));
    } catch (error) {
        return res.redirect(buildAdminNoticeRedirect(
            '/admin/categories',
            error.message || 'Kh�ng th� import danh m�c.',
            'error'
        ));
    } finally {
        cleanupImportUploadFiles(req.file ? [req.file] : []);
    }
};

// Cập nhật danh mục.
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await Category.findByIdAny(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Danh m�c kh�ng t�n t�i' });
        }
        const { name, slug, description, parent_id, image_url, display_order } = req.body;
        const uploadedImageUrl = req.file?.cloudinaryUrl || null;
        if (parent_id && await Category.createsCircularReference(id, parent_id)) {
            return res.status(400).json({ success: false, message: 'Kh�ng th� t�o v�ng l�p danh m�c cha-con' });
        }
        await Category.update(id, {
            name: name || existing.name,
            slug: slug || existing.slug,
            description: description !== undefined ? description : existing.description,
            parent_id: parent_id !== undefined ? (parent_id || null) : existing.parent_id,
            image_url: uploadedImageUrl || (image_url !== undefined ? (image_url || null) : existing.image_url),
            display_order: display_order !== undefined ? (parseInt(display_order) || 0) : existing.display_order
        });
        res.json({ success: true, message: 'C�p nh�t danh m�c th�nh c�ng' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Xóa danh mục.
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const stats = await Category.getUsageStats(id);
        if (stats.product_count > 0 || stats.child_count > 0) {
            return res.status(400).json({
                success: false,
                message: `Kh�ng th� x�a: danh m�c ang c� ${stats.product_count} s�n ph�m v� ${stats.child_count} danh m�c con`
            });
        }
        await Category.delete(id);
        res.json({ success: true, message: '� x�a danh m�c' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Xóa tất cả danh mục.
exports.deleteAllCategories = async (req, res) => {
    try {
        const result = await Category.deleteAllPermanently();

        res.json({
            success: true,
            deletedCount: result.deletedCategories,
            blockedCount: result.blockedCategories,
            deletedProducts: result.deletedProducts,
            message: result.totalCategories === 0
                ? 'Kh�ng c� danh m�c n�o trong database � x�a.'
                : result.blockedCategories > 0
                    ? `� x�a v)nh vi�n ${result.deletedCategories} danh m�c v� ${result.deletedProducts} s�n ph�m li�n quan. C�n ${result.blockedCategories} danh m�c kh�ng th� x�a v� s�n ph�m c�a ch�ng � n�m trong l�ch s� �n h�ng.`
                    : `� x�a v)nh vi�n ${result.deletedCategories} danh m�c kh�i database.`
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// =============================================================================
// QU�N L� S�N PH�M - Products Management
// =============================================================================

/**
 * Hi�n th� danh s�ch s�n ph�m
 *
 * @description L�y danh s�ch t�t c� s�n ph�m v� danh m�c
 *              � hi�n th� tr�n trang qu�n l� s�n ph�m
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} res - Response object t� Express
 *
 * @returns {void} Render trang admin/products v�i danh s�ch s�n ph�m
 */
exports.getProducts = async (req, res) => {
    try {
        let products = [];
        let categories = [];
        let totalItems = 0;
        let totalProductCount = 0;
        const bulkImportResult = req.session?.adminProductImportResult || null;

        if (req.session?.adminProductImportResult) {
            delete req.session.adminProductImportResult;
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const searchQuery = typeof req.query.search === 'string' ? req.query.search.trim() : '';

        try {
            const productFilters = {
                limit,
                offset,
                ...(searchQuery ? { search: searchQuery } : {})
            };

            products = await Product.findAll(productFilters);
            categories = await Category.findAll();
            totalItems = await Product.count(productFilters);
            totalProductCount = await Product.countAllRecords();
        } catch (err) {
            console.error('Products data error:', err);
        }

        const totalPages = Math.ceil(totalItems / limit);

        res.render('admin/products', {
            products,
            categories,
            user: req.user,
            currentPage: 'products',
            searchQuery,
            pagination: { totalItems, totalPages, currentPage: page, limit, searchQuery },
            bulkImportResult,
            totalProductCount
        });
    } catch (error) {
        res.status(500).render('error', { message: 'L�i t�i s�n ph�m: ' + error.message, user: req.user });
    }
};

// Xử lý download sản phẩm import template.
exports.downloadProductImportTemplate = async (req, res) => {
    try {
        const workbookBuffer = createProductImportTemplateBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="wind-of-fall-product-import-template.xlsx"');
        res.send(workbookBuffer);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xuất sản phẩm.
exports.exportProducts = async (req, res) => {
    try {
        const workbookBuffer = await exportProductsToWorkbookBuffer({
            search: typeof req.query.search === 'string' ? req.query.search.trim() : ''
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="wind-of-fall-products-export.xlsx"');
        res.send(workbookBuffer);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Nhập sản phẩm.
exports.importProducts = async (req, res) => {
    try {
        req.session = req.session || {};
        const workbookFile = req.files?.import_file?.[0] || null;
        const zipFile = req.files?.images_zip?.[0] || null;

        if (!workbookFile) {
            req.session.adminProductImportResult = {
                totalProducts: 0,
                createdCount: 0,
                failedCount: 0,
                createdProducts: [],
                errors: [{ message: 'Vui l�ng t�i l�n file Excel (.xlsx ho�c .xls).' }]
            };
            return res.redirect('/admin/products');
        }

        const result = await importProductsFromWorkbook({
            workbookPath: workbookFile.path,
            zipPath: zipFile?.path || null
        });

        req.session.adminProductImportResult = result;
        res.redirect(buildAdminNoticeRedirect(
            '/admin/products',
            result.failedCount > 0
                ? `Da import ${result.createdCount}/${result.totalProducts} san pham. Co ${result.failedCount} dong bi loi.`
                : `Da import thanh cong ${result.createdCount} san pham.`,
            result.failedCount > 0 ? 'warning' : 'success'
        ));
    } catch (error) {
        req.session.adminProductImportResult = {
            totalProducts: 0,
            createdCount: 0,
            failedCount: 0,
            createdProducts: [],
            errors: [{ message: error.message || 'Khong the import san pham tu file Excel.' }]
        };
        res.redirect(buildAdminNoticeRedirect('/admin/products', 'Import san pham that bai.', 'error'));
    } finally {
        cleanupImportUploadFiles(req.files);
    }
};

/**
 * T�o s�n ph�m m�i
 *
 * @description Nh�n d� li�u t� form t�o s�n ph�m, t� �ng t�o slug n�u kh�ng c�,
 *              l�u s�n ph�m v�o database v� x� l� upload �nh
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} req.body - D� li�u s�n ph�m t� form
 * @param {number} req.body.category_id - ID danh m�c
 * @param {string} req.body.name - T�n s�n ph�m
 * @param {string} [req.body.slug] - Slug URL (t� �ng t�o n�u kh�ng c�)
 * @param {string} req.body.description - M� t� s�n ph�m
 * @param {number} req.body.price - Gi� s�n ph�m
 * @param {number} req.body.stock_quantity - S� l��ng t�n kho
 * @param {string} req.body.sku - M� SKU
 * @param {number} [req.body.sale_id] - ID ch��ng tr�nh khuy�n m�i
 * @param {string} [req.body.is_featured] - S�n ph�m n�i b�t ('on' = true)
 * @param {Array} [req.files] - Danh s�ch file �nh upload
 * @param {Object} res - Response object t� Express
 *
 * @returns {Redirect} Redirect v� trang danh s�ch s�n ph�m
 */
exports.createProduct = async (req, res) => {
    try {
        const { category_id, name, description, price, stock_quantity, sku, sale_id, is_featured } = req.body;
        let { slug } = req.body;
        const parsedVariants = parseVariantsPayload(req.body.variants);
        validateVariants(parsedVariants);

        if (!slug || slug.trim() === '') {
            slug = name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\u0111/g, 'd')
                .replace(/\u0110/g, 'D')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
                + '-' + Date.now();
        }

        const product = await Product.create({
            category_id: parseInt(category_id, 10),
            name,
            slug,
            description,
            price: parseFloat(price),
            stock_quantity: parseInt(stock_quantity, 10) || 0,
            sku,
            sale_id: sale_id || null,
            is_featured: is_featured === 'on'
        });

        const imageKeyMap = await attachUploadedImagesToProduct(product.id, req.files);
        const productImages = await Product.getImages(product.id);

        if (productImages.length === 0) {
            await Product.addImage(
                product.id,
                'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
                true,
                0
            );
        }

        await syncVariants(product.id, parsedVariants, imageKeyMap);

        scheduleProductVisualEmbeddingSync(product.id);

        res.redirect('/admin/products');
    } catch (error) {
        console.error('Create product error:', error);
        res.redirect('/admin/products?error=' + encodeURIComponent(error.message));
    }
};

/**
 * C�p nh�t th�ng tin s�n ph�m
 *
 * @description Nh�n d� li�u c�p nh�t t� form v� l�u v�o database
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} req.params - Tham s� URL
 * @param {number} req.params.id - ID s�n ph�m c�n c�p nh�t
 * @param {Object} req.body - D� li�u c�p nh�t
 * @param {Object} res - Response object t� Express
 *
 * @returns {Redirect} Redirect v� trang danh s�ch s�n ph�m
 */
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, name, description, price, stock_quantity } = req.body;
        const parsedVariants = req.body.variants !== undefined ? parseVariantsPayload(req.body.variants) : null;

        if (parsedVariants !== null) {
            validateVariants(parsedVariants);
        }

        const currentProduct = await Product.findById(id);
        if (!currentProduct) {
            return res.status(404).json({ success: false, message: 'S�n ph�m kh�ng t�n t�i' });
        }

        await Product.update(id, {
            category_id: category_id || currentProduct.category_id,
            name: name || currentProduct.name,
            slug: req.body.slug || currentProduct.slug,
            description: description !== undefined ? description : currentProduct.description,
            price: price ? parseFloat(price) : currentProduct.price,
            stock_quantity: stock_quantity !== undefined ? (parseInt(stock_quantity, 10) || 0) : currentProduct.stock_quantity,
            sku: req.body.sku !== undefined ? (req.body.sku || null) : (currentProduct.sku || null),
            sale_id: req.body.sale_id !== undefined ? (req.body.sale_id || null) : (currentProduct.sale_id || null),
            is_featured: req.body.is_featured !== undefined ? (req.body.is_featured === 'on' || req.body.is_featured === true) : currentProduct.is_featured
        });

        const imageKeyMap = await attachUploadedImagesToProduct(id, req.files);

        if (parsedVariants !== null) {
            await syncVariants(id, parsedVariants, imageKeyMap);
        }

        scheduleProductVisualEmbeddingSync(id);

        res.json({ success: true, message: 'C�p nh�t s�n ph�m th�nh c�ng' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * X�a s�n ph�m
 *
 * @description X�a s�n ph�m kh�i database d�a tr�n ID
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} req.params - Tham s� URL
 * @param {number} req.params.id - ID s�n ph�m c�n x�a
 * @param {Object} res - Response object t� Express
 *
 * @returns {JSON} Tr� v� JSON v�i th�ng b�o th�nh c�ng/th�t b�i
 */
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        // X�a s�n ph�m (s� cascade x�a c� �nh li�n quan)
        await Product.delete(id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Xóa tất cả sản phẩm.
exports.deleteAllProducts = async (req, res) => {
    try {
        const result = await Product.deleteAllPermanently();
        res.json({
            success: true,
            deletedCount: result.deletedProducts,
            blockedCount: result.blockedProducts,
            message: result.totalProducts === 0
                ? 'Kh�ng c� s�n ph�m n�o trong database � x�a.'
                : result.blockedProducts > 0
                    ? `� x�a v)nh vi�n ${result.deletedProducts} s�n ph�m. C�n ${result.blockedProducts} s�n ph�m kh�ng th� x�a v� � n�m trong l�ch s� �n h�ng.`
                    : `� x�a v)nh vi�n ${result.deletedProducts} s�n ph�m kh�i database.`
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// =============================================================================
// QU�N L� �N H�NG - Orders Management
// =============================================================================

/**
 * Hi�n th� danh s�ch �n h�ng
 *
 * @description L�y danh s�ch t�t c� �n h�ng � hi�n th� tr�n trang qu�n l�
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} res - Response object t� Express
 *
 * @returns {void} Render trang admin/orders v�i danh s�ch �n h�ng
 */
exports.getOrders = async (req, res) => {
    try {
        let orders = [];
        const searchQuery = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        try {
            // L�y 50 �n h�ng g�n nh�t
            orders = await Order.findAll({
                limit: 50,
                offset: 0,
                ...(searchQuery ? { search: searchQuery } : {})
            });
        } catch (err) {
            console.error('Orders data error:', err);
        }

        // Render trang qu�n l� �n h�ng
        res.render('admin/orders', {
            orders,
            searchQuery,
            user: req.user,
            currentPage: 'orders'
        });
    } catch (error) {
        res.status(500).render('error', { message: 'L�i t�i �n h�ng: ' + error.message, user: req.user });
    }
};

/**
 * Hi�n th� chi ti�t �n h�ng
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} res - Response object t� Express
 */
exports.getOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);

        res.render('admin/order-detail', {
            order,
            user: req.user,
            currentPage: 'orders'
        });
    } catch (error) {
        res.status(500).render('error', { message: 'L�i t�i �n h�ng: ' + error.message, user: req.user });
    }
};


// =============================================================================
// QU�N L� NG��I D�NG - Users Management
// =============================================================================

/**
 * Hi�n th� danh s�ch ng��i d�ng
 *
 * @description L�y danh s�ch t�t c� ng��i d�ng � ng k�
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} res - Response object t� Express
 *
 * @returns {void} Render trang admin/users v�i danh s�ch ng��i d�ng
 */
exports.getUsers = async (req, res) => {
    try {
        let users = [];
        let totalItems = 0;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        try {
            users = await User.findAll({ limit, offset });
            // �m t�ng ng��i d�ng
            const pool = require('../../config/database');
            const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM users');
            totalItems = countResult[0].total;
        } catch (err) {
            console.error('Users data error:', err);
        }

        const totalPages = Math.ceil(totalItems / limit);

        res.render('admin/users', {
            users,
            user: req.user,
            currentPage: 'users',
            pagination: { totalItems, totalPages, currentPage: page, limit }
        });
    } catch (error) {
        res.status(500).render('error', { message: 'L�i t�i ng��i d�ng: ' + error.message, user: req.user });
    }
};

/**
 * Xem chi ti�t ng��i d�ng (API JSON)
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} res - Response object t� Express
 */
exports.getUserDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = require('../../config/database');

        // L�y user info (bao g�m c� b� kh�a)
        const [users] = await pool.execute(
            'SELECT id, email, full_name, phone, avatar_url, birthday, role, email_verified, marketing_consent, is_active, created_at FROM users WHERE id = ?',
            [id]
        );
        const userData = users[0];
        if (!userData) {
            return res.status(404).json({ success: false, message: 'Kh�ng t�m th�y ng��i d�ng' });
        }

        // L�y �a ch�
        const [addresses] = await pool.execute(
            'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC',
            [id]
        );
        userData.addresses = addresses;

        // L�y 5 �n h�ng g�n nh�t
        const [orders] = await pool.execute(
            'SELECT id, order_code, total_amount, final_amount, status, payment_status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
            [id]
        );
        userData.recent_orders = orders;

        res.json({ success: true, user: userData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * C�p nh�t tr�ng th�i ng��i d�ng (Kh�a/M� kh�a)
 *
 * @description Kh�a ho�c m� kh�a t�i kho�n ng��i d�ng
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} req.params.id - ID ng��i d�ng
 * @param {Object} req.body.is_active - Tr�ng th�i m�i ('true' ho�c 'false')
 * @param {Object} res - Response object t� Express
 *
 * @returns {JSON} Tr� v� JSON v�i th�ng b�o th�nh c�ng/th�t b�i
 */
exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        // C�p nh�t tr�ng th�i (chuy�n string 'true'/'false' th�nh boolean)
        await User.updateStatus(id, is_active === 'true');
        res.json({ message: 'User status updated successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// =============================================================================
// QU�N L� BANNER - Banners Management
// =============================================================================

/**
 * Hi�n th� danh s�ch banner
 *
 * @description L�y danh s�ch t�t c� banner qu�ng c�o
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} res - Response object t� Express
 *
 * @returns {void} Render trang admin/banners v�i danh s�ch banner
 */
exports.getBanners = async (req, res) => {
    try {
        let banners = [];
        try {
            banners = await Banner.findAll();
        } catch (err) {
            console.error('Banners data error:', err);
        }

        // Render trang qu�n l� banner
        res.render('admin/banners', {
            banners,
            user: req.user,
            currentPage: 'banners'
        });
    } catch (error) {
        res.status(500).render('error', { message: 'L�i t�i banners: ' + error.message, user: req.user });
    }
};

/**
 * T�o banner m�i
 *
 * @description T�o banner qu�ng c�o m�i v�i �nh upload ho�c URL
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} req.body - D� li�u banner
 * @param {string} req.body.title - Ti�u � banner
 * @param {string} req.body.subtitle - Ti�u � ph�
 * @param {string} req.body.description - M� t�
 * @param {string} req.body.link_url - URL khi click v�o banner
 * @param {string} req.body.button_text - Text n�t CTA
 * @param {number} req.body.display_order - Th� t� hi�n th�
 * @param {string} [req.body.start_date] - Ng�y b�t �u hi�n th�
 * @param {string} [req.body.end_date] - Ng�y k�t th�c hi�n th�
 * @param {Object} [req.file] - File �nh upload
 * @param {Object} res - Response object t� Express
 *
 * @returns {Redirect} Redirect v� trang danh s�ch banner
 */
exports.createBanner = async (req, res) => {
    try {
        // L�y d� li�u t� form
        const { title, subtitle, description, link_url, button_text, display_order, start_date, end_date } = req.body;

        // X� l� �nh upload (�u ti�n URL Cloudinary)
        let image_url = '';
        if (req.file) {
            image_url = req.file.cloudinaryUrl || `/uploads/${req.file.filename}`;
        }

        // T�o banner trong database
        await Banner.create({
            title,
            subtitle,
            description,
            image_url,
            link_url,
            button_text,
            display_order: parseInt(display_order) || 0,
            start_date: start_date || null,
            end_date: end_date || null
        });

        // Redirect v� trang danh s�ch
        res.redirect('/admin/banners');
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * X�a banner
 *
 * @description X�a banner kh�i database
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} req.params.id - ID banner c�n x�a
 * @param {Object} res - Response object t� Express
 *
 * @returns {JSON} Tr� v� JSON v�i th�ng b�o th�nh c�ng/th�t b�i
 */
exports.deleteBanner = async (req, res) => {
    try {
        const pool = require('../../config/database');
        // X�a banner t� database
        await pool.execute('DELETE FROM banners WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Banner deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// =============================================================================
// QU�N L� KHUY�N M�I - Sales Management
// =============================================================================

/**
 * Hi�n th� danh s�ch khuy�n m�i
 *
 * @description L�y danh s�ch t�t c� ch��ng tr�nh khuy�n m�i
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} res - Response object t� Express
 *
 * @returns {void} Render trang admin/sales v�i danh s�ch khuy�n m�i
 */
exports.getSales = async (req, res) => {
    try {
        let sales = [];
        let products = [];
        let subscriberCount = 0;
        const searchQuery = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        try {
            const [salesData, productsData, totalSubscribers] = await Promise.all([
                Sale.findAll(searchQuery ? { search: searchQuery } : {}),
                Product.findAll({ limit: ADMIN_PRODUCT_SELECTION_LIMIT, offset: 0, sort_by: 'name', sort_order: 'ASC' }),
                Newsletter.countActive()
            ]);
            sales = await attachSaleAssignments(salesData, productsData.length);
            products = productsData;
            subscriberCount = totalSubscribers;
        } catch (err) {
            console.error('Sales data error:', err);
        }

        // Render trang qu�n l� khuy�n m�i
        res.render('admin/sales', {
            sales,
            products,
            subscriberCount,
            searchQuery,
            user: req.user,
            currentPage: 'sales'
        });
    } catch (error) {
        res.status(500).render('error', { message: 'L�i t�i khuy�n m�i: ' + error.message, user: req.user });
    }
};

/**
 * T�o ch��ng tr�nh khuy�n m�i m�i
 *
 * @description T�o khuy�n m�i m�i v�i lo�i gi�m gi� (% ho�c s� ti�n c� �nh)
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} req.body - D� li�u khuy�n m�i
 * @param {string} req.body.name - T�n ch��ng tr�nh
 * @param {string} req.body.description - M� t�
 * @param {string} req.body.type - Lo�i gi�m gi� ('percentage' ho�c 'fixed')
 * @param {number} req.body.value - Gi� tr� gi�m (% ho�c s� ti�n)
 * @param {string} req.body.start_date - Ng�y b�t �u
 * @param {string} req.body.end_date - Ng�y k�t th�c
 * @param {Object} res - Response object t� Express
 *
 * @returns {Redirect} Redirect v� trang danh s�ch khuy�n m�i
 */
exports.createSale = async (req, res) => {
    try {
        const { name, description, type, value, start_date, end_date } = req.body;
        const productIds = parseSelectedProductIds(req.body);
        const shouldNotifySubscribers = parseChecked(req.body.notify_subscribers);
        const normalizedValue = normalizeDiscountValueOrThrow(type, value, 'Gi� tr� khuy�n m�i');
        assertDateRangeValid(start_date, end_date, 'Th�i gian khuy�n m�i');

        // T�o khuy�n m�i trong database
        const sale = await Sale.create({
            name,
            description,
            type,
            value: normalizedValue,
            start_date,
            end_date
        });

        await Sale.assignProducts(sale.id, productIds);

        if (shouldNotifySubscribers) {
            const [createdSale] = await attachSaleAssignments([await Sale.findById(sale.id)]);
            const result = await sendSaleAnnouncement(createdSale);

            if (result.total === 0) {
                return res.redirect(buildAdminNoticeRedirect('/admin/sales', '� t�o khuy�n m�i nh�ng hi�n ch�a c� ng��i ng k� nh�n th�ng b�o.', 'warning'));
            }

            if (result.success === result.total) {
                return res.redirect(buildAdminNoticeRedirect('/admin/sales', `� t�o khuy�n m�i v� g�i email th�nh c�ng t�i ${result.success} ng��i ng k�.`));
            }

            if (result.success > 0) {
                return res.redirect(buildAdminNoticeRedirect('/admin/sales', `� t�o khuy�n m�i v� g�i email t�i ${result.success}/${result.total} ng��i ng k�.`, 'warning'));
            }

            return res.redirect(buildAdminNoticeRedirect('/admin/sales', '� t�o khuy�n m�i nh�ng ch�a g�i email th�nh c�ng. Vui l�ng ki�m tra c�u h�nh email.', 'error'));
        }

        // Redirect v� trang danh s�ch
        res.redirect(buildAdminNoticeRedirect('/admin/sales', '� t�o khuy�n m�i th�nh c�ng.'));
    } catch (error) {
        res.redirect(buildAdminNoticeRedirect('/admin/sales', error.message || 'Kh�ng th� t�o khuy�n m�i.', 'error'));
    }
};

/**
 * C�p nh�t ch��ng tr�nh khuy�n m�i
 */
exports.updateSale = async (req, res) => {
    try {
        const { id } = req.params;
        const existingSale = await Sale.findById(id);

        if (!existingSale) {
            return res.status(404).json({ success: false, message: 'Khuy�n m�i kh�ng t�n t�i' });
        }

        const { name, description, type, value, start_date, end_date, is_active } = req.body;
        const productIds = parseSelectedProductIds(req.body);
        const normalizedValue = normalizeDiscountValueOrThrow(type, value, 'Gi� tr� khuy�n m�i');
        assertDateRangeValid(start_date, end_date, 'Th�i gian khuy�n m�i');

        await Sale.update(id, {
            name,
            description,
            type,
            value: normalizedValue,
            start_date: start_date || null,
            end_date: end_date || null,
            is_active: is_active === 'on' || is_active === true || is_active === 'true'
        });

        await Sale.assignProducts(id, productIds);

        res.json({ success: true, message: 'C�p nh�t khuy�n m�i th�nh c�ng' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * Ng�ng v� g� �p d�ng khuy�n m�i kh�i s�n ph�m
 */
exports.deleteSale = async (req, res) => {
    try {
        const { id } = req.params;
        const existingSale = await Sale.findById(id);

        if (!existingSale) {
            return res.status(404).json({ success: false, message: 'Khuy�n m�i kh�ng t�n t�i' });
        }

        await Sale.clearAssignedProducts(id);
        await Sale.delete(id);

        res.json({ success: true, message: '� ng�ng khuy�n m�i' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Gửi khuyến mãi announcement email.
exports.sendSaleAnnouncementEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const existingSale = await Sale.findById(id);

        if (!existingSale) {
            return res.status(404).json({ success: false, message: 'Khuy�n m�i kh�ng t�n t�i', toastType: 'error' });
        }

        const [sale] = await attachSaleAssignments([existingSale]);
        const result = await sendSaleAnnouncement(sale);

        if (result.total === 0) {
            return res.json({
                success: true,
                toastType: 'warning',
                message: 'Hi�n ch�a c� ng��i d�ng n�o ng k� nh�n th�ng b�o.'
            });
        }

        if (result.success === result.total) {
            return res.json({
                success: true,
                toastType: 'success',
                message: `� g�i email th�ng b�o khuy�n m�i t�i ${result.success} ng��i ng k�.`
            });
        }

        if (result.success > 0) {
            return res.json({
                success: true,
                toastType: 'warning',
                message: `� g�i email t�i ${result.success}/${result.total} ng��i ng k�.`
            });
        }

        return res.status(500).json({
            success: false,
            toastType: 'error',
            message: 'Kh�ng g�i ��c email th�ng b�o. Vui l�ng ki�m tra c�u h�nh email.'
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message, toastType: 'error' });
    }
};

// =============================================================================
// EMAIL MARKETING
// =============================================================================

/**
 * G�i email marketing h�ng lo�t
 *
 * @description G�i email qu�ng c�o �n t�t c� ng��i d�ng � �ng � nh�n marketing
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} req.body - N�i dung email
 * @param {string} req.body.subject - Ti�u � email
 * @param {string} req.body.content - N�i dung email (HTML)
 * @param {Object} res - Response object t� Express
 *
 * @returns {JSON} Tr� v� JSON v�i s� l��ng email � g�i th�nh c�ng
 */
exports.sendMarketingEmail = async (req, res) => {
    try {
        const { subject, content } = req.body;

        // L�y danh s�ch ng��i d�ng � �ng � nh�n email marketing
        const users = await User.getMarketingList();

        // G�i email h�ng lo�t
        const result = await emailService.sendMarketingEmail(users, {
            subject,
            content
        });

        // Tr� v� k�t qu�
        res.json({
            message: `Email sent to ${result.success}/${result.total} users`
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// =============================================================================
// QU�N L� �NH S�N PH�M - Product Images Management
// =============================================================================

/**
 * L�y danh s�ch �nh c�a s�n ph�m
 *
 * @description L�y t�t c� �nh c�a m�t s�n ph�m, s�p x�p �nh ch�nh l�n �u
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} req.params.id - ID s�n ph�m
 * @param {Object} res - Response object t� Express
 *
 * @returns {JSON} Tr� v� JSON v�i danh s�ch �nh: { images: [...] }
 */
exports.getProductImages = async (req, res) => {
    try {
        const images = await Product.getImages(req.params.id);
        res.json({ images });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Th�m �nh s�n ph�m b�ng URL
 *
 * @description Th�m �nh m�i cho s�n ph�m b�ng c�ch nh�p URL �nh
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} req.params.id - ID s�n ph�m
 * @param {Object} req.body.image_url - URL c�a �nh
 * @param {boolean} [req.body.is_primary] - �t l�m �nh ch�nh
 * @param {Object} res - Response object t� Express
 *
 * @returns {JSON} Tr� v� JSON v�i th�ng b�o th�nh c�ng/th�t b�i
 */
exports.addProductImageUrl = async (req, res) => {
    try {
        const pool = require('../../config/database');
        const { image_url, is_primary } = req.body;
        const productId = req.params.id;

        // N�u �t l�m �nh ch�nh, b� flag is_primary c�a c�c �nh kh�c
        if (is_primary) {
            await pool.execute(
                'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
                [productId]
            );
        }

        // Th�m �nh m�i v�o database
        await pool.execute(
            'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
            [productId, image_url, is_primary || false]
        );

        scheduleProductVisualEmbeddingSync(productId);

        res.json({ success: true, message: 'Image added' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * Upload �nh s�n ph�m
 *
 * @description Upload file �nh t� m�y t�nh v� l�u v�o server
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} req.params.id - ID s�n ph�m
 * @param {Object} req.file - File �nh upload (t� multer)
 * @param {string} req.body.is_primary - �t l�m �nh ch�nh ('true'/'false')
 * @param {Object} res - Response object t� Express
 *
 * @returns {JSON} Tr� v� JSON v�i th�ng b�o th�nh c�ng/th�t b�i
 */
exports.uploadProductImage = async (req, res) => {
    try {
        const productId = req.params.id;
        const isPrimary = req.body.is_primary === 'true';
        const files = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);

        if (files.length === 0) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const existingImages = await Product.getImages(productId);
        let displayOrder = existingImages.length;

        for (let index = 0; index < files.length; index += 1) {
            const file = files[index];
            const imageUrl = file.cloudinaryUrl || '/uploads/' + file.filename;
            const shouldSetPrimary = (isPrimary && index === 0) || (!isPrimary && existingImages.length === 0 && index === 0);
            await Product.addImage(productId, imageUrl, shouldSetPrimary, displayOrder);
            displayOrder += 1;
        }

        scheduleProductVisualEmbeddingSync(productId);

        res.json({
            success: true,
            message: files.length > 1 ? `� t�i l�n ${files.length} �nh` : '� t�i l�n �nh'
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * X�a �nh s�n ph�m
 *
 * @description X�a m�t �nh kh�i s�n ph�m
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} req.params.imageId - ID c�a �nh c�n x�a
 * @param {Object} res - Response object t� Express
 *
 * @returns {JSON} Tr� v� JSON v�i th�ng b�o th�nh c�ng/th�t b�i
 */
exports.deleteProductImage = async (req, res) => {
    try {
        const pool = require('../../config/database');
        const [rows] = await pool.execute(
            'SELECT product_id, is_primary FROM product_images WHERE id = ? LIMIT 1',
            [req.params.imageId]
        );
        const row = rows[0];
        await pool.execute('DELETE FROM product_images WHERE id = ?', [req.params.imageId]);
        if (row?.is_primary) {
            await ProductImageEmbedding.deleteByProductId(row.product_id);
        }
        if (row?.product_id) {
            scheduleProductVisualEmbeddingSync(row.product_id);
        }
        res.json({ success: true, message: 'Image deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * �t �nh l�m �nh ch�nh
 *
 * @description �t m�t �nh l�m �nh ch�nh (primary) c�a s�n ph�m.
 *              B� flag is_primary c�a c�c �nh kh�c c�ng s�n ph�m
 *
 * @param {Object} req - Request object t� Express
 * @param {Object} req.params.imageId - ID c�a �nh c�n �t l�m ch�nh
 * @param {Object} res - Response object t� Express
 *
 * @returns {JSON} Tr� v� JSON v�i th�ng b�o th�nh c�ng/th�t b�i
 */
exports.setPrimaryImage = async (req, res) => {
    try {
        const pool = require('../../config/database');
        const imageId = req.params.imageId;

        // L�y product_id t� �nh n�y
        const [image] = await pool.execute(
            'SELECT product_id FROM product_images WHERE id = ?',
            [imageId]
        );

        // Ki�m tra �nh c� t�n t�i kh�ng
        if (image.length === 0) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const productId = image[0].product_id;

        // B� flag is_primary c�a t�t c� �nh c�ng s�n ph�m
        await pool.execute(
            'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
            [productId]
        );

        // �t �nh n�y l�m �nh ch�nh
        await pool.execute(
            'UPDATE product_images SET is_primary = TRUE WHERE id = ?',
            [imageId]
        );

        scheduleProductVisualEmbeddingSync(productId);

        res.json({ success: true, message: 'Primary image set' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// =============================================================================
// QU�N L� VOUCHER - Vouchers Management
// =============================================================================

/**
 * Hi�n th� danh s�ch voucher
 */
exports.getVouchers = async (req, res) => {
    try {
        let vouchers = [];
        let products = [];
        let subscriberCount = 0;
        const searchQuery = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        try {
            const [voucherData, productsData, totalSubscribers] = await Promise.all([
                Voucher.findAll(searchQuery ? { search: searchQuery } : {}),
                Product.findAll({ limit: ADMIN_PRODUCT_SELECTION_LIMIT, offset: 0, sort_by: 'name', sort_order: 'ASC' }),
                Newsletter.countActive()
            ]);
            vouchers = await attachVoucherAssignments(voucherData);
            products = productsData;
            subscriberCount = totalSubscribers;
        } catch (err) {
            console.error('Vouchers data error:', err);
        }

        res.render('admin/vouchers', {
            vouchers,
            products,
            subscriberCount,
            searchQuery,
            user: req.user,
            currentPage: 'vouchers'
        });
    } catch (error) {
        res.status(500).render('error', { message: 'L�i t�i vouchers: ' + error.message, user: req.user });
    }
};

/**
 * T�o voucher m�i
 */
exports.createVoucher = async (req, res) => {
    try {
        const {
            code, name, description, type, value,
            min_order_amount, max_discount_amount, usage_limit,
            user_limit, start_date, end_date, is_active
        } = req.body;
        const productIds = parseSelectedProductIds(req.body);
        const shouldNotifySubscribers = parseChecked(req.body.notify_subscribers);
        const normalizedValue = normalizeDiscountValueOrThrow(type, value, 'Gi� tr� voucher');
        assertDateRangeValid(start_date, end_date, 'Th�i gian voucher');

        const createdVoucher = await Voucher.create({
            code,
            name,
            description,
            type,
            value: normalizedValue,
            min_order_amount: parseFloat(min_order_amount) || 0,
            max_discount_amount: max_discount_amount ? parseFloat(max_discount_amount) : null,
            usage_limit: usage_limit ? parseInt(usage_limit) : null,
            user_limit: parseInt(user_limit) || 1,
            start_date,
            end_date,
            is_active: is_active === 'on',
            product_ids: productIds
        });

        if (shouldNotifySubscribers) {
            const [voucher] = await attachVoucherAssignments([await Voucher.findById(createdVoucher.id)]);
            const result = await sendVoucherAnnouncement(voucher);

            if (result.total === 0) {
                return res.redirect(buildAdminNoticeRedirect('/admin/vouchers', '� t�o voucher nh�ng hi�n ch�a c� ng��i ng k� nh�n th�ng b�o.', 'warning'));
            }

            if (result.success === result.total) {
                return res.redirect(buildAdminNoticeRedirect('/admin/vouchers', `� t�o voucher v� g�i email th�nh c�ng t�i ${result.success} ng��i ng k�.`));
            }

            if (result.success > 0) {
                return res.redirect(buildAdminNoticeRedirect('/admin/vouchers', `� t�o voucher v� g�i email t�i ${result.success}/${result.total} ng��i ng k�.`, 'warning'));
            }

            return res.redirect(buildAdminNoticeRedirect('/admin/vouchers', '� t�o voucher nh�ng ch�a g�i email th�nh c�ng. Vui l�ng ki�m tra c�u h�nh email.', 'error'));
        }

        res.redirect(buildAdminNoticeRedirect('/admin/vouchers', '� t�o voucher th�nh c�ng.'));
    } catch (error) {
        console.error('Create voucher error:', error);
        res.redirect(buildAdminNoticeRedirect('/admin/vouchers', error.message || 'Kh�ng th� t�o voucher.', 'error'));
    }
};

/**
 * C�p nh�t voucher
 */
exports.updateVoucher = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            code, name, description, type, value,
            min_order_amount, max_discount_amount, usage_limit,
            user_limit, start_date, end_date, is_active
        } = req.body;
        const productIds = parseSelectedProductIds(req.body);
        const normalizedValue = normalizeDiscountValueOrThrow(type, value, 'Gi� tr� voucher');
        assertDateRangeValid(start_date, end_date, 'Th�i gian voucher');

        await Voucher.update(id, {
            code,
            name,
            description,
            type,
            value: normalizedValue,
            min_order_amount: parseFloat(min_order_amount) || 0,
            max_discount_amount: max_discount_amount ? parseFloat(max_discount_amount) : null,
            usage_limit: usage_limit ? parseInt(usage_limit) : null,
            user_limit: parseInt(user_limit) || 1,
            start_date,
            end_date,
            is_active: is_active === 'on' || is_active === true,
            product_ids: productIds
        });

        res.json({ success: true, message: 'Voucher updated successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * X�a voucher
 */
exports.deleteVoucher = async (req, res) => {
    try {
        const { id } = req.params;
        await Voucher.delete(id);
        res.json({ success: true, message: 'Voucher deleted successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * C�p nh�t tr�ng th�i voucher
 */
exports.updateVoucherStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        await Voucher.updateStatus(id, is_active === 'true' || is_active === true);
        res.json({ success: true, message: 'Voucher status updated' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Gửi mã giảm giá announcement email.
exports.sendVoucherAnnouncementEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const existingVoucher = await Voucher.findById(id);

        if (!existingVoucher) {
            return res.status(404).json({ success: false, message: 'Voucher kh�ng t�n t�i', toastType: 'error' });
        }

        const [voucher] = await attachVoucherAssignments([existingVoucher]);
        const result = await sendVoucherAnnouncement(voucher);

        if (result.total === 0) {
            return res.json({
                success: true,
                toastType: 'warning',
                message: 'Hi�n ch�a c� ng��i d�ng n�o ng k� nh�n th�ng b�o.'
            });
        }

        if (result.success === result.total) {
            return res.json({
                success: true,
                toastType: 'success',
                message: `� g�i email th�ng b�o voucher t�i ${result.success} ng��i ng k�.`
            });
        }

        if (result.success > 0) {
            return res.json({
                success: true,
                toastType: 'warning',
                message: `� g�i email t�i ${result.success}/${result.total} ng��i ng k�.`
            });
        }

        return res.status(500).json({
            success: false,
            toastType: 'error',
            message: 'Kh�ng g�i ��c email th�ng b�o. Vui l�ng ki�m tra c�u h�nh email.'
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message, toastType: 'error' });
    }
};

// =============================================================================
// BI�N TH� S�N PH�M - PRODUCT VARIANTS
// =============================================================================

exports.getProductVariants = async (req, res) => {
    try {
        const variants = await Product.getVariants(req.params.id);
        res.json({ success: true, variants });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thêm sản phẩm biến thể.
exports.addProductVariant = async (req, res) => {
    try {
        const variant = await Product.addVariant(req.params.id, req.body);
        res.json({ success: true, variant });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Xóa sản phẩm biến thể.
exports.deleteProductVariant = async (req, res) => {
    try {
        if (await Product.isVariantReferenced(req.params.variantId)) {
            return res.status(400).json({
                success: false,
                message: 'Kh�ng th� x�a bi�n th� � ��c d�ng trong gi� h�ng ho�c �n h�ng'
            });
        }

        await Product.deleteVariant(req.params.variantId);
        res.json({ success: true, message: '� x�a bi�n th�' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// =============================================================================
// C�I �T GIAO DI�N STOREFRONT - STOREFRONT SETTINGS
// =============================================================================

exports.getStorefrontSettings = async (req, res) => {
    try {
        const settings = await StorefrontSetting.getAll();

        res.render('admin/storefront', {
            settings,
            notice: typeof req.query.notice === 'string' ? req.query.notice : '',
            noticeType: typeof req.query.notice_type === 'string' ? req.query.notice_type : 'success',
            user: req.user,
            currentPage: 'storefront'
        });
    } catch (error) {
        res.status(500).render('error', {
            message: 'L�i t�i c�i �t giao di�n: ' + error.message,
            user: req.user
        });
    }
};

// Cập nhật storefront settings.
exports.updateStorefrontSettings = async (req, res) => {
    try {
        await StorefrontSetting.updateMany({
            product_grid_columns: req.body.product_grid_columns,
            home_category_showcase_count: req.body.home_category_showcase_count
        });

        invalidateStorefrontSettingsCache();

        return res.redirect(buildAdminNoticeRedirect(
            '/admin/storefront',
            '� l�u c�i �t giao di�n storefront.'
        ));
    } catch (error) {
        return res.redirect(buildAdminNoticeRedirect(
            '/admin/storefront',
            error.message || 'Kh�ng th� l�u c�i �t giao di�n storefront.',
            'error'
        ));
    }
};

// =============================================================================
// QU�N L� BANNER - Banners Management
// =============================================================================

exports.toggleBannerActive = async (req, res) => {
    try {
        const banner = await Banner.toggleActive(req.params.id);
        if (!banner) {
            return res.status(404).json({ success: false, message: 'Banner kh�ng t�n t�i' });
        }
        res.json({ success: true, is_active: banner.is_active });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Xử lý reorder banners.
exports.reorderBanners = async (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'D� li�u kh�ng h�p l�' });
        }
        await Banner.updateOrder(items);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Cập nhật banner.
exports.updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await Banner.findById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Banner kh�ng t�n t�i' });
        }
        const { title, subtitle, link_url } = req.body;

        let image_url = existing.image_url;
        if (req.file) {
            image_url = req.file.cloudinaryUrl || `/uploads/${req.file.filename}`;
        }

        const updated = await Banner.update(id, {
            title: title || existing.title,
            subtitle: subtitle !== undefined ? subtitle : existing.subtitle,
            description: existing.description,
            image_url,
            link_url: link_url !== undefined ? link_url : existing.link_url,
            button_text: existing.button_text,
            display_order: existing.display_order,
            is_active: existing.is_active,
            start_date: existing.start_date,
            end_date: existing.end_date
        });

        res.json({ success: true, banner: updated });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Cập nhật đơn hàng trạng thái.
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const trackingPayload = buildOrderTrackingPayload(req.body);

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const requestedStatus = Order.normalizeStatus(status);

        if (requestedStatus === 'completed') {
            return res.status(403).json({ message: 'Tr�ng th�i � ho�n th�nh ch� ��c x�c nh�n b�i ng��i mua.' });
        }

        const previousOrder = await Order.findById(id);
        if (
            previousOrder
            && ['vnpay', 'momo'].includes(String(previousOrder.payment_method || '').toLowerCase())
            && previousOrder.payment_status !== 'paid'
            && !['pending_payment', 'cancelled'].includes(requestedStatus)
        ) {
            return res.status(400).json({ message: '�n thanh to�n online ch�a thanh to�n ch� c� th� � tr�ng th�i Ch� thanh to�n ho�c � h�y.' });
        }

        const order = await Order.updateStatus(id, status, trackingPayload, {
            actorUserId: req.user?.id || null
        });
        const previousStatus = Order.normalizeStatus(previousOrder?.status);
        const nextStatus = Order.normalizeStatus(order?.status);

        if (previousStatus !== 'delivered' && nextStatus === 'delivered') {
            emailService
                .sendOrderDeliveredEmail(order)
                .catch((emailError) => console.error('Order delivered email error:', emailError));
        }

        res.json({
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Lấy hoàn hàng yêu cầu.
exports.getReturnRequests = async (req, res) => {
    try {
        const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : '';
        const returnRequests = await ReturnRequest.findAll({
            ...(statusFilter ? { status: statusFilter } : {}),
            limit: 100,
            offset: 0
        });

        res.render('admin/returns', {
            returnRequests,
            statusFilter,
            user: req.user,
            currentPage: 'returns'
        });
    } catch (error) {
        console.error('Return requests page error:', error);
        res.status(500).render('error', { message: 'Unable to load return requests' });
    }
};

// Lấy hoàn hàng yêu cầu chi tiết.
exports.getReturnRequestDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const returnRequest = await ReturnRequest.findById(id);

        if (!returnRequest) {
            return res.status(404).render('error', { message: 'Kh�ng t�m th�y y�u c�u ho�n h�ng' });
        }

        const order = await Order.findById(returnRequest.order_id);
        if (order) {
            order.shipping_address = [
                order.address_line,
                order.ward,
                order.district,
                order.city
            ].filter(Boolean).join(', ');
        }

        return res.render('admin/return-detail', {
            returnRequest,
            order,
            user: req.user,
            currentPage: 'returns'
        });
    } catch (error) {
        console.error('Return request detail error:', error);
        return res.status(500).render('error', { message: 'Unable to load return request detail' });
    }
};

// Cập nhật hoàn hàng yêu cầu trạng thái.
exports.updateReturnRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_note } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const returnRequest = await ReturnRequest.updateStatus(id, status, admin_note, req.user?.id || null);
        if (!returnRequest) {
            return res.status(404).json({ message: 'Return request not found' });
        }

        return res.json({
            success: true,
            message: '� c�p nh�t tr�ng th�i y�u c�u ho�n h�ng',
            returnRequest
        });
    } catch (error) {
        console.error('Update return request error:', error);
        return res.status(400).json({ message: error.message });
    }
};



