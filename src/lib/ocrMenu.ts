// src/lib/ocrMenu.ts

export type OcrMenuItem = {
  label: string;
  price: number | null;
  section?: string; // npr. "MAIN COURSE", "APPETIZERS"
  note?: string;
};

const SECTION_KEYWORDS = [
  "MAIN COURSE",
  "MAINS",
  "STARTERS",
  "APPETIZER",
  "APPETIZERS",
  "SOUPS",
  "SALADS",
  "DESSERT",
  "DESSERTS",
  "BEVERAGE",
  "BEVERAGES",
  "DRINK",
  "DRINKS",
  "HOT DRINKS",
  "COLD DRINKS",
  "SIDES",
];

function normalizeSpaces(raw: string): string {
  return raw
    .replace(/\r/g, " ")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
}

/**
 * Pre-segmentacija:
 * - ubaci new line pre/posle poznatih section naziva
 * - ubaci new line POSLE svake cene (price token)
 *   tako da i kad OCR sve spoji u jedan red, mi dobijemo kvazi-redove
 */
function preSegment(raw: string): string {
  let txt = normalizeSpaces(raw);

  // osiguraj razmake oko valuta da regex lakše hvata
  txt = txt.replace(/([$€£])/g, " $1 ");

  // 1) section keywords -> posebni redovi
  const sectionPattern = new RegExp(
    `\\b(${SECTION_KEYWORDS.join("|")})\\b`,
    "gi"
  );
  txt = txt.replace(sectionPattern, "\n$1\n");

  // 2) price tokeni -> nakon svake cene ubaci \n
  // dozvoli: $34, 34$, 4.50, 2,50, €12 itd.
  const priceTokenRe =
    /((?:[$€£]\s*)?\d{1,3}(?:[.,]\d{1,2})?(?:\s*[$€£])?)(?!\d)/g;
  txt = txt.replace(priceTokenRe, "$1\n");

  // očisti višak new line-ova
  txt = txt
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");

  return txt;
}

function parsePrice(str: string): number | null {
  if (!str) return null;
  // skini sve osim cifara i . ,
  const cleaned = str.replace(",", ".").replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function cleanupLabel(label: string): string {
  return label
    .replace(/^[\s.\-:–•]+/, "")
    .replace(/[\s.\-:–•]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isSectionHeader(line: string): boolean {
  if (!line) return false;

  const up = line.toUpperCase();

  // direktan match na poznate sekcije
  if (SECTION_KEYWORDS.some((k) => up.includes(k))) return true;

  // headeri tipa "PIZZA", "GRILL MENU"
  if (/\d/.test(line)) return false; // ako ima cifre, verovatno nije samo header

  const words = line
    .split(" ")
    .map((w) => w.trim())
    .filter(Boolean);

  if (!words.length) return false;

  // ignoriši jako kratke "artikle" tipa "Tea"
  if (words.length <= 2 && words[0].length <= 4) return false;

  const letters = words.join("").replace(/[^A-Za-z]/g, "");
  if (!letters) return false;

  const upperCount = letters.split("").filter((c) => c === c.toUpperCase()).length;
  const ratio = upperCount / letters.length;

  // ako je veći deo slova velikim slovima, verovatno je header
  return ratio > 0.7;
}

/**
 * Glavna logika:
 * - preSegment() razbije dugačak string na pseudo-redove pomoću sekcija i cena
 * - iteriramo kroz linije:
 *   * ako linija izgleda kao header -> currentSection
 *   * inače: tražimo jedan ili više price tokena i pravimo item(e)
 */
export function parseOcrMenuText(raw: string): OcrMenuItem[] {
  if (!raw || !raw.trim()) return [];

  const segmented = preSegment(raw);
  const lines = segmented
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const items: OcrMenuItem[] = [];
  let currentSection: string | undefined;

  // regex za ekstrakciju cena (vraća SAMO broj u grupi 1)
  const priceReGlobal =
    /(?:[$€£]\s*)?(\d{1,3}(?:[.,]\d{1,2})?)(?:\s*[$€£])?(?!\d)/g;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // 1) sekcija?
    if (!/\d/.test(line) && isSectionHeader(line)) {
      currentSection = line.replace(/[:.]+$/g, "").trim();
      continue;
    }

    // 2) pokušaj da izvučeš jednu ili više cena iz linije
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    let foundPrice = false;

    while ((match = priceReGlobal.exec(line)) !== null) {
      foundPrice = true;
      const priceStr = match[1];
      const price = parsePrice(priceStr);

      const labelPart = line.slice(lastIndex, match.index);
      const label = cleanupLabel(labelPart);

      if (label) {
        items.push({
          label,
          price,
          section: currentSection,
        });
      }

      lastIndex = priceReGlobal.lastIndex;
    }

    // ako nismo našli cenu u liniji, ignoriši – to su verovatno opis ili smeće
    if (!foundPrice) {
      continue;
    }
  }

  // fallback – ako baš ništa nismo uspjeli da izvučemo, vrati ceo text kao jedan item
  if (!items.length) {
    const normalized = normalizeSpaces(raw);
    return [
      {
        label: normalized.slice(0, 120),
        price: null,
        note: normalized.length > 120 ? normalized : undefined,
      },
    ];
  }

  return items;
}