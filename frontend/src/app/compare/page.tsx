"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { Plus, X, Search, TrendingUp, TrendingDown, BarChart3, Clock } from "lucide-react";
import { API_BASE, type CompanySummary } from "@/lib/api";

const CHART_COLORS = ["#D4A017", "#22c55e", "#3b82f6", "#ef4444", "#a855f7", "#ec4899", "#06b6d4", "#f97316"];

const TIME_PERIODS = [
  { label: "1M", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
];

interface CompareData {
  symbol: string;
  data: { date: string; close: number; volume: number }[];
}

interface CompanyStats {
  symbol: string;
  startPrice: number;
  endPrice: number;
  change: number;
  high: number;
  low: number;
  avgVolume: number;
}

function computeStats(data: { close: number; volume: number }[]): CompanyStats | null {
  if (!data.length) return null;
  const closes = data.map((d) => d.close);
  const volumes = data.map((d) => d.volume);
  const startPrice = closes[0];
  const endPrice = closes[closes.length - 1];
  return {
    symbol: "",
    startPrice,
    endPrice,
    change: startPrice ? ((endPrice - startPrice) / startPrice) * 100 : 0,
    high: Math.max(...closes),
    low: Math.min(...closes),
    avgVolume: volumes.reduce((s, v) => s + v, 0) / volumes.length,
  };
}

export default function ComparePage() {
  const [allCompanies, setAllCompanies] = useState<CompanySummary[]>([]);
  const [selected, setSelected] = useState<string[]>(["NABIL", "EBL"]);
  const [compareData, setCompareData] = useState<CompareData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [period, setPeriod] = useState(12);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/companies`)
      .then((r) => r.json())
      .then((data) => {
        setAllCompanies(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected.length === 0) {
      setCompareData([]);
      return;
    }
    setChartLoading(true);
    const from = new Date();
    from.setFullYear(from.getFullYear() - 1);
    const fromStr = from.toISOString().split("T")[0];

    Promise.all(
      selected.map((sym) =>
        fetch(`${API_BASE}/api/companies/${sym}?from=${fromStr}`)
          .then((r) => r.json())
          .then((d) => ({ symbol: sym, data: d.data || [] }))
      )
    )
      .then((results) => setCompareData(results))
      .catch(() => {})
      .finally(() => setChartLoading(false));
  }, [selected]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(
    () =>
      allCompanies.filter(
        (c) =>
          c.symbol.toLowerCase().includes(search.toLowerCase()) &&
          !selected.includes(c.symbol)
      ),
    [allCompanies, search, selected]
  );

  const addCompany = useCallback(
    (symbol: string) => {
      if (selected.length < 8 && !selected.includes(symbol)) {
        setSelected([...selected, symbol]);
      }
      setSearch("");
      setShowDropdown(false);
    },
    [selected]
  );

  const removeCompany = useCallback(
    (symbol: string) => {
      setSelected(selected.filter((s) => s !== symbol));
    },
    [selected]
  );

  const stats: CompanyStats[] = useMemo(() => {
    return compareData.map((company) => {
      const sliced = company.data.slice(-period * 30);
      const s = computeStats(sliced);
      return { ...(s || { symbol: company.symbol, startPrice: 0, endPrice: 0, change: 0, high: 0, low: 0, avgVolume: 0 }), symbol: company.symbol };
    });
  }, [compareData, period]);

  const normalizedData = useMemo(() => {
    const allDates = Array.from(
      new Set(compareData.flatMap((d) => d.data.map((r) => r.date)))
    ).sort();

    const recentDates = allDates.slice(-period * 30);

    return recentDates.map((date) => {
      const entry: Record<string, string | number> = { date };
      compareData.forEach((company) => {
        const record = company.data.find((r) => r.date === date);
        if (record) {
          const first = company.data[0]?.close || 1;
          entry[company.symbol] = Number(((record.close - first) / first * 100).toFixed(2));
        }
      });
      return entry;
    });
  }, [compareData, period]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Compare Companies</h1>
        <p className="mt-1 text-sm text-muted-theme">
          Side-by-side performance comparison with normalized returns
        </p>
      </div>

      {/* Company Selector */}
      <div className="card-3d p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Selected chips */}
          {selected.map((sym, i) => {
            const stat = stats.find((s) => s.symbol === sym);
            return (
              <div
                key={sym}
                className="group flex items-center gap-2 rounded-lg border px-3 py-2 transition-all"
                style={{
                  borderColor: CHART_COLORS[i % CHART_COLORS.length],
                  backgroundColor: `${CHART_COLORS[i % CHART_COLORS.length]}12`,
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="text-sm font-semibold text-primary-theme">{sym}</span>
                {stat && (
                  <span className={`text-xs font-mono ${stat.change >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                    {stat.change >= 0 ? "+" : ""}{stat.change.toFixed(1)}%
                  </span>
                )}
                <button
                  onClick={() => removeCompany(sym)}
                  className="ml-1 rounded-full p-0.5 text-muted-theme opacity-0 transition-all group-hover:opacity-100 hover:bg-white/10 hover:text-primary-theme"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}

          {/* Add button */}
          {selected.length < 8 && (
            <div ref={searchRef} className="relative">
              <button
                onClick={() => {
                  setShowDropdown(!showDropdown);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-hover-theme px-3 py-2 text-sm text-muted-theme transition-colors hover:border-accent-theme hover:text-accent-theme"
              >
                <Plus className="h-4 w-4" />
                Add company
              </button>

              {showDropdown && (
                <div className="absolute top-full left-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-theme bg-card-theme shadow-2xl">
                  <div className="relative border-b border-theme">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Search companies..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-primary-theme outline-none placeholder:text-muted-theme"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filtered.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-theme">
                        {search ? "No companies found" : "All companies selected"}
                      </div>
                    ) : (
                      filtered.slice(0, 20).map((c) => (
                        <button
                          key={c.symbol}
                          onClick={() => addCompany(c.symbol)}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-hover-theme"
                        >
                          <div>
                            <span className="text-sm font-semibold text-primary-theme">{c.symbol}</span>
                            <span className="ml-2 text-xs text-muted-theme">{c.category}</span>
                          </div>
                          {c.latestClose && (
                            <span className="font-mono text-xs text-muted-theme">
                              Rs {c.latestClose.toLocaleString()}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Period selector */}
        <div className="mt-4 flex items-center gap-2 border-t border-theme pt-4">
          <Clock className="h-4 w-4 text-muted-theme" />
          <span className="text-xs text-muted-theme">Period:</span>
          {TIME_PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPeriod(p.months)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                period === p.months
                  ? "bg-accent-theme text-accent-theme shadow-sm"
                  : "text-muted-theme hover:bg-hover-theme hover:text-primary-theme"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={stat.symbol} className="card-3d p-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="text-sm font-bold text-primary-theme">{stat.symbol}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-theme">Start</span>
                  <span className="font-mono text-xs text-primary-theme">Rs {stat.startPrice.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-theme">End</span>
                  <span className="font-mono text-xs text-primary-theme">Rs {stat.endPrice.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-theme">Return</span>
                  <span className={`font-mono text-xs font-bold ${stat.change >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                    {stat.change >= 0 ? "+" : ""}{stat.change.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-theme">High</span>
                  <span className="font-mono text-xs text-muted-theme">Rs {stat.high.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartLoading ? (
        <div className="card-3d flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-theme border-t-[#D4A017]" />
            <span className="text-sm text-muted-theme">Loading chart data...</span>
          </div>
        </div>
      ) : compareData.length > 0 ? (
        <div className="card-3d p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-medium text-muted-theme">
              <BarChart3 className="h-4 w-4 text-accent-theme" />
              Normalized Performance (% change from start)
            </h2>
            <div className="flex items-center gap-4">
              {compareData.map((company, i) => (
                <div key={company.symbol} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-xs text-muted-theme">{company.symbol}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={420}>
            <LineChart data={normalizedData} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => {
                  const date = new Date(d);
                  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                }}
                tick={{ fontSize: 11, fill: "#8892a0" }}
                minTickGap={50}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#8892a0" }}
                tickFormatter={(v) => `${v}%`}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a25",
                  border: "1px solid #27272a",
                  borderRadius: "0.75rem",
                  color: "#fff",
                  padding: "12px",
                }}
                labelStyle={{ color: "#8892a0", marginBottom: "8px" }}
                formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name]}
                labelFormatter={(d) =>
                  new Date(d).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                }
              />
              <ReferenceLine y={0} stroke="#3f3f46" strokeDasharray="3 3" />
              {compareData.map((company, i) => (
                <Line
                  key={company.symbol}
                  type="monotone"
                  dataKey={company.symbol}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="card-3d flex h-72 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <BarChart3 className="h-10 w-10 text-[#27272a]" />
            <p className="text-sm text-muted-theme">Add companies above to compare their performance</p>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {compareData.length > 0 && (
        <div className="card-3d overflow-hidden">
          <div className="border-b border-theme px-6 py-4">
            <h2 className="text-sm font-medium text-muted-theme">Detailed Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3 text-left">Company</th>
                  <th className="px-6 py-3 text-right">Start Price</th>
                  <th className="px-6 py-3 text-right">End Price</th>
                  <th className="px-6 py-3 text-right">Return</th>
                  <th className="px-6 py-3 text-right">High</th>
                  <th className="px-6 py-3 text-right">Low</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat, i) => (
                  <tr key={stat.symbol} className="table-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="font-bold text-primary-theme">{stat.symbol}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-primary-theme">
                      Rs {stat.startPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-primary-theme">
                      Rs {stat.endPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                        stat.change >= 0
                          ? "bg-green-theme text-green-theme"
                          : "bg-red-theme text-red-theme"
                      }`}>
                        {stat.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {stat.change >= 0 ? "+" : ""}{stat.change.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-muted-theme">
                      Rs {stat.high.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-muted-theme">
                      Rs {stat.low.toLocaleString()}
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
