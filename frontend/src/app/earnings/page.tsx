"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Earning {
  symbol: string;
  name: string;
  date: string;
  estimatedEPS?: number;
  actualEPS?: number;
  previousEPS?: number;
  sector: string;
}

function getCountdown(dateStr: string): { days: number; hours: number; minutes: number; seconds: number; expired: boolean } {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/earnings`).then((r) => r.json()).catch(() => []),
      fetch(`${API_BASE}/api/companies`).then((r) => r.json()).catch(() => []),
    ]).then(([earningsData, companies]) => {
      const enriched = (earningsData || []).map((e: any) => ({
        symbol: e.symbol || e.company,
        name: e.name || e.symbol || e.company,
        date: e.date || e.earningsDate || e.reportDate,
        estimatedEPS: e.estimatedEPS,
        actualEPS: e.actualEPS,
        previousEPS: e.previousEPS,
        sector: e.sector || companies.find((c: any) => c.symbol === e.symbol)?.sector || "Other",
      }));
      setEarnings(enriched);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const filtered = useMemo(() => {
    return earnings.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [earnings, selectedMonth, selectedYear]);

  const upcoming = useMemo(() => {
    return earnings
      .filter((e) => new Date(e.date).getTime() > Date.now())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [earnings]);

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear((y) => y - 1); }
    else setSelectedMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear((y) => y + 1); }
    else setSelectedMonth((m) => m + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Earnings Calendar</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Upcoming and historical earnings reports</p>
      </div>

      {/* Upcoming Countdown */}
      {upcoming.length > 0 && (
        <div className="card-3d p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--text-muted)]">
            <Clock className="h-4 w-4 text-[var(--accent)]" /> Next Earnings
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {upcoming.map((e) => {
              const cd = getCountdown(e.date);
              return (
                <div key={e.symbol} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
                  <div className="mb-2 text-sm font-bold text-[var(--text-primary)]">{e.symbol}</div>
                  <div className="text-[10px] text-[var(--text-dim)]">{e.date}</div>
                  {cd.expired ? (
                    <span className="mt-2 inline-block rounded-full bg-[var(--accent-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent)]">Today</span>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      {cd.days > 0 && <div className="text-center"><div className="text-lg font-bold text-[var(--accent)] font-mono">{cd.days}</div><div className="text-[8px] text-[var(--text-dim)]">DAYS</div></div>}
                      <div className="text-center"><div className="text-lg font-bold text-[var(--accent)] font-mono">{String(cd.hours).padStart(2, "0")}</div><div className="text-[8px] text-[var(--text-dim)]">HRS</div></div>
                      <div className="text-center"><div className="text-lg font-bold text-[var(--accent)] font-mono">{String(cd.minutes).padStart(2, "0")}</div><div className="text-[8px] text-[var(--text-dim)]">MIN</div></div>
                      <div className="text-center"><div className="text-lg font-bold text-[var(--accent)] font-mono">{String(cd.seconds).padStart(2, "0")}</div><div className="text-[8px] text-[var(--text-dim)]">SEC</div></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month Navigator */}
      <div className="card-3d p-4">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {months[selectedMonth]} {selectedYear}
          </h2>
          <button onClick={nextMonth} className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="card-3d flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-primary)] border-t-[var(--accent)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-3d flex flex-col items-center justify-center py-16">
          <Calendar className="mb-3 h-10 w-10 text-[var(--border-primary)]" />
          <p className="text-sm text-[var(--text-muted)]">No earnings this month</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => {
            const surprise = e.actualEPS && e.estimatedEPS ? ((e.actualEPS - e.estimatedEPS) / Math.abs(e.estimatedEPS)) * 100 : null;
            return (
              <div key={`${e.symbol}-${e.date}`} className="card-3d p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <a href={`/company/${e.symbol}`} className="text-base font-bold text-[var(--text-primary)] hover:text-[var(--accent)]">{e.symbol}</a>
                    <div className="text-xs text-[var(--text-dim)]">{e.name}</div>
                  </div>
                  <span className="rounded-full bg-[var(--bg-hover)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">{e.sector}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Calendar className="h-3 w-3" /> {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-[var(--bg-input)] p-2 text-center">
                    <div className="text-[9px] text-[var(--text-dim)]">Est. EPS</div>
                    <div className="text-xs font-bold text-[var(--text-primary)] font-mono">{e.estimatedEPS ?? "-"}</div>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-input)] p-2 text-center">
                    <div className="text-[9px] text-[var(--text-dim)]">Actual</div>
                    <div className="text-xs font-bold text-[var(--text-primary)] font-mono">{e.actualEPS ?? "-"}</div>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-input)] p-2 text-center">
                    <div className="text-[9px] text-[var(--text-dim)]">Surprise</div>
                    <div className={`text-xs font-bold font-mono ${surprise !== null ? (surprise >= 0 ? "text-[var(--green)]" : "text-[var(--red)]") : "text-[var(--text-dim)]"}`}>
                      {surprise !== null ? `${surprise >= 0 ? "+" : ""}${surprise.toFixed(1)}%` : "-"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
