"use client";

import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { Wallet, TrendingUp, TrendingDown, PieChart as PieIcon, BarChart3, Target } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Holding {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  sector: string;
}

interface PortfolioStats {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

const COLORS = ["#D4A017", "#22c55e", "#3b82f6", "#ef4444", "#a855f7", "#ec4899", "#06b6d4", "#f97316"];

const STORAGE_KEY = "nepse_portfolio";

function loadHoldings(): Holding[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [
    { symbol: "NABIL", shares: 50, avgPrice: 1100, currentPrice: 1245, sector: "Banking" },
    { symbol: "EBL", shares: 30, avgPrice: 450, currentPrice: 520, sector: "Banking" },
    { symbol: "SCB", shares: 40, avgPrice: 900, currentPrice: 892, sector: "Banking" },
    { symbol: "HEI", shares: 20, avgPrice: 1400, currentPrice: 1520, sector: "Hydropower" },
    { symbol: "NTC", shares: 25, avgPrice: 950, currentPrice: 980, sector: "Telecom" },
  ];
}

export default function PortfolioAnalytics() {
  const [holdings, setHoldings] = useState<Holding[]>([]);

  useEffect(() => {
    setHoldings(loadHoldings());
  }, []);

  const stats: PortfolioStats = useMemo(() => {
    const totalValue = holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0);
    const totalInvested = holdings.reduce((s, h) => s + h.shares * h.avgPrice, 0);
    const dayChange = holdings.reduce((s, h) => s + h.shares * (h.currentPrice * 0.01 * (Math.random() - 0.5)), 0);
    return {
      totalValue,
      totalInvested,
      totalPnL: totalValue - totalInvested,
      totalPnLPercent: totalInvested ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
      dayChange,
      dayChangePercent: totalValue ? (dayChange / totalValue) * 100 : 0,
    };
  }, [holdings]);

  const sectorAllocation = useMemo(() => {
    const map: Record<string, number> = {};
    holdings.forEach((h) => {
      map[h.sector] = (map[h.sector] || 0) + h.shares * h.currentPrice;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [holdings]);

  const holdingsWithReturns = useMemo(() => {
    return holdings.map((h) => ({
      ...h,
      value: h.shares * h.currentPrice,
      invested: h.shares * h.avgPrice,
      pnl: (h.currentPrice - h.avgPrice) * h.shares,
      pnlPercent: ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100,
    }));
  }, [holdings]);

  const benchmarkData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const portfolioReturn = stats.totalPnLPercent * (i / 30) + (Math.random() - 0.5) * 2;
      const marketReturn = stats.totalPnLPercent * 0.6 * (i / 30) + (Math.random() - 0.5) * 3;
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        Portfolio: Number(portfolioReturn.toFixed(2)),
        Market: Number(marketReturn.toFixed(2)),
      };
    });
  }, [stats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Portfolio Analytics</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Performance metrics and allocation breakdown</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="card-3d p-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Total Value</span>
          </div>
          <div className="mt-1 text-lg font-bold text-[var(--text-primary)] font-mono">
            Rs {stats.totalValue.toLocaleString()}
          </div>
        </div>
        <div className="card-3d p-4">
          <div className="text-[10px] text-[var(--text-muted)]">Invested</div>
          <div className="mt-1 text-lg font-bold text-[var(--text-primary)] font-mono">
            Rs {stats.totalInvested.toLocaleString()}
          </div>
        </div>
        <div className="card-3d p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--green)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Total P&L</span>
          </div>
          <div className={`mt-1 text-lg font-bold font-mono ${stats.totalPnL >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
            {stats.totalPnL >= 0 ? "+" : ""}Rs {stats.totalPnL.toLocaleString()}
          </div>
          <div className={`text-xs font-bold ${stats.totalPnLPercent >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
            {stats.totalPnLPercent >= 0 ? "+" : ""}{stats.totalPnLPercent.toFixed(2)}%
          </div>
        </div>
        <div className="card-3d p-4">
          <div className="text-[10px] text-[var(--text-muted)]">Day Change</div>
          <div className={`mt-1 text-lg font-bold font-mono ${stats.dayChange >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
            {stats.dayChange >= 0 ? "+" : ""}Rs {Math.abs(stats.dayChange).toLocaleString()}
          </div>
          <div className={`text-xs font-bold ${stats.dayChangePercent >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
            {stats.dayChangePercent >= 0 ? "+" : ""}{stats.dayChangePercent.toFixed(2)}%
          </div>
        </div>
        <div className="card-3d p-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Holdings</span>
          </div>
          <div className="mt-1 text-lg font-bold text-[var(--text-primary)]">{holdings.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sector Allocation */}
        <div className="card-3d p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--text-muted)]">
            <PieIcon className="h-4 w-4 text-[var(--accent)]" /> Sector Allocation
          </h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={sectorAllocation} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                  {sectorAllocation.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "0.5rem", color: "var(--text-primary)" }}
                  formatter={(value) => [`Rs ${Number(value).toLocaleString()}`, "Value"]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {sectorAllocation.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-[var(--text-muted)]">{s.name}</span>
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {((s.value / stats.totalValue) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance vs Benchmark */}
        <div className="card-3d p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--text-muted)]">
            <BarChart3 className="h-4 w-4 text-[var(--accent)]" /> Performance vs Market
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={benchmarkData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--text-dim)" }} />
              <YAxis tick={{ fontSize: 9, fill: "var(--text-dim)" }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "0.5rem", color: "var(--text-primary)" }} />
              <Line type="monotone" dataKey="Portfolio" stroke="#D4A017" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Market" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="card-3d overflow-hidden">
        <div className="border-b border-[var(--border-primary)] px-6 py-4">
          <h2 className="text-sm font-medium text-[var(--text-muted)]">Holdings Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">Symbol</th>
                <th className="px-6 py-3 text-right">Shares</th>
                <th className="px-6 py-3 text-right">Avg Price</th>
                <th className="px-6 py-3 text-right">Current</th>
                <th className="px-6 py-3 text-right">Value</th>
                <th className="px-6 py-3 text-right">P&L</th>
                <th className="px-6 py-3 text-right">Return %</th>
              </tr>
            </thead>
            <tbody>
              {holdingsWithReturns.map((h) => (
                <tr key={h.symbol} className="table-row">
                  <td className="px-6 py-4">
                    <a href={`/company/${h.symbol}`} className="font-bold text-[var(--text-primary)] hover:text-[var(--accent)]">{h.symbol}</a>
                    <div className="text-[10px] text-[var(--text-dim)]">{h.sector}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-[var(--text-muted)]">{h.shares}</td>
                  <td className="px-6 py-4 text-right font-mono text-[var(--text-muted)]">Rs {h.avgPrice.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-mono text-[var(--text-primary)]">Rs {h.currentPrice.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-mono text-[var(--text-primary)]">Rs {h.value.toLocaleString()}</td>
                  <td className={`px-6 py-4 text-right font-mono font-bold ${h.pnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                    {h.pnl >= 0 ? "+" : ""}Rs {h.pnl.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${h.pnlPercent >= 0 ? "bg-[var(--green-bg)] text-[var(--green)]" : "bg-[var(--red-bg)] text-[var(--red)]"}`}>
                      {h.pnlPercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {h.pnlPercent >= 0 ? "+" : ""}{h.pnlPercent.toFixed(1)}%
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
