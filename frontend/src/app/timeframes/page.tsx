"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { API_BASE } from "@/lib/api";

export default function TimeframesPage() {
  const [symbol, setSymbol] = useState("NMB");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("Daily");

  const fetchData = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/timeframes/${symbol}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const trendColor = (t: string) => t === "bullish" ? "text-[var(--green)]" : t === "bearish" ? "text-[var(--red)]" : "text-[var(--text-muted)]";
  const trendBg = (t: string) => t === "bullish" ? "border-[var(--green)]" : t === "bearish" ? "border-[var(--red)]" : "border-[var(--text-muted)]";

  const tfList = data?.timeframes ?? [];
  const tfMap: Record<string, any> = {};
  tfList.forEach((t: any) => { tfMap[t.timeframe] = t; });
  const tfKeys = tfList.map((t: any) => t.timeframe);
  const selected = tfMap[selectedTimeframe];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Multi-Timeframe Analysis</h1>
        <p className="text-[var(--text-muted)] text-sm mt-0.5">Analyze trends across daily, weekly, monthly, and quarterly timeframes</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" placeholder="Symbol..." value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
            className="w-32 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-hover)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-[var(--accent)] text-black text-sm font-medium hover:opacity-90">Analyze</button>
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 rounded-xl bg-[var(--bg-hover)] animate-pulse" />)}</div>
      ) : data ? (
        <>
          <div className="card-3d p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{data.symbol}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">Overall:</span>
                <span className={`text-sm font-bold capitalize ${trendColor(data.overall)}`}>{data.overall}</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)]">{data.alignment}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tfKeys.map((tf: string) => {
              const tfData = tfMap[tf];
              return (
                <button key={tf} onClick={() => setSelectedTimeframe(tf)}
                  className={`card-3d p-4 text-left transition-all ${selectedTimeframe === tf ? "ring-2 ring-[var(--accent)]" : ""}`}>
                  <div className="text-xs text-[var(--text-muted)] mb-1">{tf}</div>
                  <div className={`text-lg font-bold capitalize ${trendColor(tfData.trend)}`}>{tfData.trend}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">RSI: {tfData.rsi?.toFixed(1)} · MACD: {tfData.macdSignal}</div>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="card-3d p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{selectedTimeframe} Analysis</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${trendBg(selected.trend)} ${trendColor(selected.trend)}`}>{selected.trend}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-primary)]">
                  <div className="text-[10px] text-[var(--text-muted)]">Price</div>
                  <div className="font-mono text-sm font-bold text-[var(--text-primary)]">Rs {selected.price}</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-primary)]">
                  <div className="text-[10px] text-[var(--text-muted)]">SMA 20</div>
                  <div className="font-mono text-sm font-bold text-[var(--text-primary)]">Rs {selected.sma20?.toFixed(1)}</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-primary)]">
                  <div className="text-[10px] text-[var(--text-muted)]">SMA 50</div>
                  <div className="font-mono text-sm font-bold text-[var(--text-primary)]">Rs {selected.sma50?.toFixed(1)}</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-primary)]">
                  <div className="text-[10px] text-[var(--text-muted)]">RSI (14)</div>
                  <div className={`font-mono text-sm font-bold ${selected.rsi > 70 ? "text-[var(--red)]" : selected.rsi < 30 ? "text-[var(--green)]" : "text-[var(--text-primary)]"}`}>{selected.rsi?.toFixed(1)}</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-primary)]">
                  <div className="text-[10px] text-[var(--text-muted)]">MACD Signal</div>
                  <div className={`font-mono text-sm font-bold ${selected.macdSignal === "bullish" ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{selected.macdSignal}</div>
                </div>
              </div>
              {selected.signals && selected.signals.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border-primary)]">
                  <div className="text-[10px] text-[var(--text-muted)] mb-1">Signals</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.signals.map((s: string, i: number) => (
                      <span key={i} className={`text-[10px] px-2 py-0.5 rounded ${s === "bullish" ? "bg-[var(--green)]/10 text-[var(--green)]" : "bg-[var(--red)]/10 text-[var(--red)]"}`}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
