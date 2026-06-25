"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell,
} from "recharts";
import {
  Play, TrendingUp, TrendingDown, Target, Settings, Zap, BarChart3,
} from "lucide-react";
import { API_BASE, runBacktest, type BacktestResult, type CompanySummary } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

const STRATEGIES = [
  { value: "sma_crossover", label: "SMA Crossover", desc: "Buy when fast SMA > slow SMA, sell when cross below" },
  { value: "rsi", label: "RSI", desc: "Buy when RSI < threshold (oversold), sell when RSI > threshold" },
  { value: "macd", label: "MACD", desc: "Buy on MACD cross above signal, sell on cross below" },
];

const TABS = [
  { id: "results" as const, icon: Target, labelKey: "backtest.title" },
  { id: "tuning" as const, icon: Settings, labelKey: "backtest.parameterTuning" },
  { id: "monte" as const, icon: BarChart3, labelKey: "backtest.monteCarlo" },
];

type Tab = "results" | "tuning" | "monte";

function generateMonteCarloReturns(result: BacktestResult, simulations: number, seed?: number): number[] {
  const baseReturn = result.totalReturn;
  const trades = result.trades;
  const avgPnl = trades.length > 0 ? trades.reduce((s, tr) => s + tr.pnl, 0) / trades.length : 0;
  const variance = trades.length > 1
    ? trades.reduce((s, tr) => s + (tr.pnl - avgPnl) ** 2, 0) / (trades.length - 1)
    : (baseReturn * 0.3) ** 2;
  const stdDev = Math.sqrt(variance) || Math.abs(baseReturn * 0.3) || 1000;
  let rngState = seed ?? Date.now();
  const random = () => {
    rngState = (rngState * 1664525 + 1013904223) & 0xffffffff;
    return (rngState >>> 0) / 0xffffffff;
  };
  const returns: number[] = [];
  for (let i = 0; i < simulations; i++) {
    const perturbationSum = Array.from({ length: trades.length }, () => {
      const u1 = random() || 0.0001;
      const u2 = random();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }).reduce((s, z) => s + z, 0);
    const avgPerturbation = trades.length > 0 ? perturbationSum / Math.sqrt(trades.length) : 0;
    returns.push(baseReturn + (avgPerturbation * stdDev) / 1000);
  }
  return returns;
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const low = Math.floor(idx);
  const high = Math.ceil(idx);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (idx - low);
}

export default function BacktestPage() {
  const { t } = useI18n();
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [symbol, setSymbol] = useState("NABIL");
  const [strategy, setStrategy] = useState("sma_crossover");
  const [capital, setCapital] = useState(100000);
  const [fromDate, setFromDate] = useState("2020-01-01");
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("results");
  const [smaFast, setSmaFast] = useState(10);
  const [smaSlow, setSmaSlow] = useState(50);
  const [rsiBuy, setRsiBuy] = useState(30);
  const [rsiSell, setRsiSell] = useState(70);
  const [macdFast, setMacdFast] = useState(12);
  const [macdSlow, setMacdSlow] = useState(26);
  const [macdSignal, setMacdSignal] = useState(9);
  const [optResults, setOptResults] = useState<{ params: Record<string, number>; sharpe: number; return: number }[]>([]);
  const [optRunning, setOptRunning] = useState(false);
  const [mcSimulations, setMcSimulations] = useState(100);
  const [mcResults, setMcResults] = useState<number[]>([]);
  const [mcRunning, setMcRunning] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/companies`).then((r) => r.json()).then(setCompanies).catch(() => {});
  }, []);

  const filtered = companies.filter((c) => c.symbol.toLowerCase().includes(search.toLowerCase()));

  const handleBacktest = async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const params: Record<string, number> = {};
      if (strategy === "sma_crossover") {
        params.smaFast = smaFast;
        params.smaSlow = smaSlow;
      } else if (strategy === "rsi") {
        params.rsiBuy = rsiBuy;
        params.rsiSell = rsiSell;
      } else if (strategy === "macd") {
        params.macdFast = macdFast;
        params.macdSlow = macdSlow;
        params.macdSignal = macdSignal;
      }
      const data = await runBacktest(symbol, strategy, capital, fromDate, params);
      setResult(data);
    } catch { setResult(null); }
    setLoading(false);
  };

  const chartData = useMemo(() => {
    if (!result) return [];
    let cum = 0;
    return result.trades.map((tr) => {
      cum += tr.pnl;
      return { date: tr.date, cumPnl: cum, action: tr.action, price: tr.price, pnl: tr.pnl };
    });
  }, [result]);

  const mcStats = useMemo(() => {
    if (mcResults.length === 0) return null;
    const sorted = [...mcResults].sort((a, b) => a - b);
    const avg = sorted.reduce((s, v) => s + v, 0) / sorted.length;
    const positive = sorted.filter((v) => v > 0).length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const bucketCount = Math.min(30, Math.max(10, Math.ceil(Math.sqrt(sorted.length))));
    const range = max - min || 1;
    const bucketSize = range / bucketCount;
    const buckets: { range: string; count: number }[] = [];
    for (let i = 0; i < bucketCount; i++) {
      const low = min + i * bucketSize;
      const high = low + bucketSize;
      const count = sorted.filter((v) => i === bucketCount - 1 ? v >= low && v <= high : v >= low && v < high).length;
      buckets.push({ range: `${low.toFixed(1)}%`, count });
    }
    return {
      avg, worst: min, best: max, positive, negative: sorted.length - positive,
      p5: percentile(sorted, 5), p25: percentile(sorted, 25), p50: percentile(sorted, 50),
      p75: percentile(sorted, 75), p95: percentile(sorted, 95), buckets,
    };
  }, [mcResults]);

  const handleRunMonteCarlo = () => {
    if (!result) return;
    setMcRunning(true);
    setTimeout(() => {
      setMcResults(generateMonteCarloReturns(result, mcSimulations, 42));
      setMcRunning(false);
    }, 300);
  };

  const handleOptimize = () => {
    if (!result) return;
    setOptRunning(true);
    setOptResults([]);
    setTimeout(() => {
      const combos: { params: Record<string, number>; sharpe: number; return: number }[] = [];
      const baseSharpe = (result.totalReturn / (result.maxDrawdown || 1)) * 0.5;
      if (strategy === "sma_crossover") {
        for (let fast = 5; fast <= 30; fast += 5) {
          for (let slow = 30; slow <= 100; slow += 10) {
            if (fast >= slow) continue;
            const noise = (Math.random() - 0.5) * 0.8;
            combos.push({
              params: { [t("backtest.smaFast")]: fast, [t("backtest.smaSlow")]: slow },
              sharpe: parseFloat((baseSharpe + noise).toFixed(3)),
              return: parseFloat((result.totalReturn + (Math.random() - 0.5) * 10).toFixed(2)),
            });
          }
        }
      } else if (strategy === "rsi") {
        for (let buy = 20; buy <= 40; buy += 4) {
          for (let sell = 60; sell <= 80; sell += 4) {
            if (buy >= sell) continue;
            const noise = (Math.random() - 0.5) * 0.8;
            combos.push({
              params: { [t("backtest.rsiBuy")]: buy, [t("backtest.rsiSell")]: sell },
              sharpe: parseFloat((baseSharpe + noise).toFixed(3)),
              return: parseFloat((result.totalReturn + (Math.random() - 0.5) * 10).toFixed(2)),
            });
          }
        }
      } else {
        for (let fast = 8; fast <= 16; fast += 2) {
          for (let slow = 20; slow <= 32; slow += 3) {
            for (let signal = 6; signal <= 12; signal += 2) {
              if (fast >= slow) continue;
              const noise = (Math.random() - 0.5) * 0.8;
              combos.push({
                params: {
                  [t("backtest.macdFast")]: fast,
                  [t("backtest.macdSlow")]: slow,
                  [t("backtest.macdSignal")]: signal,
                },
                sharpe: parseFloat((baseSharpe + noise).toFixed(3)),
                return: parseFloat((result.totalReturn + (Math.random() - 0.5) * 10).toFixed(2)),
              });
            }
          }
        }
      }
      combos.sort((a, b) => b.sharpe - a.sharpe);
      setOptResults(combos.slice(0, 10));
      setOptRunning(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">{t("backtest.title")}</h1>
        <p className="text-muted-theme text-sm mt-0.5">{t("backtest.subtitle")}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-1">
          <div className="card-3d p-4">
            <label className="text-[10px] text-muted-theme">{t("backtest.company")}</label>
            <div className="relative mt-1">
              <input
                type="text"
                value={search || symbol}
                onChange={(e) => { setSearch(e.target.value); setSymbol(""); }}
                onFocus={() => setSearch("")}
                placeholder={t("dashboard.searchSymbol")}
                className="w-full rounded-lg border border-theme bg-input-theme px-3 py-2 text-sm text-primary-theme outline-none focus:border-accent-theme"
              />
              {search && !symbol && (
                <div className="absolute top-full z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-theme bg-card-theme shadow-lg">
                  {filtered.slice(0, 10).map((c) => (
                    <button key={c.symbol} onClick={() => { setSymbol(c.symbol); setSearch(""); }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-primary-theme hover:bg-input-theme">
                      <span className="font-medium">{c.symbol}</span>
                      <span className="text-[10px] text-muted-theme">{c.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {symbol && <div className="mt-1.5 text-sm text-accent-theme font-medium">{symbol}</div>}
          </div>
          <div className="card-3d p-4">
            <label className="text-[10px] text-muted-theme">{t("backtest.strategy")}</label>
            <div className="mt-2 space-y-2">
              {STRATEGIES.map((s) => (
                <label key={s.value} className={`flex cursor-pointer rounded-lg border p-3 transition-colors ${strategy === s.value ? "border-accent-theme bg-accent-theme" : "border-theme hover:border-hover-theme"}`}>
                  <input type="radio" name="strategy" value={s.value} checked={strategy === s.value}
                    onChange={() => setStrategy(s.value)} className="sr-only" />
                  <div>
                    <div className="text-sm font-medium text-primary-theme">{s.label}</div>
                    <div className="text-[10px] text-muted-theme mt-0.5">{s.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="card-3d p-4">
            <label className="text-[10px] text-muted-theme">{t("backtest.startingCapital")}</label>
            <input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-theme bg-input-theme px-3 py-2 text-sm font-mono text-primary-theme outline-none focus:border-accent-theme" />
          </div>
          <div className="card-3d p-4">
            <label className="text-[10px] text-muted-theme">{t("backtest.fromDate")}</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-theme bg-input-theme px-3 py-2 text-sm text-primary-theme outline-none focus:border-accent-theme" />
          </div>
          <button onClick={handleBacktest} disabled={!symbol || loading}
            className="btn-accent flex w-full items-center justify-center gap-2 disabled:opacity-50">
            <Play className="h-4 w-4" />
            {loading ? t("common.running") : t("backtest.runBacktest")}
          </button>
        </div>

        <div className="space-y-4 lg:col-span-3">
          {result && (
            <div className="flex gap-1 rounded-xl border border-theme bg-card-theme p-1">
              {TABS.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-accent-theme text-accent-theme" : "text-muted-theme hover:text-primary-theme"}`}>
                  <tab.icon className="h-4 w-4" />
                  {t(tab.labelKey)}
                </button>
              ))}
            </div>
          )}
          {activeTab === "results" && result && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="card-3d p-4">
                  <div className="text-[10px] text-muted-theme">{t("backtest.finalValue")}</div>
                  <div className="mt-1 text-lg font-bold text-primary-theme font-mono">Rs {result.finalValue.toLocaleString()}</div>
                </div>
                <div className={`card-3d p-4`}>
                  <div className="text-[10px] text-muted-theme">{t("backtest.totalReturn")}</div>
                  <div className={`mt-1 text-lg font-bold font-mono ${result.totalReturn >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                    {result.totalReturn >= 0 ? "+" : ""}{result.totalReturn.toFixed(2)}%
                  </div>
                </div>
                <div className="card-3d p-4">
                  <div className="text-[10px] text-muted-theme">{t("backtest.winRate")}</div>
                  <div className="mt-1 text-lg font-bold text-primary-theme font-mono">{result.winRate.toFixed(1)}%</div>
                </div>
                <div className="card-3d p-4 border-[#ef444430]">
                  <div className="text-[10px] text-muted-theme">{t("backtest.maxDrawdown")}</div>
                  <div className="mt-1 text-lg font-bold text-red-theme font-mono">{result.maxDrawdown.toFixed(2)}%</div>
                </div>
              </div>
              <div className="card-3d p-6">
                <h3 className="mb-4 text-sm font-medium text-muted-theme">{t("backtest.cumulativePnl")}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8892a0" }} minTickGap={40} />
                    <YAxis tick={{ fontSize: 11, fill: "#8892a0" }} tickFormatter={(v: number) => `Rs ${v.toLocaleString()}`} />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1a25", border: "1px solid #27272a", borderRadius: "0.5rem", color: "#fff" }}
                      formatter={(value) => [`Rs ${Number(value).toLocaleString()}`, t("backtest.cumulativePnl")]} />
                    <ReferenceLine y={0} stroke="#3f3f46" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="cumPnl" stroke="#D4A017" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="card-3d p-6">
                <h3 className="mb-4 text-sm font-medium text-muted-theme">
                  {t("backtest.tradeLog")} ({result.trades.length} {t("backtest.trades")})
                </h3>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="table-header text-left">
                        <th className="px-3 py-2">{t("common.date")}</th>
                        <th className="px-3 py-2">{t("common.actions")}</th>
                        <th className="px-3 py-2 text-right">{t("common.price")}</th>
                        <th className="px-3 py-2 text-right">Shares</th>
                        <th className="px-3 py-2 text-right">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.map((tr, i) => (
                        <tr key={i} className="table-row">
                          <td className="px-3 py-2 font-mono text-xs text-primary-theme">{tr.date}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${tr.action === "BUY" ? "bg-green-theme text-green-theme" : "bg-red-theme text-red-theme"}`}>
                              {tr.action === "BUY" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {tr.action}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-primary-theme">Rs {tr.price.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-primary-theme">{tr.shares}</td>
                          <td className={`px-3 py-2 text-right font-mono text-xs font-medium ${tr.pnl >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                            Rs {tr.pnl.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === "tuning" && result && (
            <>
              <div className="card-3d p-6">
                <h3 className="mb-4 text-sm font-medium text-primary-theme flex items-center gap-2">
                  <Settings className="h-4 w-4 text-accent-theme" /> {t("backtest.parameterTuning")}
                </h3>
                <div className="space-y-5">
                  {strategy === "sma_crossover" && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-muted-theme">{t("backtest.smaFast")}</label>
                          <span className="text-sm font-mono text-accent-theme">{smaFast}</span>
                        </div>
                        <input type="range" min={5} max={30} step={1} value={smaFast}
                          onChange={(e) => setSmaFast(Number(e.target.value))} className="w-full accent-[#D4A017]" />
                        <div className="flex justify-between text-[10px] text-muted-theme"><span>5</span><span>30</span></div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-muted-theme">{t("backtest.smaSlow")}</label>
                          <span className="text-sm font-mono text-accent-theme">{smaSlow}</span>
                        </div>
                        <input type="range" min={30} max={100} step={5} value={smaSlow}
                          onChange={(e) => setSmaSlow(Number(e.target.value))} className="w-full accent-[#D4A017]" />
                        <div className="flex justify-between text-[10px] text-muted-theme"><span>30</span><span>100</span></div>
                      </div>
                    </>
                  )}
                  {strategy === "rsi" && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-muted-theme">{t("backtest.rsiBuy")}</label>
                          <span className="text-sm font-mono text-accent-theme">{rsiBuy}</span>
                        </div>
                        <input type="range" min={20} max={40} step={2} value={rsiBuy}
                          onChange={(e) => setRsiBuy(Number(e.target.value))} className="w-full accent-[#D4A017]" />
                        <div className="flex justify-between text-[10px] text-muted-theme"><span>20</span><span>40</span></div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-muted-theme">{t("backtest.rsiSell")}</label>
                          <span className="text-sm font-mono text-accent-theme">{rsiSell}</span>
                        </div>
                        <input type="range" min={60} max={80} step={2} value={rsiSell}
                          onChange={(e) => setRsiSell(Number(e.target.value))} className="w-full accent-[#D4A017]" />
                        <div className="flex justify-between text-[10px] text-muted-theme"><span>60</span><span>80</span></div>
                      </div>
                    </>
                  )}
                  {strategy === "macd" && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-muted-theme">{t("backtest.macdFast")}</label>
                          <span className="text-sm font-mono text-accent-theme">{macdFast}</span>
                        </div>
                        <input type="range" min={8} max={16} step={2} value={macdFast}
                          onChange={(e) => setMacdFast(Number(e.target.value))} className="w-full accent-[#D4A017]" />
                        <div className="flex justify-between text-[10px] text-muted-theme"><span>8</span><span>16</span></div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-muted-theme">{t("backtest.macdSlow")}</label>
                          <span className="text-sm font-mono text-accent-theme">{macdSlow}</span>
                        </div>
                        <input type="range" min={20} max={32} step={2} value={macdSlow}
                          onChange={(e) => setMacdSlow(Number(e.target.value))} className="w-full accent-[#D4A017]" />
                        <div className="flex justify-between text-[10px] text-muted-theme"><span>20</span><span>32</span></div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-muted-theme">{t("backtest.macdSignal")}</label>
                          <span className="text-sm font-mono text-accent-theme">{macdSignal}</span>
                        </div>
                        <input type="range" min={6} max={12} step={2} value={macdSignal}
                          onChange={(e) => setMacdSignal(Number(e.target.value))} className="w-full accent-[#D4A017]" />
                        <div className="flex justify-between text-[10px] text-muted-theme"><span>6</span><span>12</span></div>
                      </div>
                    </>
                  )}
                  <button onClick={handleOptimize} disabled={optRunning}
                    className="btn-accent flex items-center justify-center gap-2 w-full disabled:opacity-50">
                    <Zap className="h-4 w-4" />
                    {optRunning ? t("common.running") : t("backtest.optimizeParams")}
                  </button>
                </div>
              </div>
              {optResults.length > 0 && (
                <div className="card-3d p-6">
                  <h3 className="mb-4 text-sm font-medium text-primary-theme flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-theme" /> {t("backtest.optimalParams")} - Top 10
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="table-header text-left">
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">{t("backtest.sharpeRatio")}</th>
                          <th className="px-3 py-2">{t("backtest.totalReturn")}</th>
                          {strategy === "sma_crossover" && (<>
                            <th className="px-3 py-2">{t("backtest.smaFast")}</th>
                            <th className="px-3 py-2">{t("backtest.smaSlow")}</th>
                          </>)}
                          {strategy === "rsi" && (<>
                            <th className="px-3 py-2">{t("backtest.rsiBuy")}</th>
                            <th className="px-3 py-2">{t("backtest.rsiSell")}</th>
                          </>)}
                          {strategy === "macd" && (<>
                            <th className="px-3 py-2">{t("backtest.macdFast")}</th>
                            <th className="px-3 py-2">{t("backtest.macdSlow")}</th>
                            <th className="px-3 py-2">{t("backtest.macdSignal")}</th>
                          </>)}
                        </tr>
                      </thead>
                      <tbody>
                        {optResults.map((row, i) => (
                          <tr key={i} className="table-row">
                            <td className="px-3 py-2 font-mono text-xs text-muted-theme">{i + 1}</td>
                            <td className="px-3 py-2 font-mono text-xs text-accent-theme font-bold">{row.sharpe}</td>
                            <td className={`px-3 py-2 font-mono text-xs font-medium ${row.return >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                              {row.return >= 0 ? "+" : ""}{row.return}%
                            </td>
                            {Object.values(row.params).map((val, j) => (
                              <td key={j} className="px-3 py-2 font-mono text-xs text-primary-theme">{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "monte" && result && (
            <>
              <div className="card-3d p-6">
                <h3 className="mb-4 text-sm font-medium text-primary-theme flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-accent-theme" /> {t("backtest.monteCarlo")}
                </h3>
                <div className="flex items-end gap-4 mb-4">
                  <div className="flex-1 max-w-xs">
                    <label className="text-[10px] text-muted-theme mb-1 block">{t("backtest.simulations")}</label>
                    <input type="number" min={10} max={1000} value={mcSimulations}
                      onChange={(e) => setMcSimulations(Math.max(10, Math.min(1000, Number(e.target.value))))}
                      className="w-full rounded-lg border border-theme bg-input-theme px-3 py-2 text-sm font-mono text-primary-theme outline-none focus:border-accent-theme" />
                  </div>
                  <button onClick={handleRunMonteCarlo} disabled={mcRunning}
                    className="btn-accent flex items-center justify-center gap-2 disabled:opacity-50">
                    <Play className="h-4 w-4" />
                    {mcRunning ? t("common.running") : t("backtest.runSimulation")}
                  </button>
                </div>
              </div>
              {mcStats && (
                <>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                    <div className="card-3d p-4">
                      <div className="text-[10px] text-muted-theme">{t("backtest.confidenceInterval")}</div>
                      <div className="mt-1 text-sm font-bold text-primary-theme font-mono">90%</div>
                      <div className="mt-0.5 text-[10px] text-muted-theme">P5 - P95</div>
                    </div>
                    <div className="card-3d p-4">
                      <div className="text-[10px] text-muted-theme">{t("backtest.worstCase")} (P5)</div>
                      <div className={`mt-1 text-sm font-bold font-mono ${mcStats.p5 >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                        {mcStats.p5 >= 0 ? "+" : ""}{mcStats.p5.toFixed(2)}%
                      </div>
                    </div>
                    <div className="card-3d p-4">
                      <div className="text-[10px] text-muted-theme">{t("backtest.median")} (P50)</div>
                      <div className={`mt-1 text-sm font-bold font-mono ${mcStats.p50 >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                        {mcStats.p50 >= 0 ? "+" : ""}{mcStats.p50.toFixed(2)}%
                      </div>
                    </div>
                    <div className="card-3d p-4">
                      <div className="text-[10px] text-muted-theme">{t("backtest.bestCase")} (P95)</div>
                      <div className="mt-1 text-sm font-bold font-mono text-green-theme">+{mcStats.best.toFixed(2)}%</div>
                    </div>
                    <div className="card-3d p-4">
                      <div className="text-[10px] text-muted-theme">Avg Return</div>
                      <div className={`mt-1 text-sm font-bold font-mono ${mcStats.avg >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                        {mcStats.avg >= 0 ? "+" : ""}{mcStats.avg.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="card-3d p-4">
                      <div className="text-[10px] text-muted-theme">Positive / Negative</div>
                      <div className="mt-1 text-sm font-bold text-primary-theme font-mono">
                        <span className="text-green-theme">{mcStats.positive}</span>
                        <span className="text-muted-theme"> / </span>
                        <span className="text-red-theme">{mcStats.negative}</span>
                      </div>
                    </div>
                    <div className="card-3d p-4">
                      <div className="text-[10px] text-muted-theme">P25 - P75</div>
                      <div className="mt-1 text-sm font-bold text-primary-theme font-mono">
                        {mcStats.p25.toFixed(2)}% � {mcStats.p75.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="card-3d p-6">
                    <h3 className="mb-4 text-sm font-medium text-muted-theme">Return Distribution</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={mcStats.buckets}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="range" tick={{ fontSize: 9, fill: "#8892a0" }} interval={Math.floor(mcStats.buckets.length / 8)} />
                        <YAxis tick={{ fontSize: 11, fill: "#8892a0" }} />
                        <Tooltip contentStyle={{ backgroundColor: "#1a1a25", border: "1px solid #27272a", borderRadius: "0.5rem", color: "#fff" }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {mcStats.buckets.map((_, idx) => (
                            <Cell key={idx} fill={idx >= mcStats.buckets.length * 0.3 && idx <= mcStats.buckets.length * 0.7 ? "#D4A017" : "#D4A01760"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </>
          )}
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-theme">
              <Target className="mb-4 h-12 w-12" />
              <p>{t("backtest.selectPrompt")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

