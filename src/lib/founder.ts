/**
 * Founder Account Utilities
 * Provides special privileges for founder/CEO accounts
 */

// Founder emails (whitelisted)
// These emails get unlimited access to all features
const FOUNDER_EMAILS = process.env.FOUNDER_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];

/**
 * Check if an email is a founder account
 */
export function isFounder(email: string | null | undefined): boolean {
    if (!email) return false;
    return FOUNDER_EMAILS.includes(email.toLowerCase());
}

/**
 * Get the plan for a founder account
 * Founders always get the "tierless" plan
 */
export function getFounderPlan(): 'tierless' {
    return 'tierless';
}

/**
 * Check if a user should be auto-upgraded to founder plan
 */
export function shouldAutoUpgradeToFounder(email: string | null | undefined): boolean {
    return isFounder(email);
}
