// src/app/api/upload-image/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

function jsonNoCache(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set(
    "cache-control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
  );
  return res;
}

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);

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

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error("Cloudinary env vars missing");
    return jsonNoCache({ error: "server_not_configured" }, 500);
  }

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const cloudForm = new FormData();
  cloudForm.append("file", file);
  cloudForm.append("upload_preset", uploadPreset);
  cloudForm.append("folder", "tierless-items");

  try {
    const res = await fetch(cloudinaryUrl, {
      method: "POST",
      body: cloudForm,
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Cloudinary upload failed:", txt);
      return jsonNoCache({ error: "upload_failed" }, 500);
    }

    const data: any = await res.json();
    const url = data.secure_url || data.url;
    const publicId = data.public_id;

    if (!url) {
      return jsonNoCache({ error: "no_url_from_cloudinary" }, 500);
    }

    return jsonNoCache({ url, publicId });
  } catch (e: any) {
    console.error("Upload error:", e);
    return jsonNoCache(
      { error: "upload_error", detail: String(e?.message || e) },
      500
    );
  }
}