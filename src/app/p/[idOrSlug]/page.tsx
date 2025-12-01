// src/app/p/[idOrSlug]/page.tsx
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import type { CalcJson } from "@/hooks/useEditorStore";
import PublicPageClient from "./PublicPageClient";
import * as fullStore from "@/lib/fullStore";

export const runtime = "nodejs";

// ISR: Revalidate every 60 seconds, or on-demand via revalidatePath()
export const revalidate = 60;

/* ---------------- helpers ---------------- */

const reB64Url = /^[A-Za-z0-9_-]+$/;
const PUBLIC_ID_LENGTH = 12; // randomBytes(9).toString("base64url")

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

const ENV_BASE =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "tierless.net";

function getBaseUrl() {
  if (ENV_BASE) return ENV_BASE;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `https://${ROOT_DOMAIN}`;
}

/**
 * Load public calculator directly from database (no API fetch = no extra cache layer)
 * This ensures revalidatePath() works immediately after editor save
 */
async function loadPublic(id: string, slug: string): Promise<any | null> {
  try {
    let calc: any = null;
    let method = "";
    
    // Try by ID first
    if (id) {
      calc = await fullStore.findFullById(id);
      if (calc) method = "id";
    }
    // Then by slug
    if (!calc && slug) {
      calc = await fullStore.findFullBySlug(slug);
      if (calc) method = "slug";
    }
    // Fallback: treat the whole key as slug
    if (!calc && id && !slug) {
      calc = await fullStore.findFullBySlug(id);
      if (calc) method = "id-as-slug";
    }
    
    if (calc) {
      // Debug log (same as API route had)
      console.log("[PublicPage] Loaded:", {
        method,
        slug: calc.meta?.slug,
        id: calc.meta?.id,
        hasContact: !!calc.meta?.contact,
        simpleAddCheckout: calc.meta?.simpleAddCheckout,
        published: calc.meta?.published,
      });
    }
    
    return calc;
  } catch (error) {
    console.error("[PublicPage] loadPublic error:", error);
    return null;
  }
}

/* ---------------- SEO Metadata ---------------- */

type PageProps = {
  params: Promise<{ idOrSlug: string }> | { idOrSlug: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const p = await Promise.resolve(params);
  const idOrSlug = typeof p === "object" && "idOrSlug" in p ? p.idOrSlug : "";
  
  if (!idOrSlug) {
    return {
      title: "Page Not Found | Tierless",
      description: "The requested page could not be found.",
    };
  }

  const { id, slug } = parseKey(idOrSlug);
  const calc = await loadPublic(id, slug || idOrSlug);
  
  if (!calc) {
    return {
      title: "Page Not Found | Tierless",
      description: "The requested page could not be found.",
    };
  }

  const meta = calc.meta || {};
  const business = meta.business || {};
  
  // Extract metadata from calculator
  const title = meta.simpleTitle || meta.name || "Untitled Page";
  const description = business.description || meta.description || `View ${title} on Tierless`;
  const coverImage = business.coverUrl || meta.simpleCoverImage || null;
  
  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}/p/${idOrSlug}`;
  
  // Build OpenGraph metadata
  const openGraph: Metadata["openGraph"] = {
    title,
    description,
    url: pageUrl,
    siteName: "Tierless",
    type: "website",
    locale: "en_US",
  };

  // Add cover image if available
  if (coverImage) {
    openGraph.images = [
      {
        url: coverImage,
        width: 1200,
        height: 630,
        alt: title,
      },
    ];
  }

  // Build Twitter Card metadata
  const twitter: Metadata["twitter"] = coverImage
    ? {
        card: "summary_large_image",
        title,
        description,
        images: [coverImage],
      }
    : {
        card: "summary",
        title,
        description,
      };

  return {
    title: `${title} | Tierless`,
    description,
    openGraph,
    twitter,
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/* ---------------- page ---------------- */

export default async function PublicPage({ params }: PageProps) {
  const p = await Promise.resolve(params);
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

  const calcId = (calc.meta as any)?.id;
  const calcSlug = (calc.meta as any)?.slug;
  if (calcId) {
    const canonical = calcSlug ? `${calcId}-${calcSlug}` : calcId;
    if (canonical && canonical !== idOrSlug) {
      redirect(`/p/${canonical}`);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#020617] dark:bg-[#05010d] dark:text-white">
      <div className="mx-auto w-full max-w-5xl px-0 py-6 sm:px-6 lg:px-8">
        <div className="rounded-none border-0 bg-transparent p-0 shadow-none sm:rounded-3xl sm:border sm:border-[color:var(--border,#e5e7eb)] sm:bg-[color:var(--card,#ffffff)] sm:p-4 sm:shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <PublicPageClient calc={calc as CalcJson} />
        </div>
      </div>
    </main>
  );
}
