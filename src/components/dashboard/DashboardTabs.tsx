// src/components/dashboard/DashboardTabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  LayoutGrid,
  Puzzle,
  Settings,
  Trash2,
  User,
  AlertTriangle,
} from "lucide-react";
import { t } from "@/i18n";

const NAV = [
  { href: "/dashboard", label: t("Pages"), icon: LayoutDashboard, exact: true },
  { href: "/dashboard/stats", label: t("Stats"), icon: BarChart3 },
  { href: "/dashboard/templates", label: t("Templates"), icon: LayoutGrid },
  { href: "/dashboard/integrations", label: t("Integrations"), icon: Puzzle },
  { href: "/dashboard/settings", label: t("Danger Zone"), icon: AlertTriangle },
  { href: "/dashboard/trash", label: t("Trash"), icon: Trash2 },
  { href: "/dashboard/account", label: t("Account"), icon: User },
];

export default function DashboardTabs() {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="flex overflow-x-auto gap-2 px-4 py-3">
      {NAV.map((item) => {
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
