"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import Footer from "@/components/marketing/Footer";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 text-lg mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
            <p className="text-slate-600">
              Cookies are small text files stored on your device when you visit a website.
              They help websites remember your preferences and understand how you interact
              with the site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Cookies We Use</h2>
            <p className="text-slate-600 mb-4">Tierless uses the following types of cookies:</p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Essential Cookies</h3>
            <p className="text-slate-600 mb-4">
              These cookies are required for the website to function and cannot be disabled.
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-6">
              <li>
                <strong>Session cookie (tl_sess)</strong> - Keeps you logged in while you use the app.
                Expires after 30 days or when you log out.
              </li>
              <li>
                <strong>Cookie consent (tierless_cookie_consent)</strong> - Remembers your cookie preferences.
                Stored in localStorage.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Analytics Cookies</h3>
            <p className="text-slate-600 mb-4">
              These cookies help us understand how visitors interact with our website.
              They are only set if you accept cookies.
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>
                <strong>Client ID (tierless_client_id)</strong> - Anonymous identifier to understand
                returning visitors. Stored in localStorage.
              </li>
              <li>
                <strong>Session ID (tierless_session_id)</strong> - Tracks a single browsing session.
                Stored in sessionStorage and expires when you close your browser.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. What We Track</h2>
            <p className="text-slate-600 mb-4">
              With your consent, we collect anonymous analytics data to improve our service:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Page views and time spent on pages</li>
              <li>Device type (desktop, mobile, tablet)</li>
              <li>Browser and operating system</li>
              <li>Referral source (how you found us)</li>
              <li>Interactions with pricing pages you create</li>
            </ul>
            <p className="text-slate-600 mt-4">
              We do not track your personal identity, email content, or sell this data to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Managing Your Preferences</h2>
            <p className="text-slate-600 mb-4">
              You can manage your cookie preferences in the following ways:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>
                <strong>Cookie banner</strong> - When you first visit our site, you can accept or
                decline non-essential cookies.
              </li>
              <li>
                <strong>Browser settings</strong> - You can configure your browser to block or
                delete cookies. Note that blocking essential cookies may prevent the app from working.
              </li>
              <li>
                <strong>Clear localStorage</strong> - You can clear your browser&apos;s localStorage
                to remove stored identifiers.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Cookies</h2>
            <p className="text-slate-600">
              We do not use third-party tracking cookies (like Google Analytics or Facebook Pixel).
              All analytics are processed by our own systems, and no data is shared with
              advertising networks.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Updates to This Policy</h2>
            <p className="text-slate-600">
              We may update this Cookie Policy from time to time. We will notify you of any
              significant changes by posting the new policy on this page with an updated
              revision date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
            <p className="text-slate-600">
              If you have questions about our use of cookies, please contact us at{" "}
              <a href="mailto:contact@tierless.net" className="text-indigo-600 hover:underline">
                contact@tierless.net
              </a>
            </p>
          </section>

          <section className="mt-12 p-6 bg-slate-50 rounded-xl">
            <p className="text-slate-600 text-sm">
              See also:{" "}
              <Link href="/privacy" className="text-indigo-600 hover:underline">
                Privacy Policy
              </Link>
              {" | "}
              <Link href="/terms" className="text-indigo-600 hover:underline">
                Terms of Service
              </Link>
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
