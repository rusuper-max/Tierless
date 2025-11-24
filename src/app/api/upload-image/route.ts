// src/app/api/upload-image/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { safeUserId } from "@/lib/safeUserId"; // Koristimo tvoj postojeći helper
import crypto from "crypto";

const MAX_SIZE = 10 * 2048 * 2048; // 10 MB

function jsonNoCache(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set(
    "cache-control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
  );
  return res;
}

export async function POST(req: Request) {
  // 1. Autentifikacija
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);

  // 2. Validacija fajla
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return jsonNoCache({ error: "no_file" }, 400);
  }
  if (!file.type.startsWith("image/")) {
    return jsonNoCache({ error: "invalid_type" }, 400);
  }
  if (file.size > MAX_SIZE) {
    return jsonNoCache({ error: "too_large", maxBytes: MAX_SIZE }, 400);
  }

  // 3. Učitaj env varijable
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Cloudinary credentials missing in .env");
    return jsonNoCache({ error: "server_configuration_error" }, 500);
  }

  // 4. Pripremi dinamički folder na osnovu User ID-a
  // safeUserId pretvara "ru@gmail.com" u "ru_gmail_com"
  const userFolder = `tierless-users/${safeUserId(userId)}`;

  const timestamp = Math.round(new Date().getTime() / 1000);

  // 5. Generiši potpis (Signature)
  // Cloudinary zahteva da parametri budu sortirani po abecedi pre potpisivanja!
  // Potpisujemo: 'folder' i 'timestamp' (bez 'file', 'api_key' ili 'resource_type')
  const paramsToSign = `folder=${userFolder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const cloudForm = new FormData();
  cloudForm.append("file", file);
  cloudForm.append("api_key", apiKey);
  cloudForm.append("timestamp", String(timestamp));
  cloudForm.append("folder", userFolder);
  cloudForm.append("signature", signature);

  // Opciono: ako želiš da koristiš i preset za transformacije, dodaj ga,
  // ali on mora biti uključen u potpis ako je 'signed'. 
  // Za sada radimo čist signed upload bez preseta da pojednostavimo (Cloudinary sam radi optimizaciju).

  try {
    const res = await fetch(cloudinaryUrl, {
      method: "POST",
      body: cloudForm,
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Cloudinary upload failed:", txt);
      return jsonNoCache({ error: "upload_failed_provider" }, 500);
    }

    const data: any = await res.json();
    const url = data.secure_url || data.url;
    const publicId = data.public_id; // npr. "tierless-users/rusuper_gmail_com/xyz123"

    return jsonNoCache({ url, publicId });
  } catch (e: any) {
    console.error("Upload error:", e);
    return jsonNoCache(
      { error: "upload_error", detail: String(e?.message || e) },
      500
    );
  }
}