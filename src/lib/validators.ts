// src/lib/validators.ts

/**
 * Validates Balkan phone numbers (Serbia, Bosnia, Croatia, etc.)
 * Accepts formats: +381123456789, +38761234567, 061234567
 */
export function isValidBalkanPhone(phone: string): boolean {
    if (!phone) return false;
    const clean = phone.replace(/[\s\-()]/g, "");

    // Must start with + or 0, and contain only digits after cleaning
    if (!/^[\+0]\d+$/.test(clean)) return false;

    // Balkan country codes: +381 (Serbia), +387 (Bosnia), +385 (Croatia), +382 (Montenegro), +383 (Kosovo), +386 (Slovenia), +389 (North Macedonia)
    const balkanPattern = /^(\+?(381|387|385|382|383|386|389)|0)(6|7)\d{6,8}$/;

    return balkanPattern.test(clean);
}

/**
 * Validates international phone numbers
 * Accepts format: +[country code][number]
 */
export function isValidInternationalPhone(phone: string): boolean {
    if (!phone) return false;
    const clean = phone.replace(/[\s\-()]/g, "");

    // Must start with + and have 10-15 digits
    const intlPattern = /^\+\d{10,15}$/;

    return intlPattern.test(clean);
}

/**
 * Validates Telegram usernames
 * - Must be 5-32 characters
 * - Can contain a-z, 0-9, underscores
 * - Cannot start with a number
 * - Cannot end with underscore
 * - Cannot contain two consecutive underscores
 */
export function isValidTelegramUsername(username: string): boolean {
    if (!username) return false;

    // Remove @ if present
    const clean = username.replace(/^@/, "");

    // Check length
    if (clean.length < 5 || clean.length > 32) return false;

    // Check format: alphanumeric + underscores, cannot start with number, cannot end with underscore, no consecutive underscores
    if (!/^[a-zA-Z][a-zA-Z0-9_]*[a-zA-Z0-9]$/.test(clean)) return false;
    if (/__/.test(clean)) return false;

    return true;
}

/**
 * Normalizes a phone number to international format (digits only, with +)
 */
export function normalizePhone(phone: string): string {
    if (!phone) return "";
    let clean = phone.replace(/[\s\-()]/g, "");

    // If starts with 0, try to add Balkan country code
    if (clean.startsWith("0") && clean.length >= 9) {
        // Default to Serbia +381 if ambiguous
        clean = "+381" + clean.slice(1);
    }

    // Ensure it starts with +
    if (!clean.startsWith("+")) {
        clean = "+" + clean;
    }

    return clean.replace(/[^\d+]/g, "");
}

/**
 * Normalizes Telegram username (removes @ and converts to lowercase)
 */
export function normalizeTelegramUsername(username: string): string {
    if (!username) return "";
    return username.replace(/^@/, "").toLowerCase().trim();
}
