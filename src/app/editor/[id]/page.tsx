// src/app/editor/[id]/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import ClientBoundary from "./ClientBoundary";

/**
 * Next.js 16:
 * - `params` is a Promise in Server Components.
 * - This page unwraps the promise and passes the slug to a client boundary.
 * - No "use client" here — this is a Server Component.
 */
export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // slug from URL segment

  if (!id || id === "undefined" || id === "null") {
    return (
      <div className="tl-dashboard px-6 py-8 text-sm text-[var(--muted,#9aa0a6)]">
        Invalid or missing slug in URL.
      </div>
    );
  }

  // ClientBoundary performs the fetch in the browser (cookies/auth intact).
  return <ClientBoundary slug={id} initialCalc={null} initialError={null} />;
}