import { promises as fs } from "fs";
import path from "path";
import type { Calculator } from "@/types/calculator";

const STORE_PATH = path.join(process.cwd(), "src/data/store.json");

async function ensureStore() {
  try { await fs.access(STORE_PATH); }
  catch {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify({ calculators: {} }, null, 2));
  }
}

export async function readStore(): Promise<{ calculators: Record<string, Calculator> }> {
  await ensureStore();
  const raw = await fs.readFile(STORE_PATH, "utf8");
  return raw ? JSON.parse(raw) : { calculators: {} };
}

export async function writeStore(data: { calculators: Record<string, Calculator> }) {
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2));
}

export async function getCalculator(slug: string): Promise<Calculator | null> {
  const store = await readStore();
  return store.calculators[slug] ?? null;
}

export async function putCalculator(calc: Calculator): Promise<void> {
  const store = await readStore();
  store.calculators[calc.meta.slug] = calc;
  await writeStore(store);
}

export async function deleteCalculator(slug: string): Promise<boolean> {
  const store = await readStore();
  if (!store.calculators[slug]) return false;
  delete store.calculators[slug];
  await writeStore(store);
  return true;
}

export async function listByOwner(email: string): Promise<Calculator[]> {
  const store = await readStore();
  return Object.values(store.calculators).filter((c) => (c as any).ownerEmail === email);
}

export async function slugExists(slug: string) {
  const store = await readStore();
  return !!store.calculators[slug];
}