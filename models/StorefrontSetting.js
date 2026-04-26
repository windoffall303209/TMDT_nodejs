// Model truy vấn và chuẩn hóa dữ liệu storefrontsetting trong MySQL.
const pool = require('../config/database');

const SETTING_DEFINITIONS = {
    product_grid_columns: {
        type: 'int',
        defaultValue: 5,
        min: 2,
        max: 6
    },
    home_category_showcase_count: {
        type: 'int',
        defaultValue: 3,
        min: 1,
        max: 8
    },
    jwt_expire_minutes: {
        type: 'int',
        defaultValue: 60,
        min: 5,
        max: 43200
    },
    payment_window_hours: {
        type: 'int',
        defaultValue: 24,
        min: 1,
        max: 168
    },
    default_web_email: {
        type: 'string',
        defaultValue: 'nvuthanh4@gmail.com',
        maxLength: 160
    }
};

// Xử lý clamp integer.
function clampInteger(value, { defaultValue, min, max }) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed)) {
        return defaultValue;
    }

    return Math.min(max, Math.max(min, parsed));
}

class StorefrontSetting {
    // Lấy definitions.
    static getDefinitions() {
        return { ...SETTING_DEFINITIONS };
    }

    // Lấy default cài đặt.
    static getDefaultSettings() {
        return Object.entries(SETTING_DEFINITIONS).reduce((settings, [key, definition]) => {
            settings[key] = definition.defaultValue;
            return settings;
        }, {});
    }

    // Chuẩn hóa giá trị.
    static normalizeValue(key, rawValue) {
        const definition = SETTING_DEFINITIONS[key];
        if (!definition) {
            return null;
        }

        if (definition.type === 'string') {
            const value = String(rawValue ?? '').trim() || definition.defaultValue;
            return value.slice(0, definition.maxLength || 255);
        }

        return clampInteger(rawValue, definition);
    }

    // Thao tác với hydrate cài đặt.
    static hydrateSettings(rows = []) {
        const settings = this.getDefaultSettings();
        const knownKeys = new Set(Object.keys(SETTING_DEFINITIONS));

        (rows || []).forEach((row) => {
            const key = row?.setting_key;
            if (!knownKeys.has(key)) {
                return;
            }

            settings[key] = this.normalizeValue(key, row.setting_value);
        });

        return settings;
    }

    // Lấy tất cả.
    static async getAll() {
        const keys = Object.keys(SETTING_DEFINITIONS);
        if (keys.length === 0) {
            return {};
        }

        const placeholders = keys.map(() => '?').join(', ');

        try {
            const [rows] = await pool.execute(
                `SELECT setting_key, setting_value
                 FROM storefront_settings
                 WHERE setting_key IN (${placeholders})`,
                keys
            );

            return this.hydrateSettings(rows);
        } catch (error) {
            if (error?.code === 'ER_NO_SUCH_TABLE') {
                return this.getDefaultSettings();
            }

            throw error;
        }
    }

    // Cập nhật many.
    static async updateMany(nextValues = {}) {
        const keysToUpdate = Object.keys(SETTING_DEFINITIONS)
            .filter((key) => Object.prototype.hasOwnProperty.call(nextValues, key));

        if (keysToUpdate.length === 0) {
            return this.getAll();
        }

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            for (const key of keysToUpdate) {
                const normalizedValue = this.normalizeValue(key, nextValues[key]);
                await connection.execute(
                    `INSERT INTO storefront_settings (setting_key, setting_value, value_type)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        setting_value = VALUES(setting_value),
                        value_type = VALUES(value_type)`,
                    [key, String(normalizedValue), SETTING_DEFINITIONS[key].type || 'int']
                );
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        return this.getAll();
    }
}

module.exports = StorefrontSetting;
