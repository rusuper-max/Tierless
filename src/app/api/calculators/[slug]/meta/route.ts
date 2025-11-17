// src/app/api/calculators/[slug]/meta/route.ts
import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import * as calcsStore from "@/lib/calcsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function resolveSlug(
  req: Request,
  ctx: { params?: { slug?: string } } | { params?: Promise<{ slug?: string }> } | undefined
): Promise<string> {
  try {
    const raw = (ctx as any)?.params;
    const params = typeof raw?.then === "function" ? await raw : raw;
    if (params?.slug && params.slug !== "undefined" && params.slug !== "null") {
      return decodeURIComponent(String(params.slug));
    }
  } catch {}
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const candidate = parts[parts.length - 1];
    if (candidate) return decodeURIComponent(candidate);
  } catch {}
  return "";
}

export async function POST(req: Request, ctx: { params?: { slug?: string } }) {
  const slug = await resolveSlug(req, ctx);
  if (!slug) return NextResponse.json({ error: "bad_slug" }, { status: 400 });

  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const metaPatch = body?.meta && typeof body.meta === "object" ? body.meta : {};

  const existing = await calcsStore.get(userId, slug);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const tasks: Promise<unknown>[] = [];

  if (typeof metaPatch.name === "string") {
    const nextName = metaPatch.name.trim();
    if (nextName && nextName !== existing.meta.name) {
      tasks.push(calcsStore.updateName(userId, slug, nextName));
    }
  }
  if (typeof metaPatch.favorite === "boolean") {
    tasks.push(calcsStore.setFavorite(userId, slug, metaPatch.favorite));
  }
  if (typeof metaPatch.published === "boolean") {
    tasks.push(calcsStore.setPublished(userId, slug, metaPatch.published));
  }

  if (tasks.length) {
    await Promise.allSettled(tasks);
  }

  const refreshed = await calcsStore.get(userId, slug);
  return NextResponse.json(
    { ok: true, meta: refreshed?.meta ?? existing.meta },
    { headers: { "Cache-Control": "no-store" } }
  );
}
