"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, TrendingUp, DollarSign, Clock, ArrowUpRight, Filter, Download } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface DividendRecord {
  symbol: string;
  name: string;
  announceDate: string;
  exDate: string;
  recordDate: string;
  paymentDate: string;
  dividendPerShare: number;
  dividendYield: number;
  type: "cash" | "bonus" | "right";
  sector: string;
  consecutiveYears?: number;
  growthRate?: number;
}

function getDividendColor(type: string): string {
  if (type === "cash") return "bg-[var(--green-bg)] text-[var(--green)]";
  if (type === "bonus") return "bg-[var(--blue-bg)] text-[var(--blue)]";
  return "bg-[var(--amber-bg)] text-[var(--amber)]";
}

function getDaysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function DividendCalendarPage() {
  const [dividends, setDividends] = useState<DividendRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "recent">("upcoming");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/dividend-calendar`)
      .then((r) => r.json())
      .then((data) => {
        setDividends(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...dividends];
    const now = new Date();

    if (filter === "upcoming") result = result.filter((d) => new Date(d.exDate) > now);
    else if (filter === "recent") result = result.filter((d) => new Date(d.exDate) <= now);

    if (typeFilter !== "all") result = result.filter((d) => d.type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((d) => d.symbol.toLowerCase().includes(q) || d.name.toLowerCase().includes(q));
    }

    return result.sort((a, b) => new Date(a.exDate).getTime() - new Date(b.exDate).getTime());
  }, [dividends, filter, typeFilter, search]);

  const topYielders = useMemo(() =>
    [...dividends].sort((a, b) => b.dividendYield - a.dividendYield).slice(0, 5),
    [dividends]
  );

  const totalDividendValue = filtered.reduce((s, d) => s + d.dividendPerShare, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dividend Calendar</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Track dividends, yields, and payment dates</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="card-3d p-5">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Upcoming</span>
          </div>
          <div className="mt-1 text-lg font-bold text-[var(--text-primary)]">
            {dividends.filter((d) => new Date(d.exDate) > new Date()).length}
          </div>
        </div>
        <div className="card-3d p-5">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[var(--green)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Avg Yield</span>
          </div>
          <div className="mt-1 text-lg font-bold text-[var(--green)]">
            {(dividends.reduce((s, d) => s + d.dividendYield, 0) / Math.max(dividends.length, 1)).toFixed(2)}%
          </div>
        </div>
        <div className="card-3d p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--blue)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Highest Yield</span>
          </div>
          <div className="mt-1 text-lg font-bold text-[var(--text-primary)]">
            {topYielders[0]?.symbol || "-"}
          </div>
          <div className="text-[10px] text-[var(--green)]">{topYielders[0]?.dividendYield.toFixed(1)}%</div>
        </div>
        <div className="card-3d p-5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--amber)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Next Ex-Date</span>
          </div>
          <div className="mt-1 text-lg font-bold text-[var(--text-primary)]">
            {filtered[0]?.exDate ? new Date(filtered[0].exDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-"}
          </div>
          {filtered[0] && (
            <div className="text-[10px] text-[var(--accent)]">{getDaysUntil(filtered[0].exDate)} days</div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <input type="text" placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] outline-none focus:border-[var(--accent)]" />
        </div>
        <div className="flex gap-1">
          {(["all", "upcoming", "recent"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${filter === f ? "bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)]" : "text-[var(--text-muted)] border border-[var(--border-primary)]"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["all", "cash", "bonus", "right"] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${typeFilter === t ? "bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)]" : "text-[var(--text-muted)] border border-[var(--border-primary)]"}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Dividend Cards */}
      {loading ? (
        <div className="card-3d flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-primary)] border-t-[var(--accent)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-3d flex flex-col items-center justify-center py-16">
          <Calendar className="mb-3 h-10 w-10 text-[var(--border-primary)]" />
          <p className="text-sm text-[var(--text-muted)]">No dividends found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => {
            const daysUntil = getDaysUntil(d.exDate);
            return (
              <div key={`${d.symbol}-${d.exDate}`} className="card-3d p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <a href={`/company/${d.symbol}`} className="text-base font-bold text-[var(--text-primary)] hover:text-[var(--accent)]">{d.symbol}</a>
                    <div className="text-xs text-[var(--text-dim)]">{d.name}</div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getDividendColor(d.type)}`}>
                    {d.type.toUpperCase()}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-[var(--bg-input)] p-2">
                    <div className="text-[9px] text-[var(--text-dim)]">Dividend/Share</div>
                    <div className="text-sm font-bold text-[var(--text-primary)] font-mono">Rs {d.dividendPerShare}</div>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-input)] p-2">
                    <div className="text-[9px] text-[var(--text-dim)]">Yield</div>
                    <div className="text-sm font-bold text-[var(--green)] font-mono">{d.dividendYield.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--text-dim)]">Ex-Date</span>
                    <span className="font-mono text-[var(--text-primary)]">{d.exDate}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--text-dim)]">Payment</span>
                    <span className="font-mono text-[var(--text-primary)]">{d.paymentDate}</span>
                  </div>
                  {d.consecutiveYears && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[var(--text-dim)]">Consecutive</span>
                      <span className="font-mono text-[var(--accent)]">{d.consecutiveYears} years</span>
                    </div>
                  )}
                </div>

                {daysUntil > 0 && (
                  <div className="mt-3 rounded-lg bg-[var(--accent-bg)] px-3 py-2 text-center">
                    <span className="text-xs font-bold text-[var(--accent)]">
                      {daysUntil} days until ex-date
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
