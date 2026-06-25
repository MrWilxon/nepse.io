"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, TrendingUp, TrendingDown, Trash2, ArrowLeft } from "lucide-react";
import { useWatchlist } from "@/lib/watchlist";
import { API_BASE } from "@/lib/api";

interface StockData {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  changePercent: number;
  volume: number;
}

export default function WatchlistPage() {
  const router = useRouter();
  const { watchlist, toggle, isWatched } = useWatchlist();
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (watchlist.length === 0) {
      setStocks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/api/companies`)
      .then((r) => r.json())
      .then((data) => {
        const filtered = data
          .filter((c: any) => watchlist.includes(c.symbol))
          .map((c: any) => ({
            symbol: c.symbol,
            name: c.name || c.companyName || c.symbol,
            ltp: parseFloat(c.ltp) || parseFloat(c.close) || 0,
            change: parseFloat(c.change) || 0,
            changePercent: parseFloat(c.changePercent || c.per_change) || 0,
            volume: parseInt(c.volume) || 0,
          }));
        setStocks(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [watchlist]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="rounded-lg border border-theme p-2 hover:bg-input-theme"
        >
          <ArrowLeft className="h-4 w-4 text-muted-theme" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary-theme">My Watchlist</h1>
          <p className="text-muted-theme text-sm">{watchlist.length} tracked stocks</p>
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div className="card-3d p-12 text-center">
          <Star className="h-12 w-12 text-muted-theme mx-auto mb-4" />
          <p className="text-primary-theme font-medium mb-2">No stocks tracked yet</p>
          <p className="text-muted-theme text-sm">Visit any company page and click the star button to add it here.</p>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: watchlist.length }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-input-theme animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="card-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-theme">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-theme uppercase">Symbol</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-theme uppercase">Company</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-theme uppercase">LTP</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-theme uppercase">Change</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-muted-theme uppercase">Volume</th>
                  <th className="text-center px-4 py-3 text-[10px] font-semibold text-muted-theme uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((s, i) => (
                  <tr
                    key={s.symbol}
                    className={`border-b border-theme/50 hover:bg-input-theme transition-colors cursor-pointer ${i % 2 === 0 ? "" : "bg-page/30"}`}
                    onClick={() => router.push(`/company/${s.symbol}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-primary-theme bg-kbd-theme px-2 py-0.5 rounded">{s.symbol}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-body-theme truncate max-w-[200px]">{s.name}</td>
                    <td className="px-4 py-3 text-xs text-primary-theme font-mono text-right font-semibold">
                      Rs. {s.ltp.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 text-xs font-mono font-medium ${s.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {s.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {s.change >= 0 ? "+" : ""}{s.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-theme font-mono text-right">{s.volume.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggle(s.symbol); }}
                        className="rounded p-1 hover:bg-red-500/10 text-muted-theme hover:text-red-500 transition-colors"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
