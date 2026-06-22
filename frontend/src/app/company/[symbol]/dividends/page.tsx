"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Gift,
  TrendingUp,
} from "lucide-react";
import type { DividendRecord, CompanyStats } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function DividendsPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params.symbol as string).toUpperCase();

  const [dividends, setDividends] = useState<DividendRecord[]>([]);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/dividends/${symbol}`).then((r) => r.json()),
      fetch(`${API_BASE}/api/companies/${symbol}/stats`).then((r) => r.json()),
    ]).then(([divData, statsData]) => {
      setDividends(divData.dividends || divData);
      setStats(statsData);
      setLoading(false);
    });
  }, [symbol]);

  const totalDividend = dividends.reduce((sum, d) => sum + d.amount, 0);
  const latestDividend = dividends[dividends.length - 1];
  const cashDividends = dividends.filter(
    (d) => d.type.toLowerCase().includes("cash")
  );
  const bonusDividends = dividends.filter(
    (d) => d.type.toLowerCase().includes("bonus")
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.push(`/company/${symbol}`)}
          className="mt-1 rounded-lg border border-[var(--border-primary)] p-2 hover:bg-[var(--bg-hover)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{symbol} Dividends</h1>
          <p className="text-[var(--text-muted)]">{stats?.category}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            <Gift className="h-3 w-3" />
            Total Dividends
          </div>
          <div className="mt-1 text-lg font-bold font-mono">
            Rs {totalDividend.toFixed(0)}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            <Calendar className="h-3 w-3" />
            Years with Dividends
          </div>
          <div className="mt-1 text-lg font-bold font-mono">
            {dividends.length}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            <DollarSign className="h-3 w-3" />
            Cash Dividends
          </div>
          <div className="mt-1 text-lg font-bold font-mono">
            {cashDividends.length}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            <TrendingUp className="h-3 w-3" />
            Bonus Issues
          </div>
          <div className="mt-1 text-lg font-bold font-mono">
            {bonusDividends.length}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[var(--text-muted)]">Loading...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-hover)] text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Amount (Rs)</th>
                <th className="px-4 py-3">Dividend %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {[...dividends]
                .reverse()
                .map((d) => (
                    <tr key={d.year} className="hover:bg-[var(--bg-hover)]">
                    <td className="px-4 py-3 font-medium">{d.year}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          d.type.toLowerCase().includes("cash")
                            ? "bg-[var(--green-bg)] text-[var(--green)]"
                            : d.type.toLowerCase().includes("bonus")
                              ? "bg-blue-100 text-blue-700"
                              : "bg-[var(--bg-input)] text-[var(--text-dim)]"
                        }`}
                      >
                        {d.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {d.amount > 0 ? `Rs ${d.amount.toLocaleString()}` : "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {d.amount > 0
                        ? `${((d.amount / (stats?.latestClose || 100)) * 100).toFixed(2)}%`
                        : "-"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
