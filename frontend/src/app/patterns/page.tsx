"use client";

import { useEffect, useState } from "react";
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function PatternsPage() {
  const [symbol, setSymbol] = useState("NMB");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/patterns/advanced/${symbol}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const severityIcon = (s: string) => {
    if (s === "high") return <TrendingUp className="h-4 w-4 text-green-theme" />;
    if (s === "medium") return <Minus className="h-4 w-4 text-accent-theme" />;
    return <TrendingDown className="h-4 w-4 text-red-theme" />;
  };
  const severityBg = (s: string) => s === "high" ? "bg-green-theme border-green-theme" : s === "medium" ? "bg-accent-theme border-accent-theme" : "bg-red-theme border-red-theme";
  const severityColor = (s: string) => s === "high" ? "text-green-theme" : s === "medium" ? "text-accent-theme" : "text-red-theme";
  const signalColor = (t: string) => t === "bullish" ? "text-green-theme" : t === "bearish" ? "text-red-theme" : "text-muted-theme";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Chart Patterns Library</h1>
        <p className="text-muted-theme text-sm mt-0.5">Automated pattern detection and breakout analysis</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
          <input type="text" placeholder="Symbol..." value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
            className="w-32 rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-[#D4A017]" />
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-accent-theme text-primary-theme text-sm font-medium hover:bg-accent-theme">Scan Patterns</button>
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 rounded-xl bg-input-theme animate-pulse" />)}</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="card-3d p-4">
              <div className="text-xs text-muted-theme">Total Patterns</div>
              <div className="text-2xl font-bold text-primary-theme">{data.summary.totalPatterns}</div>
            </div>
            <div className="card-3d p-4">
              <div className="text-xs text-muted-theme">Bullish</div>
              <div className="text-2xl font-bold text-green-theme">{data.summary.bullishCount}</div>
            </div>
            <div className="card-3d p-4">
              <div className="text-xs text-muted-theme">Bearish</div>
              <div className="text-2xl font-bold text-red-theme">{data.summary.bearishCount}</div>
            </div>
          </div>

          {data.summary.dominantPattern && (
            <div className="card-3d p-5">
              <h2 className="text-sm font-semibold text-primary-theme mb-2">Dominant Pattern</h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-primary-theme">{data.summary.dominantPattern}</div>
                  <div className="text-xs text-muted-theme capitalize">{data.summary.dominantSignal} bias · {data.summary.confidence}% confidence</div>
                </div>
                <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${data.summary.dominantSignal === "bullish" ? "bg-green-theme text-green-theme" : "bg-red-theme text-red-theme"}`}>
                  {data.summary.dominantSignal === "bullish" ? "BULLISH" : "BEARISH"}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {data.patterns.map((p: any, i: number) => (
              <div key={i} className={`card-3d p-5 border ${p.breakout ? "ring-1 ring-accent-theme" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-primary-theme">{p.name}</h3>
                      {p.breakout && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-theme text-accent-theme border border-accent-theme">BREAKOUT</span>}
                    </div>
                    <div className="text-xs text-muted-theme capitalize">{p.category.replace("_", " ")} · {p.type} · {p.confidence}% confidence</div>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${severityBg(p.severity)} ${severityColor(p.severity)}`}>
                    {p.severity}
                  </div>
                </div>
                <p className="text-xs text-body-theme mb-3">{p.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-2 rounded-lg bg-page">
                    <div className="text-[10px] text-muted-theme">Signal</div>
                    <div className={`text-sm font-bold capitalize ${signalColor(p.signal)}`}>{p.signal}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-page">
                    <div className="text-[10px] text-muted-theme">Target</div>
                    <div className="text-sm font-mono font-bold text-primary-theme">Rs {p.targetPrice}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-page">
                    <div className="text-[10px] text-muted-theme">Stop Loss</div>
                    <div className="text-sm font-mono font-bold text-red-theme">Rs {p.stopLoss}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-page">
                    <div className="text-[10px] text-muted-theme">Risk/Reward</div>
                    <div className="text-sm font-mono font-bold text-accent-theme">{p.riskReward}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-page">
                    <div className="text-[10px] text-muted-theme">Status</div>
                    <div className={`text-sm font-bold capitalize ${p.isActive ? "text-green-theme" : "text-muted-theme"}`}>{p.isActive ? "Active" : "Completed"}</div>
                  </div>
                </div>
                {p.keyPoints && p.keyPoints.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-theme">
                    <div className="text-[10px] text-muted-theme mb-1">Key Points</div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.keyPoints.map((pt: any, j: number) => (
                        <span key={j} className="text-[10px] px-2 py-0.5 rounded bg-kbd-theme text-body-theme">{pt}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
