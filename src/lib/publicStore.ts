import fs from "fs/promises";
import path from "path";
const PUB_ROOT = path.join(process.cwd(), "data", "public");
const fileFor = (slug: string) => path.join(PUB_ROOT, `${slug}.json`);

export async function getPublic(slug: string) {
  try { return JSON.parse(await fs.readFile(fileFor(slug), "utf8")); }
  catch { return undefined; }
}

export async function putPublic(slug: string, data: any) {
  await fs.mkdir(PUB_ROOT, { recursive: true });
  await fs.writeFile(fileFor(slug), JSON.stringify(data ?? {}, null, 2), "utf8");
}

// add in src/lib/publicStore.ts
export async function deletePublic(_slug: string): Promise<boolean> {
  // no-op (ili obriši iz CDN/file sistema ako imaš)
  return true;
}