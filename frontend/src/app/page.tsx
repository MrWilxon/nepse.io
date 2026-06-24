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
import {
  useDashboardWidgets,
  WidgetSettings,
  QuickActionsWidget,
  WatchlistSummaryWidget,
  EventsWidget,
  TopBrokersWidget,
  MarketNewsWidget,
  HolidayCalendarWidget,
  SectorRotationWidget,
  FloorTradesWidget,
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

  const { widgets, enabled: enabledWidgets, toggleWidget, moveWidget, resetWidgets, reorderWidgets, applyTemplate } =
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

  const chartData = marketSummary
    ? [
        { name: "Volume", value: marketSummary.totalVolume / 1_000_000, color: "#D4A017" },
        { name: "Gainers", value: marketSummary.advance, color: "#22c55e" },
        { name: "Losers", value: marketSummary.decline, color: "#ef4444" },
        { name: "Unchanged", value: marketSummary.unchanged || 0, color: "#6b7280" },
      ]
    : [];

  const hasId = (id: string) => enabledIds.includes(id);

  return (
    <ErrorBoundary>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Connection Error */}
        {connectionError && (
          <div className="rounded-xl border border-[var(--amber-border)] bg-[var(--amber-bg)] px-5 py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[var(--amber)]" />
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Backend not connected</p>
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
            <h1 className="text-2xl font-bold text-primary-theme tracking-tight">Dashboard</h1>
            <p className="text-muted-theme text-sm mt-0.5">
              {marketSummary?.latestDate
                ? `${marketSummary.totalCompanies} companies · ${marketSummary.latestDate}`
                : "Loading market data..."}
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
              showSettings
                ? "border-accent-theme bg-accent-theme/10 text-accent-theme"
                : "border-theme bg-input-theme text-body-theme hover:bg-hover-theme"
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            Customize
          </button>
        </div>

        {/* Widget Settings Panel */}
        <WidgetSettings
          widgets={widgets}
          toggleWidget={toggleWidget}
          moveWidget={moveWidget}
          open={showSettings}
          onClose={() => setShowSettings(false)}
          onReset={resetWidgets}
          onReorder={reorderWidgets}
          onApplyTemplate={applyTemplate}
        />

        {/* ═══════════════════════════════════════════════════ */}
        {/* SECTION 1: Market Snapshot Hero                     */}
        {/* ═══════════════════════════════════════════════════ */}
        {hasId("snapshot") && (
          <MarketSnapshotHero marketSummary={marketSummary} marketStatus={marketStatus} />
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SECTION 2: Quick Actions                           */}
        {/* ═══════════════════════════════════════════════════ */}
        {hasId("quick-actions") && (
          <div>
            <SectionHeader title="Quick Actions" />
            <QuickActionsWidget />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SECTION 3-4: Chart + Sectors (side by side)        */}
        {/* ═══════════════════════════════════════════════════ */}
        {(hasId("breadth") || hasId("sectors")) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {hasId("breadth") && (
              <div className="lg:col-span-2">
                <SectionHeader title="Market Activity" />
                <BreadthWidget chartData={chartData} />
              </div>
            )}
            {hasId("sectors") && (
              <div>
                <SectionHeader title="Sector Performance" link={{ href: "/sectors", label: "View All" }} />
                <SectorsWidget heatmap={heatmap} />
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SECTION 5: Top Movers                              */}
        {/* ═══════════════════════════════════════════════════ */}
        {hasId("hot") && (
          <div>
            <SectionHeader title="Top Movers" />
            <HotStocksWidget topMovers={topMovers} />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SECTION 6-7: Events + Watchlist (side by side)     */}
        {/* ═══════════════════════════════════════════════════ */}
        {(hasId("events") || hasId("watchlist")) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {hasId("events") && (
              <div className="lg:col-span-2">
                <SectionHeader title="Upcoming Events" />
                <div className="card-3d overflow-hidden">
                  <EventsWidget />
                </div>
              </div>
            )}
            {hasId("watchlist") && (
              <div>
                <SectionHeader title="Watchlist" link={{ href: "/watchlist", label: "View All" }} />
                <div className="card-3d overflow-hidden">
                  <WatchlistSummaryWidget />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SECTION 8-10: Brokers + News + Holidays (3-col)   */}
        {/* ═══════════════════════════════════════════════════ */}
        {(hasId("brokers-snapshot") || hasId("news") || hasId("holidays")) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hasId("brokers-snapshot") && (
              <div>
                <SectionHeader title="Top Brokers" link={{ href: "/brokers", label: "View All" }} />
                <div className="card-3d overflow-hidden">
                  <TopBrokersWidget />
                </div>
              </div>
            )}
            {hasId("news") && (
              <div>
                <SectionHeader title="Market News" link={{ href: "/announcements", label: "View All" }} />
                <div className="card-3d overflow-hidden">
                  <MarketNewsWidget />
                </div>
              </div>
            )}
            {hasId("holidays") && (
              <div>
                <SectionHeader title="Holiday Calendar" />
                <div className="card-3d overflow-hidden">
                  <HolidayCalendarWidget />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SECTION 11: Sector Rotation                        */}
        {/* ═══════════════════════════════════════════════════ */}
        {hasId("rotation") && (
          <div>
            <SectionHeader title="Sector Rotation" link={{ href: "/rotation", label: "Details" }} />
            <div className="card-3d overflow-hidden">
              <SectorRotationWidget />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SECTION 12: Recent Floor Trades                   */}
        {/* ═══════════════════════════════════════════════════ */}
        {hasId("floor-trades") && (
          <div>
            <SectionHeader title="Recent Floor Trades" link={{ href: "/floorsheet", label: "View All" }} />
            <div className="card-3d overflow-hidden">
              <FloorTradesWidget />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SECTION 13: Company Directory                     */}
        {/* ═══════════════════════════════════════════════════ */}
        {hasId("companies") && (
          <div>
            <SectionHeader title="Company Directory" />
            <div className="card-3d overflow-hidden">
              <CompanyListWidget />
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

/* ─── Helper Components ─── */

function SectionHeader({
  title,
  link,
}: {
  title: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-primary-theme">{title}</h2>
      {link && (
        <Link href={link.href} className="text-xs text-accent-theme hover:text-[#E8B830] font-medium">
          {link.label}
        </Link>
      )}
    </div>
  );
}

function MarketSnapshotHero({
  marketSummary,
  marketStatus,
}: {
  marketSummary: MarketSummary | null;
  marketStatus: MarketStatus | null;
}) {
  const total = marketSummary
    ? marketSummary.advance + marketSummary.decline + marketSummary.unchanged
    : 1;
  const advPct = marketSummary ? (marketSummary.advance / total) * 100 : 0;
  const decPct = marketSummary ? (marketSummary.decline / total) * 100 : 0;

  return (
    <div className="card-3d p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Date + Status */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-theme/10">
            <BarChart3 className="h-7 w-7 text-accent-theme" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-primary-theme">NEPSE</h2>
              {marketStatus && (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  marketStatus.status === "open"
                    ? "bg-green-500/10 text-green-400"
                    : marketStatus.status === "pre_open"
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-gray-500/10 text-gray-400"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    marketStatus.status === "open" ? "bg-green-400 animate-pulse" :
                    marketStatus.status === "pre_open" ? "bg-amber-400" : "bg-gray-400"
                  }`} />
                  {marketStatus.status === "open" ? "OPEN" : marketStatus.status === "pre_open" ? "PRE-OPEN" : "CLOSED"}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-theme mt-0.5">
              {marketSummary?.latestDate || "Loading..."} · {marketSummary?.totalCompanies || 0} companies
            </p>
          </div>
        </div>

        {/* Right: Key Metrics */}
        <div className="flex items-center gap-6 md:gap-8">
          <MetricPill
            label="Volume"
            value={marketSummary ? `${(marketSummary.totalVolume / 1_000_000).toFixed(1)}M` : "-"}
            icon={<BarChart3 className="h-3.5 w-3.5" />}
            color="text-accent-theme"
          />
          <MetricPill
            label="Turnover"
            value={marketSummary ? `Rs ${(marketSummary.totalTurnover / 1_000_000).toFixed(0)}M` : "-"}
            icon={<ArrowRightLeft className="h-3.5 w-3.5" />}
            color="text-blue-400"
          />
          <MetricPill
            label="Advance"
            value={marketSummary?.advance?.toString() || "-"}
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            color="text-green-400"
          />
          <MetricPill
            label="Decline"
            value={marketSummary?.decline?.toString() || "-"}
            icon={<TrendingDown className="h-3.5 w-3.5" />}
            color="text-red-400"
          />
        </div>
      </div>

      {/* A/D Ratio Bar */}
      {marketSummary && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-green-400">
              Advance {marketSummary.advance} ({advPct.toFixed(0)}%)
            </span>
            <span className="text-[10px] font-semibold text-muted-theme">
              A/D Ratio {(marketSummary.advance / (marketSummary.decline + 1)).toFixed(2)}
            </span>
            <span className="text-[10px] font-semibold text-red-400">
              Decline {marketSummary.decline} ({decPct.toFixed(0)}%)
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-hover-theme overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-l-full transition-all duration-700"
              style={{ width: `${advPct}%` }}
            />
            <div
              className="h-full bg-gray-500 transition-all duration-700"
              style={{ width: `${marketSummary.unchanged / total * 100}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-r-full transition-all duration-700"
              style={{ width: `${decPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricPill({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className={`flex items-center justify-center gap-1 mb-0.5 ${color}`}>
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <div className="text-lg font-bold text-primary-theme font-mono">{value}</div>
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 text-xs text-[#22c55e] bg-green-theme px-2 py-1 rounded-lg font-medium">
          <Zap className="h-3 w-3" />
          Live
        </div>
      </div>
      {chartData.length > 0 ? (
        <div className="h-56">
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
                  background: "var(--bg-card, #1a1a25)",
                  border: "1px solid var(--border, #27272a)",
                  borderRadius: "0.75rem",
                  color: "var(--text-primary, #f0f0f5)",
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
        <div className="h-56 flex items-center justify-center text-muted-theme">Loading chart...</div>
      )}
    </div>
  );
}

function SectorsWidget({ heatmap }: { heatmap: HeatmapData[] }) {
  return (
    <div className="card-3d p-4">
      <div className="space-y-1.5">
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
              <div className="text-[10px] text-muted-theme">{s.marketShare.toFixed(1)}% share</div>
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
      />
      <MoverCard
        title="Top Losers"
        icon={<TrendingDown className="h-4 w-4 text-[#ef4444]" />}
        items={topMovers.losers.slice(0, 5)}
      />
      <MoverCard
        title="Most Active"
        icon={<Activity className="h-4 w-4 text-accent-theme" />}
        items={topMovers.mostActive.slice(0, 5)}
      />
    </div>
  );
}

function MoverCard({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: TopMover[];
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
              <div className="font-mono text-sm text-primary-theme">Rs {item.close.toLocaleString()}</div>
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
