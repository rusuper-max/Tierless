// src/lib/validators.ts
// Zod validation schemas for API input validation
// These schemas match the types in @/types/editor.ts

import { z } from "zod";

// ============================================================================
// BASIC TYPES
// ============================================================================

export const ModeSchema = z.enum(["setup", "simple", "advanced"]);

export const BrandThemeSchema = z.enum([
  "tierless", "minimal", "luxury", "elegant", "midnight", "cafe",
  "ocean", "forest", "sunset", "rosegold", "emerald", "sapphire",
  "obsidian", "goldluxury", "classic", "custom", "light", "dark"
]);

export const ContactTypeSchema = z.enum(["email", "whatsapp", "telegram"]);

// ============================================================================
// NESTED OBJECTS
// ============================================================================

export const FeatureOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  highlighted: z.boolean().optional(),
});

export const ExtraSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  price: z.number().optional(),
  selected: z.boolean().optional(),
});

export const RangePricingSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("linear"), deltaPerUnit: z.number() }),
  z.object({ mode: z.literal("per-step"), perStep: z.array(z.number()) }),
]);

export const OptionGroupSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  type: z.enum(["features", "range", "options"]),
  pkgId: z.string().optional(),
  options: z.array(FeatureOptionSchema).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  unit: z.string().optional(),
  base: z.number().optional(),
  pricing: RangePricingSchema.optional(),
  color: z.string().optional(),
}).passthrough(); // Allow additional fields

export const PkgSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  basePrice: z.number().nullable(),
  description: z.string().optional(),
  featured: z.boolean().optional(),
  color: z.string().optional(),
}).passthrough(); // Allow additional fields

export const SocialNetworksSchema = z.object({
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  threads: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
  telegram: z.string().optional(),
  whatsapp: z.string().optional(),
  website: z.string().optional(),
}).passthrough();

export const BusinessInfoSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().optional(),
  wifiSsid: z.string().optional(),
  wifiPass: z.string().optional(),
  hours: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  logoPublicId: z.string().optional(),
  coverUrl: z.string().url().optional().or(z.literal("")),
  coverPublicId: z.string().optional(),
  social: SocialNetworksSchema.optional(),
}).passthrough();

export const FloatingCtaSchema = z.object({
  enabled: z.boolean(),
  label: z.string(),
  link: z.string(),
});

export const SimpleSectionSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional(),
  videoUrl: z.string().optional(), // Pro video feature
  collapsed: z.boolean().optional(),
}).passthrough(); // Allow additional fields to be preserved

export const ItemRowSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  price: z.number().nullable(),
  note: z.string().optional(),
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional(),
  simpleSectionId: z.string().optional(),
  hidden: z.boolean().optional(),
  soldOut: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  badge: z.string().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  unit: z.string().optional(),
  customUnit: z.string().optional(),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  duration: z.string().optional(),
  pricePrefix: z.string().optional(),
}).passthrough(); // Allow additional fields to be preserved

export const ContactInfoSchema = z.object({
  type: ContactTypeSchema.optional(),
  whatsapp: z.string().optional(),
  telegram: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
}).passthrough();

// ============================================================================
// CALC META
// ============================================================================

export const CalcMetaSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  slug: z.string().optional(),
  editorMode: ModeSchema.optional(),
  theme: BrandThemeSchema.optional(),
  business: BusinessInfoSchema.optional(),
  cta: FloatingCtaSchema.optional(),
  simpleCoverImage: z.string().optional(),
  simpleSections: z.array(SimpleSectionSchema).optional(),
  simpleSectionStates: z.record(z.string(), z.boolean()).optional(),
  simpleBg: z.string().optional(),
  simpleBgGrad1: z.string().optional(),
  simpleBgGrad2: z.string().optional(),
  simpleTextColor: z.string().optional(),
  simpleBorderColor: z.string().optional(),
  simpleFont: z.string().optional(),
  autosaveEnabled: z.boolean().optional(),
  autosaveInterval: z.number().optional(),
  contactOverride: ContactInfoSchema.optional(),
  contact: ContactInfoSchema.optional(),
  // Simple mode specific
  simpleTitle: z.string().optional(),
  simpleEnableCalculations: z.boolean().optional(),
  simpleAddCheckout: z.boolean().optional(),
  simpleCheckoutButtonText: z.string().optional(),
  simpleDisplayMode: z.enum(["accordion", "scroll"]).optional(),
  imageLayout: z.enum(["cover", "thumbnail", "none"]).optional(),
  // Rating
  allowRating: z.boolean().optional(),
  listInExamples: z.boolean().optional(),
  // Publish state
  published: z.boolean().optional(),
}).passthrough(); // Allow additional fields

// ============================================================================
// FULL CALC JSON
// ============================================================================

export const CalcJsonSchema = z.object({
  meta: CalcMetaSchema,
  packages: z.array(PkgSchema).default([]),
  fields: z.array(OptionGroupSchema).default([]),
  addons: z.array(ExtraSchema).default([]),
  items: z.array(ItemRowSchema).optional(),
  i18n: z.object({
    currency: z.string().optional(),
    decimals: z.number().optional(),
  }).optional(),
}).passthrough();

// ============================================================================
// API REQUEST SCHEMAS
// ============================================================================

/**
 * Schema for PUT /api/calculators/[slug] - Editor save
 */
export const EditorSaveSchema = z.object({
  full: CalcJsonSchema,
  meta: CalcMetaSchema.optional(), // Optional separate meta update
});

/**
 * Schema for POST /api/publish - Publish flow
 */
export const PublishRequestSchema = z.object({
  slug: z.string().min(1),
  publish: z.boolean().optional(),
});

/**
 * Schema for POST /api/calculators - Create new
 */
export const CreateCalcSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  template: z.string().optional(),
});

/**
 * Schema for POST /api/calculators/[slug]/rename
 */
export const RenameCalcSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).optional(),
});

// ============================================================================
// VALIDATION HELPER
// ============================================================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; issues: z.ZodIssue[] };

/**
 * Validate request body against a Zod schema.
 * Returns a structured result with parsed data or error details.
 */
export function validateBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  const result = schema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format error message
  const issues = result.error.issues;
  const errorMessages = issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });

  return {
    success: false,
    error: `Validation failed: ${errorMessages.slice(0, 3).join("; ")}`,
    issues,
  };
}

/**
 * Create a 422 response for validation errors
 */
export function validationErrorResponse(result: ValidationResult<unknown>) {
  if (result.success) {
    throw new Error("Cannot create error response for successful validation");
  }

  return {
    error: "validation_error",
    message: result.error,
    issues: result.issues.slice(0, 10), // Limit issues in response
  };
}
