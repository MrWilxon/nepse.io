"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Star,
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity,
  ArrowRightLeft,
  Users,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type {
  CompanySummary,
  TopMover,
  MarketSummary,
  HeatmapData,
  MarketStatus,
} from "@/lib/api";
import { useWatchlist } from "@/lib/watchlist";
import { ErrorBoundary } from "@/components/error-boundary";
import { SkeletonDashboard as DashboardSkeleton } from "@/components/skeleton";
import RecentActivity from "@/components/recent-activity";
import { useDashboardWidgets, WidgetSettings } from "@/components/dashboard-widgets";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const PAGE_SIZE = 15;

export default function Home() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [topMovers, setTopMovers] = useState<{
    gainers: TopMover[];
    losers: TopMover[];
    mostActive: TopMover[];
  }>({ gainers: [], losers: [], mostActive: [] });
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [connectionError, setConnectionError] = useState(false);

  const { toggle, isWatched } = useWatchlist();
  const { widgets, enabled: enabledWidgets, toggleWidget, moveWidget } = useDashboardWidgets();

  useEffect(() => {
    const safeFetch = (url: string, fallback: any = null) =>
      fetch(url).then((r) => r.json()).catch(() => fallback);

    Promise.all([
      safeFetch(`${API_BASE}/api/companies`, []),
      safeFetch(`${API_BASE}/api/top-movers`, { gainers: [], losers: [], mostActive: [] }),
      safeFetch(`${API_BASE}/api/market-summary`, null),
      safeFetch(`${API_BASE}/api/sectors/heatmap`, []),
      safeFetch(`${API_BASE}/api/market-status`, null),
    ])
      .then(([companiesData, movers, summary, heat, status]) => {
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
        setTopMovers(movers && movers.gainers ? movers : { gainers: [], losers: [], mostActive: [] });
        setMarketSummary(summary);
        setHeatmap(Array.isArray(heat) ? heat : []);
        setMarketStatus(status);
        if (!companiesData || (Array.isArray(companiesData) && companiesData.length === 0)) setConnectionError(true);
      })
      .catch(() => setConnectionError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = companies.filter((c) =>
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const chartData = marketSummary
    ? [
        { name: "Volume", value: marketSummary.totalVolume / 1_000_000, color: "#D4A017" },
        { name: "Gainers", value: marketSummary.advance, color: "#22c55e" },
        { name: "Losers", value: marketSummary.decline, color: "#ef4444" },
        { name: "Unchanged", value: marketSummary.unchanged || 0, color: "#6b7280" },
      ]
    : [];

  return (
    <ErrorBoundary>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Connection Error Banner */}
        {connectionError && (
          <div className="rounded-xl border border-[var(--amber-border)] bg-[var(--amber-bg)] px-5 py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[var(--amber)]" />
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Backend not connected</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Make sure the backend is running on {API_BASE}. Run: <code className="rounded bg-[var(--bg-input)] px-1.5 py-0.5 text-[var(--accent)]">cd backend && node server.js</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-theme tracking-tight">Nepal Stock Exchange</h1>
            <p className="text-muted-theme text-sm mt-0.5">
              {companies.length} companies listed
              {marketSummary && ` · Last updated: ${marketSummary.latestDate}`}
            </p>
          </div>
          {marketStatus && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              marketStatus.status === "open"
                ? "bg-green-theme text-[#22c55e]"
                : marketStatus.status === "pre_open"
                ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                : "bg-kbd-theme text-subtle-theme"
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                marketStatus.status === "open" ? "bg-[#22c55e] animate-pulse" :
                marketStatus.status === "pre_open" ? "bg-[#f59e0b]" : "bg-[#6b7280]"
              }`} />
              {marketStatus.status === "open" && "Market Open"}
              {marketStatus.status === "pre_open" && "Pre-Open Session"}
              {marketStatus.status === "closed" && "Market Closed"}
            </div>
          )}
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Volume Card */}
          <div className="metric-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-theme">
                <BarChart3 className="h-5 w-5 text-accent-theme" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-theme">Total Volume</div>
                <div className="text-xl font-bold text-primary-theme font-mono">
                  {marketSummary ? `${(marketSummary.totalVolume / 1_000_000).toFixed(1)}M` : "-"}
                </div>
              </div>
            </div>
            <div className="h-1 w-full bg-hover-theme rounded-full overflow-hidden">
              <div className="h-full bg-[#D4A017] rounded-full" style={{ width: "72%" }} />
            </div>
          </div>

          {/* Turnover Card */}
          <div className="metric-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-theme">
                <ArrowRightLeft className="h-5 w-5 text-[#22c55e]" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-theme">Total Turnover</div>
                <div className="text-xl font-bold text-primary-theme font-mono">
                  {marketSummary ? `Rs ${(marketSummary.totalTurnover / 1_000_000).toFixed(0)}M` : "-"}
                </div>
              </div>
            </div>
            <div className="h-1 w-full bg-hover-theme rounded-full overflow-hidden">
              <div className="h-full bg-[#22c55e] rounded-full" style={{ width: "65%" }} />
            </div>
          </div>

          {/* Advance Card */}
          <div className="metric-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-theme">
                <TrendingUp className="h-5 w-5 text-[#22c55e]" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-theme">Advance</div>
                <div className="text-xl font-bold text-[#22c55e] font-mono">
                  {marketSummary?.advance ?? "-"}
                </div>
              </div>
            </div>
            <div className="h-1 w-full bg-hover-theme rounded-full overflow-hidden">
              <div className="h-full bg-[#22c55e] rounded-full" style={{ width: marketSummary ? `${(marketSummary.advance / (marketSummary.advance + marketSummary.decline + 1)) * 100}%` : "0%" }} />
            </div>
          </div>

          {/* Decline Card */}
          <div className="metric-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-theme">
                <TrendingDown className="h-5 w-5 text-[#ef4444]" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-theme">Decline</div>
                <div className="text-xl font-bold text-[#ef4444] font-mono">
                  {marketSummary?.decline ?? "-"}
                </div>
              </div>
            </div>
            <div className="h-1 w-full bg-hover-theme rounded-full overflow-hidden">
              <div className="h-full bg-[#ef4444] rounded-full" style={{ width: marketSummary ? `${(marketSummary.decline / (marketSummary.advance + marketSummary.decline + 1)) * 100}%` : "0%" }} />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Trend Chart - Large */}
          <div className="lg:col-span-2 card-3d p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-primary-theme">Sales Trend</h2>
                <p className="text-xs text-muted-theme mt-0.5">Market activity overview</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#22c55e] bg-green-theme px-2 py-1 rounded-lg font-medium">
                <Zap className="h-3 w-3" />
                Live
              </div>
            </div>
            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="20%">
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#8892a0", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#8892a0", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1a1a25",
                        border: "1px solid #27272a",
                        borderRadius: "0.75rem",
                        color: "#f0f0f5",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-theme">
                Loading chart...
              </div>
            )}
          </div>

          {/* Sector Heatmap - Right Side */}
          <div className="card-3d p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-primary-theme">Sector Heatmap</h2>
                <p className="text-xs text-muted-theme mt-0.5">Today&apos;s performance</p>
              </div>
              <Link href="/sectors" className="text-xs text-accent-theme hover:text-[#E8B830] font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {heatmap.slice(0, 8).map((s) => (
                <Link
                  key={s.sector}
                  href="/sectors"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-input-theme hover:bg-hover-theme border border-theme transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-primary-theme truncate">
                      {s.sector.split("/")[0].split(" ").slice(0, 2).join(" ")}
                    </div>
                    <div className="text-[10px] text-muted-theme">
                      {s.marketShare.toFixed(1)}% share
                    </div>
                  </div>
                  <div className={`text-xs font-bold font-mono ${
                    s.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                  }`}>
                    {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Top Movers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MoverCard
            title="Top Gainers"
            icon={<TrendingUp className="h-4 w-4 text-[#22c55e]" />}
            items={topMovers.gainers.slice(0, 5)}
            color="green"
          />
          <MoverCard
            title="Top Losers"
            icon={<TrendingDown className="h-4 w-4 text-[#ef4444]" />}
            items={topMovers.losers.slice(0, 5)}
            color="red"
          />
          <MoverCard
            title="Most Active"
            icon={<Activity className="h-4 w-4 text-accent-theme" />}
            items={topMovers.mostActive.slice(0, 5)}
            color="orange"
          />
        </div>

        {/* Activity + Widget Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
          <div>
            <WidgetSettings widgets={widgets} toggleWidget={toggleWidget} moveWidget={moveWidget} />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card-3d p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-primary-theme">Recent Transactions</h2>
              <p className="text-xs text-muted-theme mt-0.5">Browse all listed companies</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
                <input
                  type="text"
                  placeholder="Search symbol..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-48 rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017]/50 placeholder:text-muted-theme"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-input-theme animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-theme">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3 w-10"></th>
                      <th className="px-4 py-3 text-left">Symbol</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-right">Latest Price</th>
                      <th className="px-4 py-3 text-right">Date</th>
                      <th className="px-4 py-3 text-right">Records</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((c) => (
                      <tr
                        key={c.symbol}
                        className="table-row cursor-pointer"
                        onClick={() => (window.location.href = `/company/${c.symbol}`)}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggle(c.symbol); }}
                            className="text-muted-theme hover:text-[#f59e0b] transition-colors"
                          >
                            <Star className={`h-4 w-4 ${isWatched(c.symbol) ? "fill-[#f59e0b] text-[#f59e0b]" : ""}`} />
                          </button>
                        </td>
                        <td className="px-4 py-3 font-semibold text-primary-theme">{c.symbol}</td>
                        <td className="px-4 py-3 text-body-theme">{c.category}</td>
                        <td className="px-4 py-3 text-right font-mono text-primary-theme">
                          {c.latestClose !== null ? `Rs ${c.latestClose.toLocaleString()}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-theme">{c.latestDate || "-"}</td>
                        <td className="px-4 py-3 text-right text-muted-theme">{c.records.toLocaleString()}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-theme">
                          No companies found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-muted-theme">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-lg border border-theme bg-input-theme p-2 text-body-theme hover:bg-hover-theme disabled:opacity-50 transition-colors"
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
                          className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
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
                      className="rounded-lg border border-theme bg-input-theme p-2 text-body-theme hover:bg-hover-theme disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

function MoverCard({
  title,
  icon,
  items,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  items: TopMover[];
  color: "green" | "red" | "orange";
}) {
  return (
    <div className="card-3d p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-primary-theme">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.symbol}
            className="flex items-center justify-between rounded-lg bg-input-theme border border-theme px-3 py-2.5 hover:bg-hover-theme transition-colors"
          >
            <Link href={`/company/${item.symbol}`} className="min-w-0">
              <div className="text-sm font-bold text-primary-theme">{item.symbol}</div>
              <div className="text-[10px] text-muted-theme truncate">{item.category}</div>
            </Link>
            <div className="text-right flex-shrink-0 ml-3">
              <div className="font-mono text-sm text-primary-theme">
                Rs {item.close.toLocaleString()}
              </div>
              <div
                className={`flex items-center justify-end gap-0.5 text-xs font-bold ${
                  item.changePct >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                }`}
              >
                {item.changePct >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : item.changePct < 0 ? (
                  <ArrowDownRight className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {item.changePct >= 0 ? "+" : ""}
                {item.changePct.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-4 text-xs text-muted-theme">No data available</div>
        )}
      </div>
    </div>
  );
}
