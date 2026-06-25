"use client";

import { useEffect, useState } from "react";
import { Search, ArrowDown, ArrowUp } from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function OrderBookPage() {
  const [symbol, setSymbol] = useState("NMB");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchBook = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/order-book/${symbol}`).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchBook(); }, []);

  if (loading) return <div className="h-96 rounded-xl bg-input-theme animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Order Book Depth</h1>
        <p className="text-muted-theme text-sm mt-0.5">Real-time bid/ask spread and volume distribution</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
          <input type="text" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && fetchBook()}
            className="w-32 rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-[#D4A017]" />
        </div>
        <button onClick={fetchBook} className="px-4 py-2 rounded-lg bg-[#D4A017] text-primary-theme text-sm font-medium hover:bg-accent-theme">Load</button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card-3d p-4">
              <div className="text-[10px] text-muted-theme">Last Price</div>
              <div className="text-xl font-bold text-primary-theme font-mono">Rs {data.lastPrice}</div>
            </div>
            <div className="card-3d p-4">
              <div className="text-[10px] text-muted-theme">Spread</div>
              <div className="text-xl font-bold text-accent-theme font-mono">Rs {data.spread.absolute} ({data.spread.percent}%)</div>
            </div>
            <div className="card-3d p-4">
              <div className="text-[10px] text-muted-theme">Bid/Ask Imbalance</div>
              <div className={`text-xl font-bold font-mono ${data.summary.imbalance > 0 ? "text-green-theme" : "text-red-theme"}`}>
                {data.summary.imbalance > 0 ? "+" : ""}{data.summary.imbalance}%
              </div>
            </div>
          </div>

          {/* Depth Visualization */}
          <div className="card-3d p-5">
            <h2 className="text-sm font-semibold text-primary-theme mb-4">Order Depth</h2>
            <div className="space-y-1">
              {[...data.asks].reverse().map((ask: any, i: number) => {
                const maxVol = Math.max(...data.asks.map((a: any) => a.volume), ...data.bids.map((b: any) => b.volume));
                const barW = (ask.volume / maxVol) * 100;
                return (
                  <div key={`ask-${i}`} className="flex items-center gap-2 text-xs">
                    <div className="w-20 text-right font-mono text-red-theme">Rs {ask.price.toFixed(2)}</div>
                    <div className="flex-1 h-5 bg-page rounded overflow-hidden">
                      <div className="h-full bg-[#ef4444]/30 rounded" style={{ width: `${barW}%` }} />
                    </div>
                    <div className="w-16 text-right font-mono text-red-theme">{ask.volume.toLocaleString()}</div>
                    <div className="w-20 text-right font-mono text-muted-theme">{ask.total.toLocaleString()}</div>
                  </div>
                );
              })}
              <div className="flex items-center justify-center py-2 my-1 border-y border-accent-theme bg-[#D4A017]/5 rounded">
                <span className="text-xs font-bold text-accent-theme">Rs {data.lastPrice} — SPREAD Rs {data.spread.absolute}</span>
              </div>
              {data.bids.map((bid: any, i: number) => {
                const maxVol = Math.max(...data.asks.map((a: any) => a.volume), ...data.bids.map((b: any) => b.volume));
                const barW = (bid.volume / maxVol) * 100;
                return (
                  <div key={`bid-${i}`} className="flex items-center gap-2 text-xs">
                    <div className="w-20 text-right font-mono text-green-theme">Rs {bid.price.toFixed(2)}</div>
                    <div className="flex-1 h-5 bg-page rounded overflow-hidden">
                      <div className="h-full bg-[#22c55e]/30 rounded" style={{ width: `${barW}%` }} />
                    </div>
                    <div className="w-16 text-right font-mono text-green-theme">{bid.volume.toLocaleString()}</div>
                    <div className="w-20 text-right font-mono text-muted-theme">{bid.total.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-theme">
              <span className="text-[10px] text-muted-theme">Price</span>
              <span className="text-[10px] text-muted-theme ml-auto">Vol</span>
              <span className="text-[10px] text-muted-theme w-20 text-right">Cumul.</span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-3d p-4">
              <div className="text-[10px] text-muted-theme">Total Bid Volume</div>
              <div className="text-lg font-bold text-green-theme font-mono">{data.summary.totalBidVol.toLocaleString()}</div>
            </div>
            <div className="card-3d p-4">
              <div className="text-[10px] text-muted-theme">Total Ask Volume</div>
              <div className="text-lg font-bold text-red-theme font-mono">{data.summary.totalAskVol.toLocaleString()}</div>
            </div>
            <div className="card-3d p-4">
              <div className="text-[10px] text-muted-theme">Bid/Ask Ratio</div>
              <div className={`text-lg font-bold font-mono ${data.summary.bidAskRatio > 1 ? "text-green-theme" : "text-red-theme"}`}>
                {data.summary.bidAskRatio}
              </div>
            </div>
            <div className="card-3d p-4">
              <div className="text-[10px] text-muted-theme">Market Pressure</div>
              <div className={`text-lg font-bold flex items-center gap-1 ${data.summary.imbalance > 0 ? "text-green-theme" : "text-red-theme"}`}>
                {data.summary.imbalance > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {data.summary.imbalance > 0 ? "Buyers" : "Sellers"}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
