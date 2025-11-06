// Minimalni “source of truth” za plan korisnika (JSON po korisniku)
import { promises as fs } from "fs";
import path from "path";
import { coercePlan, type Plan } from "@/lib/auth";

const ROOT = path.join(process.cwd(), "data", "users");

function fileFor(email: string) {
  const safe = email.replace(/[^a-z0-9._-]/gi, "_").toLowerCase();
  return path.join(ROOT, safe, "account.json");
}

export async function getUserPlan(email: string): Promise<Plan> {
  try {
    const f = fileFor(email);
    const raw = await fs.readFile(f, "utf8");
    const j = JSON.parse(raw);
    return coercePlan(j?.plan);
  } catch {
    return "free";
  }
}

export async function setUserPlan(email: string, plan: Plan): Promise<void> {
  const f = fileFor(email);
  await fs.mkdir(path.dirname(f), { recursive: true });
  await fs.writeFile(f, JSON.stringify({ plan }, null, 2), "utf8");
}