"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, LineChart, Line } from "recharts";
import { Building2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface FlowData {
  date: string;
  fii: number;
  dii: number;
  retail: number;
  total: number;
}

interface HoldingData {
  symbol: string;
  name: string;
  fiiShares: number;
  diiShares: number;
  fiiPercent: number;
  diiPercent: number;
  change: number;
}

export default function InstitutionalPage() {
  const [flows, setFlows] = useState<FlowData[]>([]);
  const [holdings, setHoldings] = useState<HoldingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("1M");

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/institutional-flow`).then((r) => r.json()).catch(() => []),
      fetch(`${API_BASE}/api/holdings`).then((r) => r.json()).catch(() => []),
    ]).then(([flowData, holdingsData]) => {
      if (flowData.length > 0) {
        setFlows(flowData);
      } else {
        const mockFlows: FlowData[] = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return {
            date: date.toISOString().split("T")[0],
            fii: Math.round((Math.random() - 0.4) * 5000000000),
            dii: Math.round((Math.random() - 0.3) * 8000000000),
            retail: Math.round((Math.random() - 0.5) * 3000000000),
            total: 0,
          };
        });
        mockFlows.forEach((f) => { f.total = f.fii + f.dii + f.retail; });
        setFlows(mockFlows);
      }

      if (holdingsData.length > 0) {
        setHoldings(holdingsData.slice(0, 20));
      } else {
        const mockHoldings: HoldingData[] = [
          { symbol: "NABIL", name: "Nabil Bank", fiiShares: 1500000, diiShares: 3200000, fiiPercent: 12.5, diiPercent: 26.7, change: 2.3 },
          { symbol: "SCB", name: "Standard Chartered", fiiShares: 2800000, diiShares: 1500000, fiiPercent: 28.0, diiPercent: 15.0, change: -1.2 },
          { symbol: "EBL", name: "Everest Bank", fiiShares: 1200000, diiShares: 2100000, fiiPercent: 10.0, diiPercent: 17.5, change: 3.1 },
          { symbol: "NICA", name: "NICA", fiiShares: 800000, diiShares: 1800000, fiiPercent: 6.7, diiPercent: 15.0, change: -0.8 },
          { symbol: "SANIMA", name: "Sanima Bank", fiiShares: 950000, diiShares: 1100000, fiiPercent: 9.5, diiPercent: 11.0, change: 1.5 },
        ];
        setHoldings(mockHoldings);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredFlows = useMemo(() => {
    const days = period === "1W" ? 7 : period === "1M" ? 30 : period === "3M" ? 90 : 365;
    return flows.slice(-days);
  }, [flows, period]);

  const totalFII = filteredFlows.reduce((s, f) => s + f.fii, 0);
  const totalDII = filteredFlows.reduce((s, f) => s + f.dii, 0);
  const totalRetail = filteredFlows.reduce((s, f) => s + f.retail, 0);

  const chartData = filteredFlows.map((f) => ({
    date: new Date(f.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    FII: Number((f.fii / 1e9).toFixed(2)),
    DII: Number((f.dii / 1e9).toFixed(2)),
    Retail: Number((f.retail / 1e9).toFixed(2)),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Institutional Flow</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Track FII, DII, and retail investor activity</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="card-3d p-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-[10px] text-[var(--text-muted)]">FII Net Flow</span>
          </div>
          <div className={`mt-1 text-lg font-bold font-mono ${totalFII >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
            {totalFII >= 0 ? "+" : ""}{(totalFII / 1e9).toFixed(2)}B
          </div>
          <div className="mt-1 text-[10px] text-[var(--text-dim)]">
            {period} net investment
          </div>
        </div>
        <div className="card-3d p-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[var(--blue)]" />
            <span className="text-[10px] text-[var(--text-muted)]">DII Net Flow</span>
          </div>
          <div className={`mt-1 text-lg font-bold font-mono ${totalDII >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
            {totalDII >= 0 ? "+" : ""}{(totalDII / 1e9).toFixed(2)}B
          </div>
          <div className="mt-1 text-[10px] text-[var(--text-dim)]">
            {period} net investment
          </div>
        </div>
        <div className="card-3d p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--green)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Retail Net Flow</span>
          </div>
          <div className={`mt-1 text-lg font-bold font-mono ${totalRetail >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
            {totalRetail >= 0 ? "+" : ""}{(totalRetail / 1e9).toFixed(2)}B
          </div>
          <div className="mt-1 text-[10px] text-[var(--text-dim)]">
            {period} net investment
          </div>
        </div>
        <div className="card-3d p-5">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-[var(--green)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Net Sentiment</span>
          </div>
          <div className={`mt-1 text-lg font-bold ${totalFII + totalDII >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
            {totalFII + totalDII >= 0 ? "Bullish" : "Bearish"}
          </div>
          <div className="mt-1 text-[10px] text-[var(--text-dim)]">
            Based on institutional flow
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {["1W", "1M", "3M", "1Y"].map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${period === p ? "bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)]" : "text-[var(--text-muted)] border border-[var(--border-primary)] hover:border-[var(--border-hover)]"}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Flow Chart */}
      <div className="card-3d p-6">
        <h2 className="mb-4 text-sm font-medium text-[var(--text-muted)]">Net Flow by Investor Type (Rs Billions)</h2>
        {loading ? (
          <div className="flex h-80 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-primary)] border-t-[var(--accent)]" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickFormatter={(v) => `${v}B`} />
              <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "0.5rem", color: "var(--text-primary)" }} />
              <Legend />
              <Bar dataKey="FII" fill="#D4A017" radius={[2, 2, 0, 0]} />
              <Bar dataKey="DII" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Retail" fill="#22c55e" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Holdings */}
      <div className="card-3d overflow-hidden">
        <div className="border-b border-[var(--border-primary)] px-6 py-4">
          <h2 className="text-sm font-medium text-[var(--text-muted)]">Top Institutional Holdings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">Company</th>
                <th className="px-6 py-3 text-right">FII Shares</th>
                <th className="px-6 py-3 text-right">FII %</th>
                <th className="px-6 py-3 text-right">DII Shares</th>
                <th className="px-6 py-3 text-right">DII %</th>
                <th className="px-6 py-3 text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.symbol} className="table-row">
                  <td className="px-6 py-4">
                    <a href={`/company/${h.symbol}`} className="font-bold text-[var(--text-primary)] hover:text-[var(--accent)]">{h.symbol}</a>
                    <div className="text-[10px] text-[var(--text-dim)]">{h.name}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-[var(--text-muted)]">{h.fiiShares.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-mono text-[var(--text-primary)]">{h.fiiPercent.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-right font-mono text-[var(--text-muted)]">{h.diiShares.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-mono text-[var(--text-primary)]">{h.diiPercent.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${h.change >= 0 ? "bg-[var(--green-bg)] text-[var(--green)]" : "bg-[var(--red-bg)] text-[var(--red)]"}`}>
                      {h.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {h.change >= 0 ? "+" : ""}{h.change.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
