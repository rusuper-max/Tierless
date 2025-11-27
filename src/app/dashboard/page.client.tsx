// src/app/dashboard/page.client.tsx
"use client";

import { useEffect, useMemo, useRef, useState, useCallback, Fragment } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "@/hooks/useAccount";
import { ENTITLEMENTS, type PlanId } from "@/lib/entitlements";
import { t } from "@/i18n";
import { GripVertical, Share2, Star } from "lucide-react";
import ShareQrModal from "@/components/share/ShareQrModal";

// --- Refactored Components ---
import {
  ActionButton,
  IconButton,
  FavoriteStar,
  FilterChip,
  SortDropdown,
  ConfirmDeleteModal,
  type SortId
} from "@/components/dashboard/DashboardUI";
import PageRow from "@/components/dashboard/PageRow";
import PageCard from "@/components/dashboard/PageCard";

/* ------------------------------------------------------------------ */
/* Types & helpers                                                     */
/* ------------------------------------------------------------------ */
type MiniCalc = {
  meta: {
    name: string;
    slug: string;
    id?: string;
    published?: boolean;
    online?: boolean;
    favorite?: boolean;
    order?: number;
    createdAt?: number;
    updatedAt?: number;
    views7d?: number;
  };
};

type ApiRows =
  | MiniCalc[]
  | { rows?: MiniCalc[]; __debug?: { userId: string; file: string }; notice?: string };

const fmtDateTime = (ts?: number) =>
  ts ? new Date(ts).toLocaleString([], { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

// --- Public URL helper: /p/{id}-{slug} (fallback /p/slug) -------
async function getPublicUrlForSlug(slug: string): Promise<string> {
  try {
    const r = await fetch(`/api/calculators/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (r.ok) {
      const j = await r.json();
      const id = j?.meta?.id;
      console.log("PUBLIC LINK DEBUG → meta.id =", j?.meta?.id, "slug =", slug, "full response:", j);
      if (id && typeof id === "string") {
        return `/p/${encodeURIComponent(id)}-${encodeURIComponent(slug)}`;
      }
    }
  } catch { }
  // Fallback (starije strane bez id-a)
  return `/p/${encodeURIComponent(slug)}`;
}

/* ------------------------------------------------------------------ */
/* Glavni Dashboard                                                    */
/* ------------------------------------------------------------------ */
type FilterId = "all" | "online" | "offline" | "favorites";

export default function DashboardPageClient() {
  const account = useAccount();
  const router = useRouter();

  const [rows, setRows] = useState<MiniCalc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [userDebug, setUserDebug] = useState<{ userId: string; file: string } | null>(null);

  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const newMenuRef = useRef<HTMLDivElement | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Drag & drop
  const [dragSlug, setDragSlug] = useState<string | null>(null);
  const [overSlug, setOverSlug] = useState<string | null>(null);
  const [overPos, setOverPos] = useState<"before" | "after" | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);
  const dragSlugRef = useRef<string | null>(null);
  const overSlugRef = useRef<string | null>(null);
  const overPosRef = useRef<"before" | "after" | null>(null);

  // --- Persisted sorting / order (localStorage) --------------------
  const LS_SORT_KEY = "tl_pages_sort";
  const LS_ORDER_KEY = "tl_pages_order"; // JSON.stringify(string[])
  const saveSortLS = (val: SortId) => { try { localStorage.setItem(LS_SORT_KEY, val); } catch { } };
  const loadSortLS = (): SortId | null => {
    try {
      const v = localStorage.getItem(LS_SORT_KEY) as SortId | null;
      if (v === "created_desc" || v === "name_asc" || v === "status" || v === "manual") return v;
      return null;
    } catch { return null; }
  };
  const saveOrderLS = (slugs: string[]) => { try { localStorage.setItem(LS_ORDER_KEY, JSON.stringify(slugs)); } catch { } };
  const loadOrderLS = (): string[] | null => {
    try {
      const raw = localStorage.getItem(LS_ORDER_KEY);
      if (!raw) return null;
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : null;
    } catch { return null; }
  };

  // --- Persist favorites & createdAt to stabilize across refreshes ----
  const LS_FAVS_KEY = "tl_pages_favs"; // JSON: { [slug]: true }
  const LS_CREATED_KEY = "tl_pages_created"; // JSON: { [slug]: number }

  const loadFavsLS = (): Record<string, boolean> => {
    try {
      const raw = localStorage.getItem(LS_FAVS_KEY);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  };
  const saveFavsLS = (map: Record<string, boolean>) => {
    try { localStorage.setItem(LS_FAVS_KEY, JSON.stringify(map)); } catch { }
  };
  const setFavLS = (slug: string, val: boolean) => {
    const m = loadFavsLS();
    if (val) m[slug] = true; else delete m[slug];
    saveFavsLS(m);
  };
  const deleteFavLS = (slug: string) => {
    const m = loadFavsLS();
    if (m[slug]) { delete m[slug]; saveFavsLS(m); }
  };

  const loadCreatedLS = (): Record<string, number> => {
    try {
      const raw = localStorage.getItem(LS_CREATED_KEY);
      return raw ? (JSON.parse(raw) as Record<string, number>) : {};
    } catch {
      return {};
    }
  };
  const saveCreatedLS = (map: Record<string, number>) => {
    try { localStorage.setItem(LS_CREATED_KEY, JSON.stringify(map)); } catch { }
  };
  const setCreatedLS = (slug: string, ts: number) => {
    if (!Number.isFinite(ts)) return;
    const m = loadCreatedLS();
    m[slug] = ts;
    saveCreatedLS(m);
  };
  const deleteCreatedLS = (slug: string) => {
    const m = loadCreatedLS();
    if (m[slug]) { delete m[slug]; saveCreatedLS(m); }
  };

  const replaceSlugInOrderLS = (from: string, to: string) => {
    if (!from || !to || from === to) return;
    try {
      const raw = localStorage.getItem(LS_ORDER_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return;
      const idx = arr.indexOf(from);
      if (idx === -1) return;
      arr[idx] = to;
      localStorage.setItem(LS_ORDER_KEY, JSON.stringify(arr));
    } catch { }
  };

  const replaceSlugInFavsLS = (from: string, to: string) => {
    if (!from || !to || from === to) return;
    const favs = loadFavsLS();
    if (favs[from]) {
      favs[to] = true;
      delete favs[from];
      saveFavsLS(favs);
    }
  };

  const replaceSlugInCreatedLS = (from: string, to: string) => {
    if (!from || !to || from === to) return;
    const created = loadCreatedLS();
    if (created[from]) {
      created[to] = created[from];
      delete created[from];
      saveCreatedLS(created);
    }
  };

  const reorderBySlug = (fromSlug: string, toSlug: string, pos: "before" | "after" = "before") => {
    if (guardOverLimit()) return;
    setRows((prev) => {
      const fromIdx = prev.findIndex((x) => x.meta.slug === fromSlug);
      const toIdxOriginal = prev.findIndex((x) => x.meta.slug === toSlug);
      if (fromIdx < 0 || toIdxOriginal < 0 || fromIdx === toIdxOriginal) return prev;

      const next = [...prev];
      const [item] = next.splice(fromIdx, 1);

      let insertIndex = toIdxOriginal;
      if (fromIdx < toIdxOriginal) insertIndex = toIdxOriginal - 1; // kompenzacija
      if (pos === "after") insertIndex += 1;
      insertIndex = Math.max(0, Math.min(next.length, insertIndex));

      next.splice(insertIndex, 0, item);

      // re-index order lokalno 0..N-1
      for (let i = 0; i < next.length; i++) {
        next[i] = { ...next[i], meta: { ...next[i].meta, order: i } };
      }

      persistOrder(next);
      return next;
    });

    // ručni ređosled => uključi "manual" i sačuvaj
    setSortBy("manual");
    saveSortLS("manual");
  };

  // Pointer-based drag-and-drop handlers
  const startDragCleanup = useRef<null | (() => void)>(null);

  // Cache rects for stability
  const dragRectsRef = useRef<{ slug: string; rect: DOMRect }[]>([]);

  const onPointerDragStart = (slug: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (guardOverLimit()) return;
    e.preventDefault();
    setDragSlug(slug);
    dragSlugRef.current = slug;
    setOverSlug(null);
    overSlugRef.current = null;
    setOverPos(null);
    overPosRef.current = null;

    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    document.body.classList.add("tl-drag-active");

    // Cache positions BEFORE layout shift (display: none) happens
    const table = tableRef.current;
    if (table) {
      const rowsEls = Array.from(table.querySelectorAll<HTMLTableRowElement>("tbody tr[data-slug]"));
      dragRectsRef.current = rowsEls.map(el => ({
        slug: el.dataset.slug!,
        rect: el.getBoundingClientRect()
      }));
    }

    const onMove = (ev: MouseEvent) => {
      const y = ev.clientY;
      const rects = dragRectsRef.current;
      if (rects.length === 0) return;

      const first = rects[0];
      const last = rects[rects.length - 1];

      if (y < first.rect.top) {
        const s = first.slug;
        setOverSlug(s); setOverPos("before");
        overSlugRef.current = s; overPosRef.current = "before";
        return;
      }
      if (y > last.rect.bottom) {
        const s = last.slug;
        setOverSlug(s); setOverPos("after");
        overSlugRef.current = s; overPosRef.current = "after";
        return;
      }

      for (const item of rects) {
        const { rect, slug: s } = item;
        if (y >= rect.top && y <= rect.bottom) {
          const mid = rect.top + rect.height / 2;
          const pos = y < mid ? "before" : "after";
          setOverSlug(s); setOverPos(pos);
          overSlugRef.current = s; overPosRef.current = pos;
          break;
        }
      }
    };

    const onUp = () => {
      const d = dragSlugRef.current;
      const o = overSlugRef.current;
      const p = overPosRef.current || "before";
      if (d && o && d !== o) {
        reorderBySlug(d, o, p);
      }
      setDragSlug(null);
      dragSlugRef.current = null;
      setOverSlug(null);
      overSlugRef.current = null;
      setOverPos(null);
      overPosRef.current = null;
      dragRectsRef.current = [];

      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = prevUserSelect;
      document.body.classList.remove("tl-drag-active");
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);

    startDragCleanup.current = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = prevUserSelect;
      document.body.classList.remove("tl-drag-active");
    };
  };
  useEffect(() => {
    return () => {
      if (startDragCleanup.current) startDragCleanup.current();
    };
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [renSlug, setRenSlug] = useState<string | null>(null);
  const [renName, setRenName] = useState<string>("");
  const [renError, setRenError] = useState<string | null>(null);

  const [confirmSlug, setConfirmSlug] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState<string>("");

  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

  const [sortBy, setSortBy] = useState<SortId>("created_desc");

  const [notice, setNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 1600);
  }, []);
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [shareLoading, setShareLoading] = useState(false);

  const [limitPulse, setLimitPulse] = useState(false);
  const limitPulseTimerRef = useRef<number | null>(null);
  const bumpLimitPulse = useCallback(() => {
    setLimitPulse(true);
    if (limitPulseTimerRef.current) window.clearTimeout(limitPulseTimerRef.current);
    limitPulseTimerRef.current = window.setTimeout(() => setLimitPulse(false), 1500);
  }, []);
  useEffect(() => {
    return () => {
      if (limitPulseTimerRef.current) window.clearTimeout(limitPulseTimerRef.current);
    };
  }, []);

  const [publishNotice, setPublishNotice] = useState<string | null>(null);
  const publishNoticeTimerRef = useRef<number | null>(null);
  const showPublishNotice = useCallback((msg: string) => {
    setPublishNotice(msg);
    showToast(msg);
    if (publishNoticeTimerRef.current) window.clearTimeout(publishNoticeTimerRef.current);
    publishNoticeTimerRef.current = window.setTimeout(() => setPublishNotice(null), 7000);
  }, [showToast]);
  useEffect(() => {
    return () => {
      if (publishNoticeTimerRef.current) window.clearTimeout(publishNoticeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!newMenuRef.current) return;
      if (!newMenuRef.current.contains(e.target as any)) setNewMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/calculators", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "x-no-cache": String(Date.now()) },
      });
      const json = (await r.json()) as ApiRows;
      const arr = Array.isArray(json) ? json : json?.rows ?? [];
      const safe = (Array.isArray(arr) ? arr : []).map((x) => ({
        ...x,
        meta: {
          ...x.meta,
          published: !!(x.meta?.published ?? x.meta?.online),
          favorite: !!x.meta?.favorite,
          order: typeof x.meta?.order === "number" ? x.meta.order : undefined,
          createdAt: x.meta?.createdAt ? Number(x.meta.createdAt) : (x.meta?.updatedAt ? Number(x.meta.updatedAt) : Date.now()),
          updatedAt: x.meta?.updatedAt ? Number(x.meta.updatedAt) : undefined,
          views7d: typeof x.meta?.views7d === "number" ? x.meta.views7d : 0,
        },
      }));

      // prime sa sekvencijalnim order-om + favoriti + stabilan createdAt
      const favsLS = loadFavsLS();
      const createdLS = loadCreatedLS();

      let primed = safe.map((r, i) => {
        const slug = r.meta.slug;
        // stabilize createdAt
        let createdAt: number;
        const existing = createdLS[slug];
        if (Number.isFinite(existing)) {
          createdAt = existing;
        } else if (typeof r.meta.createdAt === "number") {
          createdAt = Number(r.meta.createdAt);
        } else if (typeof r.meta.updatedAt === "number") {
          createdAt = Number(r.meta.updatedAt);
        } else {
          createdAt = Date.now();
        }
        if (!Number.isFinite(existing)) setCreatedLS(slug, createdAt);

        const favorite = favsLS[slug] ?? !!r.meta.favorite;

        return {
          ...r,
          meta: {
            ...r.meta,
            favorite,
            createdAt,
            order: typeof r.meta.order === "number" ? r.meta.order : i,
          },
        };
      });

      // ako postoji LS order – primeni ga i prebaci sort na manual
      const savedOrder = loadOrderLS();
      if (savedOrder && savedOrder.length) {
        const idxBySlug = new Map<string, number>();
        savedOrder.forEach((s, i) => idxBySlug.set(s, i));
        primed = primed
          .map((r) => ({
            ...r,
            meta: { ...r.meta, order: idxBySlug.has(r.meta.slug) ? (idxBySlug.get(r.meta.slug) as number) : 999999 },
          }))
          .sort((a, b) => (a.meta.order! - b.meta.order!))
          .map((r, i) => ({ ...r, meta: { ...r.meta, order: i } }));
        setSortBy("manual");
        saveSortLS("manual");
      }

      // Re-apply LS favorites (authoritative client-side if backend doesn't persist)
      {
        const favsAgain = loadFavsLS();
        primed = primed.map(it => ({
          ...it,
          meta: { ...it.meta, favorite: favsAgain[it.meta.slug] ?? !!it.meta.favorite }
        }));
      }

      setRows(primed);

      if (!Array.isArray(json) && json?.__debug) setUserDebug(json.__debug);
      else setUserDebug(null);

      if (!Array.isArray(json) && json?.notice) setNotice(json.notice);
      else setNotice(null);
    } catch {
      setRows([]);
      setUserDebug(null);
      setNotice(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // init sort iz LS
  useEffect(() => {
    const v = loadSortLS();
    if (v) setSortBy(v);
  }, []);

  // persistuj svaku promenu sortiranja
  useEffect(() => { saveSortLS(sortBy); }, [sortBy]);

  // Plan & quotas
  const plan = (account.plan as PlanId) || "free";
  const limits = ENTITLEMENTS[plan]?.limits;
  const pagesLimit = limits?.pages ?? "unlimited";
  const totalPages = rows.length;

  const publishedCount = useMemo(
    () => rows.reduce((acc, r) => (r.meta.published ? acc + 1 : acc), 0),
    [rows]
  );
  const _publishedLimit =
    (limits as any)?.maxPublicPages ??
    (typeof pagesLimit === "number" ? pagesLimit : Infinity);
  const publishedLimitNum = Number.isFinite(_publishedLimit) ? (_publishedLimit as number) : Infinity;
  const canUpgradePlan = plan !== "pro" && plan !== "tierless";

  const canCreate = useMemo(() => {
    if (pagesLimit === "unlimited") return true;
    return totalPages < (pagesLimit as number);
  }, [pagesLimit, totalPages]);

  const pagesPct = useMemo(() => {
    if (pagesLimit === "unlimited") return 0;
    return Math.min(100, Math.round((totalPages / Math.max(1, pagesLimit as number)) * 100));
  }, [pagesLimit, totalPages]);

  const isOverPagesLimit = typeof pagesLimit === "number" && totalPages > pagesLimit;
  const overLimitMessage =
    "You're over the page limit for your plan. Resolve it by deleting pages or upgrading your plan.";
  useEffect(() => {
    if (isOverPagesLimit) bumpLimitPulse();
  }, [isOverPagesLimit, bumpLimitPulse]);
  const guardOverLimit = useCallback(() => {
    if (!isOverPagesLimit) return false;
    showToast(overLimitMessage);
    bumpLimitPulse();
    return true;
  }, [isOverPagesLimit, bumpLimitPulse, showToast]);

  const openShareModal = useCallback(
    async (slug: string) => {
      if (guardOverLimit()) return;
      const target = rows.find((r) => r.meta.slug === slug);
      const published = !!(target?.meta?.published ?? target?.meta?.online);
      if (!published) {
        showToast('Publish this page from the dashboard ("Offline" button) to share it.');
        return;
      }
      try {
        setShareSlug(slug);
        setShareUrl("");
        setShareLoading(true);
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const path = await getPublicUrlForSlug(slug);
        setShareUrl(`${origin}${path}`);
      } catch (err) {
        console.error("openShareModal failed:", err);
        showToast("Could not prepare share link.");
        setShareSlug(null);
        setShareUrl("");
      } finally {
        setShareLoading(false);
      }
    },
    [guardOverLimit, rows, showToast]
  );

  const closeShareModal = useCallback(() => {
    setShareSlug(null);
    setShareUrl("");
  }, []);

  const startRename = useCallback(
    (slug: string, name: string) => {
      if (guardOverLimit()) return;
      setRenSlug(slug);
      setRenName(name);
      setRenError(null);
    },
    [guardOverLimit]
  );
  const pagesCounterClass = [
    "mt-1 text-xs",
    isOverPagesLimit ? "text-rose-600 font-semibold" : "text-[var(--muted)]",
    limitPulse ? "animate-pulse" : "",
  ]
    .join(" ")
    .trim();
  const progressGlowClass = limitPulse ? "shadow-[0_0_0_3px_rgba(248,113,113,0.35)]" : "";


  const derived = useMemo(() => {
    const term = q.trim().toLowerCase();

    let arr = rows.filter((r) => {
      const byText =
        !term || (r.meta.name?.toLowerCase() || "").includes(term) || (r.meta.slug?.toLowerCase() || "").includes(term);
      let byFilter = true;
      if (activeFilter === "online") byFilter = !!r.meta.published;
      else if (activeFilter === "offline") byFilter = !r.meta.published;
      else if (activeFilter === "favorites") byFilter = !!r.meta.favorite;
      return byText && byFilter;
    });

    if (sortBy === "manual") {
      arr = [...arr].sort((a, b) => {
        const ai = typeof a.meta.order === "number" ? a.meta.order : 0;
        const bi = typeof b.meta.order === "number" ? b.meta.order : 0;
        return ai - bi;
      });
    } else {
      arr = [...arr].sort((a, b) => {
        if (sortBy === "created_desc") return (b.meta.createdAt || 0) - (a.meta.createdAt || 0);
        if (sortBy === "name_asc") return (a.meta.name || "").localeCompare(b.meta.name || "");
        if (sortBy === "status") {
          const sa = a.meta.published ? 1 : 0;
          const sb = b.meta.published ? 1 : 0;
          return sb - sa;
        }
        return 0;
      });
      arr = [...arr].sort((a, b) => (b.meta.favorite ? 1 : 0) - (a.meta.favorite ? 1 : 0));
    }

    return arr;
  }, [rows, q, activeFilter, sortBy]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const editable = (e.target as HTMLElement)?.getAttribute?.("contenteditable") === "true";
      if (tag === "input" || tag === "textarea" || tag === "select" || editable) return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (canCreate && !busy) createBlank();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canCreate, busy]);

  // Generate a unique copy name based on existing page names
  const uniqueCopyName = (name: string) => {
    const existing = new Set(
      rows.map((r) => (r.meta.name || "").trim().toLowerCase())
    );
    const stripped = name
      .trim()
      .replace(/^copy of\s+/i, "")
      .replace(/\(\d+\)$/g, "")
      .trim();
    const base = `Copy of ${stripped || "Untitled Page"}`.trim();
    if (!existing.has(base.toLowerCase())) return base;
    for (let i = 2; i < 9999; i++) {
      const cand = `${base} (${i})`;
      if (!existing.has(cand.toLowerCase())) return cand;
    }
    return `${base} (${Date.now()})`;
  };
  // --- Public URL helper: /p/{id}-{slug} (fallback /p/slug) -------
  async function getPublicUrlForSlug(slug: string) {
    try {
      const r = await fetch(`/api/calculators/${encodeURIComponent(slug)}`, {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (r.ok) {
        const j = await r.json();
        const id = j?.meta?.id;
        if (id && typeof id === "string") {
          return `/p/${encodeURIComponent(id)}-${encodeURIComponent(slug)}`;
        }
      }
    } catch { }
    // fallback za starije zapise bez id-a
    return `/p/${encodeURIComponent(slug)}`;
  }

  /* --------------------- CRUD helpers --------------------- */
  async function createBlank() {
    if (!canCreate) {
      alert("You've reached the pages limit for your plan. Manage plan in Account.");
      return;
    }

    setBusy("new");
    try {
      const now = Date.now();
      const r = await fetch("/api/calculators", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
        cache: "no-store",
      });

      const payloadText = await r.text();
      let payloadJson: any = null;
      try { payloadJson = JSON.parse(payloadText); } catch { }

      if (!r.ok) {
        if (r.status === 409 && payloadJson?.error === "PLAN_LIMIT" && payloadJson?.key === "pages") {
          const allow = payloadJson?.allow;
          const need = payloadJson?.need;
          const planName = payloadJson?.plan || plan;
          alert(
            `Your plan (“${planName}”) allows ${allow} page(s).\n` +
            `You tried to create ${need}. Upgrade your plan to add more pages.`
          );
          return;
        }

        console.error("CREATE /api/calculators ->", payloadText || r.statusText);
        showToast("Could not create page. Try again.");
        return;
      }

      const json = payloadJson || {};
      if (json?.slug) {
        setRows((prev) => [
          ...prev,
          { meta: { name: "Untitled Page", slug: json.slug!, published: false, createdAt: now, updatedAt: now } },
        ]);
        setCreatedLS(json.slug!, now);
        window.location.href = `/editor/${json.slug}`;
      } else {
        window.location.reload();
      }
    } finally {
      setBusy(null);
    }
  }

  async function duplicate(slug: string, name: string) {
    if (!canCreate) {
      alert("You've reached the pages limit for your plan. Manage plan in Account.");
      return;
    }
    setBusy(slug);
    try {
      const now = Date.now();
      const safeName = uniqueCopyName(name);
      const r = await fetch("/api/calculators", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from: slug, name: safeName }),
      });
      const payload = await r.text();
      if (!r.ok) {
        console.warn("DUP /api/calculators ->", payload);
        alert("You reached your pages limit. Manage plan in Account.");
        return;
      }
      const json = JSON.parse(payload) as { slug?: string };
      if (json?.slug) {
        setRows((prev) => [
          ...prev,
          { meta: { name: safeName, slug: json.slug!, published: false, createdAt: now, updatedAt: now } },
        ]);
        setCreatedLS(json.slug!, now);
      }
    } finally {
      setBusy(null);
    }
  }

  function publishLimitMsg(planName: string) {
    if (planName === "tierless") {
      return "You've reached the maximum number of online pages for Tierless.";
    }
    return "Online limit reached for your plan. Upgrade your plan to publish more pages.";
  }

  async function setOnline(slug: string, next: boolean) {
    if (guardOverLimit()) return;
    // 1) Pre-submit guard (UI)
    if (next && Number.isFinite(publishedLimitNum) && publishedCount >= publishedLimitNum) {
      showPublishNotice(publishLimitMsg(plan));
      return;
    }

    setBusy(slug);
    try {
      const r = await fetch(`/api/calculators/${encodeURIComponent(slug)}/publish`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-plan": plan,
          "x-user-id": (account?.email || (account as any)?.user?.email || ""),
        },
        body: JSON.stringify({ publish: next, slug }),
      });

      const txt = await r.text();

      // 2) Server guard (sigurnosna mreža)
      if (!r.ok) {
        if (r.status === 409 || txt.includes("publish_limit_reached")) {
          showPublishNotice(publishLimitMsg(plan));
          return;
        }
        console.error("PUBLISH /api/calculators ->", txt);
        showToast("Failed to change status");
        return;
      }

      // 3) Optimistično ažuriranje UI
      setRows((prev) =>
        prev.map((x) =>
          x.meta.slug === slug ? { ...x, meta: { ...x.meta, published: next, updatedAt: Date.now() } } : x
        )
      );
      showToast(next ? "Now online" : "Now offline");
    } finally {
      setBusy(null);
    }
  }

  async function toggleFavorite(slug: string, next: boolean) {
    if (guardOverLimit()) return;
    setRows((prev) => prev.map((x) => (x.meta.slug === slug ? { ...x, meta: { ...x.meta, favorite: next } } : x)));
    setFavLS(slug, next);
    await fetch(`/api/calculators/${encodeURIComponent(slug)}/meta`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ meta: { favorite: next, updatedAt: Date.now() } }),
    }).catch(() => { });
  }

  async function persistOrder(nextArr: MiniCalc[]) {
    const order = nextArr.map((r) => r.meta.slug);
    saveOrderLS(order);
    await fetch(`/api/calculators/reorder`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ order }),
    }).catch(() => { });
  }

  async function renameConfirmed(newName: string) {
    if (!renSlug) return;
    if (guardOverLimit()) {
      setRenError(overLimitMessage);
      return;
    }
    const slug = renSlug;
    setBusy(slug);
    setRenError(null);
    try {
      const r = await fetch(`/api/calculators/${encodeURIComponent(slug)}/rename`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newName, slug }),
      });
      const payloadText = await r.text();
      let payloadJson: any = null;
      try { payloadJson = JSON.parse(payloadText); } catch { }
      if (!r.ok) {
        const errCode = payloadJson?.error || "";
        if (r.status === 409 || errCode === "name_exists" || payloadText.includes("name_exists")) {
          setRenError("You already have a page with that name.");
          return;
        }
        console.error("RENAME /api/calculators ->", payloadText);
        setRenError("Rename failed. Please try a different name.");
        return;
      }
      const nextSlug = payloadJson?.slug || slug;
      const stamp = Date.now();
      setRows((prev) =>
        prev.map((x) =>
          x.meta.slug === slug
            ? { ...x, meta: { ...x.meta, name: newName, slug: nextSlug, updatedAt: stamp } }
            : x
        )
      );
      if (nextSlug !== slug) {
        setSelected((prev) => {
          if (!prev.has(slug)) return prev;
          const next = new Set(prev);
          next.delete(slug);
          next.add(nextSlug);
          return next;
        });
        replaceSlugInOrderLS(slug, nextSlug);
        replaceSlugInFavsLS(slug, nextSlug);
        replaceSlugInCreatedLS(slug, nextSlug);
      }
      setRenSlug(null);
      setRenName("");
    } finally {
      setBusy(null);
    }
  }

  async function removeConfirmed() {
    if (!confirmSlug) return;
    const slug = confirmSlug;
    setBusy(slug);
    try {
      const r = await fetch(`/api/calculators`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slugs: [slug] }),
      });
      const payload = await r.text().catch(() => "");
      if (!r.ok) {
        console.error("DELETE /api/calculators ->", payload);
        alert("Failed to move to Trash.");
        return;
      }
      setRows((prev) => prev.filter((x) => x.meta.slug !== slug));
      deleteFavLS(slug);
      deleteCreatedLS(slug);
      window.dispatchEvent(new Event("TL_TRASH_BLINK"));
      window.dispatchEvent(new Event("TL_COUNTERS_DIRTY"));
      setConfirmSlug(null);
      setConfirmName("");
    } finally {
      setBusy(null);
    }
  }

  const moveBy = (slug: string, dir: -1 | 1) => {
    if (guardOverLimit()) return;
    setRows((prev) => {
      const idx = prev.findIndex((x) => x.meta.slug === slug);
      if (idx < 0) return prev;
      const next = [...prev];
      const newIdx = Math.max(0, Math.min(next.length - 1, idx + dir));
      if (newIdx === idx) return prev;
      const [item] = next.splice(idx, 1);
      next.splice(newIdx, 0, item);

      for (let i = 0; i < next.length; i++) {
        next[i] = { ...next[i], meta: { ...next[i].meta, order: i } };
      }
      persistOrder(next);
      setSortBy("manual");
      saveSortLS("manual");
      return next;
    });
  };

  const openPublicPage = useCallback(
    (row: MiniCalc) => {
      if (guardOverLimit()) return;
      const slug = row.meta.slug;
      const published = !!(row.meta.published ?? row.meta.online);
      if (!published) {
        showToast('Publish this page from the dashboard ("Offline" button) to open the link.');
        return;
      }
      const id = row.meta?.id ? String(row.meta.id) : "";
      const pretty = id ? `/p/${id}-${slug}` : `/p/${slug}`;
      window.open(pretty, "_blank", "noopener,noreferrer");
    },
    [guardOverLimit]
  );

  const handleEdit = useCallback(
    (slug: string) => {
      if (guardOverLimit()) return;
      router.push(`/editor/${slug}`);
    },
    [guardOverLimit, router]
  );

  const allOnPage = derived.map((r) => r.meta.slug);
  const allSelected = allOnPage.length > 0 && allOnPage.every((s) => selected.has(s));
  const toggleSelect = (slug: string, on?: boolean) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (on === undefined) (s.has(slug) ? s.delete(slug) : s.add(slug));
      else on ? s.add(slug) : s.delete(slug);
      return s;
    });
  };

  async function bulkDelete() {
    const list = allOnPage.filter((s) => selected.has(s));
    if (list.length === 0) return;

    setBusy("bulk-delete");
    try {
      const r = await fetch(`/api/calculators`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slugs: list }),
      });
      const payload = await r.text().catch(() => "");
      if (!r.ok) {
        console.error("BULK DELETE /api/calculators ->", payload);
        alert("Failed to move selected pages to Trash.");
        return;
      }

      // lokalno očisti
      list.forEach((slug) => {
        deleteFavLS(slug);
        deleteCreatedLS(slug);
      });

      // izbaci iz tabele u jednom potezu
      setRows((prev) => prev.filter((x) => !list.includes(x.meta.slug)));
      setSelected(new Set());
      window.dispatchEvent(new Event("TL_TRASH_BLINK"));
      window.dispatchEvent(new Event("TL_COUNTERS_DIRTY"));
    } finally {
      setBusy(null);
    }
  }

  /* --------------------- UI --------------------- */
  return (
    <main className="container-page space-y-6 tl-dashboard">
      {toast && <div className="fixed bottom-4 right-4 z-[120] card px-3 py-2 text-sm shadow-ambient">{toast}</div>}

      {notice && (
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] p-3 text-sm">
          {notice}
        </div>
      )}

      {publishNotice && (
        <div className="relative rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-400/70 dark:bg-amber-400/20 dark:text-amber-50">
          <button
            type="button"
            className="absolute right-3 top-2 text-xs font-semibold text-amber-900/80 dark:text-amber-100/80"
            onClick={() => setPublishNotice(null)}
            aria-label="Dismiss publish limit notice"
          >
            ×
          </button>
          <p>{publishNotice}</p>
          {canUpgradePlan && (
            <Link
              href="/dashboard/account"
              className="mt-2 inline-flex text-xs font-semibold underline decoration-dotted underline-offset-2"
            >
              Manage plan →
            </Link>
          )}
        </div>
      )}

      {isOverPagesLimit && (
        <div className="rounded-[var(--radius)] border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/60 dark:bg-amber-500/10 dark:text-amber-50">
          <div className="font-semibold">You&apos;re over the page limit for your plan.</div>
          <p className="mt-1 text-xs">
            Delete some pages or upgrade your plan to continue editing or publishing.
          </p>
          <Link
            href="/dashboard/account"
            className="mt-2 inline-flex text-xs font-semibold text-amber-900 underline decoration-dotted underline-offset-2 hover:decoration-solid dark:text-amber-100"
          >
            Manage plan →
          </Link>
        </div>
      )}

      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Pages</h1>
          <p className="text-xs text-[var(--muted)]">Create, edit and share your Tierless pages.</p>
          {userDebug && (
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              user: <code>{userDebug.userId}</code> • file: <code>{userDebug.file}</code>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 items-stretch sm:items-end">
          <div className="relative" ref={newMenuRef}>
            <ActionButton
              label={busy === "new" ? "Creating…" : "New Page"}
              onClick={() => setNewMenuOpen((v) => !v)}
              disabled={busy === "new" || !canCreate}
              title={!canCreate ? "You reached your pages limit — manage plan in Account" : undefined}
              variant="brand"
            />
            {newMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-[90] bg-[rgba(0,0,0,0.001)]"
                  onClick={() => setNewMenuOpen(false)}
                  aria-hidden
                />
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl border border-[var(--border)] bg-white dark:bg_white text-black dark:text-black shadow-[0_20px_40px_rgba(0,0,0,.70)] p-1 z-[100]"
                  style={{ color: "#000" }}
                >
                  <button
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 cursor-pointer text-black !text-black dark:!text-black"
                    style={{ color: "#000" }}
                    onClick={() => {
                      setNewMenuOpen(false);
                      createBlank();
                    }}
                  >
                    New from blank
                  </button>
                  <Link
                    className="block px-3 py-2 rounded-lg hover:bg-neutral-100 cursor-pointer text-black !text-black dark:!text-black"
                    style={{ color: "#000" }}
                    href="/templates"
                    onClick={() => setNewMenuOpen(false)}
                  >
                    New from template
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Usage / quotas */}
      <section
        className={`card p-4 rounded-[var(--radius)] bg-[var(--card)] border ${isOverPagesLimit ? "border-rose-300/80" : "border-[var(--border)]"
          } ${limitPulse && isOverPagesLimit ? "ring-2 ring-rose-200/60" : ""}`}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-sm font-medium text-[var(--text)]">Pages</div>
            <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/10">
              <div
                className={`h-2.5 rounded-full transition-[width] duration-500 bg-gradient-to-r ${isOverPagesLimit
                  ? "from-rose-500 to-rose-400"
                  : "from-[var(--brand-1,#4F46E5)] to-[var(--brand-2,#22D3EE)]"
                  } ${progressGlowClass}`}
                style={{ width: `${pagesPct}%` }}
                aria-hidden
              />
            </div>
            <div className={pagesCounterClass}>
              {typeof pagesLimit === "number" ? `${totalPages} / ${pagesLimit}` : `${totalPages} / ∞`}
            </div>
          </div>

          {/* Page count pills */}
          <div className="flex flex-wrap items-start justify-end gap-2">
            {/* Total pages pill */}
            <span
              className="inline-flex items-center rounded-full border px-3 py-1 text-sm shadow-sm transition-colors duration-300 border-[var(--border)] bg-[var(--card)] text-[var(--text)]"
              title="Total pages (all pages including drafts)"
            >
              {totalPages} / {pagesLimit === "unlimited" ? "∞" : pagesLimit} total
            </span>

            {/* Published pill */}
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-sm shadow-sm transition-colors duration-300 ${isOverPagesLimit && limitPulse
                ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--text)]"
                }`}
              title="Published pages in your plan"
            >
              {publishedCount} / {Number.isFinite(publishedLimitNum) ? publishedLimitNum : "∞"} published
            </span>
          </div>
        </div>
      </section>

      {/* Search + Filters + Sort (hide when there are no pages) */}
      {totalPages > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              ref={searchRef}
              className="field w-full max-w-md bg-[var(--card)] text-[var(--text)]"
              placeholder="Search by name or slug… (press / to focus)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="text-xs text-[var(--muted)]">{derived.length} total</div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <FilterChip label="All" active={activeFilter === "all"} onClick={() => setActiveFilter("all")} />
              <FilterChip label="Online" active={activeFilter === "online"} onClick={() => setActiveFilter("online")} />
              <FilterChip label="Offline" active={activeFilter === "offline"} onClick={() => setActiveFilter("offline")} />
              <FilterChip label="Favorites" active={activeFilter === "favorites"} onClick={() => setActiveFilter("favorites")} />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--muted)]">Sort</span>
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>
          </div>
        </div>
      )}

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2">
          <div className="font-medium text-[var(--text)]">{selected.size} selected</div>
          <div className="sm:grow" />
          <ActionButton label="Delete" onClick={bulkDelete} variant="danger" />
        </div>
      )}

      {/* Table with gradient frame in dark */}
      {loading ? (
        <div className="text-sm text-[var(--muted)]">Loading…</div>
      ) : derived.length === 0 ? (
        <div className="tl-empty-wrap">
          <div className="w-full flex flex-col gap-4">
            <button
              type="button"
              className="tl-empty-card tl-empty-card--click tl-empty-card--primary text-left"
              onClick={createBlank}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold tracking-wide uppercase text-[var(--muted)] mb-1">
                    First steps
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-[var(--text)]">
                    Create your first page
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Create a blank page.
                  </p>
                </div>
                <div className="mt-1 shrink-0">
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide">
                    <span className="bg-gradient-to-r from-[var(--brand-1,#4F46E5)] to-[var(--brand-2,#22D3EE)] bg-clip-text text-transparent">
                      Recommended
                    </span>
                  </span>
                </div>
              </div>
            </button>

            <Link
              href="/templates"
              className="tl-empty-card tl-empty-card--click tl-empty-card--secondary block text-left no-underline"
            >
              <div className="flex flex-col gap-2">
                <div className="text-xs font-semibold tracking-wide uppercase text-[var(--muted)] mb-1">
                  First steps
                </div>
                <div className="text-2xl font-semibold text-[var(--text)]">
                  Create your first page from template
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Start from a template.
                </p>
              </div>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="sm:hidden space-y-3">
            {derived.map((r) => (
              <PageCard
                key={r.meta.slug}
                row={r}
                isSelected={selected.has(r.meta.slug)}
                onSelectToggle={toggleSelect}
                onShare={openShareModal}
                onOpenPublic={openPublicPage}
                onEdit={handleEdit}
                onRenameStart={startRename}
                onDuplicate={duplicate}
                onDelete={(slug, name) => {
                  setConfirmSlug(slug);
                  setConfirmName(name);
                }}
                onToggleOnline={setOnline}
                onToggleFavorite={toggleFavorite}
                busySlug={busy}
                publishedCount={publishedCount}
                publishedLimit={publishedLimitNum}
                moveBy={moveBy}
              />
            ))}
          </div>

          <div className="hidden sm:block tl-grad-frame overflow-x-auto">
            <table ref={tableRef} className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="text-left">
                  <th className="w-[42px] text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => {
                        const on = e.target.checked;
                        const s = new Set(selected);
                        for (const slug of allOnPage) on ? s.add(slug) : s.delete(slug);
                        setSelected(s);
                      }}
                    />
                  </th>
                  <th className="text-[var(--text)]">Name</th>
                  <th className="text-[var(--text)] text-center">Link</th>
                  <th className="text-[var(--text)] text-center hidden sm:table-cell">Created</th>
                  <th className="w-[140px] text-[var(--text)] text-center">Status</th>
                  <th className="w-[560px] text-[var(--text)] text-center">
                    <span className="inline-block">Actions</span>
                  </th>
                  <th className="w-[110px] text-[var(--text)] text-center hidden lg:table-cell">Reorder (drag)</th>
                </tr>
              </thead>
              <tbody>
                {derived.map((r, i) => {
                  const { slug } = r.meta;
                  const isSel = selected.has(slug);
                  return (
                    <Fragment key={slug}>
                      {/* GAP before */}
                      {overSlug === slug && overPos === "before" && (
                        <tr className="tl-drop-gap">
                          <td colSpan={7} className="p-0">
                            <div className="tl-gap-strip">
                              {/* Render the dragged row inside the gap */}
                              <div className="tl-drag-preview">
                                {(() => {
                                  const dRow = derived.find(d => d.meta.slug === dragSlug);
                                  if (!dRow) return null;
                                  return (
                                    <table className="w-full text-sm">
                                      <tbody>
                                        <PageRow
                                          row={dRow}
                                          index={0}
                                          isSelected={selected.has(dragSlug!)}
                                          isDragging={false} // Render as normal, not dragged style
                                          onSelectToggle={() => { }}
                                          onShare={() => { }}
                                          onOpenPublic={() => { }}
                                          onEdit={() => { }}
                                          onRenameStart={() => { }}
                                          onDuplicate={() => { }}
                                          onDelete={() => { }}
                                          onToggleOnline={() => { }}
                                          onToggleFavorite={() => { }}
                                          busySlug={null}
                                          onPointerDragStart={() => { }}
                                          publishedCount={publishedCount}
                                          publishedLimit={publishedLimitNum}
                                        />
                                      </tbody>
                                    </table>
                                  );
                                })()}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      <PageRow
                        row={r}
                        index={i}
                        isSelected={isSel}
                        isDragging={dragSlug === slug}
                        onSelectToggle={toggleSelect}
                        onShare={openShareModal}
                        onOpenPublic={openPublicPage}
                        onEdit={handleEdit}
                        onRenameStart={startRename}
                        onDuplicate={duplicate}
                        onDelete={(slug, name) => {
                          setConfirmSlug(slug);
                          setConfirmName(name);
                        }}
                        onToggleOnline={setOnline}
                        onToggleFavorite={toggleFavorite}
                        busySlug={busy}
                        onPointerDragStart={onPointerDragStart}
                        publishedCount={publishedCount}
                        publishedLimit={publishedLimitNum}
                      />

                      {/* GAP after */}
                      {overSlug === slug && overPos === "after" && (
                        <tr className="tl-drop-gap">
                          <td colSpan={7} className="p-0">
                            <div className="tl-gap-strip">
                              {/* Render the dragged row inside the gap */}
                              <div className="tl-drag-preview">
                                {(() => {
                                  const dRow = derived.find(d => d.meta.slug === dragSlug);
                                  if (!dRow) return null;
                                  return (
                                    <table className="w-full text-sm">
                                      <tbody>
                                        <PageRow
                                          row={dRow}
                                          index={0}
                                          isSelected={selected.has(dragSlug!)}
                                          isDragging={false} // Render as normal, not dragged style
                                          onSelectToggle={() => { }}
                                          onShare={() => { }}
                                          onOpenPublic={() => { }}
                                          onEdit={() => { }}
                                          onRenameStart={() => { }}
                                          onDuplicate={() => { }}
                                          onDelete={() => { }}
                                          onToggleOnline={() => { }}
                                          onToggleFavorite={() => { }}
                                          busySlug={null}
                                          onPointerDragStart={() => { }}
                                          publishedCount={publishedCount}
                                          publishedLimit={publishedLimitNum}
                                        />
                                      </tbody>
                                    </table>
                                  );
                                })()}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modals */}
      <ConfirmDeleteModal
        open={!!confirmSlug}
        name={confirmName}
        onCancel={() => {
          if (!busy) {
            setConfirmSlug(null);
            setConfirmName("");
          }
        }}
        onConfirm={removeConfirmed}
        busy={!!busy}
      />
      {mounted && renSlug && typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[7000] flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => !busy && setRenSlug(null)} />
            <div className="relative z-[7001] card w-[92vw] max-w-md p-5 bg-[var(--card)] border border-[var(--border)]">
              <div className="text-lg font-semibold text-[var(--text)]">Rename page</div>
              <input
                className="field mt-3 w-full bg-[var(--card)] text-[var(--text)]"
                placeholder="New name"
                value={renName}
                onChange={(e) => setRenName(e.target.value)}
                autoFocus
              />
              {!!renError && <p className="mt-2 text-sm text-rose-600">{renError}</p>}
              <div className="mt-5 flex items-center justify-end gap-2">
                <ActionButton label="Cancel" onClick={() => setRenSlug(null)} disabled={!!busy} variant="brand" />
                <ActionButton
                  label={busy ? "Saving…" : "Save name"}
                  onClick={() => renameConfirmed(renName.trim())}
                  disabled={!!busy || !renName.trim()}
                  variant="brand"
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      <ShareQrModal
        open={!!shareSlug}
        url={shareUrl}
        loading={shareLoading && !shareUrl}
        onClose={closeShareModal}
      />

      {/* Scoped theme tokens + effects */}
      <style jsx global>{`
        /* LIGHT (scoped) */
        .tl-dashboard{
          --bg: #ffffff;
          --card: #ffffff;
          --border: #e5e7eb;
          --text: #e5e7eb;
        }
        .tl-dashboard{ --text:#111827; --muted:#6b7280; --surface:rgba(0,0,0,.04); --track:#f3f4f6; --brand-1:#4F46E5; --brand-2:#22D3EE; }
        html.dark .tl-dashboard{
          --bg:#0b0b0c; --card:#111214; --border:rgba(255,255,255,.12);
          --text:#e5e7eb; --muted:#9ca3af; --surface:rgba(255,255,255,.06); --track:rgba(255,255,255,.08);
          --brand-1:#7c7bff; --brand-2:#2dd4bf;
        }

        .tl-grad-frame{
          position: relative;
          background: var(--card);
          border-radius: 16px;
          padding: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 10px 24px rgba(2,6,23,.08);
          overflow: hidden;
        }
        .tl-grad-frame::before{
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 18px;
          background: conic-gradient(from 180deg at 50% 50%, var(--brand-1), var(--brand-2), var(--brand-1));
          filter: blur(18px);
          opacity: .20;
          pointer-events: none;
          z-index: -1;
        }
        .tl-grad-frame::after{
          content: "";
          position: absolute;
          left: -10px; right: -10px; bottom: -14px; height: 44px;
          border-radius: 24px;
          background: radial-gradient(80% 120% at 50% 0%, rgba(79,70,229,.25), rgba(34,211,238,.18) 40%, transparent 75%);
          filter: blur(18px);
          opacity: .35;
          pointer-events: none;
          z-index: -1;
        }
        html.dark .tl-grad-frame{ box-shadow: 0 12px 28px rgba(0,0,0,.45); }
        html.dark .tl-grad-frame::before{ opacity: .32; filter: blur(24px); }
        html.dark .tl-grad-frame::after{ opacity: .45; }

        .tl-drop-gap .tl-gap-strip{
          position: relative;
          margin: 4px 0;
          border-radius: 12px;
          background: linear-gradient(90deg, var(--brand-1), var(--brand-2));
          padding: 2px;
        }
        .tl-drag-preview {
          background: var(--card);
          border-radius: 10px;
          overflow: hidden;
          opacity: 0.9;
        }
        .tl-drag-preview table {
            margin: 0;
        }
        .tl-drag-preview td {
            border: none !important;
        }
        .tl-drop-gap .tl-gap-strip::before{
          display: none;
        }
        .tl-drop-gap .tl-gap-strip::after{
          display: none;
        }

        .cursor-grab { cursor: grab; cursor: -webkit-grab; }
        .cursor-grabbing { cursor: grabbing; cursor: -webkit-grabbing; }

        .tl-row--dragging { display: none; }
        .tl-drag-active { cursor: grabbing !important; }
        .tl-empty-wrap{
          display:flex;
          justify-content:center;
          align-items:stretch;
        }
        .tl-empty-card{
          position:relative;
          width:100%;
          max-width:960px;
          margin:24px auto 0;
          padding:28px 32px;
          border-radius:24px;
          background:var(--card);
          overflow:hidden;
        }
        .tl-empty-card::before{
          content:"";
          position:absolute;
          inset:0;
          padding:1.5px;
          border-radius:inherit;
          background:linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE));
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite:xor;
          mask-composite:exclude;
          pointer-events:none;
        }
        html.dark .tl-empty-card{
          box-shadow:0 16px 40px rgba(0,0,0,.55);
        }
        .tl-empty-card--click{
          cursor:pointer;
          transition:transform .15s ease, box-shadow .15s ease, background-color .15s ease;
        }
        .tl-empty-card--click:hover{
          transform:translateY(-1px);
          box-shadow:0 18px 40px rgba(15,23,42,.18);
        }
        .tl-empty-card--click:active{
          transform:translateY(0);
        }

        /* Primary empty-state card (default path) */
        .tl-empty-card--primary{
          background:
            radial-gradient(130% 160% at 0% 0%, rgba(79,70,229,.06), transparent 60%),
            radial-gradient(120% 140% at 100% 0%, rgba(34,211,238,.05), transparent 55%),
            var(--card);
        }
        html.dark .tl-empty-card--primary{
          background:
            radial-gradient(130% 160% at 0% 0%, rgba(124,123,255,.14), transparent 60%),
            radial-gradient(120% 140% at 100% 0%, rgba(45,212,191,.12), transparent 55%),
            var(--card);
        }
        .tl-empty-card--primary::after{
          content:"";
          position:absolute;
          inset:-2px;
          border-radius:inherit;
          background:radial-gradient(120% 160% at 0% 0%, rgba(79,70,229,.35), transparent 60%);
          opacity:0;
          pointer-events:none;
          animation:tlEmptyPulse 3.2s ease-out .5s 2;
        }

        @keyframes tlEmptyPulse{
          0%{opacity:0;}
          18%{opacity:.6;}
          40%{opacity:0;}
          100%{opacity:0;}
        }

        /* Secondary empty-state card (templates) */
        .tl-empty-card--secondary::before{
          background:linear-gradient(90deg,rgba(148,163,184,.6),rgba(148,163,184,.3));
        }

        html.dark .tl-empty-card--click:hover{
          box-shadow:0 18px 40px rgba(0,0,0,.70);
        }
      `}</style>
    </main>
  );
}
