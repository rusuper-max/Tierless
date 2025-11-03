// src/components/dashboard/Sidebar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Puzzle,
  User,
  LayoutGrid,
  Trash2,
} from "lucide-react";
import { useAccount } from "@/hooks/useAccount";
import { t } from "@/i18n";

type Item = { href: string; label: string; icon: any; exact?: boolean; badge?: number; navKey?: string };

export default function Sidebar() {
  const pathname = usePathname();
  const { plan } = useAccount(); // free | starter | growth | pro | tierless

  // Trash badge count (load on route change + event-based refresh)
  const [trashCount, setTrashCount] = useState<number>(0);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/trash", { cache: "no-store", credentials: "same-origin" });
        const j = await r.json();
        if (alive) setTrashCount(Array.isArray(j?.rows) ? j.rows.length : 0);
      } catch {
        if (alive) setTrashCount(0);
      }
    };
    load();

    const onDirty = () => load();
    window.addEventListener("TL_COUNTERS_DIRTY", onDirty);
    return () => { alive = false; window.removeEventListener("TL_COUNTERS_DIRTY", onDirty); };
  }, [pathname]);

  // Precizna animacija samo za Trash dugme (bez ikakvog router push-a)
  useEffect(() => {
    const trashEl = document.getElementById("nav-trash");
    if (!trashEl) return;
    const onFlash = () => {
      trashEl.classList.remove("tl-trash-flash");
      // force reflow
      void trashEl.offsetWidth;
      trashEl.classList.add("tl-trash-flash");
      // auto cleanup
      setTimeout(() => trashEl.classList.remove("tl-trash-flash"), 500);
    };
    window.addEventListener("TL_TRASH_FLASH", onFlash);
    return () => window.removeEventListener("TL_TRASH_FLASH", onFlash);
  }, []);

  const NAV: Item[] = [
    { href: "/dashboard",              label: t("Pages"),        icon: LayoutDashboard, exact: true, navKey: "pages" },
    { href: "/dashboard/stats",        label: t("Stats"),        icon: BarChart3,                          navKey: "stats" },
    { href: "/templates",              label: t("Templates"),    icon: LayoutGrid,                         navKey: "templates" },
    { href: "/dashboard/integrations", label: t("Integrations"), icon: Puzzle,                             navKey: "integrations" },
    { href: "/dashboard/settings",     label: t("Settings"),     icon: Settings,                           navKey: "settings" },
    { href: "/dashboard/trash",        label: t("Trash"),        icon: Trash2, badge: trashCount,          navKey: "trash" },
    { href: "/dashboard/account",      label: t("Account"),      icon: User,                               navKey: "account" },
  ];

  const isActive = (it: Item) =>
    it.exact ? pathname === it.href : pathname.startsWith(it.href);

  return (
    <aside
      className="hidden md:flex md:flex-col md:w-64 lg:w-72 bg-[var(--panel,white)]/90 backdrop-blur-md"
      aria-label={t("Dashboard sidebar")}
    >
      {/* Header — levo: gradient “Dashboard”, desno: plan pill */}
      <div className="px-4 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
        <h2
          title="Dashboard"
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            lineHeight: 1,
            backgroundImage: "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.01em",
          }}
        >
          Dashboard
        </h2>
        <PlanPill plan={String(plan)} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3">
        <ul className="space-y-1">
          {NAV.map((it) => {
            const active = isActive(it);
            const isTrash = it.navKey === "trash";
            return (
              <li key={it.href}>
                <Link
                  id={isTrash ? "nav-trash" : undefined}
                  data-nav={it.navKey}
                  href={it.href}
                  className={[
                    "group relative flex items-center gap-3 rounded-[var(--radius,0.75rem)] px-3 py-2.5 text-sm transition bg-[var(--card,white)]",
                    active
                      ? "border border-transparent"
                      : "border border-transparent hover:border-[var(--border)] hover:bg-[color:var(--card,white)]/70",
                    // flash animacija samo vizuelna, bez blokiranja klikova
                    isTrash ? "tl-trash-ring" : "",
                  ].join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  {/* levo marker (active) */}
                  <span
                    aria-hidden
                    className={[
                      "absolute top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full",
                      active ? "bg-[color:var(--brand-2,#22D3EE)] opacity-100" : "opacity-0",
                    ].join(" ")}
                    style={{ left: 6 }}
                  />

                  {/* hover/active brand outline */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[var(--radius,0.75rem)] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    style={{
                      padding: 1.5,
                      background: "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
                      WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                      WebkitMaskComposite: "xor" as any,
                      maskComposite: "exclude",
                    }}
                  />
                  {active && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-[var(--radius,0.75rem)]"
                      style={{
                        padding: 1.5,
                        background: "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
                        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                        WebkitMaskComposite: "xor" as any,
                        maskComposite: "exclude",
                      }}
                    />
                  )}

                  <it.icon
                    className={["size-[18px] transition-colors", active ? "text-[var(--brand-1,#4F46E5)]" : "text-neutral-800/80"].join(" ")}
                    aria-hidden
                  />
                  <span className="leading-none">{it.label}</span>

                  {/* badge */}
                  {typeof it.badge === "number" && it.badge > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center rounded-full min-w-5 h-5 px-1 text-[11px] bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200">
                      {it.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer mini help */}
      <div className="px-3 py-3 text-[11px] text-neutral-500 border-t border-[var(--border)]">
        {t("Need help?")} <Link href="/help" className="underline">{t("Docs")}</Link>
      </div>

      {/* lokalni stil samo za suptilan blink Trash dugmeta */}
      <style jsx>{`
        .tl-trash-ring::after {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: var(--radius, 0.75rem);
          pointer-events: none;
          opacity: 0;
          transition: opacity 300ms ease;
          background: linear-gradient(90deg, var(--brand-1,#4F46E5), var(--brand-2,#22D3EE));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          padding: 2px;
        }
        #nav-trash.tl-trash-flash::after {
          opacity: 1;
          animation: tlTrashBlink 500ms ease-out;
        }
        @keyframes tlTrashBlink {
          0%   { opacity: 0; transform: scale(0.98); }
          25%  { opacity: 1; transform: scale(1.01); }
          100% { opacity: 0; transform: scale(1); }
        }
      `}</style>
    </aside>
  );
}

/* ---------- Plan pill ---------- */
function planColors(p: string) {
  const key = (p || "free").toLowerCase();
  switch (key) {
    case "starter":  return { hex: "#14b8a6" }; // teal
    case "growth":   return { hex: "#3b82f6" }; // blue
    case "pro":      return { hex: "#ef4444" }; // red
    case "free":     return { hex: "#6b7280" }; // gray
    default:         return { hex: "#6b7280" };
  }
}
function PlanPill({ plan }: { plan: string }) {
  const key = (plan || "free").toLowerCase();
  const pretty = key.charAt(0).toUpperCase() + key.slice(1);

  if (key === "tierless") {
    return (
      <div className="relative inline-flex items-center gap-2 rounded-full px-2 py-1 text-[11px] bg-[var(--card,white)]">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            padding: 1.5,
            background: "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor" as any,
            maskComposite: "exclude",
          }}
        />
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--brand-2,#22D3EE)" }} aria-hidden />
        <span className="text-neutral-600">{t("Plan")}:</span>{" "}
        <b
          className="uppercase"
          style={{
            backgroundImage: "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
          }}
        >
          {pretty}
        </b>
      </div>
    );
  }

  const { hex } = planColors(key);
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-[11px] bg-[var(--card,white)]"
      style={{ border: `1.5px solid ${hex}` }}
    >
      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: hex }} aria-hidden />
      <span className="text-neutral-600">{t("Plan")}:</span>{" "}
      <b className="uppercase" style={{ color: hex }}>{pretty}</b>
    </div>
  );
}