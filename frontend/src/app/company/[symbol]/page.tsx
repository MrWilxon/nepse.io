"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CandlestickChart as CandlestickIcon,
  Layers,
  Link2,
  Download,
  FileText,
  Star,
  Wifi,
} from "lucide-react";
import type { IndicatorData, CompanyStats, ChartPattern } from "@/lib/api";
import { useWatchlist } from "@/lib/watchlist";
import { exportCSV } from "@/lib/export";
import { CandlestickChart } from "@/components/candlestick-chart";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const TIME_RANGES = [
  { label: "1M", years: 0.08 },
  { label: "3M", years: 0.25 },
  { label: "6M", years: 0.5 },
  { label: "1Y", years: 1 },
  { label: "3Y", years: 3 },
  { label: "5Y", years: 5 },
  { label: "All", years: 99 },
];

const INDICATORS = [
  { label: "None", value: "none" },
  { label: "SMA 20/50", value: "sma" },
  { label: "EMA 12/26", value: "ema" },
  { label: "RSI 14", value: "rsi" },
  { label: "MACD", value: "macd" },
  { label: "Bollinger Bands", value: "bb" },
];

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function CompanyPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params.symbol as string).toUpperCase();
  const { toggle, isWatched } = useWatchlist();

  const [data, setData] = useState<IndicatorData[]>([]);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("1Y");
  const [chartType, setChartType] = useState<"candlestick" | "line">(
    "candlestick"
  );
  const [indicator, setIndicator] = useState("none");
  const [error, setError] = useState("");
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [patterns, setPatterns] = useState<ChartPattern[]>([]);

  useEffect(() => {
    setLoading(true);
    const years = TIME_RANGES.find((r) => r.label === range)?.years || 99;
    const from = new Date();
    from.setFullYear(from.getFullYear() - years);
    const fromStr = from.toISOString().split("T")[0];

    Promise.all([
      fetch(`${API_BASE}/api/companies/${symbol}/indicators?from=${fromStr}`).then(
        (r) => r.json()
      ),
      fetch(`${API_BASE}/api/companies/${symbol}/stats`).then((r) => r.json()),
      fetch(`${API_BASE}/api/patterns/${symbol}`).then((r) => r.json()),
    ])
      .then(([detail, statsData, patternData]) => {
        if (detail.error) {
          setError(detail.error);
        } else {
          setData(detail.data || detail);
          setStats(statsData);
          setPatterns(patternData.patterns || []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load data. Is the backend running on port 4000?");
        setLoading(false);
      });
  }, [symbol, range]);

  useEffect(() => {
    const wsUrl = API_BASE.replace("http", "ws") + "/ws";
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "price_update") {
          const match = msg.data.find((d: any) => d.symbol === symbol);
          if (match) setLivePrice(match.price);
        }
      } catch {}
    };
    return () => ws.close();
  }, [symbol]);

  const handleExportCSV = () => {
    const csvData = data.map((d) => ({
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));
    exportCSV(csvData, `${symbol}_data.csv`);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-[var(--text-muted)]">
        Loading {symbol}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium text-red-500">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-sm text-[var(--text-muted)] underline"
        >
          Back to all companies
        </button>
      </div>
    );
  }

  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const change = latest && prev ? latest.close - prev.close : 0;
  const changePct = prev ? (change / prev.close) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.push("/")}
          className="mt-1 rounded-lg border border-[var(--border-primary)] p-2 hover:bg-[var(--bg-hover)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">{symbol}</h1>
          <p className="text-[var(--text-muted)]">{stats?.category}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toggle(symbol)}
            className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
              isWatched(symbol)
                ? "border-yellow-300 bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:border-yellow-700"
                : "border-[var(--border-primary)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] dark:border-zinc-600 dark:bg-zinc-800"
            }`}
          >
            <Star className={`h-4 w-4 ${isWatched(symbol) ? "fill-current" : ""}`} />
            {isWatched(symbol) ? "Watching" : "Watch"}
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-3 py-2 text-sm hover:bg-[var(--bg-hover)] dark:border-zinc-600 dark:bg-zinc-800"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <a
            href={`/company/${symbol}/dividends`}
            className="flex items-center gap-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-3 py-2 text-sm hover:bg-[var(--bg-hover)] dark:border-zinc-600 dark:bg-zinc-800"
          >
            <Link2 className="h-4 w-4" />
            Dividends
          </a>
          <a
            href="/compare"
            className="flex items-center gap-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-3 py-2 text-sm hover:bg-[var(--bg-hover)] dark:border-zinc-600 dark:bg-zinc-800"
          >
            <Layers className="h-4 w-4" />
            Compare
          </a>
        </div>
        {latest && (
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <div className="text-3xl font-bold font-mono">
                Rs {(livePrice || latest.close).toLocaleString()}
              </div>
              {wsConnected && (
                <span className="flex items-center gap-1 rounded-full bg-[var(--green-bg)] px-2 py-0.5 text-xs text-[var(--green)] dark:bg-green-900/30 dark:text-green-400">
                  <Wifi className="h-3 w-3" />
                  Live
                </span>
              )}
            </div>
            <div
              className={`flex items-center justify-end gap-1 text-sm font-medium ${
                change >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
              }`}
            >
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)} ({changePct.toFixed(2)}%)
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats && (
          <>
            <StatCard
              label="All-Time High"
              value={`Rs ${stats.allTimeHigh.toLocaleString()}`}
            />
            <StatCard
              label="All-Time Low"
              value={`Rs ${stats.allTimeLow.toLocaleString()}`}
            />
            <StatCard
              label="Avg Volume"
              value={formatNumber(stats.avgVolume)}
            />
            <StatCard
              label="Total Records"
              value={stats.totalRecords.toLocaleString()}
            />
          </>
        )}
      </div>

      {patterns.length > 0 && (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-muted)] dark:text-zinc-400">
            Detected Patterns ({patterns.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {patterns.map((p, i) => (
              <div
                key={i}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                    p.signal === "bullish"
                      ? "border-[var(--green-border)] bg-[var(--green-bg)] dark:border-green-800 dark:bg-green-900/20"
                      : p.signal === "bearish"
                      ? "border-[var(--red-border)] bg-[var(--red-bg)] dark:border-red-800 dark:bg-red-900/20"
                      : p.signal === "forming"
                      ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
                      : "border-[var(--border-primary)] bg-[var(--bg-input)] dark:border-zinc-700 dark:bg-zinc-800"
                  }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${
                      p.signal === "bullish" ? "text-[var(--green)] dark:text-green-400" :
                      p.signal === "bearish" ? "text-[var(--red)] dark:text-red-400" :
                      p.signal === "forming" ? "text-yellow-700 dark:text-yellow-400" :
                      "text-[var(--text-dim)] dark:text-zinc-300"
                    }`}>
                      {p.name}
                    </span>
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--text-muted)] bg-[var(--bg-input)] dark:bg-zinc-700">
                      {p.signal}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">{p.confidence}%</span>
                  </div>
                  <div className="mt-0.5 text-[var(--text-dim)] dark:text-zinc-400">{p.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.label)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r.label
                  ? "bg-green-600 text-primary-theme"
                   : "bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-dim)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setChartType("candlestick")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              chartType === "candlestick"
                ? "bg-zinc-800 text-primary-theme"
                : "bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-dim)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            <CandlestickIcon className="h-3 w-3" />
            Candle
          </button>
          <button
            onClick={() => setChartType("line")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              chartType === "line"
                ? "bg-zinc-800 text-primary-theme"
                : "bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-dim)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            Line
          </button>
        </div>
        <select
          value={indicator}
          onChange={(e) => setIndicator(e.target.value)}
          className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium outline-none"
        >
          {INDICATORS.map((ind) => (
            <option key={ind.value} value={ind.value}>
              {ind.label}
            </option>
          ))}
        </select>
      </div>

      {data.length > 0 && (
        <>
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6">
            <h2 className="mb-4 text-sm font-medium text-[var(--text-muted)]">
              {chartType === "candlestick" ? "OHLC Chart" : "Price Chart"}
            </h2>
            <CandlestickChart data={data} chartType={chartType} indicator={indicator} />
            {indicator === "sma" && (
              <div className="mt-2 flex gap-4 text-xs text-[var(--text-muted)]">
                <span><span className="inline-block h-2 w-4 rounded bg-amber-500" /> SMA 20</span>
                <span><span className="inline-block h-2 w-4 rounded bg-violet-500" /> SMA 50</span>
              </div>
            )}
            {indicator === "ema" && (
              <div className="mt-2 flex gap-4 text-xs text-[var(--text-muted)]">
                <span><span className="inline-block h-2 w-4 rounded bg-cyan-500" /> EMA 12</span>
                <span><span className="inline-block h-2 w-4 rounded bg-pink-500" /> EMA 26</span>
              </div>
            )}
            {indicator === "bb" && (
              <div className="mt-2 text-xs text-[var(--text-muted)]">
                <span><span className="inline-block h-2 w-4 rounded bg-violet-500" /> Bollinger Bands (20, 2)</span>
              </div>
            )}
          </div>

          {indicator === "rsi" && (
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6">
              <h2 className="mb-4 text-sm font-medium text-[var(--text-muted)]">RSI (14)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 11 }} minTickGap={30} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => [Number(value)?.toFixed(1), "RSI"]}
                  />
                  <ReferenceLine y={70} stroke="#dc2626" strokeDasharray="3 3" />
                  <ReferenceLine y={30} stroke="#16a34a" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {indicator === "macd" && (
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6">
              <h2 className="mb-4 text-sm font-medium text-[var(--text-muted)]">MACD (12, 26, 9)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 11 }} minTickGap={30} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <ReferenceLine y={0} stroke="#9ca3af" />
                  <Bar dataKey="macdHist" name="Histogram">
                    {data.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          (entry.macdHist ?? 0) >= 0 ? "#16a34a" : "#dc2626"
                        }
                      />
                    ))}
                  </Bar>
                  <Line type="monotone" dataKey="macd" stroke="#2563eb" strokeWidth={1.5} dot={false} name="MACD" />
                  <Line type="monotone" dataKey="macdSignal" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Signal" />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="mt-2 flex gap-4 text-xs text-[var(--text-muted)]">
                <span><span className="inline-block h-2 w-4 rounded bg-blue-600" /> MACD</span>
                <span><span className="inline-block h-2 w-4 rounded bg-amber-500" /> Signal</span>
                <span><span className="inline-block h-2 w-4 rounded bg-[var(--green)]" /> Histogram</span>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6">
            <h2 className="mb-4 text-sm font-medium text-[var(--text-muted)] flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Volume
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11 }}
                  minTickGap={30}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={formatNumber} />
                <Tooltip
                  formatter={(value) => [
                    Number(value).toLocaleString(),
                    "Volume",
                  ]}
                />
                <Bar dataKey="volume" fill="#93c5fd">
                  {data.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={(entry.close ?? 0) >= (entry.open ?? 0) ? "#bbf7d0" : "#fecaca"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6">
            <h2 className="mb-4 text-sm font-medium text-[var(--text-muted)]">
              Recent Data
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-primary)] text-left text-xs font-medium uppercase text-[var(--text-muted)]">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2 text-right">Open</th>
                    <th className="px-3 py-2 text-right">High</th>
                    <th className="px-3 py-2 text-right">Low</th>
                    <th className="px-3 py-2 text-right">Close</th>
                    <th className="px-3 py-2 text-right">Change%</th>
                    <th className="px-3 py-2 text-right">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)]">
                  {[...data]
                    .reverse()
                    .slice(0, 30)
                    .map((r) => (
                      <tr key={r.date} className="hover:bg-zinc-50">
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                          {r.date}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs">
                          {r.open?.toLocaleString() ?? "-"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs">
                          {r.high?.toLocaleString() ?? "-"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs">
                          {r.low?.toLocaleString() ?? "-"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs font-medium">
                          {r.close.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs">
                          -
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs text-[var(--text-muted)]">
                          {r.volume?.toLocaleString() ?? "-"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
      <div className="text-xs font-medium text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-lg font-bold font-mono">{value}</div>
    </div>
  );
}
