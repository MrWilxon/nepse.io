"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowUpRight, ArrowDownRight, Minus, Wifi, WifiOff } from "lucide-react";
import { safeFetch, API_BASE } from "@/lib/api";

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

const FALLBACK_ITEMS: TickerItem[] = [
  { symbol: "NEPSE", price: 2634.52, change: 18.42, changePercent: 0.70, volume: 0 },
  { symbol: "NABIL", price: 1245.00, change: 12.50, changePercent: 1.01, volume: 0 },
  { symbol: "SCB", price: 892.00, change: -8.30, changePercent: -0.92, volume: 0 },
  { symbol: "NICA", price: 410.00, change: 3.10, changePercent: 0.76, volume: 0 },
  { symbol: "NRIC", price: 1085.00, change: 22.00, changePercent: 2.07, volume: 0 },
  { symbol: "SANIMA", price: 625.00, change: -4.20, changePercent: -0.67, volume: 0 },
  { symbol: "SBL", price: 352.00, change: 1.80, changePercent: 0.51, volume: 0 },
  { symbol: "NTC", price: 980.00, change: 15.00, changePercent: 1.55, volume: 0 },
  { symbol: "HEI", price: 1520.00, change: 8.00, changePercent: 0.53, volume: 0 },
  { symbol: "AKPL", price: 265.00, change: 4.50, changePercent: 1.73, volume: 0 },
];

const WS_BASE = API_BASE.replace(/^http/, "ws");

export default function PriceTicker() {
  const [items, setItems] = useState<TickerItem[]>(FALLBACK_ITEMS);
  const [connected, setConnected] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    safeFetch<any[]>(`${API_BASE}/api/companies`, []).then((data) => {
      const tickers = (Array.isArray(data) ? data : []).slice(0, 20).map((c: any) => ({
        symbol: c.symbol,
        price: c.ltp || c.latestClose || 0,
        change: c.change || c.percentChange || 0,
        changePercent: c.percentChange || 0,
        volume: c.volume || 0,
      }));
      if (tickers.length > 0) setItems(tickers);
    });

    const connect = () => {
      try {
        const ws = new WebSocket(`${WS_BASE}/ws`);
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);
        ws.onclose = () => {
          setConnected(false);
          reconnectRef.current = setTimeout(connect, 5000);
        };
        ws.onerror = () => ws.close();
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === "price_update" && msg.symbol) {
              setItems((prev) => {
                const idx = prev.findIndex((i) => i.symbol === msg.symbol);
                const updated = {
                  symbol: msg.symbol,
                  price: msg.price ?? prev[idx]?.price ?? 0,
                  change: msg.change ?? prev[idx]?.change ?? 0,
                  changePercent: msg.changePercent ?? prev[idx]?.changePercent ?? 0,
                  volume: msg.volume ?? prev[idx]?.volume ?? 0,
                };
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = updated;
                  return next;
                }
                return [...prev, updated];
              });
              setFlash(msg.symbol);
              setTimeout(() => setFlash(null), 600);
            }
          } catch {}
        };
      } catch {}
    };

    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, []);

  return (
    <div className="w-full bg-[#0a0a12] border-b border-theme overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center bg-gradient-to-r from-[#0a0a12] via-[#0a0a12] to-transparent px-3">
        <div className="flex items-center gap-1.5">
          {connected ? (
            <Wifi className="h-3 w-3 text-green-theme" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-theme" />
          )}
          <span className="text-[9px] font-bold text-accent-theme tracking-wider">LIVE</span>
        </div>
      </div>
      <div className="flex ticker-scroll pl-16">
        {[...items, ...items].map((item, i) => {
          const dir = item.change > 0 ? "up" : item.change < 0 ? "down" : "flat";
          return (
            <div
              key={`${item.symbol}-${i}`}
              className={`flex items-center gap-2.5 px-4 py-1.5 border-r border-theme/30 whitespace-nowrap transition-colors duration-300 ${
                flash === item.symbol ? "bg-accent-theme" : ""
              }`}
            >
              <span className="text-[10px] font-bold text-primary-theme">{item.symbol}</span>
              <span className="text-[10px] font-mono text-body-theme">
                {item.price.toLocaleString("en-NP", { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`text-[10px] font-mono font-medium flex items-center gap-0.5 ${
                  dir === "up" ? "text-green-theme" : dir === "down" ? "text-red-theme" : "text-muted-theme"
                }`}
              >
                {dir === "up" ? (
                  <ArrowUpRight className="h-2.5 w-2.5" />
                ) : dir === "down" ? (
                  <ArrowDownRight className="h-2.5 w-2.5" />
                ) : (
                  <Minus className="h-2.5 w-2.5" />
                )}
                {item.change >= 0 ? "+" : ""}
                {item.change.toFixed(2)}
              </span>
              <span
                className={`text-[10px] font-mono font-bold ${
                  dir === "up" ? "text-green-theme" : dir === "down" ? "text-red-theme" : "text-muted-theme"
                }`}
              >
                ({item.changePercent >= 0 ? "+" : ""}
                {item.changePercent.toFixed(2)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
