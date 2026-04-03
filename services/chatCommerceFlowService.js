const {
    analyzeConversationTurn,
    buildPreferenceSummary,
    normalizeChatText
} = require('./chatConversationStateService');
const { buildCatalogContext } = require('./chatProductRetrievalService');

const CHAT_IMAGE_SEARCH_HINTS = [
    'bang hinh anh', 'bang anh', 'theo anh', 'tu anh', 'gui anh', 'upload anh',
    'anh san pham', 'hinh san pham', 'photo', 'image'
];

const CHAT_IMAGE_SEARCH_ACTIONS = [
    'tim', 'tim kiem', 'tim san pham', 'goi y', 'tu van', 'nhan dien',
    'so sanh', 'tuong dong', 'co the', 'duoc khong', 'ho tro', 'giup'
];

function includesPhrase(text, phrases = []) {
    const normalized = normalizeChatText(text);
    return phrases.some((phrase) => normalized.includes(normalizeChatText(phrase)));
}

function isImageSearchIntent(rawMessage) {
    const normalizedMessage = normalizeChatText(rawMessage);
    if (!normalizedMessage) {
        return false;
    }

    return includesPhrase(normalizedMessage, CHAT_IMAGE_SEARCH_HINTS)
        && includesPhrase(normalizedMessage, CHAT_IMAGE_SEARCH_ACTIONS);
}

function buildTextResult(conversationState, text, products = []) {
    return {
        conversationState,
        text,
        products
    };
}

function buildBrowseReply(turn) {
    const summary = buildPreferenceSummary(turn.activeFilters);

    if (!turn.activeFilters.category && !turn.activeFilters.gender && !turn.activeFilters.color && !turn.activeFilters.price_range && !turn.activeFilters.sku) {
        return 'Bạn muốn xem nhóm nào trước: nam, nữ hay trẻ em? Nếu có kiểu cụ thể như áo polo, quần jeans hoặc màu bạn thích thì mình sẽ lọc đúng hơn.';
    }

    return `Mình đã hiểu bạn đang tìm ${summary}. Bạn muốn mình gợi ý sản phẩm luôn không? Nếu muốn, chỉ cần nói “gợi ý giúp mình” hoặc “có mẫu nào không”.`;
}

function buildRecommendationDisabledReply(turn) {
    const summary = buildPreferenceSummary(turn.activeFilters);
    if (summary && summary !== 'sản phẩm') {
        return `Mình sẽ chưa gợi ý sản phẩm cho ${summary}. Khi nào cần, bạn chỉ cần nói “gợi ý giúp mình” là mình lọc ngay.`;
    }

    return 'Mình sẽ chưa gợi ý sản phẩm. Khi nào cần, bạn chỉ cần nói “gợi ý giúp mình” hoặc “có mẫu nào không”.';
}

function buildSupportReply(turn) {
    switch (turn.supportTopic?.id) {
        case 'shipping':
            return 'Shop hiện hỗ trợ giao hàng toàn quốc. Nếu bạn cần kiểm tra tình trạng đơn cụ thể hoặc khu vực giao chi tiết hơn, admin có thể hỗ trợ thêm.';
        case 'payment':
            return 'Shop hiện hỗ trợ COD, VNPay và MoMo. Nếu bạn cần hướng dẫn thanh toán cho một đơn cụ thể, mình có thể hỗ trợ tiếp.';
        case 'voucher':
            return 'Shop có hỗ trợ voucher và mã giảm giá khi có chương trình áp dụng. Nếu bạn có mã cụ thể, mình có thể giúp bạn kiểm tra thêm.';
        case 'account':
            return 'Mình có thể hỗ trợ các bước cơ bản về đăng nhập, đăng ký hoặc tài khoản. Nếu gặp lỗi cụ thể hơn, admin sẽ hỗ trợ thêm cho bạn.';
        case 'order':
            return 'Mình có thể hỗ trợ thông tin cơ bản về đơn hàng, đổi trả và hoàn tiền. Nếu bạn có mã đơn hoặc trường hợp cụ thể, admin sẽ kiểm tra nhanh hơn.';
        case 'image-search':
            return 'Bạn có thể gửi ảnh trực tiếp ngay trong khung chat. Khi có ảnh, mình sẽ đối chiếu với catalog để tìm mẫu gần nhất và sẽ nói rõ nếu shop chưa có mẫu đủ sát.';
        default:
            return 'Mình có thể hỗ trợ thông tin sản phẩm, tình trạng hàng, thanh toán, giao hàng hoặc gợi ý khi bạn yêu cầu. Bạn muốn mình kiểm tra phần nào trước?';
    }
}

function formatBreakdown(context) {
    return `nam ${context.breakdown.male}, nữ ${context.breakdown.female}, trẻ em ${context.breakdown.kids}`;
}

function buildCountReply(turn, context) {
    const summary = buildPreferenceSummary(turn.activeFilters);

    if (turn.isGlobalCatalogQuery || turn.mentionedGenders.length > 1 || (!turn.activeFilters.gender && !turn.activeFilters.category && !turn.activeFilters.color && !turn.activeFilters.price_range && !turn.activeFilters.sku)) {
        return `Hiện catalog đang có ${context.breakdown.total} sản phẩm đang hiển thị, trong đó còn hàng ${context.breakdown.in_stock} sản phẩm. Tách theo nhóm: ${formatBreakdown(context)}.`;
    }

    if (context.exactMatches.length === 0) {
        return `Mình vừa kiểm tra catalog: hiện chưa thấy ${summary} trong dữ liệu sản phẩm đang hiển thị.`;
    }

    if (context.inStockMatches.length === 0) {
        return `Mình vừa kiểm tra catalog: hiện có ${context.exactMatches.length} ${summary} trong dữ liệu, nhưng đang tạm hết hàng.`;
    }

    return `Mình vừa kiểm tra catalog: hiện có ${context.exactMatches.length} ${summary} đang hiển thị, trong đó còn hàng ${context.inStockMatches.length} sản phẩm.`;
}

function buildAvailabilityReply(turn, context) {
    const summary = buildPreferenceSummary(turn.activeFilters);

    if (context.inStockMatches.length > 0) {
        return `Mình vừa kiểm tra catalog: hiện có ${context.inStockMatches.length} ${summary} còn hàng. Nếu bạn muốn, mình có thể gợi ý đúng các mẫu này khi bạn yêu cầu.`;
    }

    if (context.exactMatches.length > 0) {
        return `Mình vừa kiểm tra catalog: có ${summary} trong dữ liệu sản phẩm, nhưng hiện các mẫu này đang tạm hết hàng.`;
    }

    if (turn.activeFilters.color && context.relaxedWithoutColorMatches.length > 0) {
        const colorText = context.availableColors.length
            ? ` Cùng dòng ${buildPreferenceSummary({ ...turn.activeFilters, color: null })}, shop đang có các màu ${context.availableColors.join(', ')}.`
            : '';
        return `Mình vừa kiểm tra catalog: hiện chưa thấy đúng ${summary}.${colorText}`.trim();
    }

    if (turn.activeFilters.price_range && context.relaxedWithoutPriceMatches.length > 0) {
        return `Mình vừa kiểm tra catalog: hiện chưa thấy đúng ${summary} trong tầm giá bạn nêu, nhưng shop vẫn có mẫu cùng nhóm sản phẩm ở mức giá khác.`;
    }

    if (turn.activeFilters.sku && context.relaxedWithoutSkuMatches.length > 0) {
        return `Mình chưa thấy đúng mã ${turn.activeFilters.sku} khớp toàn bộ tiêu chí hiện tại. Nếu bạn muốn, mình có thể kiểm tra lại theo màu hoặc nhóm sản phẩm trước.`;
    }

    return `Mình vừa kiểm tra catalog: hiện chưa thấy ${summary} trong dữ liệu sản phẩm đang hiển thị.`;
}

function buildInfoReply(turn, context) {
    if (turn.supportTopic) {
        return buildSupportReply(turn);
    }

    if (turn.explicitRecommendationDisabled && !turn.countQuery) {
        return buildRecommendationDisabledReply(turn);
    }

    if (turn.countQuery) {
        return buildCountReply(turn, context);
    }

    if (!turn.activeFilters.category && !turn.activeFilters.gender && !turn.activeFilters.color && !turn.activeFilters.price_range && !turn.activeFilters.sku) {
        return 'Mình có thể kiểm tra rất cụ thể theo màu, kiểu, nhóm nam/nữ/trẻ em hoặc khoảng giá. Bạn cứ nói ví dụ như “áo polo nam màu vàng” hoặc “váy nữ dưới 500k”.';
    }

    return buildAvailabilityReply(turn, context);
}

function buildNoRecommendationMatchReply(turn, context) {
    const summary = buildPreferenceSummary(turn.activeFilters);

    if (context.exactMatches.length > 0 && context.inStockMatches.length === 0) {
        return `Mình đã kiểm tra toàn bộ catalog và thấy ${summary} trong dữ liệu, nhưng hiện các mẫu đó đang tạm hết hàng.`;
    }

    if (turn.activeFilters.color && context.relaxedWithoutColorMatches.length > 0) {
        const baseSummary = buildPreferenceSummary({ ...turn.activeFilters, color: null });
        const colorText = context.availableColors.length
            ? ` Các màu đang có là ${context.availableColors.join(', ')}.`
            : '';
        return `Mình đã kiểm tra toàn bộ catalog và hiện chưa thấy đúng ${summary}.${baseSummary ? ` Cùng dòng ${baseSummary}, shop vẫn còn sản phẩm.` : ''}${colorText}`.trim();
    }

    if (turn.activeFilters.price_range && context.relaxedWithoutPriceMatches.length > 0) {
        return `Mình đã kiểm tra toàn bộ catalog và hiện chưa thấy đúng ${summary} trong tầm giá này, nhưng shop vẫn có mẫu cùng nhóm ở mức giá khác.`;
    }

    return `Mình đã kiểm tra toàn bộ catalog và hiện chưa thấy sản phẩm khớp đúng ${summary}. Bạn có thể đổi màu, nới tầm giá hoặc nói mẫu gần giống để mình lọc lại.`;
}

function buildRecommendationReply(turn, context) {
    const summary = buildPreferenceSummary(turn.activeFilters);

    if (!context.recommendedProducts.length) {
        return buildNoRecommendationMatchReply(turn, context);
    }

    return `Mình đã lọc ${context.recommendedProducts.length} sản phẩm phù hợp với ${summary}. Mình gửi ngay bên dưới để bạn xem nhanh.`;
}

async function generateChatCommerceReply({
    rawUserMessage,
    effectiveUserMessage,
    previousMessages = [],
    conversationState,
    attachments = []
}) {
    const messageForAnalysis = effectiveUserMessage || rawUserMessage || '';
    const turn = analyzeConversationTurn({
        userMessage: messageForAnalysis,
        previousState: conversationState,
        attachments
    });

    if (!attachments.length && isImageSearchIntent(rawUserMessage)) {
        return buildTextResult(
            turn.nextState,
            'Bạn cứ gửi ảnh trực tiếp ngay trong khung chat. Khi có ảnh, mình sẽ đối chiếu với catalog để tìm mẫu gần nhất và sẽ không gợi ý sai nếu shop chưa có mẫu đủ sát.'
        );
    }

    if (!messageForAnalysis && attachments.length > 0) {
        return buildTextResult(
            turn.nextState,
            'Mình đã nhận ảnh của bạn. Bạn muốn mình tìm mẫu tương tự luôn không? Nếu muốn, chỉ cần nói “gợi ý giúp mình từ ảnh này”.'
        );
    }

    if (turn.isGreetingOnly) {
        return buildTextResult(
            turn.nextState,
            'Mình có thể giúp bạn kiểm tra thông tin sản phẩm, lọc theo nhu cầu hoặc gợi ý khi bạn yêu cầu. Bạn đang tìm nam, nữ hay trẻ em?'
        );
    }

    if (turn.intent === 'browse') {
        if (turn.explicitRecommendationDisabled) {
            return buildTextResult(turn.nextState, buildRecommendationDisabledReply(turn));
        }

        return buildTextResult(turn.nextState, buildBrowseReply(turn));
    }

    if (turn.intent === 'unknown') {
        return buildTextResult(turn.nextState, buildSupportReply(turn));
    }

    const context = await buildCatalogContext(turn, { limit: 6 });

    if (turn.intent === 'ask_info') {
        return buildTextResult(turn.nextState, buildInfoReply(turn, context));
    }

    return buildTextResult(
        turn.nextState,
        buildRecommendationReply(turn, context),
        context.recommendedProducts
    );
}

module.exports = {
    generateChatCommerceReply
};
