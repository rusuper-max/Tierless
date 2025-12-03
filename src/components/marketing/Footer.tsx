"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import TierlessLogo from "./TierlessLogo";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#020617] border-t border-white/5 pt-16 pb-8 relative z-30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <TierlessLogo className="w-6 h-6" />
              <span className="text-lg font-bold text-white">Tierless</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              {t("footer.desc")}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t("footer.product")}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/pricing" className="hover:text-white transition">{t("footer.pricing")}</Link></li>
              <li><Link href="/templates" className="hover:text-white transition">{t("footer.templates")}</Link></li>
              <li><Link href="/start" className="hover:text-white transition">{t("footer.builder")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t("footer.legal")}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/privacy" className="hover:text-white transition">{t("footer.privacy")}</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">{t("footer.terms")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t("footer.support")}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
              <li><a href="mailto:support@tierless.net" className="hover:text-white transition">{t("footer.contact")}</a></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} Tierless. {t("footer.rights")}</p>
          <p>{t("footer.madeWith")}</p>
        </div>
      </div>
    </footer>
  );
}