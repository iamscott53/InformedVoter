import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { ReactNode } from "react";
import { SiteJsonLd } from "@/components/seo/JsonLd";
import SubscribeBottomBar from "@/components/features/SubscribeBottomBar";

// ─────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "InformedVoter — Your Government, In Plain English",
    template: "%s | InformedVoter",
  },
  description:
    "Understand your government without the jargon. Track Congress, Supreme Court rulings, " +
    "federal agency budgets, campaign finance, and your local ballot — all in plain English.",
  keywords: [
    "government",
    "congress",
    "supreme court",
    "federal agencies",
    "legislation",
    "elections",
    "nonpartisan",
    "civic information",
    "campaign finance",
    "voter information",
    "judicial branch",
    "SCOTUS",
  ],
  authors: [{ name: "InformedVoter" }],
  creator: "InformedVoter",
  publisher: "InformedVoter",
  metadataBase: new URL("https://knowyourgov.us"),
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://knowyourgov.us",
    siteName: "InformedVoter",
    title: "InformedVoter — Your Government, In Plain English",
    description:
      "Track Congress, the Supreme Court, federal agencies, and your ballot. " +
      "Complex government made simple — nonpartisan, no spin.",
  },
  twitter: {
    card: "summary_large_image",
    title: "InformedVoter — Your Government, In Plain English",
    description:
      "Congress, SCOTUS, federal agencies, and your ballot — all explained in plain English.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1B2A4A",
};

// ─────────────────────────────────────────────
// Root Layout
// ─────────────────────────────────────────────

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <SiteJsonLd />
      </head>
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-800 antialiased">
        <Providers>
          {/* Skip-to-main-content for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50
                       focus:px-4 focus:py-2 focus:bg-white focus:text-[#1B2A4A] focus:font-semibold
                       focus:rounded focus:shadow-lg focus:outline-none"
          >
            Skip to main content
          </a>

          <Header />

          <main
            id="main-content"
            className="flex-1 w-full"
            role="main"
          >
            {children}
          </main>

          <Footer />
          <SubscribeBottomBar />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
