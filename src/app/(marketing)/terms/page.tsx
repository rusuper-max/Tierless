"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import Footer from "@/components/marketing/Footer";

export default function TermsPage() {
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

        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 text-lg mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-600">
              By accessing or using Tierless ("the Service"), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-slate-600">
              Tierless provides a platform for creating and hosting pricing pages, calculators,
              and related business tools. We reserve the right to modify, suspend, or discontinue
              any aspect of the Service at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-slate-600 mb-4">To use certain features, you must create an account. You agree to:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
            <p className="text-slate-600 mb-4">You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit malicious code or interfere with the Service</li>
              <li>Harass, abuse, or harm others</li>
              <li>Create fraudulent or misleading content</li>
              <li>Attempt to gain unauthorized access to systems</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Content Ownership</h2>
            <p className="text-slate-600">
              You retain ownership of content you create using the Service. By using the Service,
              you grant us a license to host, display, and distribute your content as necessary
              to provide the Service. You are responsible for ensuring you have rights to any
              content you upload.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Payment Terms</h2>
            <p className="text-slate-600">
              Paid features are billed according to the plan you select. Payments are non-refundable
              except as required by law. We may change pricing with notice. Failure to pay may
              result in suspension of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
            <p className="text-slate-600">
              We may terminate or suspend your account at any time for violations of these terms.
              You may cancel your account at any time. Upon termination, your right to use the
              Service ceases immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-slate-600">
              The Service is provided "as is" without warranties of any kind. We do not guarantee
              that the Service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="text-slate-600">
              To the maximum extent permitted by law, Tierless shall not be liable for any
              indirect, incidental, special, or consequential damages arising from your use
              of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
            <p className="text-slate-600">
              We may update these terms from time to time. Continued use of the Service after
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact</h2>
            <p className="text-slate-600">
              For questions about these Terms, contact us at{" "}
              <a href="mailto:contact@tierless.net" className="text-indigo-600 hover:underline">
                contact@tierless.net
              </a>
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}

