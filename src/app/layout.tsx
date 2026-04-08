import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { ReactNode } from "react";

// ─────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "InformedVoter — Know Your Vote",
    template: "%s | InformedVoter",
  },
  description:
    "Nonpartisan civic information for every American voter. Research candidates, " +
    "track legislation, find your polling place, and stay informed — without the spin.",
  keywords: [
    "voter information",
    "candidates",
    "bills",
    "legislation",
    "elections",
    "nonpartisan",
    "civic information",
    "US politics",
    "voting",
  ],
  authors: [{ name: "InformedVoter" }],
  creator: "InformedVoter",
  publisher: "InformedVoter",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://informedvoter.us",
    siteName: "InformedVoter",
    title: "InformedVoter — Know Your Vote",
    description:
      "Nonpartisan civic information for every American voter. Research candidates, " +
      "track legislation, and stay informed.",
  },
  twitter: {
    card: "summary_large_image",
    title: "InformedVoter — Know Your Vote",
    description:
      "Nonpartisan civic information for every American voter.",
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
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
