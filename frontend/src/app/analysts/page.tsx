"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Target, Users, BarChart3 } from "lucide-react";
import type { AnalystRatingsListResponse, AnalystRatingsResponse } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AnalystsPage() {
  const [data, setData] = useState<AnalystRatingsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [detail, setDetail] = useState<AnalystRatingsResponse | null>(null);
  const [filter, setFilter] = useState<"all" | "Buy" | "Hold" | "Sell">("all");

  useEffect(() => {
    fetch(`${API_BASE}/api/analyst-ratings`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedSymbol) {
      fetch(`${API_BASE}/api/analyst-ratings/${selectedSymbol}`)
        .then((r) => r.json())
        .then(setDetail);
    }
  }, [selectedSymbol]);

  const filtered = data?.ratings.filter((r) => {
    if (filter === "all") return true;
    return r.consensus === filter;
  }) || [];

  const getConsensusColor = (consensus: string) => {
    if (consensus === "Buy") return "bg-green-theme text-green-theme border-green-theme";
    if (consensus === "Sell") return "bg-red-theme text-red-theme border-red-theme";
    return "bg-amber-theme text-amber-theme border-amber-theme";
  };

  const getConsensusIcon = (consensus: string) => {
    if (consensus === "Buy") return <TrendingUp className="h-4 w-4" />;
    if (consensus === "Sell") return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getRatingColor = (rating: string) => {
    if (rating === "Strong Buy" || rating === "Buy") return "text-green-theme";
    if (rating === "Sell" || rating === "Strong Sell") return "text-red-theme";
    return "text-amber-theme";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Analyst Ratings</h1>
        <p className="text-muted-theme text-sm mt-0.5">Buy/hold/sell recommendations from research firms</p>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-3d p-4">
            <div className="text-xs text-muted-theme">Companies Covered</div>
            <div className="text-xl font-bold text-primary-theme font-mono">{data.summary.totalCompanies}</div>
          </div>
          <div className="card-3d p-4">
            <div className="text-xs text-muted-theme">Avg Buy %</div>
            <div className="text-xl font-bold text-green-theme font-mono">{data.summary.avgBuyPct}%</div>
          </div>
          <div className="card-3d p-4">
            <div className="text-xs text-muted-theme">Avg Hold %</div>
            <div className="text-xl font-bold text-amber-theme font-mono">{data.summary.avgHoldPct}%</div>
          </div>
          <div className="card-3d p-4">
            <div className="text-xs text-muted-theme">Avg Sell %</div>
            <div className="text-xl font-bold text-red-theme font-mono">{data.summary.avgSellPct}%</div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "Buy", "Hold", "Sell"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? f === "Buy" ? "bg-green-theme text-primary-theme" : f === "Sell" ? "bg-red-theme text-primary-theme" : f === "Hold" ? "bg-amber-theme text-primary-theme" : "bg-accent-theme text-primary-theme"
                : "bg-input-theme text-body-theme border border-theme hover:bg-hover-theme"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {/* Ratings Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-input-theme animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="card-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3">Company</th>
                  <th className="text-left px-4 py-3">Consensus</th>
                  <th className="text-center px-4 py-3">Buy</th>
                  <th className="text-center px-4 py-3">Hold</th>
                  <th className="text-center px-4 py-3">Sell</th>
                  <th className="text-right px-4 py-3">Avg Target</th>
                  <th className="text-center px-4 py-3">Analysts</th>
                  <th className="text-center px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.symbol} className="table-row">
                    <td className="px-4 py-3">
                      <a href={`/company/${r.symbol}`} className="font-bold text-primary-theme hover:text-accent-theme transition-colors">
                        {r.symbol}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${getConsensusColor(r.consensus)}`}>
                        {getConsensusIcon(r.consensus)}
                        {r.consensus}
                      </span>
                    </td>
                    <td className="text-center px-4 py-3 font-mono text-green-theme">{r.buyCount}</td>
                    <td className="text-center px-4 py-3 font-mono text-amber-theme">{r.holdCount}</td>
                    <td className="text-center px-4 py-3 font-mono text-red-theme">{r.sellCount}</td>
                    <td className="text-right px-4 py-3 font-mono text-primary-theme">Rs {r.avgTarget.toLocaleString()}</td>
                    <td className="text-center px-4 py-3 font-mono text-muted-theme">{r.totalAnalysts}</td>
                    <td className="text-center px-4 py-3">
                      <button
                        onClick={() => setSelectedSymbol(selectedSymbol === r.symbol ? null : r.symbol)}
                        className="text-accent-theme hover:text-accent-theme text-xs font-medium"
                      >
                        {selectedSymbol === r.symbol ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail View */}
      {detail && selectedSymbol && (
        <div className="card-3d p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary-theme">{detail.symbol} - Analyst Details</h2>
            <button onClick={() => setSelectedSymbol(null)} className="text-muted-theme hover:text-primary-theme text-sm">Close</button>
          </div>

          {/* Rating Distribution Bar */}
          <div className="flex gap-1 h-6 rounded-lg overflow-hidden">
            <div className="bg-green-theme flex items-center justify-center text-[10px] font-bold text-primary-theme" style={{ width: `${(detail.buyCount / detail.totalAnalysts) * 100}%` }}>
              {detail.buyCount}
            </div>
            <div className="bg-amber-theme flex items-center justify-center text-[10px] font-bold text-primary-theme" style={{ width: `${(detail.holdCount / detail.totalAnalysts) * 100}%` }}>
              {detail.holdCount}
            </div>
            <div className="bg-red-theme flex items-center justify-center text-[10px] font-bold text-primary-theme" style={{ width: `${(detail.sellCount / detail.totalAnalysts) * 100}%` }}>
              {detail.sellCount}
            </div>
          </div>

          {/* Individual Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {detail.ratings.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-input-theme border border-theme">
                <div>
                  <div className="font-semibold text-primary-theme text-sm">{r.analyst}</div>
                  <div className="text-xs text-muted-theme">{r.date}</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-sm ${getRatingColor(r.rating)}`}>{r.rating}</div>
                  <div className="text-xs text-muted-theme">
                    <Target className="inline h-3 w-3 mr-1" />
                    Rs {r.priceTarget.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
