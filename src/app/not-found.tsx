"use client";

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { useT } from "@/i18n/client";

export default function NotFound() {
    const t = useT();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center">
                {/* 404 Number */}
                <div className="mb-6">
                    <span className="text-8xl sm:text-9xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500">
                        404
                    </span>
                </div>

                {/* Message */}
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                    {t("errors.pageNotFound")}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                    {t("errors.pageNotFoundDesc")}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-xl hover:shadow-lg transition-all duration-200"
                    >
                        <Home className="w-4 h-4" />
                        {t("errors.backToHome")}
                    </Link>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t("errors.goToDashboard")}
                    </Link>
                </div>

                {/* Help Link */}
                <p className="mt-8 text-sm text-slate-500 dark:text-slate-500">
                    {t("errors.needHelp")}{' '}
                    <Link href="/faq" className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-medium">
                        {t("errors.checkFaq")}
                    </Link>
                </p>
            </div>
        </div>
    );
}

