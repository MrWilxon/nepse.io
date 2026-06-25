"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { API_BASE, type IPORecord } from "@/lib/api";

export default function IPOPage() {
  const [ipos, setIpos] = useState<IPORecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch(`${API_BASE}/api/ipo`)
      .then((r) => r.json())
      .then((data) => {
        setIpos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all"
      ? ipos
      : ipos.filter(
          (i) => i.status.toLowerCase() === filter.toLowerCase()
        );

  const listedCount = ipos.filter(
    (i) => i.status.toLowerCase() === "listed"
  ).length;
  const upcomingCount = ipos.filter(
    (i) => i.status.toLowerCase() === "upcoming"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">IPO / FPO</h1>
        <p className="text-[var(--text-muted)]">
          Initial and Follow-on Public Offerings on NEPSE
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
          <div className="text-xs font-medium text-[var(--text-muted)]">Total IPOs</div>
          <div className="mt-1 text-2xl font-bold">{ipos.length}</div>
        </div>
        <div className="rounded-xl border border-[var(--green-border)] bg-[var(--green-bg)] p-4">
          <div className="text-xs font-medium text-[var(--green)]">Listed</div>
          <div className="mt-1 text-2xl font-bold text-[var(--green)]">
            {listedCount}
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs font-medium text-amber-600">Upcoming</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">
            {upcomingCount}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {["all", "listed", "upcoming"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === f
                ? "bg-green-600 text-primary-theme"
                : "bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-dim)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-[var(--text-muted)]">Loading...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-hover)] text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Sector</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Issue Price</th>
                <th className="px-4 py-3">Open Date</th>
                <th className="px-4 py-3">Close Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Issue Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filtered.map((ipo) => (
                <tr
                  key={ipo.symbol}
                  className="cursor-pointer transition-colors hover:bg-[var(--bg-hover)]"
                  onClick={() =>
                    (window.location.href = `/company/${ipo.symbol}`)
                  }
                >
                  <td className="px-4 py-3 font-medium">{ipo.symbol}</td>
                  <td className="px-4 py-3 text-[var(--text-dim)] max-w-[200px] truncate">
                    {ipo.name}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                    {ipo.sector}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                    {ipo.type}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    Rs {ipo.issuePrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                    {ipo.openDate}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                    {ipo.closeDate}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        ipo.status.toLowerCase() === "listed"
                          ? "bg-[var(--green-bg)] text-[var(--green)]"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {ipo.status.toLowerCase() === "listed" ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {ipo.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                    {ipo.issueManager}
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
