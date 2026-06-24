"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Search } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface MutualFund {
  symbol: string;
  name: string;
  category: string;
  nav: number;
  aum: number;
  expenseRatio: number;
  manager: string;
  dayChange: number;
  dayChangePct: number;
  ytdReturn: number;
  oneYearReturn: number;
}

export default function MutualFundsPage() {
  const [funds, setFunds] = useState<MutualFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/mutual-funds`)
      .then((r) => r.json())
      .then((d) => { setFunds(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = funds.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const formatAUM = (aum: number) => {
    if (aum >= 1e9) return `Rs ${(aum / 1e9).toFixed(1)}B`;
    if (aum >= 1e6) return `Rs ${(aum / 1e6).toFixed(0)}M`;
    return `Rs ${aum}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Mutual Funds</h1>
        <p className="text-muted-theme text-sm mt-0.5">NAV tracking, performance, and fund details</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
        <input
          type="text"
          placeholder="Search funds..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-accent-theme placeholder:text-placeholder"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-input-theme animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-muted-theme">No mutual funds found</div>
          )}
          {filtered.map((fund) => (
            <Link
              key={fund.symbol}
              href={`/mutual-funds/${fund.symbol}`}
              className="card-3d p-5 hover:border-accent-theme transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-primary-theme">{fund.name}</div>
                  <div className="text-xs text-muted-theme">{fund.symbol} · {fund.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-primary-theme">Rs {fund.nav ?? "—"}</div>
                  <div className={`text-xs font-bold flex items-center gap-1 justify-end ${(fund.dayChange ?? 0) >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                    {(fund.dayChange ?? 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {(fund.dayChange ?? 0) >= 0 ? "+" : ""}{fund.dayChangePct ?? 0}%
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div>
                  <div className="text-[10px] text-muted-theme">AUM</div>
                  <div className="text-xs font-mono text-primary-theme">{formatAUM(fund.aum)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-theme">YTD</div>
                  <div className={`text-xs font-mono ${(fund.ytdReturn ?? 0) >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                    {(fund.ytdReturn ?? 0) >= 0 ? "+" : ""}{fund.ytdReturn ?? "—"}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-theme">1Y Return</div>
                  <div className={`text-xs font-mono ${(fund.oneYearReturn ?? 0) >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                    {(fund.oneYearReturn ?? 0) >= 0 ? "+" : ""}{fund.oneYearReturn ?? "—"}%
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
