// src/lib/publicStore.ts
import { promises as fs } from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "data", "public");

async function ensureDir() {
  await fs.mkdir(ROOT, { recursive: true }).catch(() => {});
}

async function writeJson(file: string, obj: any) {
  await fs.writeFile(file, JSON.stringify(obj, null, 2), "utf8");
}

async function readJson(file: string): Promise<any | null> {
  try {
    const txt = await fs.readFile(file, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

/**
 * Upis u public storage.
 * Možeš pozvati sa ključem (id ili slug) ili samo sa celim calc objektom.
 * Uvek pokušamo da upišemo i po id-u i po slug-u ako postoje.
 */
export async function putPublic(keyOrCalc: string | any, maybeCalc?: any): Promise<boolean> {
  await ensureDir();

  const calc = typeof keyOrCalc === "string" ? maybeCalc : keyOrCalc;
  const key  = typeof keyOrCalc === "string" ? keyOrCalc : "";

  if (!calc || typeof calc !== "object") return false;

  const id   = (calc?.meta?.id ?? "").toString().trim();
  const slug = (calc?.meta?.slug ?? "").toString().trim();

  // 1) ako je prosleđen konkretan ključ (id ili slug) — zapiši ga
  if (key) {
    await writeJson(path.join(ROOT, `${key}.json`), calc);
  }
  // 2) canonical po id-u (ako postoji)
  if (id) {
    await writeJson(path.join(ROOT, `${id}.json`), calc);
  }
  // 3) friendly po slug-u (ako postoji)
  if (slug) {
    await writeJson(path.join(ROOT, `${slug}.json`), calc);
  }
  return true;
}

/**
 * Čitanje iz public storage-a po ključu (id ili slug).
 */
export async function getPublic(key: string): Promise<any | null> {
  if (!key) return null;
  await ensureDir();
  return readJson(path.join(ROOT, `${key}.json`));
}

/** (opciono) brisanje jednog ključa */
export async function deletePublic(key: string): Promise<void> {
  try {
    await fs.unlink(path.join(ROOT, `${key}.json`));
  } catch {}
}