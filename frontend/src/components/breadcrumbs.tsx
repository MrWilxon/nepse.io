"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_NAMES: Record<string, string> = {
  "": "Home",
  sectors: "Sectors",
  company: "Companies",
  compare: "Compare",
  indicators: "Indicators",
  fibonacci: "Fibonacci",
  "volume-profile": "Volume Profile",
  breadth: "Market Breadth",
  timeframes: "Timeframes",
  patterns: "Chart Patterns",
  fundamentals: "Fundamentals",
  earnings: "Earnings",
  screener: "Screener",
  backtest: "Backtest",
  "paper-trading": "Paper Trading",
  portfolio: "Portfolio",
  "order-book": "Order Depth",
  "trade-journal": "Trade Journal",
  "risk-calculator": "Risk Calculator",
  watchlist: "Watchlist",
  "alerts-config": "Price Alerts",
  announcements: "Announcements",
  "mutual-funds": "Mutual Funds",
  debentures: "Debentures",
  ipo: "IPO / FPO",
  sentiment: "Sentiment",
  news: "News",
  alerts: "Technical Alerts",
  institutional: "Institutional",
  holdings: "Holdings",
  export: "Data Export",
  settings: "Settings",
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-xs text-muted-theme mb-4">
      <Link href="/" className="hover:text-accent-theme transition-colors flex items-center gap-1">
        <Home className="h-3 w-3" />
      </Link>
      {parts.map((part, i) => {
        const href = "/" + parts.slice(0, i + 1).join("/");
        const isLast = i === parts.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {isLast ? (
              <span className="text-primary-theme font-medium">{ROUTE_NAMES[part] || part}</span>
            ) : (
              <Link href={href} className="hover:text-accent-theme transition-colors">{ROUTE_NAMES[part] || part}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
