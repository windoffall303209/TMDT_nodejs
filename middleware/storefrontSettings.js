// Nạp cấu hình storefront toàn cục để view có layout, theme và nội dung động.
const StorefrontSetting = require('../models/StorefrontSetting');

const SETTINGS_CACHE_TTL_MS = 30 * 1000;

let cachedSettings = null;
let cacheExpiresAt = 0;
let pendingLoad = null;

// Nạp storefront settings.
async function loadStorefrontSettings() {
    const now = Date.now();
    if (cachedSettings && now < cacheExpiresAt) {
        return cachedSettings;
    }

    if (!pendingLoad) {
        pendingLoad = StorefrontSetting.getAll()
            .then((settings) => {
                cachedSettings = settings;
                cacheExpiresAt = Date.now() + SETTINGS_CACHE_TTL_MS;
                return cachedSettings;
            })
            .finally(() => {
                pendingLoad = null;
            });
    }

    return pendingLoad;
}

// Xử lý invalidate storefront settings cache.
function invalidateStorefrontSettingsCache() {
    cachedSettings = null;
    cacheExpiresAt = 0;
    pendingLoad = null;
}

// Xử lý storefront settings.
async function storefrontSettings(req, res, next) {
    try {
        const settings = await loadStorefrontSettings();
        req.storefrontSettings = settings;
        res.locals.storefrontSettings = settings;
    } catch (error) {
        console.error('Storefront settings middleware error:', error);
        const fallbackSettings = StorefrontSetting.getDefaultSettings();
        req.storefrontSettings = fallbackSettings;
        res.locals.storefrontSettings = fallbackSettings;
    }

    next();
}

module.exports = {
    storefrontSettings,
    invalidateStorefrontSettingsCache
};
