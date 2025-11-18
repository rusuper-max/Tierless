// src/app/api/ocr-menu/route.ts
import { NextResponse } from "next/server";
import { parseOcrMenuText } from "@/lib/ocrMenu";
import { openai } from "@/lib/openai";

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
 * GPT parser – od raw OCR teksta napravi sekcije + stavke.
 * Ako bilo šta krene po zlu, baci error pa ćemo fallback-ovati na regex parser.
 */
async function parseWithChatGpt(ocrText: string): Promise<ParsedMenu> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const systemPrompt =
    "You take raw OCR text of a restaurant or services menu and return a clean JSON menu. " +
    "You must infer sections (like 'Main course', 'Appetizers', 'Beverages', etc.) and items with prices. " +
    "If you are unsure about a line or cannot find a price, skip that line. " +
    "Prices must be numeric only (no currency symbols).";

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
    "Rules:",
    "- Group items into logical sections if possible.",
    "- Items without a clear price should be skipped.",
    "- description can contain extra notes if the line has them, otherwise null.",
    "",
    "Here is the OCR text:",
    '"""',
    ocrText,
    '"""',
  ].join("\n");

  const completion = await openai.chat.completions.create({
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
        const num = Number(priceRaw.replace(/[^0-9.,-]/g, "").replace(",", "."));
        price = Number.isFinite(num) ? num : null;
      }

      if (price === null) continue; // bez cene nemamo poentu

      const note =
        typeof it?.description === "string" && it.description.trim()
          ? it.description.trim()
          : undefined;

      items.push({
        label,
        price,
        note,
        sectionName: name,
      });
    }
  }

  return { items, sections };
}

export async function POST(req: Request) {
  try {
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
      console.error("GPT menu parsing failed, falling back to regex parser:", err);
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

    // Vraćamo items + sekcije + rawText (frontend trenutno koristi items; sekcije možeš kasnije da iskoristiš)
    return NextResponse.json(
      {
        items: parsed.items,
        sections: parsed.sections,
        rawText: text,
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