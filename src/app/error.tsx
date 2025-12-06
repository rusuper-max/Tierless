'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center">
                {/* Error Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                        <AlertTriangle className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Message */}
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                    Something Went Wrong
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                    We encountered an unexpected error. Don&apos;t worry, our team has been notified.
                    Please try again or return to the homepage.
                </p>

                {/* Error Digest (for debugging) */}
                {error.digest && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 font-mono">
                        Error ID: {error.digest}
                    </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-xl hover:shadow-lg transition-all duration-200"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-200"
                    >
                        <Home className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>

                {/* Help Link */}
                <p className="mt-8 text-sm text-slate-500 dark:text-slate-500">
                    If this keeps happening,{' '}
                    <Link href="mailto:contact@tierless.net" className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-medium">
                        contact support
                    </Link>
                </p>
            </div>
        </div>
    );
}
