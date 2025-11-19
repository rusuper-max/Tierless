// src/lib/publishSync.ts
import * as fullStore from "@/lib/fullStore";
import { putPublic, deletePublic } from "@/lib/publicStore";

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

  const slugKey = updated.meta?.slug;
  const idKey = updated.meta?.id;

  if (publish) {
    if (slugKey) await putPublic(slugKey, updated);
    if (idKey) await putPublic(idKey, updated);
  } else {
    if (slugKey) {
      try {
        await deletePublic(slugKey);
      } catch {}
    }
    if (idKey) {
      try {
        await deletePublic(idKey);
      } catch {}
    }
  }
}
