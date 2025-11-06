import { ENTITLEMENTS } from "@/lib/entitlements";

/** Literalni niz plan ključeva izveden iz ENTITLEMENTS */
export const PLANS = Object.keys(ENTITLEMENTS) as (keyof typeof ENTITLEMENTS)[];

/** Tip plana = bilo koji ključ iz ENTITLEMENTS */
export type Plan = keyof typeof ENTITLEMENTS;

/** Sigurna normalizacija plana (nepoznato => "free") */
export function coercePlan(input: unknown): Plan {
  const k = typeof input === "string" ? input : "free";
  return (k in ENTITLEMENTS ? k : "free") as Plan;
}