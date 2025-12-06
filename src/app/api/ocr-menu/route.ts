// src/app/api/ocr-menu/route.ts
import { NextResponse } from "next/server";
import { parseOcrMenuText } from "@/lib/ocrMenu";
import { openai } from "@/lib/openai";
import { checkRateLimit, getClientIP, rateLimitHeaders, OCR_LIMIT } from "@/lib/rateLimit";
import { getSessionUser, coercePlan } from "@/lib/auth";
import { canUseOcr, incrementOcrUsage, ensureOcrUsageTable } from "@/lib/ocrUsage";
import { getPool } from "@/lib/db";

const OCR_API_URL =
  process.env.OCR_MENU_API_URL || "https://api.edenai.run/v2/ocr/ocr";
const OCR_API_KEY = process.env.OCR_MENU_API_KEY;

// Ako želiš da ograničiš trajanje na Vercel-u (GPT + OCR ume da traje)
export const maxDuration = 20;

function extractText(payload: any): string {
  if (!payload || typeof payload !== "object") return "";
  if (typeof payload.text === "string") return payload.text as string;

  // Probaj da izvučeš tekst po provider-ima (google, microsoft...)
  for (const key of Object.keys(payload)) {
    const val = (payload as any)[key];
    if (val && typeof val.text === "string") {
      return val.text as string;
    }
  }
  return "";
}

type ParsedMenu = {
  items: {
    label: string;
    price: number | null;
    note?: string;
    sectionName?: string;
  }[];
  sections: { name: string }[];
};

/**
 * Pokušaj da pametno isečemo "naziv + opis" ako je GPT sve stavio u name.
 * Heuristika:
 * - ako je string kratak, tretiramo ga kao čist naziv (bez opisa)
 * - ako je duži, probamo da isečemo po:
 *   - " - ", " – ", " — ", ":" ili
 *   - prepoznavanju reči tipa " sa ", " na ", " uz ", " with ", " served with "
 *   tako da:
 *     name = kraći front deo,
 *     description = ostatak.
 */
function splitNameAndDescription(raw: string): { name: string; description?: string } {
  if (!raw || typeof raw !== "string") {
    return { name: "" };
  }

  const clean = raw.replace(/\s+/g, " ").trim();
  if (!clean) return { name: "" };

  // Kratki nazivi – ne cepamo ih
  if (clean.length <= 40) {
    return { name: clean };
  }

  // 1) Separatori tipa " - ", " – ", " — ", ":"
  const separators = [" - ", " – ", " — ", ": "];
  for (const sep of separators) {
    const idx = clean.indexOf(sep);
    if (idx > 0) {
      const left = clean.slice(0, idx).trim();
      const right = clean.slice(idx + sep.length).trim();
      if (left.length >= 3 && right.length >= 8) {
        return { name: left, description: right };
      }
    }
  }

  // 2) Reči koje često uvode opis (sa / na / uz / with / served with)
  const lower = clean.toLowerCase();
  const markers = [" sa ", " na ", " uz ", " with ", " served with "];

  for (const marker of markers) {
    const idx = lower.indexOf(marker);
    if (idx > 0) {
      const left = clean.slice(0, idx).trim();
      const right = clean.slice(idx).trim(); // zadržavamo "sa / with" u opisu
      if (left.length >= 3 && right.length >= 8) {
        return { name: left, description: right };
      }
    }
  }

  // Ako nismo našli dobar split, tretiramo sve kao naziv
  return { name: clean };
}

/**
 * GPT parser – od raw OCR teksta napravi sekcije + stavke.
 * Ako bilo šta krene po zlu, baci error pa ćemo fallback-ovati na regex parser.
 */
async function parseWithChatGpt(ocrText: string): Promise<ParsedMenu> {
  if (!openai) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const systemPrompt =
  "You take raw OCR text of a restaurant or services menu and return a clean JSON menu. " +
  "You must infer sections (like headings for groups of items) and items with prices. " +
  "You MUST NOT translate, localize, or rename any text. " +
  "Section names, item names and descriptions must stay in the original language and reuse the original wording from the OCR text, except for trimming spaces and removing prices. " +
  "If you are unsure about a line or cannot find a price, skip that line. " +
  "Prices must be numeric only (no currency symbols). " +
  "Your job is to structure the menu, not to rewrite it.";

  const userPrompt = [
  "Convert the following OCR menu text into JSON.",
  "",
  "Return JSON with this shape:",
  "{",
  '  "sections": [',
  "    {",
  '      "name": string,',
  '      "items": [',
  "        {",
  '          "name": string,',
  '          "price": number,',
  '          "description": string | null',
  "        }",
  "      ]",
  "    }",
  "  ]",
  "}",
  "",
  "Very important:",
  "- Do NOT translate or localize anything.",
  "- Do NOT invent new section names like 'Meat & Poultry' if the OCR text says 'Meso'. Use the heading exactly as it appears in the OCR text (trim spaces only).",
  "- Do NOT replace words with English synonyms. If the menu is in Serbian, keep it in Serbian.",
  "",
  "Rules:",
  "- Group items into logical sections only if there are clear headings in the OCR text.",
  "- Items without a clear price should be skipped.",
  "- 'name' should be a SHORT label for the item (usually 2–5 words), using the original wording of the dish.",
  "- If the original line contains BOTH a dish name AND preparation/side details, you SHOULD split:",
  "  - Put only the core dish name into 'name'.",
  "  - Put ALL extra details (sides, preparation, sauces, etc.) into 'description'.",
  "- If there is no obvious extra text, set description to null.",
  "",
  "Examples of splitting logic (these are logic examples only, you must always keep the original language of the menu):",
  '  Line: \"Riblji paprikaš 1150\"',
  '  → name: \"Riblji paprikaš\"',
  '  → description: null',
  "",
  '  Line: \"Fileti morske ribe sa blitvom i krompirom 1550\"',
  '  → name: \"Fileti morske ribe\"',
  '  → description: \"sa blitvom i krompirom\"',
  "",
  '  Line: \"Teleći medaljoni na žaru uz povrće i sos 1850\"',
  '  → name: \"Teleći medaljoni na žaru\"',
  '  → description: \"uz povrće i sos\"',
  "",
  "Here is the OCR text:",
  '\"\"\"',
  ocrText,
  '\"\"\"',
].join("\n");

  const completion = await openai!.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned from OpenAI");
  }

  let json: any;
  try {
    json = JSON.parse(content);
  } catch (err) {
    console.error("Failed to JSON.parse GPT content:", content);
    throw new Error("Invalid JSON from OpenAI");
  }

  const sectionsRaw: any[] = Array.isArray(json.sections) ? json.sections : [];

  const sections: { name: string }[] = [];
  const items: ParsedMenu["items"] = [];

  for (const section of sectionsRaw) {
    const name =
      typeof section?.name === "string"
        ? section.name.trim()
        : typeof section?.title === "string"
        ? section.title.trim()
        : "";

    if (!name) continue;

    sections.push({ name });

    const sectionItems: any[] = Array.isArray(section.items)
      ? section.items
      : [];

    for (const it of sectionItems) {
      const labelRaw = it?.name ?? it?.title;
      const priceRaw = it?.price;
      if (typeof labelRaw !== "string") continue;

      const label = labelRaw.trim();
      if (!label) continue;

      let price: number | null = null;
      if (typeof priceRaw === "number") {
        price = priceRaw;
      } else if (typeof priceRaw === "string") {
        const num = Number(
          priceRaw.replace(/[^0-9.,-]/g, "").replace(",", ".")
        );
        price = Number.isFinite(num) ? num : null;
      }

      // bez cene nemamo poentu
      if (price === null) continue;

      // 1) GPT opis ako postoji
      const gptDesc =
        typeof it?.description === "string" && it.description.trim()
          ? it.description.trim()
          : "";

      // 2) Lokalni pokušaj da isečemo naziv + opis iz label-a
      const { name: splitName, description: autoDesc } =
        splitNameAndDescription(label);

      const finalLabel = splitName || label;
      const finalNote = gptDesc || autoDesc || undefined;

      items.push({
        label: finalLabel,
        price,
        note: finalNote,
        sectionName: name,
      });
    }
  }

  return { items, sections };
}

export async function POST(req: Request) {
  try {
    // 1) Rate Limiting - 20 requests per hour per IP (protects against abuse)
    const clientIP = getClientIP(req);
    const rateResult = checkRateLimit(clientIP, OCR_LIMIT);
    
    if (!rateResult.success) {
      console.warn(`[OCR] Rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        { error: "Too many OCR requests. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rateResult) }
      );
    }

    // 2) User Authentication & Monthly Limit
    const user = await getSessionUser(req);
    if (!user?.email) {
      return NextResponse.json(
        { error: "Please log in to use OCR scanning." },
        { status: 401 }
      );
    }

    // Get user's plan
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT plan FROM user_plans WHERE user_id = $1 LIMIT 1`,
      [user.email]
    );
    const plan = coercePlan(rows[0]?.plan || "free");

    // Check usage limit (monthly for paid, lifetime for free)
    await ensureOcrUsageTable();
    const usage = await canUseOcr(user.email, plan);
    
    if (!usage.allowed) {
      const limitType = usage.isLifetimeTrial ? "trial" : "monthly";
      console.warn(`[OCR] ${limitType} limit exceeded for user: ${user.email} (${usage.used}/${usage.limit})`);
      
      // Different error messages for free vs paid
      const errorMsg = usage.isLifetimeTrial
        ? `You've used all ${usage.limit} free trial scans. Upgrade to Starter for 10 monthly scans!`
        : `Monthly OCR limit reached (${usage.used}/${usage.limit}). Upgrade your plan for more scans.`;
      
      return NextResponse.json(
        { 
          error: errorMsg,
          usage: { 
            used: usage.used, 
            limit: usage.limit, 
            remaining: 0,
            isLifetimeTrial: usage.isLifetimeTrial 
          },
          requiresUpgrade: true
        },
        { status: 429 }
      );
    }

    if (!OCR_API_KEY) {
      console.error("OCR_MENU_API_KEY is missing");
      return NextResponse.json(
        { error: "OCR API key is not configured on the server." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 }
      );
    }

    // 1) EdenAI OCR
    const edenForm = new FormData();
    edenForm.append("providers", "google");
    edenForm.append("language", "en");
    edenForm.append("file", file);

    const edenRes = await fetch(OCR_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OCR_API_KEY}`,
      },
      body: edenForm,
    });

    const edenJson = await edenRes.json().catch(() => ({}));

    if (!edenRes.ok) {
      console.error("EdenAI OCR error:", edenJson);
      return NextResponse.json(
        {
          error:
            "Couldn't read your photo. Please upload a clearer, higher-quality picture.",
          details: edenJson,
        },
        { status: 502 }
      );
    }

    const text = extractText(edenJson);
    if (!text || !text.trim()) {
      return NextResponse.json(
        {
          error:
            "Couldn't read your photo. Please upload a clearer, higher-quality picture.",
          rawText: text || "",
        },
        { status: 502 }
      );
    }

    // 2) GPT parsing (sekcije + stavke), fallback na stari parser
    let parsed: ParsedMenu;

    try {
      parsed = await parseWithChatGpt(text);
    } catch (err) {
      console.error(
        "GPT menu parsing failed, falling back to regex parser:",
        err
      );
      const legacyItems = parseOcrMenuText(text);
      parsed = {
        items: legacyItems.map((it: any) => ({
          label: it.label,
          price: typeof it.price === "number" ? it.price : null,
          note: it.note,
        })),
        sections: [],
      };
    }

    if (!parsed.items.length) {
      return NextResponse.json(
        {
          error:
            "We scanned your photo but could not detect valid menu items. Please try another photo or a higher-quality image.",
          rawText: text,
        },
        { status: 422 }
      );
    }

    // Increment usage counter on success
    const newUsage = await incrementOcrUsage(user.email);
    const periodLabel = usage.isLifetimeTrial ? "lifetime" : "monthly";
    console.log(`[OCR] Success for ${user.email}, ${periodLabel} usage: ${newUsage.monthly}/${usage.limit}`);

    // Vraćamo items + sekcije + rawText (frontend trenutno koristi items; sekcije možeš kasnije da iskoristiš)
    return NextResponse.json(
      {
        items: parsed.items,
        sections: parsed.sections,
        rawText: text,
        usage: { 
          used: usage.isLifetimeTrial ? newUsage.lifetime : newUsage.monthly, 
          limit: usage.limit, 
          remaining: usage.limit - (usage.isLifetimeTrial ? newUsage.lifetime : newUsage.monthly),
          isLifetimeTrial: usage.isLifetimeTrial
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("ocr-menu route error:", err);
    return NextResponse.json(
      {
        error:
          "Unexpected server error while scanning your menu. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}