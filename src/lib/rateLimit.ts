// src/lib/rateLimit.ts
// Hybrid rate limiter: Uses Upstash Redis in production, falls back to in-memory for development
// For production with multiple instances, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ============================================
// CONFIGURATION
// ============================================

export type RateLimitConfig = {
  /** Unique identifier for this limiter (e.g., "login", "ocr") */
  id: string;
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
};

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
};

// ============================================
// UPSTASH REDIS SETUP (if configured)
// ============================================

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let redis: Redis | null = null;
const upstashLimiters = new Map<string, Ratelimit>();

if (hasRedis) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    console.log("[rateLimit] Using Upstash Redis for rate limiting");
  } catch (e) {
    console.warn("[rateLimit] Failed to connect to Upstash Redis, falling back to in-memory", e);
  }
}

function getUpstashLimiter(config: RateLimitConfig): Ratelimit | null {
  if (!redis) return null;

  const key = `${config.id}:${config.limit}:${config.windowSeconds}`;
  if (!upstashLimiters.has(key)) {
    upstashLimiters.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
        prefix: `ratelimit:${config.id}`,
        analytics: true,
      })
    );
  }
  return upstashLimiters.get(key)!;
}

// ============================================
// IN-MEMORY FALLBACK
// ============================================

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

// In-memory store (cleared on server restart)
const memoryStore = new Map<string, RateLimitRecord>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (record.resetAt < now) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

function checkMemoryRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${config.id}:${identifier}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let record = memoryStore.get(key);

  // If no record or window expired, create new
  if (!record || record.resetAt < now) {
    record = {
      count: 1,
      resetAt: now + windowMs,
    };
    memoryStore.set(key, record);
    return {
      success: true,
      remaining: config.limit - 1,
      resetAt: record.resetAt,
    };
  }

  // Increment count
  record.count++;

  // Check if over limit
  if (record.count > config.limit) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfterSeconds,
    };
  }

  return {
    success: true,
    remaining: config.limit - record.count,
    resetAt: record.resetAt,
  };
}

// ============================================
// MAIN RATE LIMIT FUNCTION
// ============================================

/**
 * Check rate limit for a given identifier (IP, userId, etc.)
 * Uses Upstash Redis if configured, falls back to in-memory otherwise
 */
export async function checkRateLimitAsync(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const upstashLimiter = getUpstashLimiter(config);

  if (upstashLimiter) {
    try {
      const result = await upstashLimiter.limit(identifier);
      return {
        success: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
        retryAfterSeconds: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch (e) {
      console.warn("[rateLimit] Upstash Redis error, falling back to in-memory", e);
      // Fall through to in-memory
    }
  }

  return checkMemoryRateLimit(identifier, config);
}

/**
 * Synchronous rate limit check (in-memory only)
 * For backwards compatibility - prefer checkRateLimitAsync for production
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  // If Redis is configured, we should use async version
  // But for sync compatibility, use in-memory
  return checkMemoryRateLimit(identifier, config);
}

// ============================================
// UTILITIES
// ============================================

/**
 * Get client IP from request headers
 */
export function getClientIP(req: Request): string {
  // Vercel
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  // Cloudflare
  const cfIP = req.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;

  // Real IP header
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP;

  return "unknown";
}

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
    ...(result.retryAfterSeconds
      ? { "Retry-After": String(result.retryAfterSeconds) }
      : {}),
  };
}

/**
 * Check if Upstash Redis is configured and available
 */
export function isRedisConfigured(): boolean {
  return hasRedis && redis !== null;
}

/**
 * Get Redis instance for other uses (webhook deduplication, etc.)
 */
export function getRedis(): Redis | null {
  return redis;
}

// ============================================
// PRE-CONFIGURED LIMITERS
// ============================================

/** Login: 5 requests per minute per IP */
export const LOGIN_LIMIT: RateLimitConfig = {
  id: "login",
  limit: 5,
  windowSeconds: 60,
};

/** Signup: 3 requests per 5 minutes per IP (strict to prevent abuse) */
export const SIGNUP_LIMIT: RateLimitConfig = {
  id: "signup",
  limit: 3,
  windowSeconds: 300,
};

/** Auth verify: 10 requests per minute per IP (prevent token brute-forcing) */
export const AUTH_VERIFY_LIMIT: RateLimitConfig = {
  id: "auth-verify",
  limit: 10,
  windowSeconds: 60,
};

/** OCR: 20 requests per hour per IP (additional user-level limit elsewhere) */
export const OCR_LIMIT: RateLimitConfig = {
  id: "ocr",
  limit: 20,
  windowSeconds: 3600,
};

/** Stats POST: 100 requests per minute per IP */
export const STATS_LIMIT: RateLimitConfig = {
  id: "stats",
  limit: 100,
  windowSeconds: 60,
};

/** Rating: 10 per minute per IP (prevents rating spam) */
export const RATING_LIMIT: RateLimitConfig = {
  id: "rating",
  limit: 10,
  windowSeconds: 60,
};

/** Generic API: 60 requests per minute per IP */
export const API_LIMIT: RateLimitConfig = {
  id: "api",
  limit: 60,
  windowSeconds: 60,
};

/** Webhook: 1000 requests per minute (high limit for webhooks) */
export const WEBHOOK_LIMIT: RateLimitConfig = {
  id: "webhook",
  limit: 1000,
  windowSeconds: 60,
};
