import { promises as fs } from "fs";
import path from "path";

async function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

export async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (e: any) {
    if (e?.code === "ENOENT") return fallback; // nema fajla -> prazno
    try { await fs.copyFile(filePath, filePath + ".bak"); } catch {}
    return fallback; // korumpirano -> vrati fallback
  }
}

export async function writeJsonAtomic(filePath: string, data: unknown) {
  await ensureDir(filePath);
  const tmp = filePath + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
  await fs.rename(tmp, filePath); // atomic replace
}