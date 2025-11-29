import { cookies } from "next/headers";
import crypto from "crypto";
import { getUserIdFromRequest } from "@/lib/auth";

const RATING_SALT = process.env.RATING_SALT || "rating_salt_change_me_in_prod";
const VOTER_COOKIE_NAME = "tl_sid";
const VOTER_COOKIE_MAX_AGE = 400 * 24 * 60 * 60; // 400 days

export type VoterIdentity = {
    voterKey: string;
    userId: string | null;
    ipHash: string;
};

export function hashIp(ip: string): string {
    return crypto
        .createHash("sha256")
        .update(ip + RATING_SALT)
        .digest("hex");
}

export function getClientIp(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return "127.0.0.1"; // Fallback
}

export async function getVoterIdentity(req: Request): Promise<VoterIdentity> {
    const userId = await getUserIdFromRequest(req);
    const ip = getClientIp(req);
    const ipHash = hashIp(ip);

    // If user is logged in, voterKey is userId
    if (userId) {
        return { voterKey: userId, userId, ipHash };
    }

    // If not logged in, check for tl_sid cookie
    const cookieStore = await cookies();
    let sid = cookieStore.get(VOTER_COOKIE_NAME)?.value;

    // If no cookie, we will generate one later or use a placeholder if this is just a read
    // But for writing, we need a stable ID.
    // If we are just reading status, we might return a temporary key or null logic upstream.
    // Here we return what we have.

    if (!sid) {
        // If we are in an API route that intends to SET the cookie, we might generate it here
        // but we can't set cookies in a helper easily without returning it.
        // So we'll return a generated one and let the API route set the cookie.
        sid = crypto.randomUUID();
    }

    return { voterKey: sid, userId: null, ipHash };
}

export async function ensureVoterCookie(resHeaders: Headers, currentSid: string) {
    // We can't easily check if the cookie is already set in the RESPONSE headers here
    // unless we pass the request cookies too.
    // But usually we just set it again to extend validity.

    resHeaders.append(
        "Set-Cookie",
        `${VOTER_COOKIE_NAME}=${currentSid}; Path=/; Max-Age=${VOTER_COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`
    );
}
