// src/lib/blobStore.ts
import { put, del, list as blobList } from "@vercel/blob";

export type Calc = { meta: { name: string; slug: string }; template?: string; config?: any };

const P = {
  mini: (uid: string) => `users/${uid}/mini.json`,
  full: (uid: string, slug: string) => `users/${uid}/full/${slug}.json`,
  pub:  (slug: string) => `public/${slug}.json`,
};

export function safeUserId(userId: string) {
  return (userId || "anon")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "anon";
}

export function slugify(s: string) {
  return (s || "page")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-")
    .slice(0, 60) || "page";
}

/** Čitanje JSON-a sa tačne putanje (bypass CDN keša) */
async function readByPathJSON(path: string): Promise<any | null> {
  const { blobs } = await blobList({ prefix: path, token: process.env.BLOB_READ_WRITE_TOKEN });
  const b = blobs.find((x) => x.pathname === path);
  if (!b) return null;

  // Preferiraj downloadUrl (signed); u suprotnom koristi url
  const baseUrl = (b as any).downloadUrl || b.url;
  const bust = baseUrl.includes("?") ? `&ts=${Date.now()}` : `?ts=${Date.now()}`;

  const headers: Record<string, string> = {};
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    headers.Authorization = `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`;
  }

  const r = await fetch(baseUrl + bust, { headers, cache: "no-store" });
  if (!r.ok) return null;
  try { return await r.json(); } catch { return null; }
}

/** Pisanje JSON-a (DEV forsira public) + omogućen overwrite + bez keša na CDN-u */
async function writeJSON(path: string, data: any, access: "public" | "private") {
  const forcePublic =
    process.env.NEXT_PUBLIC_BLOB_FORCE_PUBLIC === "1" || process.env.NODE_ENV !== "production";

  await put(path, JSON.stringify(data ?? {}), {
    token: process.env.BLOB_READ_WRITE_TOKEN,
    access: forcePublic ? "public" : access,
    contentType: "application/json; charset=utf-8",
    addRandomSuffix: false,   // fiksna putanja
    allowOverwrite: true,     // važan fix da Save radi
    cacheControlMaxAge: 0,    // <<< ključ: bez keša na CDN-u => instant čitanje
  } as any);
}

async function removePath(path: string) {
  await del(path, { token: process.env.BLOB_READ_WRITE_TOKEN } as any);
}

/* ---------- MINI ---------- */
async function readMini(uid: string): Promise<Calc[]> {
  const arr = await readByPathJSON(P.mini(uid));
  return Array.isArray(arr) ? (arr as Calc[]) : [];
}
async function writeMini(uid: string, rows: Calc[]) {
  await writeJSON(P.mini(uid), rows, "private");
}

function uniqueSlug(rows: Calc[], baseName: string) {
  const base = slugify(baseName);
  let slug = base; let i = 1;
  while (rows.some((r) => r.meta.slug === slug)) slug = `${base}-${++i}`;
  return slug;
}

/* ===== DASHBOARD API ===== */
export async function listCalcs(uid: string): Promise<Calc[]> {
  return await readMini(uid);
}
export async function get(uid: string, slug: string): Promise<Calc | undefined> {
  const rows = await readMini(uid);
  return rows.find((r) => r.meta.slug === slug);
}
export async function create(uid: string, name = "Untitled Page"): Promise<Calc> {
  const rows = await readMini(uid);
  const slug = uniqueSlug(rows, name);
  const row: Calc = { meta: { name, slug }, config: {} };
  rows.push(row);
  await writeMini(uid, rows);
  // inicijalni "full"
  await writeJSON(P.full(uid, slug), {
    meta:{ name, slug, branding:{ theme:"dark", accent:"#7c3aed", layout:"cards", hideBadge:false }},
    i18n:{ locale:"en", currency:"EUR", decimals:0 },
    pricingMode:"packages", packages:[], items:[], addons:[], fields:[], blocks:[],
  }, "private");
  return row;
}
export async function createFromTemplate(uid: string, templateSlug: string, name?: string) {
  const rows = await readMini(uid);
  const baseName = name?.trim() || templateSlug || "New Page";
  const slug = uniqueSlug(rows, baseName);
  const row: Calc = { meta: { name: baseName, slug }, template: templateSlug, config: {} };
  rows.push(row);
  await writeMini(uid, rows);
  await writeJSON(P.full(uid, slug), {
    meta:{ name: baseName, slug, branding:{ theme:"dark", accent:"#7c3aed", layout:"cards", hideBadge:false }},
    i18n:{ locale:"en", currency:"EUR", decimals:0 },
    pricingMode:"packages", packages:[], items:[], addons:[], fields:[], blocks:[],
  }, "private");
  return row;
}
export async function duplicate(uid: string, fromSlug: string, newName: string) {
  const src = await getFull(uid, fromSlug);
  if (!src) return undefined;
  const rows = await readMini(uid);
  const baseName = newName || `Copy of ${src?.meta?.name ?? fromSlug}`;
  const slug = uniqueSlug(rows, baseName);
  const row: Calc = { meta: { name: baseName, slug }, template: src.template, config: src.config ?? {} };
  rows.push(row);
  await writeMini(uid, rows);
  const next = { ...src, meta: { ...src.meta, name: baseName, slug } };
  await writeJSON(P.full(uid, slug), next, "private");
  return slug;
}
export async function remove(uid: string, slug: string) {
  const rows = await readMini(uid);
  const next = rows.filter((r) => r.meta.slug !== slug);
  const changed = next.length !== rows.length;
  if (changed) {
    await writeMini(uid, next);
    await removePath(P.full(uid, slug)).catch(() => {});
  }
  return changed;
}
export async function updateName(uid: string, slug: string, newName: string) {
  const rows = await readMini(uid);
  const row = rows.find((r) => r.meta.slug === slug);
  if (!row) return false;
  if (row.meta.name !== newName) {
    row.meta.name = newName;
    await writeMini(uid, rows);
    const full = await getFull(uid, slug);
    if (full) {
      full.meta = { ...full.meta, name: newName };
      await writeJSON(P.full(uid, slug), full, "private");
    }
  }
  return true;
}

/* ===== FULL (editor) ===== */
export async function getFull(uid: string, slug: string) {
  return await readByPathJSON(P.full(uid, slug));
}
export async function putFull(uid: string, slug: string, data: any) {
  await writeJSON(P.full(uid, slug), data, "private");
}
export async function deleteFull(uid: string, slug: string) {
  await removePath(P.full(uid, slug));
}

/* ===== PUBLIC ===== */
export async function putPublic(slug: string, data: any) {
  await writeJSON(P.pub(slug), data, "public");
}
export async function getPublic(slug: string) {
  return await readByPathJSON(P.pub(slug));
}