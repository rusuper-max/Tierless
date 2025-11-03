// src/lib/plan-cookie.ts
import type { PlanId } from "@/lib/entitlements";

const ALL: PlanId[] = ["free","starter","growth","pro","tierless"];

export function getPlanFromReq(req: Request): PlanId {
  try {
    const cookie = req.headers.get("cookie") || "";
    const part = cookie.split(/;\s*/).find(s => s.startsWith("tl_plan="));
    const raw  = part ? decodeURIComponent((part.split("=")[1] || "").trim()) : "";
    const k = raw.toLowerCase() as PlanId;
    return ALL.includes(k) ? k : "free";
  } catch {
    return "free";
  }
}