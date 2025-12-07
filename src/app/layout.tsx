import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import UpgradeSheetMount from "./_providers/UpgradeSheetMount";
import Toaster from "@/components/toast/Toaster";
import ThemeProvider from "./_providers/ThemeProvider";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import DevPlanSwitcher from "@/components/DevPlanSwitcher";
import CookieConsent from "@/components/CookieConsent";
import { DEFAULT_LOCALE, LOCALE_COOKIE, SUPPORTED_LOCALES, type Locale } from "@/i18n";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://tierless.net";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Tierless - Create Beautiful Price Lists & Digital Menus",
    template: "%s | Tierless",
  },
  description:
    "Create stunning, mobile-friendly price lists and digital menus in minutes. Perfect for restaurants, salons, freelancers, and agencies. Share via QR code or embed on your website.",
  keywords: [
    "price list",
    "digital menu",
    "restaurant menu",
    "QR code menu",
    "pricing page builder",
    "menu maker",
    "service catalog",
  ],
  authors: [{ name: "Tierless" }],
  creator: "Tierless",
  publisher: "Tierless",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Tierless",
    title: "Tierless - Create Beautiful Price Lists & Digital Menus",
    description:
      "Create stunning, mobile-friendly price lists and digital menus in minutes. Perfect for restaurants, salons, freelancers, and agencies.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tierless - Price List & Menu Builder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tierless - Create Beautiful Price Lists & Digital Menus",
    description:
      "Create stunning, mobile-friendly price lists and digital menus in minutes. Share via QR code or embed on your website.",
    images: ["/og-image.png"],
    creator: "@tierless",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tierless",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: BASE_URL,
  description:
    "Create stunning, mobile-friendly price lists and digital menus in minutes. Perfect for restaurants, salons, freelancers, and agencies.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "0",
    highPrice: "99.99",
    offerCount: "5",
  },
  creator: {
    "@type": "Organization",
    name: "Tierless",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    sameAs: ["https://twitter.com/tierless"],
  },
  featureList: [
    "Digital menu creation",
    "QR code generation",
    "Website embedding",
    "Team collaboration",
    "Custom domains",
    "AI menu scanning",
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  let initialLocale: Locale = DEFAULT_LOCALE;
  try {
    const cookieStore = await cookies();
    const possible = cookieStore.get(LOCALE_COOKIE)?.value;
    if (possible && SUPPORTED_LOCALES.includes(possible as Locale)) {
      initialLocale = possible as Locale;
    }
  } catch {
    initialLocale = DEFAULT_LOCALE;
  }

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[var(--bg)] text-[var(--text)]">
        <a
          href="#main"
          className="skip-link sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black focus:shadow-lg"
        >
          Skip to main content
        </a>
        <LanguageProvider initialLocale={initialLocale}>
          <ThemeProvider>
            {children}
            <UpgradeSheetMount />
            <Toaster />
            <DevPlanSwitcher />
            <CookieConsent />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
