"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Palette,
  Bell,
  Download,
  Globe,
  Shield,
  BarChart3,
} from "lucide-react";

const SECTIONS = [
  { href: "/dashboard-config", label: "Dashboard Layout", desc: "Customize widgets and layout", icon: LayoutDashboard },
  { href: "/sectors", label: "Sectors", desc: "Sector heatmap and analysis", icon: BarChart3 },
  { href: "/alerts", label: "Price Alerts", desc: "Set price alert notifications", icon: Bell },
  { href: "/export", label: "Data Export", desc: "Export market data to CSV", icon: Download },
  { href: "/bulk-ipo", label: "Bulk IPO", desc: "Bulk IPO applications via MeroShare", icon: Globe },
  { href: "/backtest", label: "Backtest", desc: "Test trading strategies", icon: Shield },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Settings</h1>
        <p className="text-[var(--text-muted)] text-sm mt-0.5">Manage your dashboard and preferences</p>
      </div>
      <div className="space-y-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--accent)] transition-colors group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--bg-hover)] group-hover:bg-[var(--accent)]/10">
                <Icon className="h-5 w-5 text-[var(--text-muted)] group-hover:text-[var(--accent)]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">{s.label}</div>
                <div className="text-xs text-[var(--text-muted)]">{s.desc}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
