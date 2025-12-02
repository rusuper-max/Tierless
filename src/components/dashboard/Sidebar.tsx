// src/components/dashboard/Sidebar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Puzzle,
  User,
  LayoutGrid,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useAccount } from "@/hooks/useAccount";
import { t } from "@/i18n";

type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: number;
  navKey?: string;
};

export default function Sidebar() {
  const pathname = usePathname();
  const { plan } = useAccount();

  // --- Trash Logic ---
  const [trashCount, setTrashCount] = useState<number>(0);
  const [isTrashFlashing, setTrashFlashing] = useState(false);

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
    const onFlash = () => {
      setTrashFlashing(true);
      setTimeout(() => setTrashFlashing(false), 500);
    };

    window.addEventListener("TL_COUNTERS_DIRTY", onDirty);
    window.addEventListener("TL_TRASH_FLASH", onFlash);

    return () => {
      alive = false;
      window.removeEventListener("TL_COUNTERS_DIRTY", onDirty);
      window.removeEventListener("TL_TRASH_FLASH", onFlash);
    };
  }, [pathname]);

  // --- Navigation Config ---
  const NAV: Item[] = useMemo(() => [
    { href: "/dashboard", label: t("Pages"), icon: LayoutDashboard, exact: true, navKey: "pages" },
    { href: "/dashboard/stats", label: t("Stats"), icon: BarChart3, navKey: "stats" },
    { href: "/dashboard/templates", label: t("Templates"), icon: LayoutGrid, navKey: "templates" },
    { href: "/dashboard/integrations", label: t("Integrations"), icon: Puzzle, navKey: "integrations" },
    { href: "/dashboard/settings", label: t("Settings"), icon: Settings, navKey: "settings" },
    { href: "/dashboard/trash", label: t("Trash"), icon: Trash2, badge: trashCount, navKey: "trash" },
  ], [trashCount]);

  const ACCOUNT_NAV: Item[] = [
    { href: "/dashboard/account", label: t("Account"), icon: User, navKey: "account" },
  ];

  const isActive = (it: Item) =>
    it.exact ? pathname === it.href : pathname?.startsWith(it.href);

  return (
    <aside
      className="hidden md:flex md:flex-col md:w-64 lg:w-72 h-screen bg-[var(--sidebar)] border-r border-[var(--border)] text-[var(--text)] transition-colors duration-300"
      aria-label={t("Dashboard sidebar")}
    >
      {/* Defined Brand Gradient for SVG Strokes - Referenced by ID */}
      <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
        <defs>
          <linearGradient id="tlSidebarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
      </svg>

      {/* --- Header --- */}
      <div className="px-5 py-6 flex items-center justify-between border-b border-[var(--border)]">
        <h2 className="text-lg font-bold tracking-tight" style={{
          backgroundImage: "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
        }}>
          Dashboard
        </h2>
        <PlanPill plan={String(plan)} />
      </div>

      {/* --- Main Navigation --- */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
        {/* Primary Items */}
        <ul className="space-y-1">
          {NAV.map((it) => (
            <NavItem
              key={it.href}
              item={it}
              active={isActive(it)}
              isTrashFlashing={it.navKey === 'trash' && isTrashFlashing}
            />
          ))}
        </ul>

        {/* Secondary Group (Separator) */}
        <div className="pt-4 border-t border-[var(--border)]">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] opacity-60">
            {t("User")}
          </div>
          <ul className="space-y-1">
            {ACCOUNT_NAV.map((it) => (
              <NavItem key={it.href} item={it} active={isActive(it)} />
            ))}
          </ul>
        </div>
      </nav>

      {/* --- Footer --- */}
      <div className="p-5 text-xs border-t border-[var(--border)]">
        <div className="flex items-center gap-1 text-[var(--muted)]">
          <span>{t("Need help?")}</span>
          <Link href="/help" className="hover:underline" style={{ color: "var(--brand-1)" }}>
            {t("Docs")}
          </Link>
        </div>
      </div>
    </aside>
  );
}

// --- Sub-components ---

const NavItem = ({
  item,
  active,
  isTrashFlashing
}: {
  item: Item;
  active: boolean;
  isTrashFlashing?: boolean
}) => {
  return (
    <li>
      <Link
        href={item.href}
        data-nav={item.navKey}
        aria-current={active ? "page" : undefined}
        className={[
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
          "text-[var(--text)]",
          active
            ? "bg-[var(--surface)] border border-transparent"
            : "border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface)]",
          isTrashFlashing ? "animate-pulse ring-2 ring-red-500/50" : "",
        ].join(" ")}
      >
        {/* Active gradient border */}
        {active && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{
              padding: 1.5,
              background: "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
              WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor" as any,
              maskComposite: "exclude",
            }}
          />
        )}

        {/* Hover gradient border */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          style={{
            padding: 1.5,
            background: "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor" as any,
            maskComposite: "exclude",
          }}
        />

        <item.icon
          className={`size-[18px] ${active ? 'sidebar-icon-active' : 'sidebar-icon-default'} ${isTrashFlashing ? 'text-red-500' : ''}`}
          strokeWidth={2}
          aria-hidden
        />
        <span className="leading-none">{item.label}</span>

        {/* Badge */}
        {typeof item.badge === "number" && item.badge > 0 && (
          <span className="ml-auto inline-flex items-center justify-center rounded-full min-w-5 h-5 px-1 text-[11px] text-[var(--text)] opacity-60 bg-[var(--surface)] ring-1 ring-inset ring-[var(--border)]">
            {item.badge}
          </span>
        )}

        {/* Icon gradient on hover/active only */}
        <style jsx>{`
          .sidebar-icon-default {
            stroke: currentColor;
          }
          .sidebar-icon-active {
            stroke: url(#tlSidebarGrad);
          }
          :global(.group:hover) .sidebar-icon-default {
            stroke: url(#tlSidebarGrad);
          }
        `}</style>
      </Link>
    </li>
  );
};

// --- Plan Pill Component ---

function PlanPill({ plan }: { plan: string }) {
  const key = (plan || "free").toLowerCase();

  // Special treatment for Tierless (Dev/Founder) plan - animated spinning gradient
  if (key === "tierless") {
    return (
      <div className="group relative inline-flex items-center justify-center p-[1px] rounded-full overflow-hidden">
        {/* Spinning gradient border */}
        <span
          className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] opacity-70 group-hover:opacity-100 transition-opacity"
          style={{
            background: "conic-gradient(from 90deg at 50% 50%, #020617 0%, #4F46E5 50%, #22D3EE 100%)"
          }}
          aria-hidden
        />

        {/* Inner content */}
        <span className="relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] bg-[var(--card)]">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))" }} aria-hidden />
          <b
            className="uppercase font-medium tracking-wider"
            style={{
              backgroundImage: "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
            }}
          >
            Dev
          </b>
        </span>
      </div>
    );
  }

  // Special treatment for Pro plan (gradient like old Tierless)
  if (key === "pro") {
    return (
      <div className="relative inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] bg-[var(--card)]">
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
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))" }} aria-hidden />
        <b
          className="uppercase font-medium tracking-wider"
          style={{
            backgroundImage: "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
          }}
        >
          Pro
        </b>
      </div>
    );
  }

  // Regular plans configuration
  const configs: Record<string, { label: string, classes: string, dot: string }> = {
    growth: {
      label: "Growth",
      classes: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 ring-rose-500/30",
      dot: "bg-rose-500"
    },
    starter: {
      label: "Starter",
      classes: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30",
      dot: "bg-emerald-500"
    },
    free: {
      label: "Free",
      classes: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-slate-500/20",
      dot: "bg-slate-400"
    }
  };

  const config = configs[key] || configs.free;

  return (
    <div className={`
      inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset
      ${config.classes}
    `}>
      <span className={`size-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </div>
  );
}