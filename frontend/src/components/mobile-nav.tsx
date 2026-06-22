"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart3, Search, TrendingUp, Bookmark,
  Wallet, Settings, X, Zap, Menu,
} from "lucide-react";

const MOBILE_NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/screener", label: "Screener", icon: Search },
  { href: "/watchlist", label: "Watchlist", icon: Bookmark },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/settings", label: "More", icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-primary)] bg-[var(--bg-surface)]/95 backdrop-blur-sm lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {MOBILE_NAV.map((item) => {
            const isActive = pathname === item.href || (pathname?.startsWith(item.href + "/") && item.href !== "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => item.href === "/settings" && setShowMore(true)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? "text-[var(--accent)]" : "text-[var(--text-dim)]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[9px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More Menu */}
      {showMore && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMore(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-[var(--bg-surface)] p-6 max-h-[80vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">All Pages</h2>
              <button onClick={() => setShowMore(false)} className="rounded-lg p-1 text-[var(--text-dim)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { href: "/sectors", label: "Sectors", icon: BarChart3 },
                { href: "/compare", label: "Compare", icon: BarChart3 },
                { href: "/indicators", label: "Indicators", icon: TrendingUp },
                { href: "/backtest", label: "Backtest", icon: TrendingUp },
                { href: "/earnings", label: "Earnings", icon: BarChart3 },
                { href: "/paper-trading", label: "Paper Trading", icon: Zap },
                { href: "/risk-calculator", label: "Risk Calc", icon: BarChart3 },
                { href: "/alerts", label: "Signals", icon: TrendingUp },
                { href: "/export", label: "Export", icon: BarChart3 },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Spacer for bottom nav */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
