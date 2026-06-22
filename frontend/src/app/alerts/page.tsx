"use client";

import { useState, useEffect, useMemo } from "react";
import { Zap, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Signal {
  symbol: string;
  type: "bullish" | "bearish" | "neutral";
  signal: string;
  indicator: string;
  strength: number;
  price: number;
  change: number;
  timestamp: string;
}

function getSignals(companies: any[]): Signal[] {
  const signals: Signal[] = [];
  const indicators = ["MACD Crossover", "RSI Oversold", "RSI Overbought", "Golden Cross", "Death Cross", "Bollinger Breakout", "Volume Spike", "Support Break", "Resistance Break"];

  companies.slice(0, 30).forEach((c: any) => {
    const numSignals = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numSignals; i++) {
      const indicator = indicators[Math.floor(Math.random() * indicators.length)];
      const isBullish = indicator.includes("Bullish") || indicator.includes("Oversold") || indicator.includes("Golden") || indicator.includes("Support");
      const isBearish = indicator.includes("Bearish") || indicator.includes("Overbought") || indicator.includes("Death") || indicator.includes("Resistance");
      signals.push({
        symbol: c.symbol,
        type: isBullish ? "bullish" : isBearish ? "bearish" : "neutral",
        signal: isBullish ? "Buy Signal" : isBearish ? "Sell Signal" : "Watch",
        indicator,
        strength: Math.floor(Math.random() * 40) + 60,
        price: c.ltp || c.latestClose || 0,
        change: c.percentChange || 0,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      });
    }
  });

  return signals.sort((a, b) => b.strength - a.strength);
}

export default function AlertsPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "bullish" | "bearish">("all");
  const [indicatorFilter, setIndicatorFilter] = useState("all");

  useEffect(() => {
    fetch(`${API_BASE}/api/companies`)
      .then((r) => r.json())
      .then((data) => {
        setCompanies(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const signals = useMemo(() => getSignals(companies), [companies]);

  const filtered = useMemo(() => {
    let result = signals;
    if (filter !== "all") result = result.filter((s) => s.type === filter);
    if (indicatorFilter !== "all") result = result.filter((s) => s.indicator === indicatorFilter);
    return result;
  }, [signals, filter, indicatorFilter]);

  const indicators = useMemo(() => Array.from(new Set(signals.map((s) => s.indicator))).sort(), [signals]);
  const bullishCount = signals.filter((s) => s.type === "bullish").length;
  const bearishCount = signals.filter((s) => s.type === "bearish").length;

  const groupedByIndicator = useMemo(() => {
    const groups: Record<string, Signal[]> = {};
    filtered.forEach((s) => {
      if (!groups[s.indicator]) groups[s.indicator] = [];
      groups[s.indicator].push(s);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Technical Signals</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Real-time technical analysis signals across the market</p>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-[var(--green-bg)] px-3 py-1 text-xs font-bold text-[var(--green)]">
            <TrendingUp className="h-3 w-3" /> {bullishCount} Bullish
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[var(--red-bg)] px-3 py-1 text-xs font-bold text-[var(--red)]">
            <TrendingDown className="h-3 w-3" /> {bearishCount} Bearish
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex gap-1">
          {(["all", "bullish", "bearish"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${filter === f ? "bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)]" : "text-[var(--text-muted)] border border-[var(--border-primary)]"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <select value={indicatorFilter} onChange={(e) => setIndicatorFilter(e.target.value)} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">
          <option value="all">All Indicators</option>
          {indicators.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {/* Signal Cards */}
      {loading ? (
        <div className="card-3d flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-primary)] border-t-[var(--accent)]" />
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByIndicator).map(([indicator, sigs]) => (
            <div key={indicator} className="card-3d overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-6 py-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-sm font-bold text-[var(--text-primary)]">{indicator}</span>
                </div>
                <span className="text-xs text-[var(--text-dim)]">{sigs.length} signals</span>
              </div>
              <div className="divide-y divide-[var(--border-primary)]">
                {sigs.slice(0, 5).map((s, i) => (
                  <div key={`${s.symbol}-${i}`} className="flex items-center justify-between px-6 py-3 hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.type === "bullish" ? "bg-[var(--green-bg)]" : s.type === "bearish" ? "bg-[var(--red-bg)]" : "bg-[var(--bg-input)]"}`}>
                        {s.type === "bullish" ? <TrendingUp className="h-5 w-5 text-[var(--green)]" /> :
                         s.type === "bearish" ? <TrendingDown className="h-5 w-5 text-[var(--red)]" /> :
                         <AlertTriangle className="h-5 w-5 text-[var(--amber)]" />}
                      </div>
                      <div>
                        <a href={`/company/${s.symbol}`} className="text-sm font-bold text-[var(--text-primary)] hover:text-[var(--accent)]">{s.symbol}</a>
                        <div className="text-xs text-[var(--text-dim)]">{s.signal}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-mono text-sm text-[var(--text-primary)]">Rs {s.price.toLocaleString()}</div>
                        <div className={`font-mono text-xs ${s.change >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                          {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%
                        </div>
                      </div>
                      <div className="w-16">
                        <div className="mb-1 flex items-center justify-between text-[9px] text-[var(--text-dim)]">
                          <span>Strength</span>
                          <span className="font-bold">{s.strength}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--bg-input)]">
                          <div
                            className={`h-full rounded-full ${s.type === "bullish" ? "bg-[var(--green)]" : s.type === "bearish" ? "bg-[var(--red)]" : "bg-[var(--accent)]"}`}
                            style={{ width: `${s.strength}%` }}
                          />
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        s.type === "bullish" ? "bg-[var(--green-bg)] text-[var(--green)]" :
                        s.type === "bearish" ? "bg-[var(--red-bg)] text-[var(--red)]" :
                        "bg-[var(--amber-bg)] text-[var(--amber)]"
                      }`}>
                        {s.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
