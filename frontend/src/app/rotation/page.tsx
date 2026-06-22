"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { RotationSector, fetchSectorRotation } from "@/lib/api";

const PERIODS = [
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
  { label: "180 Days", value: 180 },
  { label: "1 Year", value: 365 },
];

const MOMENTUM_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  strong: { bg: "bg-[var(--green-bg)]", text: "text-[var(--green)]", label: "Strong Bullish" },
  weak: { bg: "bg-[var(--green-bg)]", text: "text-[var(--green)]", label: "Weak Bullish" },
  weak_neg: { bg: "bg-[var(--red-bg)]", text: "text-[var(--red)]", label: "Weak Bearish" },
  strong_neg: { bg: "bg-[var(--red-bg)]", text: "text-[var(--red)]", label: "Strong Bearish" },
};

export default function RotationPage() {
  const [period, setPeriod] = useState(30);
  const [sectors, setSectors] = useState<RotationSector[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSector, setExpandedSector] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchSectorRotation(period).then((data) => {
      setSectors(data.sectors || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [period]);

  const chartData = sectors.map((s) => ({
    sector: s.sector.split("/")[0].split(" ").slice(0, 2).join(" "),
    avgReturn: s.avgReturn,
    avgChange: s.avgChange,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Sector Rotation</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Which sectors are leading and lagging over time
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p.value
                  ? "bg-[var(--accent)] text-primary-theme"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card-3d flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-primary)] border-t-[var(--accent)]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {sectors.slice(0, 5).map((s) => {
              const m = MOMENTUM_COLORS[s.momentum];
              return (
                <div key={s.sector} className={`rounded-xl p-4 ${m.bg}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-[var(--text-dim)]">Rank #{s.rank}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.text}`}>{m.label}</span>
                  </div>
                  <div className="mt-2 text-sm font-bold text-[var(--text-primary)]">{s.sector}</div>
                  <div className={`mt-1 font-mono text-lg font-bold ${s.avgReturn >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                    {s.avgReturn >= 0 ? "+" : ""}{s.avgReturn.toFixed(2)}%
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-dim)]">
                    {s.aboveSMA50Pct}% above SMA50 · {s.companyCount} stocks
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card-3d p-6">
            <h2 className="mb-4 text-sm font-medium text-[var(--text-muted)]">
              Sector Returns ({period}-day average)
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "0.5rem", color: "var(--text-primary)" }}
                  formatter={(value) => [`${Number(value).toFixed(2)}%`, "Avg Return"]}
                />
                <Bar dataKey="avgReturn" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.avgReturn >= 0 ? "var(--green)" : "var(--red)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {sectors.map((sector) => {
              const m = MOMENTUM_COLORS[sector.momentum];
              const expanded = expandedSector === sector.sector;
              return (
                <div key={sector.sector} className="card-3d overflow-hidden">
                  <button
                    onClick={() => setExpandedSector(expanded ? null : sector.sector)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-hover)] text-sm font-bold text-[var(--text-primary)]">
                        {sector.rank}
                      </span>
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">{sector.sector}</div>
                        <div className="text-xs text-[var(--text-dim)]">
                          {sector.companyCount} companies · {sector.aboveSMA50Pct}% above SMA50
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`font-mono text-lg font-bold ${sector.avgReturn >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                          {sector.avgReturn >= 0 ? "+" : ""}{sector.avgReturn.toFixed(2)}%
                        </div>
                        <div className="text-xs text-[var(--text-dim)]">{period}-day return</div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.bg} ${m.text}`}>
                        {m.label}
                      </span>
                      {expanded ? <ChevronUp className="h-5 w-5 text-[var(--text-dim)]" /> : <ChevronDown className="h-5 w-5 text-[var(--text-dim)]" />}
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-[var(--border-primary)] px-5 py-3">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        {sector.companies.map((c) => (
                          <Link
                            key={c.symbol}
                            href={`/company/${c.symbol}`}
                            className="flex items-center justify-between rounded-lg bg-[var(--bg-input)] p-3 transition-colors hover:bg-[var(--bg-hover)]"
                          >
                            <div>
                              <div className="text-sm font-bold text-[var(--text-primary)]">{c.symbol}</div>
                              <div className="font-mono text-xs text-[var(--text-muted)]">Rs {c.price.toLocaleString()}</div>
                              <div className="text-[10px] text-[var(--text-dim)]">
                                RSI: {c.rsi?.toFixed(0) ?? "-"} · {c.aboveSMA50 ? "Above" : "Below"} SMA50
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`flex items-center gap-0.5 text-sm font-bold ${c.periodReturn >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                                {c.periodReturn >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {c.periodReturn >= 0 ? "+" : ""}{c.periodReturn.toFixed(2)}%
                              </div>
                              <div className={`text-xs ${c.change >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                                Today: {c.change >= 0 ? "+" : ""}{c.change.toFixed(2)}%
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
