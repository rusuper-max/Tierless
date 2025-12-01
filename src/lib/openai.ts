// src/lib/openai.ts
import OpenAI from "openai";

/**
 * Lazy OpenAI client.
 *
 * Važno: NE smemo da bacimo error na import-u ako nema OPENAI_API_KEY,
 * da GitHub Actions build ne bi padao. Umesto toga:
 *  - ako key postoji → pravimo realni klijent
 *  - ako key NE postoji → vraćamo null i route treba da hendluje fallback
 */

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  if (_client) return _client;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn(
      "OPENAI_API_KEY is not set. OCR / AI helpers will be disabled (safe for build/CI)."
    );
    return null;
  }

  _client = new OpenAI({ apiKey });
  return _client;
}

// Backwards-compatible export used in existing code
// NOTE: may be null when OPENAI_API_KEY is missing
export const openai = getOpenAIClient();

