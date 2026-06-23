"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Zap,
  Activity,
  ArrowRightLeft,
  AlertTriangle,
  Settings,
  X,
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
  TopMover,
  MarketSummary,
  HeatmapData,
  MarketStatus,
} from "@/lib/api";
import { safeFetch, API_BASE } from "@/lib/api";
import { ErrorBoundary } from "@/components/error-boundary";
import RecentActivity from "@/components/recent-activity";
import {
  useDashboardWidgets,
  WidgetSettings,
  WatchlistSummaryWidget,
  EarningsCalendarWidget,
  UpcomingIPOWidget,
  CompanyListWidget,
} from "@/components/dashboard-widgets";

export default function Home() {
  const [topMovers, setTopMovers] = useState<{
    gainers: TopMover[];
    losers: TopMover[];
    mostActive: TopMover[];
  }>({ gainers: [], losers: [], mostActive: [] });
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { widgets, enabled: enabledWidgets, toggleWidget, moveWidget } =
    useDashboardWidgets();

  useEffect(() => {
    Promise.all([
      safeFetch(`${API_BASE}/api/top-movers`, {
        gainers: [] as TopMover[],
        losers: [] as TopMover[],
        mostActive: [] as TopMover[],
      }),
      safeFetch<MarketSummary | null>(`${API_BASE}/api/market-summary`, null),
      safeFetch(`${API_BASE}/api/sectors/heatmap`, [] as HeatmapData[]),
      safeFetch<MarketStatus | null>(`${API_BASE}/api/market-status`, null),
    ])
      .then(([movers, summary, heat, status]) => {
        setTopMovers(
          movers && movers.gainers
            ? movers
            : { gainers: [], losers: [], mostActive: [] }
        );
        setMarketSummary(summary);
        setHeatmap(Array.isArray(heat) ? heat : []);
        setMarketStatus(status);
      })
      .catch(() => setConnectionError(true));
  }, []);

  const enabledIds = enabledWidgets.map((w) => w.id);

  const hasBreadth = enabledIds.includes("breadth");
  const hasSectors = enabledIds.includes("sectors");

  const chartData = marketSummary
    ? [
        {
          name: "Volume",
          value: marketSummary.totalVolume / 1_000_000,
          color: "#D4A017",
        },
        {
          name: "Gainers",
          value: marketSummary.advance,
          color: "#22c55e",
        },
        {
          name: "Losers",
          value: marketSummary.decline,
          color: "#ef4444",
        },
        {
          name: "Unchanged",
          value: marketSummary.unchanged || 0,
          color: "#6b7280",
        },
      ]
    : [];

  const renderWidget = (id: string) => {
    switch (id) {
      case "overview":
        return <OverviewWidget marketSummary={marketSummary} />;
      case "breadth":
        return <BreadthWidget chartData={chartData} />;
      case "sectors":
        return <SectorsWidget heatmap={heatmap} />;
      case "activity":
        return <RecentActivity />;
      case "hot":
        return <HotStocksWidget topMovers={topMovers} />;
      case "watchlist":
        return <WatchlistSummaryWidget />;
      case "calendar":
        return <EarningsCalendarWidget />;
      case "ipo":
        return <UpcomingIPOWidget />;
      case "companies":
        return <CompanyListWidget />;
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Connection Error Banner */}
        {connectionError && (
          <div className="rounded-xl border border-[var(--amber-border)] bg-[var(--amber-bg)] px-5 py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[var(--amber)]" />
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Backend not connected
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Make sure the backend is running on {API_BASE}. Run:{" "}
                  <code className="rounded bg-[var(--bg-input)] px-1.5 py-0.5 text-[var(--accent)]">
                    cd backend &amp;&amp; node server.js
                  </code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-theme tracking-tight">
              Nepal Stock Exchange
            </h1>
            <p className="text-muted-theme text-sm mt-0.5">
              Last updated: {marketSummary?.latestDate || "Loading..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {marketStatus && (
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  marketStatus.status === "open"
                    ? "bg-green-theme text-[#22c55e]"
                    : marketStatus.status === "pre_open"
                    ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                    : "bg-kbd-theme text-subtle-theme"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    marketStatus.status === "open"
                      ? "bg-[#22c55e] animate-pulse"
                      : marketStatus.status === "pre_open"
                      ? "bg-[#f59e0b]"
                      : "bg-[#6b7280]"
                  }`}
                />
                {marketStatus.status === "open" && "Market Open"}
                {marketStatus.status === "pre_open" && "Pre-Open Session"}
                {marketStatus.status === "closed" && "Market Closed"}
              </div>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                showSettings
                  ? "border-accent-theme bg-accent-theme/10 text-accent-theme"
                  : "border-theme bg-input-theme text-body-theme hover:bg-hover-theme"
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              Widgets
            </button>
          </div>
        </div>

        {/* Widget Settings Panel */}
        {showSettings && (
          <div className="relative">
            <WidgetSettings
              widgets={widgets}
              toggleWidget={toggleWidget}
              moveWidget={moveWidget}
            />
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-2 right-2 text-muted-theme hover:text-primary-theme"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Widget-driven layout */}
        {enabledWidgets.map((w) => {
          // Overview is full-width 4-col grid
          if (w.id === "overview") {
            return <div key={w.id}>{renderWidget(w.id)}</div>;
          }

          // Breadth + Sectors on same row when both enabled
          if (w.id === "breadth" && hasSectors) {
            return (
              <div key="breadth-sectors" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">{renderWidget("breadth")}</div>
                <div>{renderWidget("sectors")}</div>
              </div>
            );
          }
          if (w.id === "sectors" && hasBreadth) {
            // Skip — already rendered with breadth
            return null;
          }

          // Hot Stocks is full-width 3-col
          if (w.id === "hot") {
            return <div key={w.id}>{renderWidget(w.id)}</div>;
          }

          // Everything else is full-width
          return <div key={w.id}>{renderWidget(w.id)}</div>;
        })}
      </div>
    </ErrorBoundary>
  );
}

function OverviewWidget({
  marketSummary,
}: {
  marketSummary: MarketSummary | null;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="metric-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-theme">
            <BarChart3 className="h-5 w-5 text-accent-theme" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-theme">Total Volume</div>
            <div className="text-xl font-bold text-primary-theme font-mono">
              {marketSummary
                ? `${(marketSummary.totalVolume / 1_000_000).toFixed(1)}M`
                : "-"}
            </div>
          </div>
        </div>
        <div className="h-1 w-full bg-hover-theme rounded-full overflow-hidden">
          <div
            className="h-full bg-[#D4A017] rounded-full"
            style={{ width: "72%" }}
          />
        </div>
      </div>

      <div className="metric-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-theme">
            <ArrowRightLeft className="h-5 w-5 text-[#22c55e]" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-theme">Total Turnover</div>
            <div className="text-xl font-bold text-primary-theme font-mono">
              {marketSummary
                ? `Rs ${(marketSummary.totalTurnover / 1_000_000).toFixed(0)}M`
                : "-"}
            </div>
          </div>
        </div>
        <div className="h-1 w-full bg-hover-theme rounded-full overflow-hidden">
          <div
            className="h-full bg-[#22c55e] rounded-full"
            style={{ width: "65%" }}
          />
        </div>
      </div>

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
          <div
            className="h-full bg-[#22c55e] rounded-full"
            style={{
              width: marketSummary
                ? `${(marketSummary.advance / (marketSummary.advance + marketSummary.decline + 1)) * 100}%`
                : "0%",
            }}
          />
        </div>
      </div>

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
          <div
            className="h-full bg-[#ef4444] rounded-full"
            style={{
              width: marketSummary
                ? `${(marketSummary.decline / (marketSummary.advance + marketSummary.decline + 1)) * 100}%`
                : "0%",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function BreadthWidget({
  chartData,
}: {
  chartData: { name: string; value: number; color: string }[];
}) {
  return (
    <div className="card-3d p-6">
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
  );
}

function SectorsWidget({ heatmap }: { heatmap: HeatmapData[] }) {
  return (
    <div className="card-3d p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-primary-theme">
            Sector Heatmap
          </h2>
          <p className="text-xs text-muted-theme mt-0.5">Today&apos;s performance</p>
        </div>
        <Link
          href="/sectors"
          className="text-xs text-accent-theme hover:text-[#E8B830] font-medium"
        >
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
            <div
              className={`text-xs font-bold font-mono ${
                s.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
              }`}
            >
              {s.change >= 0 ? "+" : ""}
              {s.change.toFixed(2)}%
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function HotStocksWidget({
  topMovers,
}: {
  topMovers: { gainers: TopMover[]; losers: TopMover[]; mostActive: TopMover[] };
}) {
  return (
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
              <div className="text-sm font-bold text-primary-theme">
                {item.symbol}
              </div>
              <div className="text-[10px] text-muted-theme truncate">
                {item.category}
              </div>
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
          <div className="text-center py-4 text-xs text-muted-theme">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}
