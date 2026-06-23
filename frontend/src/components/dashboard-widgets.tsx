"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  GripVertical,
  Eye,
  EyeOff,
  Settings,
  Star,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Building2,
} from "lucide-react";
import { safeFetch, API_BASE } from "@/lib/api";
import type { CompanySummary } from "@/lib/api";

export interface DashboardWidget {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: "overview", label: "Market Overview", enabled: true, order: 0 },
  { id: "breadth", label: "Market Breadth", enabled: true, order: 1 },
  { id: "sectors", label: "Sector Performance", enabled: true, order: 2 },
  { id: "activity", label: "Recent Activity", enabled: true, order: 3 },
  { id: "hot", label: "Hot Stocks", enabled: true, order: 4 },
  { id: "watchlist", label: "Watchlist Summary", enabled: false, order: 5 },
  { id: "calendar", label: "Earnings Calendar", enabled: false, order: 6 },
  { id: "ipo", label: "Upcoming IPOs", enabled: false, order: 7 },
  { id: "companies", label: "Company List", enabled: true, order: 8 },
];

export function useDashboardWidgets() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);

  useEffect(() => {
    const saved = localStorage.getItem("nepse_dashboard_widgets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = DEFAULT_WIDGETS.map((dw) => {
          const s = parsed.find((p: DashboardWidget) => p.id === dw.id);
          return s ? { ...dw, enabled: s.enabled, order: s.order } : dw;
        });
        setWidgets(merged.sort((a, b) => a.order - b.order));
      } catch {
        /* use defaults */
      }
    }
  }, []);

  const save = (next: DashboardWidget[]) => {
    setWidgets(next);
    localStorage.setItem("nepse_dashboard_widgets", JSON.stringify(next));
  };

  const toggleWidget = (id: string) =>
    save(widgets.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)));

  const moveWidget = (id: string, dir: -1 | 1) => {
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((w) => w.id === id);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === sorted.length - 1)) return;
    const swap = sorted[idx + dir];
    sorted[idx] = { ...sorted[idx], order: swap.order };
    swap.order = idx === 0 ? 0 : sorted[idx].order;
    save([...sorted]);
  };

  const enabled = widgets.filter((w) => w.enabled).sort((a, b) => a.order - b.order);
  return { widgets, enabled, toggleWidget, moveWidget };
}

export function WidgetSettings({
  widgets,
  toggleWidget,
  moveWidget,
}: {
  widgets: DashboardWidget[];
  toggleWidget: (id: string) => void;
  moveWidget: (id: string, dir: -1 | 1) => void;
}) {
  return (
    <div className="card-3d p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="h-3.5 w-3.5 text-accent-theme" />
        <h3 className="text-xs font-bold text-primary-theme uppercase tracking-wider">
          Dashboard Widgets
        </h3>
      </div>
      {[...widgets]
        .sort((a, b) => a.order - b.order)
        .map((w, i) => (
          <div
            key={w.id}
            className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-hover-theme group"
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-theme opacity-0 group-hover:opacity-100 transition-opacity" />
            <button
              onClick={() => moveWidget(w.id, -1)}
              className="text-[10px] text-muted-theme hover:text-primary-theme disabled:opacity-30"
              disabled={i === 0}
            >
              ▲
            </button>
            <button
              onClick={() => moveWidget(w.id, 1)}
              className="text-[10px] text-muted-theme hover:text-primary-theme disabled:opacity-30"
              disabled={i === widgets.length - 1}
            >
              ▼
            </button>
            <span className="flex-1 text-xs text-body-theme">{w.label}</span>
            <button onClick={() => toggleWidget(w.id)}>
              {w.enabled ? (
                <Eye className="h-3.5 w-3.5 text-accent-theme" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-muted-theme" />
              )}
            </button>
          </div>
        ))}
    </div>
  );
}

export function WatchlistSummaryWidget() {
  const [watched, setWatched] = useState<string[]>([]);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("nepse_watchlist");
    if (raw) {
      try {
        setWatched(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (watched.length === 0) return;
    safeFetch<CompanySummary[]>(`${API_BASE}/api/companies`, []).then((data) =>
      setCompanies(Array.isArray(data) ? data : [])
    );
  }, [watched.length]);

  const watchedCompanies = useMemo(
    () => companies.filter((c) => watched.includes(c.symbol)),
    [companies, watched]
  );

  if (watched.length === 0) {
    return (
      <div className="p-6 text-center">
        <Star className="h-8 w-8 text-muted-theme mx-auto mb-2" />
        <p className="text-sm text-muted-theme">No stocks in watchlist</p>
        <p className="text-xs text-muted-theme mt-1">
          Click the star icon on any stock to add it
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {watchedCompanies.slice(0, 9).map((c) => (
          <Link
            key={c.symbol}
            href={`/company/${c.symbol}`}
            className="flex items-center justify-between p-3 rounded-lg bg-input-theme border border-theme hover:bg-hover-theme transition-colors"
          >
            <div>
              <div className="text-sm font-bold text-primary-theme">{c.symbol}</div>
              <div className="text-[10px] text-muted-theme">{c.category}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-primary-theme">
                {c.latestClose !== null ? `Rs ${c.latestClose.toLocaleString()}` : "-"}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {watched.length > 9 && (
        <p className="text-xs text-muted-theme text-center mt-3">
          +{watched.length - 9} more in watchlist
        </p>
      )}
    </div>
  );
}

interface EarningsEntry {
  symbol: string;
  date: string;
  event: string;
  amount?: number;
}

export function EarningsCalendarWidget() {
  const [entries, setEntries] = useState<EarningsEntry[]>([]);

  useEffect(() => {
    safeFetch<EarningsEntry[]>(`${API_BASE}/api/earnings-calendar`, [])
      .then((data) => setEntries(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch(() => {});
  }, []);

  if (entries.length === 0) {
    return (
      <div className="p-6 text-center">
        <Calendar className="h-8 w-8 text-muted-theme mx-auto mb-2" />
        <p className="text-sm text-muted-theme">No upcoming earnings</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-2">
        {entries.map((e, i) => (
          <div
            key={`${e.symbol}-${i}`}
            className="flex items-center justify-between p-3 rounded-lg bg-input-theme border border-theme"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-theme/10">
                <Calendar className="h-4 w-4 text-accent-theme" />
              </div>
              <div>
                <div className="text-sm font-bold text-primary-theme">{e.symbol}</div>
                <div className="text-[10px] text-muted-theme">{e.event}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-primary-theme">{e.date}</div>
              {e.amount !== undefined && (
                <div className="text-[10px] text-accent-theme font-mono">
                  Rs {e.amount.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface IPOEntry {
  name: string;
  symbol?: string;
  priceRange: string;
  openDate: string;
  closeDate: string;
  status: string;
}

export function UpcomingIPOWidget() {
  const [ipos, setIpos] = useState<IPOEntry[]>([]);

  useEffect(() => {
    safeFetch<IPOEntry[]>(`${API_BASE}/api/ipo`, [])
      .then((data) => setIpos(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => {});
  }, []);

  if (ipos.length === 0) {
    return (
      <div className="p-6 text-center">
        <Building2 className="h-8 w-8 text-muted-theme mx-auto mb-2" />
        <p className="text-sm text-muted-theme">No upcoming IPOs</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-2">
        {ipos.map((ipo, i) => (
          <div
            key={ipo.name + i}
            className="flex items-center justify-between p-3 rounded-lg bg-input-theme border border-theme"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-theme/10">
                <Building2 className="h-4 w-4 text-accent-theme" />
              </div>
              <div>
                <div className="text-sm font-bold text-primary-theme">
                  {ipo.name}
                </div>
                <div className="text-[10px] text-muted-theme">
                  {ipo.symbol || "New listing"}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-primary-theme">{ipo.priceRange}</div>
              <div className="text-[10px] text-muted-theme">{ipo.openDate} – {ipo.closeDate}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const COMPANY_PAGE_SIZE = 15;

export function CompanyListWidget() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [watched, setWatched] = useState<string[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("nepse_watchlist");
    if (raw) {
      try {
        setWatched(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const toggleWatch = (symbol: string) => {
    setWatched((prev) => {
      const next = prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol];
      localStorage.setItem("nepse_watchlist", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    safeFetch<CompanySummary[]>(`${API_BASE}/api/companies`, [])
      .then((data) => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = companies.filter((c) =>
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / COMPANY_PAGE_SIZE));
  const paginated = filtered.slice(
    (page - 1) * COMPANY_PAGE_SIZE,
    page * COMPANY_PAGE_SIZE
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-theme">
          {filtered.length} companies
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
          <input
            type="text"
            placeholder="Search symbol..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-48 rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017]/50 placeholder:text-muted-theme"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-input-theme animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-theme">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-3 py-2.5 w-10"></th>
                  <th className="px-3 py-2.5 text-left">Symbol</th>
                  <th className="px-3 py-2.5 text-left">Category</th>
                  <th className="px-3 py-2.5 text-right">Price</th>
                  <th className="px-3 py-2.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => (
                  <tr
                    key={c.symbol}
                    className="table-row cursor-pointer"
                    onClick={() => (window.location.href = `/company/${c.symbol}`)}
                  >
                    <td className="px-3 py-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatch(c.symbol);
                        }}
                        className="text-muted-theme hover:text-[#f59e0b] transition-colors"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            watched.includes(c.symbol)
                              ? "fill-[#f59e0b] text-[#f59e0b]"
                              : ""
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-primary-theme">
                      {c.symbol}
                    </td>
                    <td className="px-3 py-2.5 text-body-theme">{c.category}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-primary-theme">
                      {c.latestClose !== null
                        ? `Rs ${c.latestClose.toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-theme">
                      {c.latestDate || "-"}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-theme">
                      No companies found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-muted-theme">
                {(page - 1) * COMPANY_PAGE_SIZE + 1}–
                {Math.min(page * COMPANY_PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-theme bg-input-theme p-1.5 text-body-theme hover:bg-hover-theme disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`h-7 w-7 rounded-lg text-xs font-medium transition-colors ${
                        page === pageNum
                          ? "bg-[#D4A017] text-primary-theme"
                          : "border border-theme bg-input-theme text-body-theme hover:bg-hover-theme"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-theme bg-input-theme p-1.5 text-body-theme hover:bg-hover-theme disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
