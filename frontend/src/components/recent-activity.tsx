"use client";

import { useState, useEffect } from "react";
import { Activity, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ActivityItem {
  id: string;
  type: "buy" | "sell" | "alert" | "milestone";
  symbol: string;
  detail: string;
  time: string;
  change: number;
}

const typeConfig = {
  buy: { icon: ArrowUpRight, color: "text-[var(--green)]", bg: "bg-[var(--green-bg)]" },
  sell: { icon: ArrowDownRight, color: "text-[var(--red)]", bg: "bg-[var(--red-bg)]" },
  alert: { icon: Activity, color: "text-[var(--accent)]", bg: "bg-[var(--accent-bg)]" },
  milestone: { icon: Activity, color: "text-[var(--blue)]", bg: "bg-[var(--blue-bg)]" },
};

export default function RecentActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/companies`)
      .then((r) => r.json())
      .then((data) => {
        if (!data || data.length === 0) { setLoading(false); return; }
        const sorted = [...data].sort((a, b) => Math.abs(b.percentChange || 0) - Math.abs(a.percentChange || 0));
        const topMovers = sorted.slice(0, 6);
        const activities: ActivityItem[] = topMovers.map((c: any, i: number) => {
          const change = c.percentChange || 0;
          const isUp = change >= 0;
          return {
            id: `${c.symbol}-${i}`,
            type: isUp ? "buy" : "sell",
            symbol: c.symbol,
            detail: `${isUp ? "Up" : "Down"} ${Math.abs(change).toFixed(2)}% · Rs ${(c.ltp || 0).toLocaleString()}`,
            time: "Today",
            change,
          };
        });
        setItems(activities);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card-3d overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-primary)]">
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Market Movers</h3>
        </div>
        <div className="space-y-2 p-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded bg-[var(--bg-secondary)]" />)}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="card-3d overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-primary)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-[var(--accent)]" />
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Market Movers</h3>
        </div>
        <span className="text-[10px] text-[var(--text-dim)]">{items.length} stocks</span>
      </div>
      <div className="divide-y divide-[var(--border-primary)]">
        {items.map(item => {
          const cfg = typeConfig[item.type];
          const Icon = cfg.icon;
          return (
            <a key={item.id} href={`/company/${item.symbol}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-secondary)] transition-colors">
              <div className={`p-1.5 rounded-lg ${cfg.bg}`}>
                <Icon className={`h-3 w-3 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{item.symbol}</span>
                  <span className={`text-[10px] font-medium ${item.change >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                    {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-dim)] truncate">{item.detail}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
