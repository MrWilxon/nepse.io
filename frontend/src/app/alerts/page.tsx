"use client";

import { useState, useEffect, useMemo } from "react";
import { Zap, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight, ArrowDownRight, Filter, Search, Package } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface Signal {
  symbol: string;
  name: string;
  type: "bullish" | "bearish" | "neutral";
  price: number;
  change: number;
  volume: number;
  sector: string;
}

export default function AlertsPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "bullish" | "bearish">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/companies`)
      .then((r) => r.json())
      .then((data) => { setCompanies(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const signals = useMemo(() => {
    return companies
      .filter((c) => c.ltp > 0)
      .map((c: any): Signal => ({
        symbol: c.symbol,
        name: c.name || c.symbol,
        type: (c.percentChange || 0) > 2 ? "bullish" : (c.percentChange || 0) < -2 ? "bearish" : "neutral",
        price: c.ltp || 0,
        change: c.percentChange || 0,
        volume: c.volume || 0,
        sector: c.sector || c.category || "Other",
      }));
  }, [companies]);

  const filtered = useMemo(() => {
    let result = signals;
    if (filter !== "all") result = result.filter((s) => s.type === filter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    return result;
  }, [signals, filter, search]);

  const bullishCount = signals.filter((s) => s.type === "bullish").length;
  const bearishCount = signals.filter((s) => s.type === "bearish").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--bg-secondary)]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="card-3d h-24 animate-pulse bg-[var(--bg-secondary)]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Market Signals</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Real-time price-based signals from {companies.length} companies
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-3d p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--green)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Bullish (&gt;+2%)</span>
          </div>
          <div className="mt-1 text-lg font-bold text-[var(--green)]">{bullishCount}</div>
          <div className="mt-1 text-[10px] text-[var(--text-dim)]">stocks rising</div>
        </div>
        <div className="card-3d p-5">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-[var(--red)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Bearish (&lt;-2%)</span>
          </div>
          <div className="mt-1 text-lg font-bold text-[var(--red)]">{bearishCount}</div>
          <div className="mt-1 text-[10px] text-[var(--text-dim)]">stocks falling</div>
        </div>
        <div className="card-3d p-5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Total Tracked</span>
          </div>
          <div className="mt-1 text-lg font-bold text-[var(--text-primary)]">{signals.length}</div>
          <div className="mt-1 text-[10px] text-[var(--text-dim)]">active companies</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-[var(--bg-secondary)] p-1">
          {(["all", "bullish", "bearish"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] pl-8 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>

      {/* Signals Table */}
      <div className="card-3d overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="mb-4 h-12 w-12 text-[var(--text-dim)]" />
            <h3 className="text-lg font-medium text-[var(--text-primary)]">No Signals</h3>
            <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">
              {companies.length === 0
                ? "No company data available. The market data may not be loaded yet."
                : "No stocks match your current filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">Sector</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Change</th>
                  <th className="px-4 py-3 text-right">Volume</th>
                  <th className="px-4 py-3 text-center">Signal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.symbol} className="table-row">
                    <td className="px-4 py-3">
                      <a href={`/company/${s.symbol}`} className="font-bold text-[var(--text-primary)] hover:text-[var(--accent)]">
                        {s.symbol}
                      </a>
                      <div className="text-[10px] text-[var(--text-dim)]">{s.name}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{s.sector}</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-primary)]">
                      Rs {s.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-0.5 font-mono text-xs font-bold ${s.change >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                        {s.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-muted)]">
                      {s.volume >= 1e6 ? `${(s.volume / 1e6).toFixed(1)}M` : s.volume >= 1e3 ? `${(s.volume / 1e3).toFixed(0)}K` : s.volume.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        s.type === "bullish" ? "bg-[var(--green-bg)] text-[var(--green)]"
                          : s.type === "bearish" ? "bg-[var(--red-bg)] text-[var(--red)]"
                          : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                      }`}>
                        {s.type === "bullish" ? "BULLISH" : s.type === "bearish" ? "BEARISH" : "NEUTRAL"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
