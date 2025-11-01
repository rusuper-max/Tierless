import { z } from "zod";

export const FieldSlider = z.object({
  key: z.string(),
  type: z.literal("slider"),
  label: z.string(),
  min: z.number(),
  max: z.number(),
  step: z.number(),
  default: z.number(),
  deltaPerUnit: z.number().optional(),
});

export const FieldSelect = z.object({
  key: z.string(),
  type: z.literal("select"),
  label: z.string(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    delta: z.number(),
  })),
  default: z.string(),
});

export const FieldCheckbox = z.object({
  key: z.string(),
  type: z.literal("checkbox"),
  label: z.string(),
  delta: z.number(),
  default: z.boolean().optional(),
});

export const FieldSchema = z.discriminatedUnion("type", [
  FieldSlider, FieldSelect, FieldCheckbox,
]);

const AddonFixed = z.object({
  id: z.string(),
  label: z.string(),
  type: z.literal("fixed"),
  value: z.number(),
  recommended: z.boolean().optional(),
});

const AddonUnit = z.object({
  id: z.string(),
  label: z.string(),
  type: z.literal("unit"),
  unitLabel: z.string(),
  unitPrice: z.number(),
  min: z.number(),
  max: z.number(),
  step: z.number(),
});

export const AddonSchema = z.discriminatedUnion("type", [
  AddonFixed, AddonUnit,
]);

export const PackageSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  basePrice: z.number().nullable().optional(),
  featured: z.boolean().optional(),
  covers: z.array(z.object({
    text: z.string(),
    premium: z.boolean().optional(),
  })).optional(),
});

export const CalculatorSchema = z.object({
  meta: z.object({
    name: z.string(),
    slug: z.string(),
    branding: z.object({
      theme: z.enum(["light", "dark"]),
      accent: z.string(),
      layout: z.enum(["cards", "list"]),
      logoUrl: z.string().url().optional(),
    }),
  }),
  i18n: z.object({
    locale: z.string(),
    currency: z.string(),
    decimals: z.number(),
  }),
  packages: z.array(PackageSchema),
  addons: z.array(AddonSchema),
  fields: z.array(FieldSchema),
});

export type CalculatorInput = z.infer<typeof CalculatorSchema>;