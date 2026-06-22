"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Settings,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  GripVertical,
  BarChart3,
  TrendingUp,
  Activity,
  ArrowRightLeft,
  Users,
  Zap,
} from "lucide-react";

const ResponsiveGridLayout = dynamic(
  () => import("react-grid-layout").then((mod) => mod.Responsive),
  { ssr: false }
);
const WidthProvider = dynamic(
  () => import("react-grid-layout").then((mod) => mod.WidthProvider),
  { ssr: false }
);

const WidthProviderGridLayout = WidthProvider ? (ResponsiveGridLayout as any) : null;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

const WIDGET_TYPES = [
  { type: "market_summary", label: "Market Summary", icon: BarChart3, defaultW: 4, defaultH: 2 },
  { type: "top_gainers", label: "Top Gainers", icon: TrendingUp, defaultW: 4, defaultH: 3 },
  { type: "top_losers", label: "Top Losers", icon: TrendingUp, defaultW: 4, defaultH: 3 },
  { type: "most_active", label: "Most Active", icon: Activity, defaultW: 4, defaultH: 3 },
  { type: "sector_heatmap", label: "Sector Heatmap", icon: BarChart3, defaultW: 6, defaultH: 4 },
  { type: "market_stats", label: "Market Stats", icon: ArrowRightLeft, defaultW: 4, defaultH: 2 },
  { type: "recent_trades", label: "Recent Trades", icon: Users, defaultW: 8, defaultH: 3 },
  { type: "watchlist_summary", label: "Watchlist", icon: Zap, defaultW: 4, defaultH: 3 },
];

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: "w1", type: "market_summary", title: "Market Summary", x: 0, y: 0, w: 4, h: 2 },
  { id: "w2", type: "top_gainers", title: "Top Gainers", x: 4, y: 0, w: 4, h: 3 },
  { id: "w3", type: "top_losers", title: "Top Losers", x: 8, y: 0, w: 4, h: 3 },
  { id: "w4", type: "sector_heatmap", title: "Sector Heatmap", x: 0, y: 3, w: 6, h: 4 },
  { id: "w5", type: "most_active", title: "Most Active", x: 6, y: 3, w: 6, h: 3 },
];

function MarketSummaryWidget() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch(`${API_BASE}/api/market-summary`).then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data) return <div className="h-full flex items-center justify-center text-muted-theme text-sm">Loading...</div>;
  return (
    <div className="p-4 h-full flex flex-col justify-center">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted-theme">Volume</div>
          <div className="text-lg font-bold text-primary-theme font-mono">{(data.totalVolume / 1e6).toFixed(1)}M</div>
        </div>
        <div>
          <div className="text-xs text-muted-theme">Turnover</div>
          <div className="text-lg font-bold text-primary-theme font-mono">Rs {(data.totalTurnover / 1e6).toFixed(0)}M</div>
        </div>
        <div>
          <div className="text-xs text-green-theme">Advances</div>
          <div className="text-lg font-bold text-green-theme font-mono">{data.advance}</div>
        </div>
        <div>
          <div className="text-xs text-red-theme">Declines</div>
          <div className="text-lg font-bold text-red-theme font-mono">{data.decline}</div>
        </div>
      </div>
    </div>
  );
}

function TopMoversWidget({ type }: { type: string }) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API_BASE}/api/top-movers`)
      .then((r) => r.json())
      .then((d) => setItems(type === "top_gainers" ? d.gainers?.slice(0, 5) : type === "top_losers" ? d.losers?.slice(0, 5) : d.mostActive?.slice(0, 5)))
      .catch(() => {});
  }, [type]);
  return (
    <div className="p-3 h-full overflow-auto">
      <div className="space-y-1.5">
        {items.map((item: any) => (
          <div key={item.symbol} className="flex items-center justify-between text-xs p-2 rounded bg-input-theme">
            <span className="font-semibold text-primary-theme">{item.symbol}</span>
            <span className="font-mono text-primary-theme">Rs {item.close?.toLocaleString()}</span>
            <span className={`font-mono ${item.changePct >= 0 ? "text-green-theme" : "text-red-theme"}`}>
              {item.changePct >= 0 ? "+" : ""}{item.changePct?.toFixed(2)}%
            </span>
          </div>
        ))}
        {items.length === 0 && <div className="text-muted-theme text-xs text-center py-4">No data</div>}
      </div>
    </div>
  );
}

function SectorHeatmapWidget() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API_BASE}/api/sectors/heatmap`).then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  return (
    <div className="p-3 h-full overflow-auto">
      <div className="grid grid-cols-3 gap-1.5">
        {data.slice(0, 12).map((s) => (
          <div
            key={s.sector}
            className="p-2 rounded text-center"
            style={{
              background: s.change >= 0 ? `rgba(34, 197, 94, ${Math.min(Math.abs(s.change) / 3, 0.4)})` : `rgba(239, 68, 68, ${Math.min(Math.abs(s.change) / 3, 0.4)})`,
            }}
          >
            <div className="text-[10px] font-medium text-primary-theme truncate">{s.sector.split("/")[0]}</div>
            <div className={`text-xs font-bold ${s.change >= 0 ? "text-green-theme" : "text-red-theme"}`}>
              {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketStatsWidget() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch(`${API_BASE}/api/market-summary`).then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data) return <div className="h-full flex items-center justify-center text-muted-theme text-sm">Loading...</div>;
  return (
    <div className="p-4 h-full flex flex-col justify-center gap-2">
      <div className="text-xs text-muted-theme">Total Companies: <span className="text-primary-theme font-semibold">{data.totalCompanies}</span></div>
      <div className="text-xs text-muted-theme">A/D Ratio: <span className="text-primary-theme font-semibold">{data.advance}/{data.decline}</span></div>
      <div className="text-xs text-muted-theme">Last Updated: <span className="text-primary-theme font-semibold">{data.latestDate}</span></div>
    </div>
  );
}

function RecentTradesWidget() {
  const [trades, setTrades] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API_BASE}/api/journal`).then((r) => r.json()).then((d) => setTrades(d.entries?.slice(0, 10) || [])).catch(() => {});
  }, []);
  return (
    <div className="p-3 h-full overflow-auto">
      <div className="space-y-1.5">
        {trades.map((t: any) => (
          <div key={t.id} className="flex items-center justify-between text-xs p-2 rounded bg-input-theme">
            <span className="font-semibold text-primary-theme">{t.symbol}</span>
            <span className={`font-medium ${t.type === "buy" ? "text-green-theme" : "text-red-theme"}`}>{t.type?.toUpperCase()}</span>
            <span className="font-mono text-primary-theme">{t.quantity} @ Rs {t.entryPrice}</span>
            <span className={`font-mono ${t.pnl >= 0 ? "text-green-theme" : "text-red-theme"}`}>{t.pnl >= 0 ? "+" : ""}{t.pnl}</span>
          </div>
        ))}
        {trades.length === 0 && <div className="text-muted-theme text-xs text-center py-4">No trades yet</div>}
      </div>
    </div>
  );
}

function WatchlistWidget() {
  const [watched, setWatched] = useState<string[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem("watchlist");
    if (saved) setWatched(JSON.parse(saved));
  }, []);
  return (
    <div className="p-3 h-full overflow-auto">
      <div className="space-y-1.5">
        {watched.map((sym) => (
          <div key={sym} className="flex items-center justify-between text-xs p-2 rounded bg-input-theme">
            <span className="font-semibold text-primary-theme">{sym}</span>
            <a href={`/company/${sym}`} className="text-accent-theme hover:underline">View</a>
          </div>
        ))}
        {watched.length === 0 && <div className="text-muted-theme text-xs text-center py-4">No watchlist items</div>}
      </div>
    </div>
  );
}

const WIDGET_COMPONENTS: Record<string, React.FC<any>> = {
  market_summary: MarketSummaryWidget,
  top_gainers: TopMoversWidget,
  top_losers: TopMoversWidget,
  most_active: TopMoversWidget,
  sector_heatmap: SectorHeatmapWidget,
  market_stats: MarketStatsWidget,
  recent_trades: RecentTradesWidget,
  watchlist_summary: WatchlistWidget,
};

export default function DashboardConfigPage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [editMode, setEditMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dashboard_layout");
    if (saved) {
      try { setWidgets(JSON.parse(saved)); } catch { setWidgets(DEFAULT_LAYOUT); }
    } else {
      setWidgets(DEFAULT_LAYOUT);
    }
  }, []);

  const saveLayout = useCallback(() => {
    localStorage.setItem("dashboard_layout", JSON.stringify(widgets));
    setEditMode(false);
  }, [widgets]);

  const resetLayout = useCallback(() => {
    setWidgets(DEFAULT_LAYOUT);
    localStorage.removeItem("dashboard_layout");
  }, []);

  const addWidget = useCallback((type: string) => {
    const widgetType = WIDGET_TYPES.find((w) => w.type === type);
    if (!widgetType) return;
    const newWidget: WidgetConfig = {
      id: `w_${Date.now()}`,
      type,
      title: widgetType.label,
      x: 0,
      y: Infinity,
      w: widgetType.defaultW,
      h: widgetType.defaultH,
    };
    setWidgets((prev) => [...prev, newWidget]);
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const onLayoutChange = useCallback(
    (newLayout: any[]) => {
      setWidgets((prev) =>
        prev.map((w) => {
          const match = newLayout.find((l: any) => l.i === w.id);
          if (match) return { ...w, x: match.x, y: match.y, w: match.w, h: match.h };
          return w;
        })
      );
    },
    []
  );

  const gridLayout = widgets.map((w) => ({
    i: w.id,
    x: w.x,
    y: w.y,
    w: w.w,
    h: w.h,
    minW: 3,
    minH: 2,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-theme tracking-tight">Custom Dashboard</h1>
          <p className="text-muted-theme text-sm mt-0.5">
            Drag, resize, and configure your widgets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <button onClick={saveLayout} className="btn-accent flex items-center gap-2 text-sm py-2 px-4">
                <Save className="h-4 w-4" /> Save Layout
              </button>
              <button onClick={resetLayout} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-theme bg-input-theme text-body-theme hover:bg-hover-theme text-sm">
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-theme bg-input-theme text-body-theme hover:bg-hover-theme text-sm">
              <Settings className="h-4 w-4" /> Edit Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Widget Palette */}
      {editMode && (
        <div className="card-3d p-4">
          <h3 className="text-sm font-semibold text-primary-theme mb-3">Add Widgets</h3>
          <div className="flex flex-wrap gap-2">
            {WIDGET_TYPES.map((wt) => (
              <button
                key={wt.type}
                onClick={() => addWidget(wt.type)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-input-theme border border-theme text-body-theme hover:bg-hover-theme hover:text-primary-theme text-xs font-medium transition-colors"
              >
                <Plus className="h-3 w-3" />
                {wt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      {mounted && WidthProviderGridLayout ? (
        <WidthProviderGridLayout
          className="layout"
          layouts={{ lg: gridLayout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
          rowHeight={60}
          isDraggable={editMode}
          isResizable={editMode}
          onLayoutChange={onLayoutChange}
          margin={[12, 12]}
          compactType="vertical"
          useCSSTransforms={true}
        >
          {widgets.map((widget) => {
            const WidgetComponent = WIDGET_COMPONENTS[widget.type];
            return (
              <div key={widget.id} className="card-3d overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-theme bg-table-header-theme">
                  <div className="flex items-center gap-2">
                    {editMode && <GripVertical className="h-3.5 w-3.5 text-muted-theme cursor-grab" />}
                    <span className="text-xs font-semibold text-primary-theme">{widget.title}</span>
                  </div>
                  {editMode && (
                    <button
                      onClick={() => removeWidget(widget.id)}
                      className="text-muted-theme hover:text-red-theme transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="h-full">
                  {WidgetComponent && <WidgetComponent type={widget.type} />}
                </div>
              </div>
            );
          })}
        </WidthProviderGridLayout>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((widget) => {
            const WidgetComponent = WIDGET_COMPONENTS[widget.type];
            return (
              <div key={widget.id} className="card-3d overflow-hidden">
                <div className="px-3 py-2 border-b border-theme bg-table-header-theme">
                  <span className="text-xs font-semibold text-primary-theme">{widget.title}</span>
                </div>
                <div className="min-h-[200px]">
                  {WidgetComponent && <WidgetComponent type={widget.type} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
