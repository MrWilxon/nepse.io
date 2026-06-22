"use client";

import { useState, useEffect } from "react";
import { GripVertical, Eye, EyeOff, Settings } from "lucide-react";

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
];

export function useDashboardWidgets() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);

  useEffect(() => {
    const saved = localStorage.getItem("nepse_dashboard_widgets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = DEFAULT_WIDGETS.map(dw => {
          const s = parsed.find((p: DashboardWidget) => p.id === dw.id);
          return s ? { ...dw, enabled: s.enabled, order: s.order } : dw;
        });
        setWidgets(merged.sort((a, b) => a.order - b.order));
      } catch { /* use defaults */ }
    }
  }, []);

  const save = (next: DashboardWidget[]) => {
    setWidgets(next);
    localStorage.setItem("nepse_dashboard_widgets", JSON.stringify(next));
  };

  const toggleWidget = (id: string) => save(widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));

  const moveWidget = (id: string, dir: -1 | 1) => {
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(w => w.id === id);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === sorted.length - 1)) return;
    const swap = sorted[idx + dir];
    sorted[idx] = { ...sorted[idx], order: swap.order };
    swap.order = idx === 0 ? 0 : sorted[idx].order;
    save([...sorted]);
  };

  const enabled = widgets.filter(w => w.enabled).sort((a, b) => a.order - b.order);
  return { widgets, enabled, toggleWidget, moveWidget };
}

export function WidgetSettings({ widgets, toggleWidget, moveWidget }: {
  widgets: DashboardWidget[];
  toggleWidget: (id: string) => void;
  moveWidget: (id: string, dir: -1 | 1) => void;
}) {
  return (
    <div className="card-3d p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="h-3.5 w-3.5 text-accent-theme" />
        <h3 className="text-xs font-bold text-primary-theme uppercase tracking-wider">Dashboard Widgets</h3>
      </div>
      {[...widgets].sort((a, b) => a.order - b.order).map((w, i) => (
        <div key={w.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-hover-theme group">
          <GripVertical className="h-3.5 w-3.5 text-muted-theme opacity-0 group-hover:opacity-100 transition-opacity" />
          <button onClick={() => moveWidget(w.id, -1)} className="text-[10px] text-muted-theme hover:text-primary-theme disabled:opacity-30" disabled={i === 0}>▲</button>
          <button onClick={() => moveWidget(w.id, 1)} className="text-[10px] text-muted-theme hover:text-primary-theme disabled:opacity-30" disabled={i === widgets.length - 1}>▼</button>
          <span className="flex-1 text-xs text-body-theme">{w.label}</span>
          <button onClick={() => toggleWidget(w.id)}>
            {w.enabled ? <Eye className="h-3.5 w-3.5 text-accent-theme" /> : <EyeOff className="h-3.5 w-3.5 text-muted-theme" />}
          </button>
        </div>
      ))}
    </div>
  );
}
