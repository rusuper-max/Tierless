/**
 * Environment Configuration - Single Source of Truth
 * 
 * All environment variables should be accessed through this module.
 * The application will fail fast if required variables are missing in production.
 */
import { z } from "zod";

// === Schema Definition ===

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Database (Required in production)
  DATABASE_URL: z.string().url().optional(),
  
  // Authentication
  SESSION_SECRET: z.string().min(32).optional(),
  SESSION_COOKIE_NAME: z.string().default("tl_sess"),
  
  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // Cloudinary (Image uploads)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  
  // Domain configuration
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().default("tierless.net"),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  
  // Vercel-specific
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  
  // Storage backend - Postgres only (Blob removed in Phase 2)
  // Accept any value but always use "pg" - legacy env vars might still have "blob" or "local"
  DATA_BACKEND: z.string().optional().transform(() => "pg" as const),
  
  // OpenAI (for OCR)
  OPENAI_API_KEY: z.string().optional(),
  
  // Payments (LemonSqueezy)
  LEMON_API_KEY: z.string().optional(),
  LEMON_WEBHOOK_SECRET: z.string().optional(),
  LEMON_STORE_ID: z.string().optional(),
});

// === Environment Parsing ===

type EnvSchema = z.infer<typeof envSchema>;

// Skip validation in CI builds (for build checks without real env)
const SKIP_ENV_VALIDATION = process.env.SKIP_ENV_VALIDATION === "1";

function parseEnv(): EnvSchema {
  if (SKIP_ENV_VALIDATION) {
    console.log("⚠️ Skipping env validation (SKIP_ENV_VALIDATION=1)");
    return envSchema.parse(process.env);
  }
  
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    
    // In production, fail fast
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL: Invalid environment configuration. " +
        "Check server logs for details."
      );
    }
    
    // In development, warn but continue with defaults
    console.warn("⚠️ Continuing with partial environment in development mode");
    return envSchema.parse(process.env);
  }
  
  return parsed.data;
}

// Parse once at module load
const env = parseEnv();

// === Production Validation ===

function validateProduction() {
  // Skip validation in CI builds
  if (SKIP_ENV_VALIDATION) return;
  if (env.NODE_ENV !== "production") return;
  
  const errors: string[] = [];
  
  // Required in production
  if (!env.DATABASE_URL) {
    errors.push("DATABASE_URL is required in production");
  }
  
  if (!env.SESSION_SECRET) {
    errors.push("SESSION_SECRET is required in production (min 32 chars)");
  }
  
  if (!env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY not set - email sending will fail");
  }
  
  if (errors.length > 0) {
    console.error("❌ Production environment validation failed:");
    errors.forEach(e => console.error(`  - ${e}`));
    throw new Error(
      "FATAL: Missing required environment variables in production. " +
      `Missing: ${errors.join(", ")}`
    );
  }
  
  console.log("✅ Production environment validated");
}

// Run production validation
validateProduction();

// === Exports ===

// Core flags
export const IS_DEV = env.NODE_ENV !== "production";
export const IS_PRODUCTION = env.NODE_ENV === "production";
export const IS_PREVIEW = env.VERCEL_ENV === "preview";

// Database
export const DATABASE_URL = env.DATABASE_URL;

// Auth
export const SESSION_SECRET = env.SESSION_SECRET;
export const SESSION_COOKIE_NAME = env.SESSION_COOKIE_NAME;

// Email
export const RESEND_API_KEY = env.RESEND_API_KEY;
export const EMAIL_FROM = env.EMAIL_FROM || "noreply@tierless.net";

// Cloudinary
export const CLOUDINARY_CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = env.CLOUDINARY_API_SECRET;

// Domain
export const ROOT_DOMAIN = env.NEXT_PUBLIC_ROOT_DOMAIN;
export const BASE_URL = env.NEXT_PUBLIC_BASE_URL || 
  (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : `https://${ROOT_DOMAIN}`);

// Storage - Postgres only (Blob removed)
export const DATA_BACKEND = "pg" as const;
export const isPostgres = () => true;

// OpenAI
export const OPENAI_API_KEY = env.OPENAI_API_KEY;

// Payments
export const LEMON_API_KEY = env.LEMON_API_KEY;
export const LEMON_WEBHOOK_SECRET = env.LEMON_WEBHOOK_SECRET;
export const LEMON_STORE_ID = env.LEMON_STORE_ID;

// Full env object (for advanced use cases)
export { env };

// Type export
export type { EnvSchema };
