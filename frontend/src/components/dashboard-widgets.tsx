"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import {
  GripVertical,
  Eye,
  EyeOff,
  Settings,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Building2,
  Zap,
  Activity,
  Users,
  Bell,
  Clock,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Wallet,
  BookOpen,
  LineChart,
  BarChart3,
  RotateCcw,
  X,
  Sparkles,
  LayoutGrid,
  LayoutDashboard,
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
  { id: "snapshot", label: "Market Snapshot", enabled: true, order: 0 },
  { id: "quick-actions", label: "Quick Actions", enabled: true, order: 1 },
  { id: "breadth", label: "Market Breadth", enabled: true, order: 2 },
  { id: "sectors", label: "Sector Heatmap", enabled: true, order: 3 },
  { id: "hot", label: "Top Movers", enabled: true, order: 4 },
  { id: "events", label: "Upcoming Events", enabled: true, order: 5 },
  { id: "watchlist", label: "Watchlist", enabled: true, order: 6 },
  { id: "brokers-snapshot", label: "Top Brokers", enabled: true, order: 7 },
  { id: "news", label: "Market News", enabled: true, order: 8 },
  { id: "holidays", label: "Holiday Calendar", enabled: true, order: 9 },
  { id: "rotation", label: "Sector Rotation", enabled: true, order: 10 },
  { id: "floor-trades", label: "Recent Floor Trades", enabled: true, order: 11 },
  { id: "companies", label: "Company Directory", enabled: true, order: 12 },
];

export function useDashboardWidgets() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);

  useEffect(() => {
    const saved = localStorage.getItem("nepse_dashboard_widgets_v2");
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
    localStorage.setItem("nepse_dashboard_widgets_v2", JSON.stringify(next));
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

  const resetWidgets = () => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.removeItem("nepse_dashboard_widgets_v2");
  };

  const reorderWidgets = (fromIndex: number, toIndex: number) => {
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);
    const reordered = sorted.map((w, i) => ({ ...w, order: i }));
    setWidgets(reordered);
    localStorage.setItem("nepse_dashboard_widgets_v2", JSON.stringify(reordered));
  };

  const applyTemplate = (template: DashboardWidget[]) => {
    setWidgets(template);
    localStorage.setItem("nepse_dashboard_widgets_v2", JSON.stringify(template));
  };

  const enabled = widgets.filter((w) => w.enabled).sort((a, b) => a.order - b.order);
  return { widgets, enabled, toggleWidget, moveWidget, resetWidgets, reorderWidgets, applyTemplate };
}

export function WidgetSettings({
  widgets,
  toggleWidget,
  moveWidget,
  open,
  onClose,
  onReset,
  onReorder,
  onApplyTemplate,
}: {
  widgets: DashboardWidget[];
  toggleWidget: (id: string) => void;
  moveWidget: (id: string, dir: -1 | 1) => void;
  open: boolean;
  onClose: () => void;
  onReset: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onApplyTemplate?: (template: DashboardWidget[]) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const sorted = [...widgets].sort((a, b) => a.order - b.order);
  const enabledCount = widgets.filter((w) => w.enabled).length;

  // Layout templates
  const templates = [
    {
      name: "Default",
      description: "Balanced market overview",
      icon: LayoutDashboard,
      widgets: DEFAULT_WIDGETS,
    },
    {
      name: "Market Focus",
      description: "Chart and sectors front and center",
      icon: BarChart3,
      widgets: DEFAULT_WIDGETS.map((w) => {
        if (w.id === "breadth") return { ...w, enabled: true, order: 0 };
        if (w.id === "sectors") return { ...w, enabled: true, order: 1 };
        if (w.id === "snapshot") return { ...w, enabled: true, order: 2 };
        if (w.id === "hot") return { ...w, enabled: true, order: 3 };
        return { ...w, enabled: false };
      }),
    },
    {
      name: "Minimal",
      description: "Essentials only — clean and simple",
      icon: LayoutGrid,
      widgets: DEFAULT_WIDGETS.map((w) => {
        if (["overview", "snapshot", "quick-actions", "hot", "companies"].includes(w.id))
          return { ...w, enabled: true };
        return { ...w, enabled: false };
      }),
    },
  ];

  const handleDragStart = useCallback((id: string) => {
    setDraggedId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => {
      if (!draggedId || draggedId === targetId) {
        setDraggedId(null);
        setDragOverId(null);
        return;
      }
      const fromIdx = sorted.findIndex((w) => w.id === draggedId);
      const toIdx = sorted.findIndex((w) => w.id === targetId);
      if (fromIdx !== -1 && toIdx !== -1) {
        onReorder(fromIdx, toIdx);
      }
      setDraggedId(null);
      setDragOverId(null);
    },
    [draggedId, sorted, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-surface border-l border-theme shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-primary-theme">Customize Dashboard</h2>
            <p className="text-xs text-muted-theme mt-0.5">
              {enabledCount} of {widgets.length} visible · Drag to reorder
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-theme hover:text-primary-theme hover:bg-hover-theme transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Templates Bar */}
        <div className="px-5 py-3 border-b border-theme bg-input-theme/30 flex-shrink-0">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 text-xs font-medium text-accent-theme hover:text-[#E8B830] transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {showTemplates ? "Hide templates" : "Layout templates"}
          </button>
          {showTemplates && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {templates.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.name}
                    onClick={() => {
                      onApplyTemplate?.(t.widgets);
                      setShowTemplates(false);
                    }}
                    className="p-2.5 rounded-lg border border-theme bg-input-theme hover:bg-hover-theme hover:border-accent-theme/30 transition-all text-left"
                  >
                    <Icon className="h-4 w-4 text-accent-theme mb-1.5" />
                    <div className="text-[10px] font-semibold text-primary-theme">{t.name}</div>
                    <div className="text-[9px] text-muted-theme leading-tight">{t.description}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Widget List — Drag and Drop */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-2">
            {sorted.map((w, idx) => {
              const isDragging = draggedId === w.id;
              const isDragOver = dragOverId === w.id;

              return (
                <div
                  key={w.id}
                  draggable
                  onDragStart={() => handleDragStart(w.id)}
                  onDragOver={(e) => handleDragOver(e, w.id)}
                  onDrop={() => handleDrop(w.id)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                    isDragging
                      ? "opacity-40 scale-95 border-dashed border-accent-theme"
                      : isDragOver
                      ? "border-accent-theme bg-accent-theme/10 scale-[1.02]"
                      : w.enabled
                      ? "bg-accent-theme/5 border-accent-theme/20 hover:border-accent-theme/40"
                      : "bg-input-theme border-theme opacity-60 hover:opacity-80"
                  }`}
                >
                  {/* Drag Handle */}
                  <GripVertical className="h-4 w-4 text-muted-theme/50 flex-shrink-0" />

                  {/* Widget Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-primary-theme">{w.label}</div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWidget(w.id);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      w.enabled ? "bg-accent-theme" : "bg-hover-theme"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        w.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-theme flex-shrink-0">
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-theme bg-input-theme px-4 py-2.5 text-sm font-medium text-body-theme hover:bg-hover-theme transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </button>
        </div>
      </div>
    </>
  );
}

export function QuickActionsWidget() {
  const actions = [
    { href: "/screener", label: "Stock Screener", icon: Search, color: "text-blue-400", bg: "bg-blue-400/10" },
    { href: "/brokers", label: "Top Brokers", icon: Users, color: "text-purple-400", bg: "bg-purple-400/10" },
    { href: "/portfolio", label: "Portfolio", icon: Wallet, color: "text-green-400", bg: "bg-green-400/10" },
    { href: "/paper-trading", label: "Paper Trading", icon: Target, color: "text-orange-400", bg: "bg-orange-400/10" },
    { href: "/dividend-calendar", label: "Dividends", icon: Gift, color: "text-pink-400", bg: "bg-pink-400/10" },
    { href: "/watchlist", label: "Watchlist", icon: Star, color: "text-amber-400", bg: "bg-amber-400/10" },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {actions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-input-theme border border-theme hover:bg-hover-theme hover:border-accent-theme/30 transition-all group"
        >
          <div className={`p-2.5 rounded-xl ${a.bg} group-hover:scale-110 transition-transform`}>
            <a.icon className={`h-5 w-5 ${a.color}`} />
          </div>
          <span className="text-[11px] font-medium text-body-theme text-center leading-tight">{a.label}</span>
        </Link>
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
      try { setWatched(JSON.parse(raw)); } catch { /* ignore */ }
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
        <p className="text-xs text-muted-theme mt-1">Click the star on any stock to add</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-1.5">
      {watchedCompanies.slice(0, 6).map((c) => (
        <Link
          key={c.symbol}
          href={`/company/${c.symbol}`}
          className="flex items-center justify-between p-2.5 rounded-lg bg-input-theme border border-theme hover:bg-hover-theme transition-colors"
        >
          <div className="text-sm font-bold text-primary-theme">{c.symbol}</div>
          <div className="font-mono text-sm text-primary-theme">
            {c.latestClose !== null ? `Rs ${c.latestClose.toLocaleString()}` : "-"}
          </div>
        </Link>
      ))}
      {watched.length > 6 && (
        <Link href="/watchlist" className="block text-center text-xs text-accent-theme hover:underline pt-1">
          +{watched.length - 6} more
        </Link>
      )}
    </div>
  );
}

interface DividendEntry {
  symbol: string;
  type: string;
  amount: number;
  exDate: string;
  dividendYield: number;
}

interface IPOEntry {
  name: string;
  symbol?: string;
  priceRange: string;
  openDate: string;
  closeDate: string;
}

interface EarningsEntry {
  symbol: string;
  date: string;
  event: string;
  amount?: number;
}

export function EventsWidget() {
  const [activeTab, setActiveTab] = useState<"earnings" | "ipos" | "dividends">("dividends");
  const [dividends, setDividends] = useState<DividendEntry[]>([]);
  const [ipos, setIpos] = useState<IPOEntry[]>([]);
  const [earnings, setEarnings] = useState<EarningsEntry[]>([]);

  useEffect(() => {
    safeFetch<any>(`${API_BASE}/api/dividend-calendar?upcoming=true`, { calendar: [] })
      .then((d) => setDividends(Array.isArray(d?.calendar) ? d.calendar.slice(0, 6) : []))
      .catch(() => {});
    safeFetch<IPOEntry[]>(`${API_BASE}/api/ipo`, [])
      .then((d) => setIpos(Array.isArray(d) ? d.slice(0, 6) : []))
      .catch(() => {});
    safeFetch<EarningsEntry[]>(`${API_BASE}/api/earnings-calendar`, [])
      .then((d) => setEarnings(Array.isArray(d) ? d.slice(0, 6) : []))
      .catch(() => {});
  }, []);

  const tabs = [
    { id: "dividends" as const, label: "Dividends", count: dividends.length },
    { id: "ipos" as const, label: "IPOs", count: ipos.length },
    { id: "earnings" as const, label: "Earnings", count: earnings.length },
  ];

  return (
    <div>
      <div className="flex gap-1 px-4 pt-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === t.id
                ? "bg-accent-theme text-primary-theme"
                : "text-muted-theme hover:text-primary-theme hover:bg-hover-theme"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 text-[10px] opacity-70">{t.count}</span>
            )}
          </button>
        ))}
      </div>
      <div className="p-3 space-y-1.5">
        {activeTab === "dividends" && (
          <>
            {dividends.length === 0 && (
              <div className="text-center py-4 text-xs text-muted-theme">No upcoming dividends</div>
            )}
            {dividends.map((d, i) => (
              <div key={`${d.symbol}-${i}`} className="flex items-center justify-between p-2.5 rounded-lg bg-input-theme border border-theme">
                <div className="flex items-center gap-2.5">
                  <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    d.type === "cash" ? "bg-green-500/10 text-green-400" :
                    d.type === "bonus" ? "bg-blue-500/10 text-blue-400" :
                    "bg-purple-500/10 text-purple-400"
                  }`}>
                    {d.type.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-primary-theme">{d.symbol}</div>
                    <div className="text-[10px] text-muted-theme">Yield: {d.dividendYield}%</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-accent-theme">Rs {d.amount}</div>
                  <div className="text-[10px] text-muted-theme">{d.exDate}</div>
                </div>
              </div>
            ))}
          </>
        )}
        {activeTab === "ipos" && (
          <>
            {ipos.length === 0 && (
              <div className="text-center py-4 text-xs text-muted-theme">No upcoming IPOs</div>
            )}
            {ipos.map((ipo, i) => (
              <div key={ipo.name + i} className="flex items-center justify-between p-2.5 rounded-lg bg-input-theme border border-theme">
                <div>
                  <div className="text-xs font-bold text-primary-theme">{ipo.name}</div>
                  <div className="text-[10px] text-muted-theme">{ipo.symbol || "New listing"}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-primary-theme">{ipo.priceRange}</div>
                  <div className="text-[10px] text-muted-theme">{ipo.openDate}</div>
                </div>
              </div>
            ))}
          </>
        )}
        {activeTab === "earnings" && (
          <>
            {earnings.length === 0 && (
              <div className="text-center py-4 text-xs text-muted-theme">No upcoming earnings</div>
            )}
            {earnings.map((e, i) => (
              <div key={`${e.symbol}-${i}`} className="flex items-center justify-between p-2.5 rounded-lg bg-input-theme border border-theme">
                <div>
                  <div className="text-xs font-bold text-primary-theme">{e.symbol}</div>
                  <div className="text-[10px] text-muted-theme">{e.event}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-primary-theme">{e.date}</div>
                  {e.amount !== undefined && (
                    <div className="text-[10px] text-accent-theme font-mono">Rs {e.amount.toLocaleString()}</div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

interface BrokerSnapshot {
  brokerNo: number;
  turnover: number;
  buyAmt: number;
  sellAmt: number;
  netDirection: string;
}

export function TopBrokersWidget() {
  const [brokers, setBrokers] = useState<BrokerSnapshot[]>([]);

  useEffect(() => {
    safeFetch<any>(`${API_BASE}/api/brokers`, { brokers: [] })
      .then((d) => {
        const list = Array.isArray(d?.brokers) ? d.brokers : Array.isArray(d) ? d : [];
        setBrokers(list.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  if (brokers.length === 0) {
    return (
      <div className="p-6 text-center">
        <Users className="h-8 w-8 text-muted-theme mx-auto mb-2" />
        <p className="text-sm text-muted-theme">No broker data</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-1.5">
      {brokers.map((b) => (
        <Link
          key={b.brokerNo}
          href={`/brokers`}
          className="flex items-center justify-between p-2.5 rounded-lg bg-input-theme border border-theme hover:bg-hover-theme transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-theme/10 text-[10px] font-bold text-accent-theme">
              {b.brokerNo}
            </div>
            <div>
              <div className="text-xs font-bold text-primary-theme">Broker {b.brokerNo}</div>
              <div className={`text-[10px] font-medium ${
                b.netDirection === "net_buy" ? "text-green-400" : b.netDirection === "net_sell" ? "text-red-400" : "text-muted-theme"
              }`}>
                {b.netDirection === "net_buy" ? "Net Buyer" : b.netDirection === "net_sell" ? "Net Seller" : "Neutral"}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono text-primary-theme">Rs {(b.turnover / 1_000_000).toFixed(0)}M</div>
          </div>
        </Link>
      ))}
      <Link href="/brokers" className="block text-center text-xs text-accent-theme hover:underline pt-1">
        View all brokers →
      </Link>
    </div>
  );
}

interface Announcement {
  id: string;
  title: string;
  date: string;
  type: string;
  symbol?: string;
}

export function MarketNewsWidget() {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    safeFetch<any>(`${API_BASE}/api/announcements?limit=6`, { announcements: [] })
      .then((d) => setItems(Array.isArray(d?.announcements) ? d.announcements.slice(0, 5) : []))
      .catch(() => {});
  }, []);

  if (items.length === 0) {
    return (
      <div className="p-6 text-center">
        <Bell className="h-8 w-8 text-muted-theme mx-auto mb-2" />
        <p className="text-sm text-muted-theme">No recent news</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-1.5">
      {items.map((item, i) => (
        <div
          key={item.id || i}
          className="p-2.5 rounded-lg bg-input-theme border border-theme"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-medium text-primary-theme line-clamp-2">{item.title}</div>
              {item.symbol && (
                <span className="text-[10px] text-accent-theme font-medium">{item.symbol}</span>
              )}
            </div>
            <span className="text-[10px] text-muted-theme whitespace-nowrap">{item.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

interface Holiday {
  title: string;
  date: string;
  day?: string;
}

export function HolidayCalendarWidget() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    safeFetch<any>(`${API_BASE}/api/holidays`, { upcoming: [] })
      .then((d) => setHolidays(Array.isArray(d?.upcoming) ? d.upcoming.slice(0, 3) : []))
      .catch(() => {});
  }, []);

  const getNextHoliday = () => {
    if (holidays.length === 0) return null;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const next = holidays.find((h) => h.date >= todayStr);
    if (!next) return null;
    const holidayDate = new Date(next.date);
    const diffMs = holidayDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return { ...next, daysUntil: diffDays };
  };

  const next = getNextHoliday();

  return (
    <div className="p-3 space-y-3">
      {next && (
        <div className="p-3 rounded-xl bg-accent-theme/5 border border-accent-theme/20">
          <div className="text-[10px] text-accent-theme font-semibold uppercase tracking-wider mb-1">Next Holiday</div>
          <div className="text-sm font-bold text-primary-theme">{next.title}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-theme">{next.date} {next.day && `(${next.day})`}</span>
            <span className="text-xs font-bold text-accent-theme">{next.daysUntil}d away</span>
          </div>
        </div>
      )}
      {holidays.length > 1 && (
        <div className="space-y-1.5">
          {holidays.slice(1).map((h, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-input-theme border border-theme">
              <div className="text-xs text-primary-theme">{h.title}</div>
              <div className="text-[10px] text-muted-theme">{h.date}</div>
            </div>
          ))}
        </div>
      )}
      {holidays.length === 0 && (
        <div className="text-center py-4 text-xs text-muted-theme">No holidays data</div>
      )}
    </div>
  );
}

interface RotationSector {
  sector: string;
  avgReturn: number;
  momentum: string;
  rank: number;
  companyCount: number;
}

export function SectorRotationWidget() {
  const [data, setData] = useState<RotationSector[]>([]);

  useEffect(() => {
    safeFetch<any>(`${API_BASE}/api/sectors/rotation?days=7`, { sectors: [] })
      .then((d) => setData(Array.isArray(d?.sectors) ? d.sectors.slice(0, 10) : []))
      .catch(() => {});
  }, []);

  if (data.length === 0) {
    return (
      <div className="p-6 text-center">
        <Activity className="h-8 w-8 text-muted-theme mx-auto mb-2" />
        <p className="text-sm text-muted-theme">No rotation data</p>
      </div>
    );
  }

  const mid = Math.ceil(data.length / 2);
  const leading = data.slice(0, mid);
  const lagging = data.slice(mid);

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="h-3.5 w-3.5 text-green-400" />
            <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Leading</span>
          </div>
          <div className="space-y-1.5">
            {leading.map((s) => (
              <div key={s.sector} className="flex items-center justify-between p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                <div>
                  <div className="text-xs font-medium text-primary-theme truncate">{s.sector}</div>
                  <div className="text-[10px] text-muted-theme">{s.companyCount} stocks</div>
                </div>
                <span className="text-xs font-bold text-green-400 font-mono">
                  +{s.avgReturn.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingDown className="h-3.5 w-3.5 text-red-400" />
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Lagging</span>
          </div>
          <div className="space-y-1.5">
            {lagging.map((s) => (
              <div key={s.sector} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                <div>
                  <div className="text-xs font-medium text-primary-theme truncate">{s.sector}</div>
                  <div className="text-[10px] text-muted-theme">{s.companyCount} stocks</div>
                </div>
                <span className={`text-xs font-bold font-mono ${s.avgReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {s.avgReturn >= 0 ? "+" : ""}{s.avgReturn.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FloorTrade {
  sn: string;
  contractNo: string;
  symbol: string;
  quantity: number;
  rate: number;
  amount: number;
}

export function FloorTradesWidget() {
  const [trades, setTrades] = useState<FloorTrade[]>([]);

  useEffect(() => {
    safeFetch<any>(`${API_BASE}/api/floorsheet?limit=8`, { records: [] })
      .then((d) => setTrades(Array.isArray(d?.records) ? d.records.slice(0, 8) : []))
      .catch(() => {});
  }, []);

  if (trades.length === 0) {
    return (
      <div className="p-6 text-center">
        <BarChart3 className="h-8 w-8 text-muted-theme mx-auto mb-2" />
        <p className="text-sm text-muted-theme">No floor trades available</p>
        <p className="text-[10px] text-muted-theme mt-1">Data updates during market hours</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="overflow-hidden rounded-lg border border-theme">
        <table className="w-full text-xs">
          <thead>
            <tr className="table-header">
              <th className="px-2.5 py-2 text-left">Symbol</th>
              <th className="px-2.5 py-2 text-right">Qty</th>
              <th className="px-2.5 py-2 text-right">Rate</th>
              <th className="px-2.5 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr key={t.contractNo || i} className="table-row">
                <td className="px-2.5 py-2 font-semibold text-primary-theme">{t.symbol}</td>
                <td className="px-2.5 py-2 text-right font-mono text-body-theme">{t.quantity?.toLocaleString()}</td>
                <td className="px-2.5 py-2 text-right font-mono text-body-theme">Rs {t.rate?.toLocaleString()}</td>
                <td className="px-2.5 py-2 text-right font-mono text-body-theme">Rs {(t.amount / 1_000_000).toFixed(1)}M</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href="/floorsheet" className="block text-center text-xs text-accent-theme hover:underline mt-2">
        View full floor sheet →
      </Link>
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
      try { setWatched(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  const toggleWatch = (symbol: string) => {
    setWatched((prev) => {
      const next = prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol];
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
  const paginated = filtered.slice((page - 1) * COMPANY_PAGE_SIZE, page * COMPANY_PAGE_SIZE);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-theme">{filtered.length} companies</p>
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
                        onClick={(e) => { e.stopPropagation(); toggleWatch(c.symbol); }}
                        className="text-muted-theme hover:text-[#f59e0b] transition-colors"
                      >
                        <Star className={`h-4 w-4 ${watched.includes(c.symbol) ? "fill-[#f59e0b] text-[#f59e0b]" : ""}`} />
                      </button>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-primary-theme">{c.symbol}</td>
                    <td className="px-3 py-2.5 text-body-theme">{c.category}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-primary-theme">
                      {c.latestClose !== null ? `Rs ${c.latestClose.toLocaleString()}` : "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-theme">{c.latestDate || "-"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-theme">No companies found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-muted-theme">
                {(page - 1) * COMPANY_PAGE_SIZE + 1}–{Math.min(page * COMPANY_PAGE_SIZE, filtered.length)} of {filtered.length}
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
