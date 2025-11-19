// src/lib/publishSync.ts
import * as fullStore from "@/lib/fullStore";

/**
 * Keeps calc_full + public store in sync with the latest published flag.
 * Optionally accepts a calc override (already-updated object) to avoid refetching.
 */
export async function syncPublicationState(
  userId: string,
  slug: string,
  publish: boolean,
  calcOverride?: any
) {
  const full = calcOverride ?? (await fullStore.getFull(userId, slug));
  if (!full) return;

  const updated = {
    ...full,
    meta: { ...(full.meta || {}), slug: full.meta?.slug || slug, published: publish },
  };

  await fullStore.putFull(userId, slug, updated);

  // No separate public store anymore; calc_full now serves public traffic directly.
}
