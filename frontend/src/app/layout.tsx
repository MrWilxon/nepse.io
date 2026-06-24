"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BarChart3,
  GitCompare,
  FileText,
  TrendingUp,
  GitBranch,
  Search,
  RotateCcw,
  AlertTriangle,
  BrainCircuit,
  Bookmark,
  Menu,
  X,
  Zap,
  Activity,
  MessageSquare,
  Users,
  Heart,
  Building2,
  Download,
  Calendar,
  Calculator,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  Layers,
  Target,
  LineChart,
  Wallet,
  BookOpen,
  PieChart,
  Settings,
  Bell,
} from "lucide-react";
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

interface NavItem {
  href: string;
  label: string;
  icon: any;
}
interface NavCategory {
  id: string;
  label: string;
  icon: any;
  items: NavItem[];
}

function getNavCategories(t: (key: string) => string): NavCategory[] {
  return [
    {
      id: "overview", label: "Overview", icon: PieChart,
      items: [
        { href: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
        { href: "/sectors", label: t("nav.sectors"), icon: BarChart3 },
        { href: "/compare", label: t("nav.compare"), icon: GitCompare },
      ],
    },
    {
      id: "technical", label: "Technical Analysis", icon: LineChart,
      items: [
        { href: "/indicators", label: t("nav.indicators"), icon: GitBranch },
        { href: "/fibonacci", label: t("nav.fibonacci"), icon: TrendingUp },
        { href: "/volume-profile", label: t("nav.volumeProfile"), icon: BarChart3 },
        { href: "/breadth", label: t("nav.marketBreadth"), icon: Activity },
        { href: "/timeframes", label: t("nav.timeframes"), icon: RotateCcw },
        { href: "/patterns", label: t("nav.chartPatterns"), icon: Search },
      ],
    },
    {
      id: "data", label: "Market Data", icon: Layers,
      items: [
        { href: "/fundamentals", label: t("nav.fundamentals"), icon: TrendingUp },
        { href: "/earnings", label: t("nav.earnings"), icon: FileText },
        { href: "/options", label: t("nav.options"), icon: GitBranch },
        { href: "/mutual-funds", label: t("nav.mutualFunds"), icon: BarChart3 },
        { href: "/debentures", label: t("nav.debentures"), icon: FileText },
        { href: "/insider-trading", label: t("nav.insiderTrading"), icon: AlertTriangle },
        { href: "/brokers", label: "Top Brokers", icon: Users },
        { href: "/brokers/analysis", label: "Broker Analysis", icon: Activity },
        { href: "/floorsheet", label: "Floor Sheet", icon: FileText },
        { href: "/ipo", label: t("nav.ipo"), icon: FileText },
        { href: "/bulk-ipo", label: "Bulk IPO", icon: Layers },
        { href: "/dividend-calendar", label: t("nav.dividendCalendar"), icon: Calendar },
        { href: "/announcements", label: t("nav.announcements"), icon: Bell },
      ],
    },
    {
      id: "research", label: "Research & Analysis", icon: BrainCircuit,
      items: [
        { href: "/screener", label: t("nav.stockScreener"), icon: Search },
        { href: "/backtest", label: t("nav.backtesting"), icon: TrendingUp },
        { href: "/correlation", label: t("nav.correlation"), icon: GitBranch },
        { href: "/predict", label: t("nav.pricePrediction"), icon: BrainCircuit },
        { href: "/analysts", label: t("nav.analysts"), icon: Users },
        { href: "/sentiment", label: t("nav.marketSentiment"), icon: Heart },
      ],
    },
    {
      id: "trading", label: "Trading Tools", icon: Target,
      items: [
        { href: "/paper-trading", label: t("nav.paperTrading"), icon: Zap },
        { href: "/portfolio", label: t("nav.portfolio"), icon: Wallet },
        { href: "/order-book", label: t("nav.orderDepth"), icon: BarChart3 },
        { href: "/trade-journal", label: t("nav.tradeJournal"), icon: BookOpen },
        { href: "/risk-calculator", label: t("nav.riskCalculator"), icon: Calculator },
        { href: "/alerts", label: t("nav.technicalAlerts"), icon: AlertTriangle },
        { href: "/watchlist", label: t("nav.watchlist"), icon: Bookmark },
        { href: "/alerts-config", label: t("nav.targetAlerts"), icon: AlertTriangle },
      ],
    },
    {
      id: "reports", label: "Reports & Settings", icon: Settings,
      items: [
        { href: "/reports", label: t("nav.reports"), icon: Download },
        { href: "/holdings", label: t("nav.institutionalHoldings"), icon: Building2 },
        { href: "/tax-report", label: t("nav.taxReport"), icon: Calculator },
        { href: "/export", label: t("nav.dataExport"), icon: Download },
      ],
    },
  ];
}

function getAllNavItems(categories: NavCategory[]): NavItem[] {
  return categories.flatMap(c => c.items);
}

function SidebarLink({ link, pathname, isFav, onToggleFav, onClick }: {
  link: NavItem;
  pathname: string | null;
  isFav: boolean;
  onToggleFav: (href: string, e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const isActive = pathname === link.href || (pathname?.startsWith(link.href + "/") && link.href !== "/");
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={`group flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-200 ${
        isActive ? "bg-accent-theme text-accent-theme" : "text-body-theme hover:bg-hover-theme hover:text-primary-theme"
      }`}
    >
      <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-accent-theme" : "text-muted-theme"}`} />
      <span className="flex-1 truncate">{link.label}</span>
      <button
        onClick={(e) => onToggleFav(link.href, e)}
        className={`flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isFav ? "!opacity-100 text-accent-theme" : "text-muted-theme hover:text-accent-theme"}`}
        title={isFav ? "Remove from favorites" : "Add to favorites"}
      >
        <Bookmark className={`h-3 w-3 ${isFav ? "fill-current" : ""}`} />
      </button>
    </Link>
  );
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [cmdOpen, setCmdOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();
  const CATEGORIES = getNavCategories(t);
  const ALL_ITEMS = getAllNavItems(CATEGORIES);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(v => !v); }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) { e.preventDefault(); setCmdOpen(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nepse_favorites");
      if (saved) setFavorites(JSON.parse(saved));
      const savedCols = localStorage.getItem("nepse_collapsed");
      if (savedCols) setCollapsed(JSON.parse(savedCols));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("nepse_favorites", JSON.stringify(favorites)); } catch {}
  }, [favorites]);

  useEffect(() => {
    try { localStorage.setItem("nepse_collapsed", JSON.stringify(collapsed)); } catch {}
  }, [collapsed]);

  useEffect(() => {
    safeFetch<MarketStatus | null>(`${API_BASE}/api/market-status`, null).then(setMarketStatus);
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const toggleFav = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => prev.includes(href) ? prev.filter(f => f !== href) : [...prev, href]);
  };

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const q = searchQuery.toLowerCase().trim();
  const isSearching = q.length > 0;

  const filteredCategories = isSearching
    ? CATEGORIES.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
          item.label.toLowerCase().includes(q) || item.href.toLowerCase().includes(q)
        ),
      })).filter(cat => cat.items.length > 0)
    : CATEGORIES;

  const favItems = isSearching
    ? filteredCategories.flatMap(c => c.items).filter(item => favorites.includes(item.href))
    : ALL_ITEMS.filter(item => favorites.includes(item.href));

  return (
    <>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <OnboardingTour />

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "var(--overlay)" }} onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex-shrink-0 flex flex-col border-r transition-transform duration-300 lg:translate-x-0 overflow-y-auto bg-surface border-theme ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-theme">
          <img src="/icon.svg" alt="NEPSE.io" className="h-9 w-9 rounded-xl shadow-lg shadow-[#D4A017]/20" />
          <div className="flex-1">
            <div className="text-sm font-bold tracking-wide text-primary-theme">NEPSE<span className="text-accent-theme">.io</span></div>
            <div className="text-[10px] text-muted-theme font-medium">Stock Analytics</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-dim-theme hover:text-primary-theme">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search + Filter */}
        <div className="px-3 pt-3 pb-1 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input-theme bg-input-theme py-2 pl-9 pr-8 text-xs text-primary-theme placeholder-text-placeholder outline-none focus:border-accent-theme transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-theme hover:text-primary-theme">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-1">
            <button onClick={() => { setShowFavsOnly(false); setSearchQuery(""); }}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-colors ${!showFavsOnly ? "bg-accent-theme text-accent-theme border border-accent-border" : "text-muted-theme hover:text-primary-theme border border-transparent"}`}>
              All Pages
            </button>
            <button onClick={() => { setShowFavsOnly(true); setSearchQuery(""); }}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-colors flex items-center justify-center gap-1 ${showFavsOnly ? "bg-accent-theme text-accent-theme border border-accent-border" : "text-muted-theme hover:text-primary-theme border border-transparent"}`}>
              <Bookmark className="h-3 w-3" /> Favorites ({favorites.length})
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {/* Favorites only view */}
          {showFavsOnly && !isSearching && (
            <div className="space-y-0.5">
              {favorites.length === 0 && (
                <div className="px-2 py-6 text-center">
                  <Bookmark className="h-5 w-5 text-border-theme mx-auto mb-2" />
                  <p className="text-[10px] text-muted-theme">No favorites yet</p>
                  <p className="text-[10px] text-muted-theme">Click the bookmark icon to add</p>
                </div>
              )}
              {favItems.map(item => (
                <SidebarLink key={item.href} link={item} pathname={pathname} isFav onToggleFav={toggleFav} onClick={() => setSidebarOpen(false)} />
              ))}
            </div>
          )}

          {/* Favorites bar in default view */}
          {!showFavsOnly && !isSearching && favorites.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 px-2 py-1">
                <Bookmark className="h-3 w-3 text-accent-theme" />
                <span className="text-[10px] font-semibold text-accent-theme uppercase tracking-wider">Favorites</span>
              </div>
              <div className="space-y-0.5">
                {favItems.slice(0, 5).map(item => (
                  <SidebarLink key={item.href} link={item} pathname={pathname} isFav onToggleFav={toggleFav} onClick={() => setSidebarOpen(false)} />
                ))}
                {favItems.length > 5 && (
                  <button onClick={() => setShowFavsOnly(true)} className="w-full text-left px-3 py-1 text-[10px] text-muted-theme hover:text-accent-theme">
                    View all {favorites.length} favorites...
                  </button>
                )}
              </div>
              <div className="mx-2 my-2 border-t border-theme" />
            </div>
          )}

          {/* Search results */}
          {isSearching && (
            <div className="space-y-0.5">
              {filteredCategories.length === 0 && (
                <div className="px-2 py-6 text-center">
                  <Search className="h-5 w-5 text-border-theme mx-auto mb-2" />
                  <p className="text-[10px] text-muted-theme">No results for &quot;{searchQuery}&quot;</p>
                </div>
              )}
              {filteredCategories.map(cat => (
                <div key={cat.id} className="mb-2">
                  <div className="flex items-center gap-2 px-2 py-1">
                    <span className="cat-icon">
                      <cat.icon className="h-3 w-3 text-muted-theme" />
                    </span>
                    <span className="text-[10px] font-semibold text-muted-theme uppercase tracking-wider">{cat.label}</span>
                  </div>
                  {cat.items.map(item => (
                    <SidebarLink key={item.href} link={item} pathname={pathname} isFav={favorites.includes(item.href)} onToggleFav={toggleFav} onClick={() => setSidebarOpen(false)} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Categorized navigation */}
          {!showFavsOnly && !isSearching && (
            <div className="space-y-1">
              {CATEGORIES.map(cat => {
                const isCol = collapsed[cat.id];
                const hasActive = cat.items.some(item =>
                  pathname === item.href || (pathname?.startsWith(item.href + "/") && item.href !== "/")
                );
                return (
                  <div key={cat.id}>
                    <button
                      onClick={() => toggleCollapse(cat.id)}
                      className={`sidebar-category ${hasActive ? "active" : ""}`}
                    >
                      <span className="cat-icon">
                        <cat.icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex-1 text-left">{cat.label}</span>
                      {isCol
                        ? <ChevronRight className="h-3 w-3 flex-shrink-0 opacity-50" />
                        : <ChevronDown className="h-3 w-3 flex-shrink-0 opacity-50" />
                      }
                    </button>
                    {!isCol && (
                      <div className="space-y-0.5">
                        {cat.items.map(item => (
                          <SidebarLink key={item.href} link={item} pathname={pathname} isFav={favorites.includes(item.href)} onToggleFav={toggleFav} onClick={() => setSidebarOpen(false)} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div className="sticky bottom-0 border-t border-theme p-3 bg-surface">
          <div className="flex items-center gap-3 rounded-lg bg-input-theme px-3 py-2.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#D4A017]/30 to-[#E8B830]/30 flex items-center justify-center">
              <span className="text-sm font-bold text-accent-theme">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-primary-theme">User</div>
              <div className="text-[10px] text-muted-theme">Premium Plan</div>
            </div>
            <div className="h-2 w-2 rounded-full bg-green flex-shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Price ticker */}
        <PriceTicker />

        {/* Leaderboard Ad */}
        <div className="flex justify-center py-3 border-b border-theme bg-header-theme/50">
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
        <meta name="description" content="All-in-one Nepal Stock Exchange analytics platform" />
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
