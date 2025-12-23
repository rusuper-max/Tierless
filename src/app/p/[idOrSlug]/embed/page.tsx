// src/app/p/[idOrSlug]/embed/page.tsx
// Embed version of public page - no header/footer, optimized for iframe
import { notFound } from "next/navigation";
import type { CalcJson } from "@/hooks/useEditorStore";
import * as fullStore from "@/lib/fullStore";
import EmbedPageClient from "./EmbedPageClient";

export const runtime = "nodejs";
export const revalidate = 60;

/* ---------------- helpers ---------------- */

const reB64Url = /^[A-Za-z0-9_-]+$/;
const PUBLIC_ID_LENGTH = 12;

function parseKey(key: string) {
  if (!key) return { id: "", slug: "" };
  if (
    key.length > PUBLIC_ID_LENGTH &&
    key[PUBLIC_ID_LENGTH] === "-" &&
    reB64Url.test(key.slice(0, PUBLIC_ID_LENGTH))
  ) {
    return {
      id: key.slice(0, PUBLIC_ID_LENGTH),
      slug: key.slice(PUBLIC_ID_LENGTH + 1),
    };
  }
  if (key.length === PUBLIC_ID_LENGTH && reB64Url.test(key)) {
    return { id: key, slug: "" };
  }
  return { id: "", slug: key };
}

async function loadPublic(id: string, slug: string): Promise<any | null> {
  let calc: any = null;

  if (id) {
    calc = await fullStore.findFullById(id);
  }
  if (!calc && slug) {
    calc = await fullStore.findFullBySlug(slug);
  }
  if (!calc && id && !slug) {
    calc = await fullStore.findFullBySlug(id);
  }

  return calc;
}

/* ---------------- types ---------------- */

type PageProps = {
  params: Promise<{ idOrSlug: string }> | { idOrSlug: string };
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
};

/* ---------------- page ---------------- */

export default async function EmbedPage({ params, searchParams }: PageProps) {
  const p = await Promise.resolve(params);
  const sp = await Promise.resolve(searchParams);
  const idOrSlug = typeof p === "object" && "idOrSlug" in p ? p.idOrSlug : "";

  if (!idOrSlug || typeof idOrSlug !== "string") notFound();

  const { id, slug } = parseKey(idOrSlug);
  const calc = await loadPublic(id, slug || idOrSlug);
  if (!calc) notFound();

  const isPublished =
    typeof calc?.meta?.published === "boolean"
      ? calc.meta.published
      : typeof calc?.meta?.online === "boolean"
        ? calc.meta.online
        : false;
  if (!isPublished) notFound();

  // Parse embed options from query params
  const theme = (sp.theme as string) || "auto";
  const showBadge = sp.badge !== "0";
  const transparent = sp.bg === "transparent";
  const radius = (sp.radius as string) || "md";

  const pageId = (calc.meta as any)?.id || idOrSlug;

  return (
    <EmbedPageClient
      calc={calc as CalcJson}
      pageId={pageId}
      options={{
        theme,
        showBadge,
        transparent,
        radius,
      }}
    />
  );
}

// Disable all metadata for embed pages
export function generateMetadata() {
  return {
    robots: {
      index: false,
      follow: false,
    },
  };
}
