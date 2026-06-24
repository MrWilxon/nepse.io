"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useState, useEffect } from "react";
import { Menu, Search } from "lucide-react";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { safeFetch } from "@/lib/api";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ToastProvider } from "@/components/toast";
import { ConfirmProvider } from "@/components/confirm-dialog";
import CommandPalette from "@/components/command-palette";
import OnboardingTour from "@/components/onboarding-tour";
import ThemeToggle from "@/components/theme-toggle";
import PriceTicker from "@/components/price-ticker";
import Breadcrumbs from "@/components/breadcrumbs";
import KeyboardShortcutsProvider from "@/components/keyboard-shortcuts";
import MobileNav from "@/components/mobile-nav";
import Sidebar from "@/components/sidebar";
import Footer from "@/components/footer";
import { API_BASE } from "@/lib/api";
import { LeaderboardAd } from "@/components/adsense";

interface MarketStatus {
  status: string;
  reason: string;
  nextOpen?: string;
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function InnerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(v => !v); }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) { e.preventDefault(); setCmdOpen(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    safeFetch<MarketStatus | null>(`${API_BASE}/api/market-status`, null).then(setMarketStatus);
  }, []);

  return (
    <>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <OnboardingTour />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Price ticker */}
        <PriceTicker />

        {/* Leaderboard Ad */}
        <div className="flex justify-center py-2 border-b border-theme bg-header-theme/50">
          <LeaderboardAd />
        </div>

        {/* Top header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-theme bg-header-theme/80 backdrop-blur-sm sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-hover-theme text-body-theme"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setCmdOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-theme text-muted-theme hover:border-hover-theme hover:text-primary-theme transition-colors text-xs">
              <Search className="h-3 w-3" />
              <span>Search...</span>
              <kbd className="text-[10px] bg-kbd-theme px-1.5 py-0.5 rounded ml-2">⌘K</kbd>
            </button>
            <ThemeToggle />
            <LanguageSwitcher />
            {marketStatus && (
              <div className={`hidden sm:flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border ${
                marketStatus.status === "open"
                  ? "bg-green-theme border-green-theme text-green-theme"
                  : marketStatus.status === "pre_open"
                  ? "bg-amber-theme border-amber-theme text-amber-theme"
                  : "bg-kbd-theme border-hover-theme text-body-theme"
              }`}>
                <div className={`h-2 w-2 rounded-full ${
                  marketStatus.status === "open" ? "bg-green animate-pulse" :
                  marketStatus.status === "pre_open" ? "bg-amber" : "bg-dim-theme"
                }`} />
                <span className="text-xs font-medium">
                  {marketStatus.status === "open" && t("dashboard.marketOpen")}
                  {marketStatus.status === "pre_open" && t("dashboard.preOpen")}
                  {marketStatus.status === "closed" && t("dashboard.marketClosed")}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Breadcrumbs />
          {children}
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#D4A017" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" sizes="any" />
        <link rel="apple-touch-icon" href="/logo-large.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NEPSE.io" />
        <meta name="application-name" content="NEPSE.io" />
        <meta name="description" content="NEPSE.io - Free Nepal Stock Exchange analytics platform with real-time prices, technical analysis, stock screener, portfolio tracking, and AI predictions for NEPSE-listed companies." />
        <meta name="keywords" content="NEPSE, Nepal Stock Exchange, stock market Nepal, share price, technical analysis, stock screener, portfolio tracker, NEPSE live, Nepal shares, stock trading Nepal" />
        <meta name="author" content="NEPSE.io" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="NEPSE.io - Nepal Stock Exchange Analytics" />
        <meta property="og:description" content="Free all-in-one NEPSE analytics platform with real-time prices, technical indicators, stock screener, and AI predictions." />
        <meta property="og:url" content="https://nepse.wilson.com.np" />
        <meta property="og:site_name" content="NEPSE.io" />
        <meta property="og:image" content="https://nepse.wilson.com.np/icon.svg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NEPSE.io - Nepal Stock Exchange Analytics" />
        <meta name="twitter:description" content="Free all-in-one NEPSE analytics platform with real-time prices, technical indicators, stock screener, and AI predictions." />
        <meta name="twitter:image" content="https://nepse.wilson.com.np/icon.svg" />
        {/* Canonical URL */}
        <link rel="canonical" href="https://nepse.wilson.com.np" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("nepse_theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}`,
          }}
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9798460762666960"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen flex text-primary-theme" suppressHydrationWarning>
        <ToastProvider>
          <ConfirmProvider>
            <I18nProvider>
              <KeyboardShortcutsProvider>
                <InnerLayout>{children}</InnerLayout>
                <MobileNav />
              </KeyboardShortcutsProvider>
            </I18nProvider>
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
