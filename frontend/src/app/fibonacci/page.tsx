"use client";

import { useEffect, useState } from "react";
import { Search, TrendingUp, TrendingDown } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function FibonacciPage() {
  const [symbol, setSymbol] = useState("NMB");
  const [period, setPeriod] = useState(180);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/fibonacci/${symbol}?period=${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const fibColors: Record<string, string> = {
    "0%": "#22c55e", "23.6%": "#D4A017", "38.2%": "#ef4444",
    "50%": "#8b5cf6", "61.8%": "#2563eb", "78.6%": "#06b6d4", "100%": "#22c55e",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Fibonacci Retracement</h1>
        <p className="text-muted-theme text-sm mt-0.5">Auto-detect support/resistance levels with Fibonacci ratios</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
          <input type="text" placeholder="Symbol..." value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
            className="w-32 rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-accent-theme" />
        </div>
        <select value={period} onChange={(e) => setPeriod(parseInt(e.target.value))}
          className="rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme">
          <option value={60}>60 Days</option>
          <option value={90}>90 Days</option>
          <option value={120}>120 Days</option>
          <option value={180}>180 Days</option>
          <option value={365}>1 Year</option>
        </select>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-accent-theme text-primary-theme text-sm font-medium hover:bg-accent-theme">Analyze</button>
      </div>

      {loading ? (
        <div className="h-96 rounded-xl bg-input-theme animate-pulse" />
      ) : data ? (
        <>
          <div className="card-3d p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-primary-theme">{data.symbol}</h2>
                <p className="text-xs text-muted-theme">Period: {data.period} days · Trend: <span className={data.trend === "uptrend" ? "text-green-theme" : "text-red-theme"}>{data.trend}</span></p>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-theme">Current Price</div>
                <div className="text-xl font-bold font-mono text-primary-theme">Rs {data.currentPrice}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-input-theme border border-theme">
                <div className="text-[10px] text-muted-theme">Swing High</div>
                <div className="text-sm font-mono font-bold text-green-theme">Rs {data.swingHigh.price}</div>
                <div className="text-[10px] text-muted-theme">{data.swingHigh.date}</div>
              </div>
              <div className="p-3 rounded-lg bg-input-theme border border-theme">
                <div className="text-[10px] text-muted-theme">Swing Low</div>
                <div className="text-sm font-mono font-bold text-red-theme">Rs {data.swingLow.price}</div>
                <div className="text-[10px] text-muted-theme">{data.swingLow.date}</div>
              </div>
              <div className="p-3 rounded-lg bg-input-theme border border-theme">
                <div className="text-[10px] text-muted-theme">Range</div>
                <div className="text-sm font-mono font-bold text-primary-theme">Rs {data.range}</div>
                <div className="text-[10px] text-muted-theme">{data.analysis.pricePosition} from low</div>
              </div>
            </div>
          </div>

          <div className="card-3d p-5">
            <h2 className="text-sm font-semibold text-primary-theme mb-4">Fibonacci Levels</h2>
            <div className="space-y-2">
              {data.levels.map((level: any) => (
                <div key={level.level} className={`flex items-center justify-between p-3 rounded-lg border ${level.isNear ? "bg-accent-theme/5 border-accent-theme" : "bg-input-theme border-theme"}`}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 rounded" style={{ backgroundColor: fibColors[level.level] || "#8892a0" }} />
                    <div>
                      <div className="text-xs font-bold" style={{ color: fibColors[level.level] || "#8892a0" }}>{level.level}</div>
                      <div className="text-[10px] text-muted-theme">{level.type} level</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-primary-theme">Rs {level.price}</div>
                    {level.isNear && <div className="text-[10px] text-accent-theme font-bold">NEAR CURRENT PRICE</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-3d p-5">
            <h2 className="text-sm font-semibold text-primary-theme mb-3">Analysis Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-green-theme border border-green-theme">
                <div className="text-xs text-green-theme font-bold mb-1">Nearest Support</div>
                <div className="font-mono font-bold text-primary-theme">Rs {data.analysis.nearestSupport.price}</div>
                <div className="text-[10px] text-muted-theme">{data.analysis.nearestSupport.level} level</div>
              </div>
              <div className="p-3 rounded-lg bg-red-theme border border-red-theme">
                <div className="text-xs text-red-theme font-bold mb-1">Nearest Resistance</div>
                <div className="font-mono font-bold text-primary-theme">Rs {data.analysis.nearestResistance.price}</div>
                <div className="text-[10px] text-muted-theme">{data.analysis.nearestResistance.level} level</div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
