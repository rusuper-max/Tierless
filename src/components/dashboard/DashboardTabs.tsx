// src/components/dashboard/DashboardTabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  LayoutDashboard,
  BarChart3,
  LayoutGrid,
  Puzzle,
  Settings,
  Trash2,
  User,
} from "lucide-react";
import { useT } from "@/i18n";

export default function DashboardTabs() {
  const t = useT();
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);
  const navItems = useMemo(
    () => [
      { href: "/dashboard", label: t("nav.pages"), icon: LayoutDashboard, exact: true },
      { href: "/dashboard/stats", label: t("nav.stats"), icon: BarChart3 },
      { href: "/dashboard/templates", label: t("nav.templates"), icon: LayoutGrid },
      { href: "/dashboard/integrations", label: t("nav.integrations"), icon: Puzzle },
      { href: "/dashboard/settings", label: t("nav.settings"), icon: Settings },
      { href: "/dashboard/trash", label: t("nav.trash"), icon: Trash2 },
      { href: "/dashboard/account", label: t("nav.account"), icon: User },
    ],
    [t]
  );

  return (
    <nav className="flex overflow-x-auto gap-2 px-4 py-3">
      {navItems.map((item) => {
        const active = isActive(item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center text-xs min-w-[70px] rounded-2xl border px-2 py-1.5 transition ${active
                ? "border-transparent bg-[color:var(--card)]/80 text-[var(--text)]"
                : "border-[var(--border)] text-[var(--muted)]"
              }`}
          >
            <Icon className="size-4 mb-1" />
            <span className="leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
