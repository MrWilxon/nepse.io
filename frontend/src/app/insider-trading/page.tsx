"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Search, Filter } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface InsiderTransaction {
  id: number;
  symbol: string;
  insiderName: string;
  designation: string;
  transactionType: string;
  quantity: number;
  price: number;
  totalValue: number;
  date: string;
  holdingAfter: number;
  percentageHolding: number;
}

interface InsiderSummary {
  totalTransactions: number;
  totalBuyValue: number;
  totalSellValue: number;
  uniqueInsiders: number;
  uniqueCompanies: number;
}

export default function InsiderTradingPage() {
  const [transactions, setTransactions] = useState<InsiderTransaction[]>([]);
  const [summary, setSummary] = useState<InsiderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "buy" | "sell">("all");

  useEffect(() => {
    const url = filter === "all"
      ? `${API_BASE}/api/insider-trading`
      : `${API_BASE}/api/insider-trading?type=${filter}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setTransactions(d.transactions); setSummary(d.summary); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  const formatValue = (val: number) => {
    if (val >= 1e6) return `Rs ${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `Rs ${(val / 1e3).toFixed(0)}K`;
    return `Rs ${val}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Insider Trading Alerts</h1>
        <p className="text-muted-theme text-sm mt-0.5">Board and management transaction notifications</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card-3d p-4">
            <div className="text-xs text-muted-theme">Total Transactions</div>
            <div className="text-xl font-bold text-primary-theme font-mono">{summary.totalTransactions}</div>
          </div>
          <div className="card-3d p-4">
            <div className="text-xs text-muted-theme">Total Buy Value</div>
            <div className="text-xl font-bold text-green-theme font-mono">{formatValue(summary.totalBuyValue)}</div>
          </div>
          <div className="card-3d p-4">
            <div className="text-xs text-muted-theme">Total Sell Value</div>
            <div className="text-xl font-bold text-red-theme font-mono">{formatValue(summary.totalSellValue)}</div>
          </div>
          <div className="card-3d p-4">
            <div className="text-xs text-muted-theme">Unique Insiders</div>
            <div className="text-xl font-bold text-primary-theme font-mono">{summary.uniqueInsiders}</div>
          </div>
          <div className="card-3d p-4">
            <div className="text-xs text-muted-theme">Companies</div>
            <div className="text-xl font-bold text-primary-theme font-mono">{summary.uniqueCompanies}</div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {(["all", "buy", "sell"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? f === "buy" ? "bg-green-theme text-primary-theme" : f === "sell" ? "bg-red-theme text-primary-theme" : "bg-accent-theme text-primary-theme"
                : "bg-input-theme text-body-theme border border-theme hover:bg-hover-theme"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-input-theme animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.length === 0 && (
            <div className="text-center py-12 text-muted-theme">No insider trading data available</div>
          )}
          {transactions.map((t) => (
            <div key={t.id} className="card-3d p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    t.transactionType === "Buy" ? "bg-green-theme" : "bg-red-theme"
                  }`}>
                    {t.transactionType === "Buy"
                      ? <TrendingUp className="h-6 w-6 text-green-theme" />
                      : <TrendingDown className="h-6 w-6 text-red-theme" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary-theme">{t.insiderName}</span>
                      <span className="text-xs text-muted-theme">{t.designation}</span>
                    </div>
                    <div className="text-xs text-muted-theme mt-0.5">
                      {t.symbol} · {t.date} · Holding: {t.percentageHolding ?? "—"}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                    t.transactionType === "Buy"
                      ? "bg-green-theme text-green-theme"
                      : "bg-red-theme text-red-theme"
                  }`}>
                    {t.transactionType}
                  </div>
                  <div className="mt-1 font-mono text-sm text-primary-theme">
                    {(t.quantity ?? 0).toLocaleString()} @ Rs {t.price ?? "—"}
                  </div>
                  <div className="font-mono text-xs text-accent-theme font-bold">
                    {formatValue(t.totalValue ?? 0)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
