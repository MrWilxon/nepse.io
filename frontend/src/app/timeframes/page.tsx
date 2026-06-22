"use client";

import { useEffect, useState } from "react";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function TimeframesPage() {
  const [symbol, setSymbol] = useState("NMB");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("daily");

  const fetchData = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/timeframes/${symbol}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const trendColor = (t: string) => t === "uptrend" ? "text-green-theme" : t === "downtrend" ? "text-red-theme" : "text-muted-theme";
  const trendBg = (t: string) => t === "uptrend" ? "bg-green-theme border-green-theme" : t === "downtrend" ? "bg-red-theme border-red-theme" : "bg-[#8892a0]/10 border-[#8892a0]/30";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Multi-Timeframe Analysis</h1>
        <p className="text-muted-theme text-sm mt-0.5">Analyze trends across daily, weekly, monthly, and quarterly timeframes</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
          <input type="text" placeholder="Symbol..." value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
            className="w-32 rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-[#D4A017]" />
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-accent-theme text-primary-theme text-sm font-medium hover:bg-accent-theme">Analyze</button>
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 rounded-xl bg-input-theme animate-pulse" />)}</div>
      ) : data ? (
        <>
          <div className="card-3d p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-primary-theme">{data.symbol}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-theme">Overall:</span>
                <span className={`text-sm font-bold capitalize ${trendColor(data.summary.overallTrend)}`}>{data.summary.overallTrend}</span>
              </div>
            </div>
            <p className="text-xs text-muted-theme">Timeframe Alignment: {data.summary.alignmentScore}% · Conflicts: {data.summary.conflicts.length}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(["daily", "weekly", "monthly", "quarterly"] as const).map((tf) => {
              const tfData = data.timeframes[tf];
              return (
                <button key={tf} onClick={() => setSelectedTimeframe(tf)}
                  className={`card-3d p-4 text-left transition-all ${selectedTimeframe === tf ? "ring-2 ring-accent-theme" : ""}`}>
                  <div className="text-xs text-muted-theme capitalize mb-1">{tf}</div>
                  <div className={`text-lg font-bold capitalize ${trendColor(tfData.trend)}`}>{tfData.trend}</div>
                  <div className="text-[10px] text-muted-theme">ADX: {tfData.adx} · Period: {tfData.period}</div>
                </button>
              );
            })}
          </div>

          {data.timeframes[selectedTimeframe] && (
            <div className="card-3d p-5">
              {(() => {
                const tfData = data.timeframes[selectedTimeframe];
                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-primary-theme capitalize">{selectedTimeframe} Analysis</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${trendBg(tfData.trend)} ${trendColor(tfData.trend)}`}>{tfData.trend}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-input-theme border border-theme">
                        <div className="text-[10px] text-muted-theme">SMA 20</div>
                        <div className="font-mono text-sm font-bold text-primary-theme">Rs {tfData.sma20.toFixed(1)}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-input-theme border border-theme">
                        <div className="text-[10px] text-muted-theme">SMA 50</div>
                        <div className="font-mono text-sm font-bold text-primary-theme">Rs {tfData.sma50.toFixed(1)}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-input-theme border border-theme">
                        <div className="text-[10px] text-muted-theme">RSI (14)</div>
                        <div className={`font-mono text-sm font-bold ${tfData.rsi > 70 ? "text-red-theme" : tfData.rsi < 30 ? "text-green-theme" : "text-primary-theme"}`}>{tfData.rsi.toFixed(1)}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-input-theme border border-theme">
                        <div className="text-[10px] text-muted-theme">ADTrend</div>
                        <div className={`font-mono text-sm font-bold ${tfData.adx >= 20 ? "text-accent-theme" : "text-muted-theme"}`}>{tfData.adx}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-input-theme border border-theme">
                        <div className="text-[10px] text-muted-theme">MACD Signal</div>
                        <div className={`font-mono text-sm font-bold ${tfData.macdCrossover > 0 ? "text-green-theme" : "text-red-theme"}`}>{tfData.macdCrossover > 0 ? "Bullish" : "Bearish"}</div>
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={tfData.data}>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8892a0", fontSize: 10 }} interval="preserveStartEnd" />
                          <YAxis domain={["auto", "auto"]} axisLine={false} tickLine={false} tick={{ fill: "#8892a0", fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: "#1a1a25", border: "1px solid #27272a", borderRadius: "0.75rem", color: "#f0f0f5", fontSize: 12 }} />
                          <ReferenceLine y={tfData.sma20} stroke="#D4A017" strokeDasharray="3 3" />
                          <ReferenceLine y={tfData.sma50} stroke="#2563eb" strokeDasharray="3 3" />
                          <Line type="monotone" dataKey="close" stroke="#f0f0f5" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {data.summary.conflicts.length > 0 && (
            <div className="card-3d p-5">
              <h3 className="text-sm font-semibold text-primary-theme mb-3">Timeframe Conflicts</h3>
              <div className="space-y-2">
                {data.summary.conflicts.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-input-theme border border-theme">
                    <span className="text-xs text-muted-theme capitalize">{c.timeframe}</span>
                    <span className={`text-xs font-bold capitalize ${trendColor(c.trend)}`}>{c.trend}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
