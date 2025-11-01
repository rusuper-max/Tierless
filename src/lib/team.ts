// src/lib/team.ts
export type Role = "owner" | "designer" | "admin" | "viewer";
export type PlanId = "free" | "starter" | "pro" | "business";

export type DevProfile = {
  displayName: string;   // za pozdrav u UI
  title: string;         // opis uloge
  role: Role;
  plan: PlanId;
};

const mapEmail = (e?: string) => (e || "").trim().toLowerCase();

export const DEV_ACCOUNTS: Record<string, DevProfile> = {
  "rusuper@gmail.com": {
    displayName: "Aleksandar - Dev account",
    title: "Main developer",
    role: "owner",
    plan: "pro",
  },
  "jstevanoviic@gmail.com": {
    displayName: "Jelena - Dev account",
    title: "Main designer",
    role: "owner",      // ⬅ co-owner
    plan: "pro",        // ⬅ PRO, hteo sam standard, ali reko da ne plačeš puno :)
  },
};

export function getDevProfileByEmail(email?: string): DevProfile | undefined {
  return DEV_ACCOUNTS[mapEmail(email)];
}

export function getDevProfileByUserId(userId?: string): { email?: string; profile?: DevProfile } {
  if (!userId?.startsWith("dev:")) return {};
  const email = userId.slice(4);
  return { email, profile: getDevProfileByEmail(email) };
}