const Product = require('../models/Product');
const {
    CHAT_CATEGORY_RULES,
    CHAT_COLOR_RULES,
    getCategoryRuleById,
    getColorRuleById,
    normalizeChatText,
    includesChatPhrase
} = require('./chatConversationStateService');

function getProductSearchText(product) {
    return normalizeChatText([
        product?.name,
        product?.description,
        product?.category_name,
        product?.category_slug,
        product?.sku,
        product?.variant_colors,
        product?.variant_sizes
    ].filter(Boolean).join(' '));
}

function inferProductAudience(product) {
    const productText = getProductSearchText(product);

    if (includesChatPhrase(productText, 'tre em') || includesChatPhrase(productText, 'be trai') || includesChatPhrase(productText, 'be gai')) {
        return 'kids';
    }

    if (includesChatPhrase(productText, 'nu')) {
        return 'female';
    }

    if (includesChatPhrase(productText, 'nam')) {
        return 'male';
    }

    return 'neutral';
}

function getProductMatchedCategories(product) {
    const productText = getProductSearchText(product);

    return CHAT_CATEGORY_RULES.filter((rule) =>
        rule.keywords.some((keyword) => includesChatPhrase(productText, keyword))
    );
}

function getProductColors(product) {
    const productText = getProductSearchText(product);
    const matchedColors = new Set();
    const rawVariantColors = String(product?.variant_colors || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

    rawVariantColors.forEach((colorValue) => {
        const normalizedColor = normalizeChatText(colorValue);
        const matchedRule = CHAT_COLOR_RULES.find((rule) =>
            rule.keywords.some((keyword) => includesChatPhrase(normalizedColor, keyword))
                || normalizedColor === normalizeChatText(rule.label)
        );

        if (matchedRule) {
            matchedColors.add(matchedRule.id);
        }
    });

    CHAT_COLOR_RULES.forEach((rule) => {
        if (rule.keywords.some((keyword) => includesChatPhrase(productText, keyword))) {
            matchedColors.add(rule.id);
        }
    });

    return Array.from(matchedColors);
}

function isInStock(product) {
    return Number(product?.stock_quantity || 0) > 0;
}

function matchesSku(product, filters = {}) {
    if (!filters.sku) {
        return true;
    }

    return normalizeChatText(product?.sku) === normalizeChatText(filters.sku);
}

function matchesGender(product, filters = {}) {
    if (!filters.gender) {
        return true;
    }

    return inferProductAudience(product) === filters.gender;
}

function matchesCategory(product, filters = {}) {
    if (!filters.category) {
        return true;
    }

    const requestedCategory = getCategoryRuleById(filters.category);
    if (!requestedCategory) {
        return true;
    }

    const matchedCategories = getProductMatchedCategories(product);
    if (!matchedCategories.length) {
        return false;
    }

    if (requestedCategory.generic) {
        return matchedCategories.some((category) => category.family === requestedCategory.family);
    }

    return matchedCategories.some((category) => category.id === requestedCategory.id);
}

function matchesColor(product, filters = {}) {
    if (!filters.color) {
        return true;
    }

    return getProductColors(product).includes(filters.color);
}

function matchesPriceRange(product, filters = {}) {
    if (!filters.price_range) {
        return true;
    }

    const price = Number(product?.final_price || product?.price || 0);
    if (!price) {
        return false;
    }

    const min = Number.isFinite(Number(filters.price_range.min)) ? Number(filters.price_range.min) : null;
    const max = Number.isFinite(Number(filters.price_range.max)) ? Number(filters.price_range.max) : null;

    if (min !== null && price < min) {
        return false;
    }

    if (max !== null && price > max) {
        return false;
    }

    return true;
}

function filterCatalogProducts(catalog = [], filters = {}) {
    return catalog.filter((product) =>
        matchesSku(product, filters)
        && matchesGender(product, filters)
        && matchesCategory(product, filters)
        && matchesColor(product, filters)
        && matchesPriceRange(product, filters)
    );
}

function buildAudienceBreakdown(catalog = []) {
    return {
        total: catalog.length,
        in_stock: catalog.filter((product) => isInStock(product)).length,
        male: catalog.filter((product) => inferProductAudience(product) === 'male').length,
        female: catalog.filter((product) => inferProductAudience(product) === 'female').length,
        kids: catalog.filter((product) => inferProductAudience(product) === 'kids').length
    };
}

function collectAvailableColors(products = []) {
    const colors = new Set();

    products.forEach((product) => {
        getProductColors(product).forEach((colorId) => {
            const colorRule = getColorRuleById(colorId);
            colors.add(colorRule?.label || colorId);
        });
    });

    return Array.from(colors);
}

function scoreProduct(product, turn = {}) {
    const productText = getProductSearchText(product);
    const price = Number(product?.final_price || product?.price || 0);
    const soldCount = Number(product?.sold_count || 0);
    let score = Math.min(24, soldCount / 2);
    const reasons = [];

    if (isInStock(product)) {
        score += 30;
    } else {
        score -= 100;
    }

    if (turn.activeFilters?.sku && matchesSku(product, turn.activeFilters)) {
        score += 80;
        reasons.push(`đúng mã ${turn.activeFilters.sku}`);
    }

    if (turn.activeFilters?.gender && matchesGender(product, turn.activeFilters)) {
        score += 24;
        reasons.push(`đúng nhóm ${turn.activeFilters.gender === 'male' ? 'nam' : turn.activeFilters.gender === 'female' ? 'nữ' : 'trẻ em'}`);
    }

    if (turn.activeFilters?.category && matchesCategory(product, turn.activeFilters)) {
        const categoryRule = getCategoryRuleById(turn.activeFilters.category);
        score += 28;
        if (categoryRule?.label) {
            reasons.push(`đúng kiểu ${categoryRule.label}`);
        }
    }

    if (turn.activeFilters?.color && matchesColor(product, turn.activeFilters)) {
        const colorRule = getColorRuleById(turn.activeFilters.color);
        score += 30;
        if (colorRule?.label) {
            reasons.push(`đúng màu ${colorRule.label}`);
        }
    }

    if (turn.activeFilters?.price_range && matchesPriceRange(product, turn.activeFilters)) {
        score += 18;
        if (turn.activeFilters.price_range.label) {
            reasons.push(`trong ${turn.activeFilters.price_range.label}`);
        }
    }

    const termMatches = (turn.focusTerms || []).reduce((count, term) => (
        includesChatPhrase(productText, term) ? count + 1 : count
    ), 0);
    score += Math.min(20, termMatches * 4);

    if (turn.activeFilters?.price_range && price > 0) {
        const min = Number.isFinite(Number(turn.activeFilters.price_range.min))
            ? Number(turn.activeFilters.price_range.min)
            : null;
        const max = Number.isFinite(Number(turn.activeFilters.price_range.max))
            ? Number(turn.activeFilters.price_range.max)
            : null;

        if (min !== null && max !== null) {
            const midpoint = Math.round((min + max) / 2);
            const delta = Math.abs(price - midpoint);
            score += Math.max(0, 12 - Math.round(delta / 50000));
        }
    }

    return {
        score,
        reason: Array.from(new Set(reasons)).slice(0, 3).join(', ')
    };
}

function rankProducts(products = [], turn = {}, limit = 6) {
    return products
        .map((product) => {
            const ranking = scoreProduct(product, turn);
            return {
                ...product,
                chat_score: ranking.score,
                chat_reason: ranking.reason
            };
        })
        .sort((left, right) => right.chat_score - left.chat_score)
        .slice(0, limit);
}

async function buildCatalogContext(turn = {}, options = {}) {
    const catalog = await Product.getActiveChatCatalog();
    const filters = turn.activeFilters || {};
    const exactMatches = filterCatalogProducts(catalog, filters);
    const inStockMatches = exactMatches.filter((product) => isInStock(product));
    const recommendedProducts = rankProducts(
        inStockMatches.length ? inStockMatches : exactMatches,
        turn,
        Number.parseInt(options.limit, 10) || 6
    );

    const relaxedWithoutColorMatches = filters.color
        ? filterCatalogProducts(catalog, { ...filters, color: null })
        : [];
    const relaxedWithoutPriceMatches = filters.price_range
        ? filterCatalogProducts(catalog, { ...filters, price_range: null })
        : [];
    const relaxedWithoutSkuMatches = filters.sku
        ? filterCatalogProducts(catalog, { ...filters, sku: null })
        : [];

    return {
        catalog,
        exactMatches,
        inStockMatches,
        recommendedProducts,
        relaxedWithoutColorMatches,
        relaxedWithoutPriceMatches,
        relaxedWithoutSkuMatches,
        availableColors: collectAvailableColors(relaxedWithoutColorMatches.length ? relaxedWithoutColorMatches : exactMatches),
        breakdown: buildAudienceBreakdown(catalog)
    };
}

module.exports = {
    buildCatalogContext
};
