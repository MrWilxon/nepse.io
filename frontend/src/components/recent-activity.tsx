"use client";

import { useState, useEffect } from "react";
import { Activity, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "buy" | "sell" | "alert" | "milestone";
  symbol: string;
  detail: string;
  time: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: "1", type: "buy", symbol: "NABIL", detail: "Paper buy @ Rs 1,245", time: "2 min ago" },
  { id: "2", type: "alert", symbol: "Nepal Index", detail: "Broke above 2,600", time: "15 min ago" },
  { id: "3", type: "sell", symbol: "SCB", detail: "Paper sell @ Rs 892", time: "1 hr ago" },
  { id: "4", type: "milestone", symbol: "NRIC", detail: "Hit 52-week high", time: "3 hr ago" },
  { id: "5", type: "buy", symbol: "NICA", detail: "Bought 50 shares @ Rs 410", time: "Yesterday" },
  { id: "6", type: "alert", symbol: "AKPL", detail: "RSI below 30 — Oversold", time: "Yesterday" },
];

const typeConfig = {
  buy: { icon: ArrowUpRight, color: "text-green-theme", bg: "bg-green-theme" },
  sell: { icon: ArrowDownRight, color: "text-red-theme", bg: "bg-red-theme" },
  alert: { icon: Activity, color: "text-accent-theme", bg: "bg-accent-theme" },
  milestone: { icon: Activity, color: "text-blue-theme", bg: "bg-blue-theme" },
};

export default function RecentActivity() {
  const [items] = useState(MOCK_ACTIVITY);

  return (
    <div className="card-3d overflow-hidden">
      <div className="px-4 py-3 border-b border-theme flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-accent-theme" />
          <h3 className="text-xs font-bold text-primary-theme uppercase tracking-wider">Recent Activity</h3>
        </div>
        <span className="text-[10px] text-muted-theme">{items.length} events</span>
      </div>
      <div className="divide-y divide-[#27272a]">
        {items.map(item => {
          const cfg = typeConfig[item.type];
          const Icon = cfg.icon;
          return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-hover-theme transition-colors">
              <div className={`p-1.5 rounded-lg ${cfg.bg}`}>
                <Icon className={`h-3 w-3 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary-theme">{item.symbol}</span>
                  <span className={`text-[10px] font-medium ${cfg.color}`}>{item.type.toUpperCase()}</span>
                </div>
                <p className="text-[10px] text-muted-theme truncate">{item.detail}</p>
              </div>
              <span className="text-[10px] text-muted-theme whitespace-nowrap">{item.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
