import fs from "fs/promises";
import path from "path";

const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

// Lokalno: ./data/users/...
// Vercel (prod): /tmp/tierless-data/users/...
const DATA_ROOT = isProd
  ? path.join("/tmp", "tierless-data")
  : path.join(process.cwd(), "data");

const USERS_ROOT = path.join(DATA_ROOT, "users");

function safeUserId(userId: string) {
  return (userId || "anon")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "anon";
}

function fileFor(userId: string, slug: string) {
  const uid = safeUserId(userId);
  return path.join(USERS_ROOT, uid, "full", `${slug}.json`);
}

export async function getFull(userId: string, slug: string) {
  const f = fileFor(userId, slug);
  try {
    const s = await fs.readFile(f, "utf8");
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

export async function putFull(userId: string, slug: string, calc: any) {
  const f = fileFor(userId, slug);
  await fs.mkdir(path.dirname(f), { recursive: true });
  await fs.writeFile(f, JSON.stringify(calc, null, 2), "utf8");
}

export async function deleteFull(userId: string, slug: string) {
  const f = fileFor(userId, slug);
  try {
    await fs.unlink(f);
  } catch {
    // ignore if not exists
  }
}

// Vrati prvi FULL kalkulator koji ima dati slug, bez obzira na korisnika
export async function findFullBySlug(slug: string) {
  const root = USERS_ROOT;
  let dirs: string[] = [];
  try {
    const ents = await fs.readdir(root, { withFileTypes: true });
    dirs = ents.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return undefined;
  }

  for (const uid of dirs) {
    const f = path.join(root, uid, "full", `${slug}.json`);
    try {
      const s = await fs.readFile(f, "utf8");
      return JSON.parse(s);
    } catch {
      // skip missing / invalid
    }
  }
  return undefined;
}