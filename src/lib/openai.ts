// src/lib/openai.ts
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  // Nemoj bacati error odmah – samo log, da ne crkne build ako key fali
  console.warn("OPENAI_API_KEY is not set. OCR menu parsing will be disabled.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});