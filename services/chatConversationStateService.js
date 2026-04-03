const CHAT_PRODUCT_KEYWORDS = [
    'ao', 'ao thun', 'ao so mi', 'ao polo', 'quan', 'quan jean', 'jeans', 'kaki',
    'dam', 'vay', 'chan vay', 'croptop', 'crop top', 'hoodie', 'jacket', 'outfit',
    'thoi trang', 'tim san pham', 'tim mau', 'mau', 'size', 'sku'
];

const CHAT_SUPPORT_TOPICS = [
    { id: 'shipping', keywords: ['giao hang', 'van chuyen', 'ship', 'ship cod', 'phi ship'] },
    { id: 'payment', keywords: ['thanh toan', 'vnpay', 'momo', 'cod'] },
    { id: 'voucher', keywords: ['voucher', 'ma giam', 'khuyen mai'] },
    { id: 'account', keywords: ['tai khoan', 'dang nhap', 'dang ky', 'quen mat khau'] },
    { id: 'order', keywords: ['don hang', 'ma don', 'trang thai don', 'doi tra', 'hoan tien'] },
    { id: 'image-search', keywords: ['bang hinh anh', 'bang anh', 'gui anh', 'upload anh', 'theo anh'] }
];

const CHAT_RECOMMENDATION_ENABLE_PHRASES = [
    'goi y', 'de xuat', 'recommend', 'show me', 'cho toi xem', 'xem giup',
    'co mau nao', 'co san pham nao', 'tim giup', 'tim cho toi', 'loc giup'
];

const CHAT_RECOMMENDATION_DISABLE_PHRASES = [
    'chua can goi y', 'chua can de xuat', 'khong can goi y', 'khong can de xuat',
    'chua can suggestion', 'dung goi y', 'khong can tu van san pham'
];

const CHAT_INFO_KEYWORDS = [
    'bao nhieu', 'so luong', 'con hang', 'het hang', 'ton kho', 'co mau',
    'mau sac', 'co size', 'chat lieu', 'sku', 'ma san pham', 'gia bao nhieu'
];

const CHAT_FOLLOW_UP_HINTS = [
    'mau', 'size', 'gia', 'ngan sach', 'co ma', 'co mau nao', 'con hang',
    'het hang', 'mau vang', 'mau do', 'mau den', 'mau trang', 'co the'
];

const CHAT_GLOBAL_SCOPE_KEYWORDS = [
    'tat ca', 'toan bo', 'tong', 'catalog', 'shop', 'cua hang'
];

const CHAT_COUNT_KEYWORDS = ['bao nhieu', 'so luong', 'tong', 'may'];

const CHAT_GREETING_TOKENS = new Set([
    'xin', 'chao', 'hello', 'hi', 'hey', 'alo', 'shop', 'oi', 'ad', 'admin',
    'em', 'anh', 'chi', 'ban', 'nhe', 'nha', 'a', 'ah', 'ha'
]);

const CHAT_STOP_WORDS = new Set([
    'shop', 'minh', 'toi', 'cho', 'voi', 'can', 'muon', 'tim', 'giup',
    'tu', 'van', 'san', 'pham', 'loai', 'cua', 'nay', 'kia', 'dep', 'mac',
    'mot', 'nhung', 'dang', 'roi', 'nhe', 'a', 'ah', 'ha', 'nua', 'tam',
    'khoang', 'duoi', 'tren', 'tu', 'den', 'ban', 'de', 'xuat', 'cac',
    'trong', 'gia', 'neu', 'ko', 'khong', 'du', 'thi', 'co', 'the', 'nao'
]);

const CHAT_GENDER_RULES = [
    { id: 'kids', label: 'trẻ em', searchPhrase: 'tre em', keywords: ['tre em', 'em be', 'be trai', 'be gai', 'kids'] },
    { id: 'male', label: 'nam', searchPhrase: 'nam', keywords: ['do nam', 'thoi trang nam', 'nam', 'men', 'male'] },
    { id: 'female', label: 'nữ', searchPhrase: 'nu', keywords: ['do nu', 'thoi trang nu', 'nu', 'women', 'female'] }
];

const CHAT_CATEGORY_RULES = [
    { id: 'shirt', family: 'top', generic: true, label: 'áo', searchPhrase: 'ao', keywords: ['ao'] },
    { id: 'croptop', family: 'top', generic: false, label: 'áo croptop', searchPhrase: 'ao croptop', keywords: ['ao croptop', 'croptop', 'crop top'] },
    { id: 'shirt-office', family: 'top', generic: false, label: 'áo sơ mi', searchPhrase: 'ao so mi', keywords: ['ao so mi', 'so mi', 'shirt', 'oxford'] },
    { id: 'shirt-polo', family: 'top', generic: false, label: 'áo polo', searchPhrase: 'ao polo', keywords: ['ao polo', 'polo'] },
    { id: 'shirt-tee', family: 'top', generic: false, label: 'áo thun', searchPhrase: 'ao thun', keywords: ['ao thun', 'thun', 't-shirt', 'tee'] },
    { id: 'hoodie', family: 'top', generic: false, label: 'hoodie', searchPhrase: 'hoodie', keywords: ['hoodie'] },
    { id: 'jacket', family: 'top', generic: false, label: 'áo khoác', searchPhrase: 'ao khoac', keywords: ['ao khoac', 'khoac', 'jacket', 'blazer'] },
    { id: 'pants', family: 'bottom', generic: true, label: 'quần', searchPhrase: 'quan', keywords: ['quan', 'pants', 'trousers'] },
    { id: 'jeans', family: 'bottom', generic: false, label: 'quần jeans', searchPhrase: 'quan jeans', keywords: ['quan jeans', 'jeans', 'denim'] },
    { id: 'kaki', family: 'bottom', generic: false, label: 'quần kaki', searchPhrase: 'quan kaki', keywords: ['quan kaki', 'kaki'] },
    { id: 'dress', family: 'dress', generic: false, label: 'đầm', searchPhrase: 'dam', keywords: ['dam', 'maxi', 'dress'] },
    { id: 'skirt', family: 'dress', generic: false, label: 'váy', searchPhrase: 'vay', keywords: ['vay', 'chan vay', 'skirt'] }
];

const CHAT_COLOR_RULES = [
    { id: 'yellow', label: 'vàng', keywords: ['vang', 'mau vang', 'yellow', 'gold', 'vang tuoi', 'vang nghe', 'vang mustard'] },
    { id: 'red', label: 'đỏ', keywords: ['do', 'mau do', 'red', 'burgundy', 'maroon'] },
    { id: 'blue', label: 'xanh dương', keywords: ['xanh duong', 'mau xanh duong', 'blue', 'navy', 'xanh navy', 'xanh bien'] },
    { id: 'green', label: 'xanh lá', keywords: ['xanh la', 'mau xanh la', 'green', 'olive', 'mint'] },
    { id: 'black', label: 'đen', keywords: ['den', 'mau den', 'black'] },
    { id: 'white', label: 'trắng', keywords: ['trang', 'mau trang', 'white'] },
    { id: 'gray', label: 'xám', keywords: ['xam', 'ghi', 'mau xam', 'grey', 'gray'] },
    { id: 'beige', label: 'be', keywords: ['be', 'beige', 'kem', 'nude', 'mau be', 'mau kem'] },
    { id: 'brown', label: 'nâu', keywords: ['nau', 'mau nau', 'brown', 'camel'] },
    { id: 'pink', label: 'hồng', keywords: ['hong', 'mau hong', 'pink'] },
    { id: 'purple', label: 'tím', keywords: ['tim', 'mau tim', 'purple'] },
    { id: 'orange', label: 'cam', keywords: ['cam', 'mau cam', 'orange'] }
];

const CHAT_AMBIGUOUS_COLOR_KEYWORDS = new Set(['be', 'cam', 'do', 'tim', 'trang']);

const CHAT_COLOR_CONTEXT_TOKENS = new Set([
    'ao', 'polo', 'thun', 'so', 'mi', 'croptop', 'crop', 'hoodie', 'jacket', 'khoac',
    'quan', 'jeans', 'kaki', 'vay', 'dam', 'chan', 'top', 'shirt', 'dress', 'skirt',
    'nam', 'nu', 'tre', 'em', 'kids', 'kid', 'be', 'gai', 'trai', 'mau'
]);

function normalizeChatText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();
}

function escapeChatRegex(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function includesChatPhrase(text, phrase) {
    const haystack = normalizeChatText(text);
    const needle = normalizeChatText(phrase);

    if (!haystack || !needle) {
        return false;
    }

    if (needle.includes(' ')) {
        return haystack.includes(needle);
    }

    return new RegExp(`(^|[^a-z0-9])${escapeChatRegex(needle)}([^a-z0-9]|$)`).test(haystack);
}

function detectChatRule(normalizedMessage, rules = []) {
    return rules.find((rule) => rule.keywords.some((keyword) => includesChatPhrase(normalizedMessage, keyword))) || null;
}

function detectAllChatRules(normalizedMessage, rules = []) {
    return rules.filter((rule) => rule.keywords.some((keyword) => includesChatPhrase(normalizedMessage, keyword)));
}

function detectChatCategories(normalizedMessage) {
    const matches = detectAllChatRules(normalizedMessage, CHAT_CATEGORY_RULES);

    return matches.filter((rule) => {
        if (!rule.generic) {
            return true;
        }

        return !matches.some((item) => item.family === rule.family && item.id !== rule.id && !item.generic);
    });
}

function tokenizeNormalizedMessage(normalizedMessage) {
    return String(normalizedMessage || '')
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean);
}

function hasStandaloneColorContext(tokens, index) {
    if (index < 0 || index >= tokens.length) {
        return false;
    }

    const previousTokens = tokens.slice(Math.max(0, index - 2), index);
    return previousTokens.some((token) => CHAT_COLOR_CONTEXT_TOKENS.has(token));
}

function detectChatColor(normalizedMessage) {
    const tokens = tokenizeNormalizedMessage(normalizedMessage);

    for (const rule of CHAT_COLOR_RULES) {
        for (const keyword of rule.keywords) {
            const normalizedKeyword = normalizeChatText(keyword);
            if (!normalizedKeyword || !includesChatPhrase(normalizedMessage, normalizedKeyword)) {
                continue;
            }

            if (normalizedKeyword.includes(' ') || !CHAT_AMBIGUOUS_COLOR_KEYWORDS.has(normalizedKeyword)) {
                return rule;
            }

            const tokenIndexes = tokens.reduce((indexes, token, index) => {
                if (token === normalizedKeyword) {
                    indexes.push(index);
                }
                return indexes;
            }, []);

            if (tokenIndexes.some((itemIndex) => hasStandaloneColorContext(tokens, itemIndex))) {
                return rule;
            }
        }
    }

    return null;
}

function parseChatMoneyAmount(rawAmount, rawUnit) {
    if (!rawAmount) {
        return null;
    }

    const amountText = String(rawAmount).trim();
    let normalizedAmount = amountText;

    if (amountText.includes(',') && amountText.includes('.')) {
        normalizedAmount = amountText.replace(/\./g, '').replace(',', '.');
    } else if (amountText.includes(',')) {
        normalizedAmount = amountText.replace(',', '.');
    } else if (amountText.includes('.')) {
        const decimalLike = /^\d+\.\d{1,2}$/.test(amountText);
        normalizedAmount = decimalLike ? amountText : amountText.replace(/\./g, '');
    }

    const amount = Number.parseFloat(normalizedAmount);
    if (!Number.isFinite(amount)) {
        return null;
    }

    const unit = normalizeChatText(rawUnit);
    if (unit === 'm' || unit.includes('tr')) {
        return Math.round(amount * 1000000);
    }

    if (unit.includes('k') || unit.includes('nghin') || unit.includes('ngan')) {
        return Math.round(amount * 1000);
    }

    if (amount >= 1000) {
        return Math.round(amount);
    }

    if (!unit && amount >= 100 && amount < 1000) {
        return Math.round(amount * 1000);
    }

    return null;
}

function formatPriceRangeLabel(min, max) {
    const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
    if (min && max) {
        return `${formatCurrency(min)} - ${formatCurrency(max)}`;
    }

    if (max) {
        return `dưới ${formatCurrency(max)}`;
    }

    if (min) {
        return `từ ${formatCurrency(min)}`;
    }

    return null;
}

function parseChatBudget(normalizedMessage) {
    if (!normalizedMessage) {
        return null;
    }

    const rangeMatch = normalizedMessage.match(/(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|k|nghin|ngan)?\s*(?:-|den|toi)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|k|nghin|ngan)?/);
    if (rangeMatch) {
        const first = parseChatMoneyAmount(rangeMatch[1], rangeMatch[2]);
        const second = parseChatMoneyAmount(rangeMatch[3], rangeMatch[4] || rangeMatch[2]);
        if (first && second) {
            return {
                min: Math.min(first, second),
                max: Math.max(first, second),
                label: formatPriceRangeLabel(Math.min(first, second), Math.max(first, second))
            };
        }
    }

    const maxMatch = normalizedMessage.match(/(?:duoi|toi da|khong qua|re hon|nho hon|<=)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|k|nghin|ngan)?/);
    if (maxMatch) {
        const max = parseChatMoneyAmount(maxMatch[1], maxMatch[2]);
        if (max) {
            return {
                min: null,
                max,
                label: formatPriceRangeLabel(null, max)
            };
        }
    }

    const minMatch = normalizedMessage.match(/(?:tren|tu|it nhat|>=)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|k|nghin|ngan)?/);
    if (minMatch) {
        const min = parseChatMoneyAmount(minMatch[1], minMatch[2]);
        if (min) {
            return {
                min,
                max: null,
                label: formatPriceRangeLabel(min, null)
            };
        }
    }

    const targetMatch = normalizedMessage.match(/(?:tam|khoang|gan|quanh)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|k|nghin|ngan)?/);
    if (targetMatch) {
        const target = parseChatMoneyAmount(targetMatch[1], targetMatch[2]);
        if (target) {
            const min = Math.round(target * 0.8);
            const max = Math.round(target * 1.2);
            return {
                min,
                max,
                label: formatPriceRangeLabel(min, max)
            };
        }
    }

    return null;
}

function extractFocusTerms(normalizedMessage) {
    return normalizedMessage
        .split(/\s+/)
        .map((term) => term.trim())
        .filter((term) =>
            term.length >= 2 &&
            !CHAT_STOP_WORDS.has(term) &&
            !/^\d/.test(term) &&
            !['tr', 'trieu', 'k', 'nghin', 'ngan'].includes(term)
        );
}

function extractSku(rawMessage) {
    const value = String(rawMessage || '');
    const matches = value.match(/\b(?=[A-Za-z0-9-]{5,}\b)(?=[A-Za-z0-9-]*[A-Za-z])(?=[A-Za-z0-9-]*\d)[A-Za-z0-9-]+\b/g);
    return matches && matches.length ? matches[0].toUpperCase() : null;
}

function isGreetingOnlyMessage(normalizedMessage) {
    const cleaned = String(normalizedMessage || '')
        .replace(/[!?.,]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleaned) {
        return false;
    }

    const tokens = cleaned.split(' ').filter(Boolean);
    return tokens.length > 0 && tokens.every((token) => CHAT_GREETING_TOKENS.has(token));
}

function createDefaultConversationState() {
    return {
        intent: 'unknown',
        gender: null,
        category: null,
        color: null,
        price_range: null,
        sku: null,
        allow_recommendation: false,
        confirmed: false
    };
}

function sanitizeConversationState(rawState) {
    const defaultState = createDefaultConversationState();
    if (!rawState || typeof rawState !== 'object') {
        return defaultState;
    }

    const priceRange = rawState.price_range && typeof rawState.price_range === 'object'
        ? {
            min: Number.isFinite(Number(rawState.price_range.min)) ? Number(rawState.price_range.min) : null,
            max: Number.isFinite(Number(rawState.price_range.max)) ? Number(rawState.price_range.max) : null,
            label: typeof rawState.price_range.label === 'string' ? rawState.price_range.label : formatPriceRangeLabel(
                Number.isFinite(Number(rawState.price_range.min)) ? Number(rawState.price_range.min) : null,
                Number.isFinite(Number(rawState.price_range.max)) ? Number(rawState.price_range.max) : null
            )
        }
        : null;

    return {
        ...defaultState,
        intent: typeof rawState.intent === 'string' ? rawState.intent : defaultState.intent,
        gender: typeof rawState.gender === 'string' ? rawState.gender : null,
        category: typeof rawState.category === 'string' ? rawState.category : null,
        color: typeof rawState.color === 'string' ? rawState.color : null,
        price_range: priceRange,
        sku: typeof rawState.sku === 'string' ? rawState.sku : null,
        allow_recommendation: Boolean(rawState.allow_recommendation),
        confirmed: Boolean(rawState.confirmed)
    };
}

function getRuleById(rules, id) {
    return rules.find((rule) => rule.id === id) || null;
}

function getGenderRuleById(id) {
    return getRuleById(CHAT_GENDER_RULES, id);
}

function getCategoryRuleById(id) {
    return getRuleById(CHAT_CATEGORY_RULES, id);
}

function getColorRuleById(id) {
    return getRuleById(CHAT_COLOR_RULES, id);
}

function buildPreferenceSummary(filters = {}) {
    const category = getCategoryRuleById(filters.category);
    const gender = getGenderRuleById(filters.gender);
    const color = getColorRuleById(filters.color);
    const parts = [];

    if (category?.label) {
        parts.push(category.label);
    } else if (filters.sku) {
        parts.push(`mã ${filters.sku}`);
    } else {
        parts.push('sản phẩm');
    }

    if (gender?.label) {
        parts.push(gender.label);
    }

    if (color?.label) {
        parts.push(`màu ${color.label}`);
    }

    if (filters.price_range?.label) {
        parts.push(filters.price_range.label);
    }

    return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function mergeStateValue(currentValue, previousValue, keepPrevious) {
    if (currentValue !== null && currentValue !== undefined) {
        return currentValue;
    }

    return keepPrevious ? previousValue : null;
}

function detectSupportTopic(normalizedMessage) {
    return CHAT_SUPPORT_TOPICS.find((topic) =>
        topic.keywords.some((keyword) => includesChatPhrase(normalizedMessage, keyword))
    ) || null;
}

function hasAnyPhrase(normalizedMessage, phrases = []) {
    return phrases.some((phrase) => includesChatPhrase(normalizedMessage, phrase));
}

function isGlobalCatalogQuery(normalizedMessage) {
    return hasAnyPhrase(normalizedMessage, CHAT_GLOBAL_SCOPE_KEYWORDS)
        && hasAnyPhrase(normalizedMessage, CHAT_COUNT_KEYWORDS);
}

function hasProductSignals(normalizedMessage, entities) {
    return Boolean(
        entities.gender ||
        entities.category ||
        entities.color ||
        entities.price_range ||
        entities.sku ||
        hasAnyPhrase(normalizedMessage, CHAT_PRODUCT_KEYWORDS)
    );
}

function isAvailabilityQuestion(normalizedMessage) {
    if (!normalizedMessage) {
        return false;
    }

    return (
        /\bkhong\b/.test(normalizedMessage) ||
        normalizedMessage.startsWith('co ') ||
        normalizedMessage.startsWith('con ')
    );
}

function shouldUseStoredPreferences({
    previousState,
    normalizedMessage,
    currentEntities,
    attachments = []
}) {
    const previousHasContext = Boolean(
        previousState.gender ||
        previousState.category ||
        previousState.color ||
        previousState.price_range ||
        previousState.sku
    );

    if (!previousHasContext) {
        return false;
    }

    if (isGlobalCatalogQuery(normalizedMessage)) {
        return false;
    }

    const currentHasSpecificEntity = Boolean(
        currentEntities.gender ||
        currentEntities.category ||
        currentEntities.color ||
        currentEntities.price_range ||
        currentEntities.sku
    );

    if (currentHasSpecificEntity) {
        return true;
    }

    if (attachments.length > 0) {
        return true;
    }

    if (hasAnyPhrase(normalizedMessage, CHAT_FOLLOW_UP_HINTS)) {
        return true;
    }

    return normalizeChatText(normalizedMessage).split(/\s+/).filter(Boolean).length <= 8;
}

function buildActiveFilters(previousState, currentEntities, useStoredPreferences) {
    return {
        gender: mergeStateValue(currentEntities.gender, previousState.gender, useStoredPreferences),
        category: mergeStateValue(currentEntities.category, previousState.category, useStoredPreferences),
        color: mergeStateValue(currentEntities.color, previousState.color, useStoredPreferences),
        price_range: mergeStateValue(currentEntities.price_range, previousState.price_range, useStoredPreferences),
        sku: mergeStateValue(currentEntities.sku, previousState.sku, useStoredPreferences)
    };
}

function classifyIntent({
    normalizedMessage,
    previousState,
    currentEntities,
    activeFilters,
    explicitRecommendationRequest,
    explicitRecommendationDisabled,
    infoQuery,
    supportTopic,
    attachments = []
}) {
    if (explicitRecommendationDisabled) {
        return infoQuery ? 'ask_info' : 'browse';
    }

    if (explicitRecommendationRequest) {
        return 'want_product';
    }

    const hasRefinement = Boolean(
        currentEntities.gender ||
        currentEntities.category ||
        currentEntities.color ||
        currentEntities.price_range ||
        currentEntities.sku ||
        attachments.length > 0
    );

    if (previousState.allow_recommendation && previousState.confirmed && hasRefinement) {
        return 'want_product';
    }

    if (supportTopic && !hasProductSignals(normalizedMessage, currentEntities) && !activeFilters.category && !activeFilters.gender) {
        return 'ask_info';
    }

    if (infoQuery) {
        return 'ask_info';
    }

    if (hasProductSignals(normalizedMessage, currentEntities) || activeFilters.gender || activeFilters.category || activeFilters.color || activeFilters.price_range || activeFilters.sku) {
        return 'browse';
    }

    return 'unknown';
}

function analyzeConversationTurn({
    userMessage,
    previousState,
    attachments = []
}) {
    const safePreviousState = sanitizeConversationState(previousState);
    const normalizedMessage = normalizeChatText(userMessage);
    const detectedGender = detectChatRule(normalizedMessage, CHAT_GENDER_RULES);
    const detectedCategories = detectChatCategories(normalizedMessage);
    const detectedColor = detectChatColor(normalizedMessage);
    const detectedPriceRange = parseChatBudget(normalizedMessage);
    const detectedSku = extractSku(userMessage);
    const supportTopic = detectSupportTopic(normalizedMessage);
    const mentionedGenders = detectAllChatRules(normalizedMessage, CHAT_GENDER_RULES);

    const currentEntities = {
        gender: detectedGender?.id || null,
        category: detectedCategories[0]?.id || null,
        color: detectedColor?.id || null,
        price_range: detectedPriceRange,
        sku: detectedSku
    };

    const explicitRecommendationDisabled = hasAnyPhrase(normalizedMessage, CHAT_RECOMMENDATION_DISABLE_PHRASES);
    const explicitRecommendationRequest = hasAnyPhrase(normalizedMessage, CHAT_RECOMMENDATION_ENABLE_PHRASES) || attachments.length > 0;
    const countQuery = hasAnyPhrase(normalizedMessage, CHAT_COUNT_KEYWORDS);
    const infoQuery = countQuery
        || hasAnyPhrase(normalizedMessage, CHAT_INFO_KEYWORDS)
        || isAvailabilityQuestion(normalizedMessage)
        || Boolean(supportTopic);
    const useStoredPreferences = shouldUseStoredPreferences({
        previousState: safePreviousState,
        normalizedMessage,
        currentEntities,
        attachments
    });
    const activeFilters = buildActiveFilters(safePreviousState, currentEntities, useStoredPreferences);
    const intent = classifyIntent({
        normalizedMessage,
        previousState: safePreviousState,
        currentEntities,
        activeFilters,
        explicitRecommendationRequest,
        explicitRecommendationDisabled,
        infoQuery,
        supportTopic,
        attachments
    });

    const nextState = {
        ...safePreviousState,
        intent,
        gender: currentEntities.gender || safePreviousState.gender,
        category: currentEntities.category || safePreviousState.category,
        color: currentEntities.color || safePreviousState.color,
        price_range: currentEntities.price_range || safePreviousState.price_range,
        sku: currentEntities.sku || safePreviousState.sku,
        allow_recommendation: explicitRecommendationDisabled
            ? false
            : explicitRecommendationRequest
                ? true
                : safePreviousState.allow_recommendation,
        confirmed: explicitRecommendationDisabled
            ? false
            : explicitRecommendationRequest
                ? true
                : safePreviousState.confirmed
    };

    return {
        previousState: safePreviousState,
        nextState,
        normalizedMessage,
        focusTerms: extractFocusTerms(normalizedMessage),
        supportTopic,
        explicitRecommendationRequest,
        explicitRecommendationDisabled,
        infoQuery,
        countQuery,
        mentionedGenders: mentionedGenders.map((rule) => rule.id),
        currentEntities,
        activeFilters,
        isGreetingOnly: isGreetingOnlyMessage(normalizedMessage),
        isGlobalCatalogQuery: isGlobalCatalogQuery(normalizedMessage),
        intent,
        hasProductSignals: hasProductSignals(normalizedMessage, currentEntities)
    };
}

module.exports = {
    CHAT_GENDER_RULES,
    CHAT_CATEGORY_RULES,
    CHAT_COLOR_RULES,
    createDefaultConversationState,
    sanitizeConversationState,
    analyzeConversationTurn,
    buildPreferenceSummary,
    getGenderRuleById,
    getCategoryRuleById,
    getColorRuleById,
    normalizeChatText,
    includesChatPhrase
};
