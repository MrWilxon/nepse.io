"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, Users, Activity, Scale,
  ArrowUpDown, ChevronDown, ChevronUp, Search, X, Filter, Zap,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import type {
  BrokerTrendsResponse, BrokerRankingsResponse, BrokerCompareResponse,
  BrokerParticipationResponse, BrokerRanking, BrokerComparisonItem,
} from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const COLORS = ["#D4A017", "#22c55e", "#ef4444", "#3b82f6", "#a855f7", "#f97316", "#06b6d4", "#ec4899"];

function formatAmt(amt: number): string {
  if (amt >= 1e9) return `${(amt / 1e9).toFixed(2)}Cr`;
  if (amt >= 1e7) return `${(amt / 1e7).toFixed(2)}L`;
  if (amt >= 1e5) return `${(amt / 1e5).toFixed(1)}K`;
  return amt.toLocaleString();
}

function formatQty(qty: number): string {
  if (qty >= 1e7) return `${(qty / 1e7).toFixed(2)}Cr`;
  if (qty >= 1e5) return `${(qty / 1e5).toFixed(2)}L`;
  if (qty >= 1e3) return `${(qty / 1e3).toFixed(1)}K`;
  return qty.toLocaleString();
}

type Tab = "trends" | "ranking" | "compare" | "participation";

export default function BrokerAnalysisPage() {
  const [tab, setTab] = useState<Tab>("trends");
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const [trends, setTrends] = useState<BrokerTrendsResponse | null>(null);
  const [rankings, setRankings] = useState<BrokerRankingsResponse | null>(null);
  const [compare, setCompare] = useState<BrokerCompareResponse | null>(null);
  const [participation, setParticipation] = useState<BrokerParticipationResponse | null>(null);

  const [selectedBrokers, setSelectedBrokers] = useState<number[]>([1, 2, 3]);
  const [brokerInput, setBrokerInput] = useState("");
  const [rankingSort, setRankingSort] = useState("score");

  useEffect(() => {
    setLoading(true);
    if (tab === "trends") {
      fetch(`${API_BASE}/api/brokers/analysis/trends?days=${days}&brokers=${selectedBrokers.join(",")}`)
        .then(r => r.json()).then(d => { setTrends(d); setLoading(false); })
        .catch(() => setLoading(false));
    } else if (tab === "ranking") {
      fetch(`${API_BASE}/api/brokers/analysis/ranking?days=${days}&sortBy=${rankingSort}`)
        .then(r => r.json()).then(d => { setRankings(d); setLoading(false); })
        .catch(() => setLoading(false));
    } else if (tab === "compare") {
      fetch(`${API_BASE}/api/brokers/analysis/compare?days=${days}&brokers=${selectedBrokers.join(",")}`)
        .then(r => r.json()).then(d => { setCompare(d); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      fetch(`${API_BASE}/api/brokers/analysis/participation?days=${days}`)
        .then(r => r.json()).then(d => { setParticipation(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [tab, days, selectedBrokers, rankingSort]);

  const addBroker = () => {
    const num = parseInt(brokerInput);
    if (num >= 1 && num <= 91 && !selectedBrokers.includes(num) && selectedBrokers.length < 8) {
      setSelectedBrokers([...selectedBrokers, num]);
      setBrokerInput("");
    }
  };

  const removeBroker = (n: number) => setSelectedBrokers(selectedBrokers.filter(b => b !== n));

  const tooltipStyle = { background: "#13131a", border: "1px solid #27272a", borderRadius: "0.5rem", fontSize: 12, color: "#f0f0f5" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-theme flex items-center gap-2">
            <Activity className="h-6 w-6 text-accent-theme" />
            Broker Analysis
          </h1>
          <p className="text-muted-theme text-sm mt-0.5">Deep-dive analytics on broker trading patterns & behavior</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="bg-input-theme border border-theme rounded-lg px-3 py-1.5 text-xs text-body-theme"
          >
            {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d}D</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "trends", label: "Market Trends", icon: TrendingUp },
          { key: "ranking", label: "Broker Rankings", icon: BarChart3 },
          { key: "compare", label: "Compare Brokers", icon: Scale },
          { key: "participation", label: "Participation", icon: Users },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              tab === key
                ? "bg-accent-theme text-primary-theme"
                : "bg-input-theme text-body-theme border border-theme hover:bg-hover-theme"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Broker Selector (for trends & compare) */}
      {(tab === "trends" || tab === "compare") && (
        <div className="card-3d p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-theme">Track brokers:</span>
            {selectedBrokers.map(n => (
              <span key={n} className="flex items-center gap-1 bg-accent-theme/10 text-accent-theme px-2 py-0.5 rounded-lg text-xs font-medium">
                #{n}
                <button onClick={() => removeBroker(n)} className="hover:text-primary-theme"><X className="h-3 w-3" /></button>
              </span>
            ))}
            {selectedBrokers.length < 8 && (
              <div className="flex items-center gap-1">
                <input
                  value={brokerInput}
                  onChange={e => setBrokerInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addBroker()}
                  placeholder="1-91"
                  className="bg-card-theme border border-theme rounded px-2 py-1 text-xs text-primary-theme w-14 focus:outline-none focus:border-accent-theme"
                />
                <button onClick={addBroker} className="text-accent-theme hover:text-accent-theme"><Zap className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="card-3d h-48 animate-pulse bg-input-theme" />)}
        </div>
      ) : (
        <>
          {/* ═══ MARKET TRENDS ═══ */}
          {tab === "trends" && trends && (
            <div className="space-y-4">
              {/* Buy/Sell Ratio Trend */}
              <div className="card-3d p-5">
                <h3 className="text-sm font-semibold text-primary-theme mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent-theme" />
                  Market Buy/Sell Ratio Trend
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trends.marketTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: "#8892a0" }} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#8892a0" }} />
                    <Line type="monotone" dataKey="buySellRatio" stroke="#D4A017" strokeWidth={2} dot={false} name="Buy/Sell Ratio" />
                    <Line type="monotone" dataKey={() => 1} stroke="#8892a060" strokeDasharray="5 5" strokeWidth={1} dot={false} name="Neutral (1.0)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Net Buyers vs Sellers */}
              <div className="card-3d p-5">
                <h3 className="text-sm font-semibold text-primary-theme mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-theme" />
                  Net Buyers vs Sellers Over Time
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={trends.marketTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: "#8892a0" }} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#8892a0" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="netBuyers" fill="#22c55e" radius={[2, 2, 0, 0]} name="Net Buyers" />
                    <Bar dataKey="netSellers" fill="#ef4444" radius={[2, 2, 0, 0]} name="Net Sellers" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Market Turnover Trend */}
              <div className="card-3d p-5">
                <h3 className="text-sm font-semibold text-primary-theme mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-theme" />
                  Total Market Turnover
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={trends.marketTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={v => formatAmt(v)} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#8892a0" }} formatter={(v) => formatAmt(Number(v))} />
                    <Bar dataKey="turnover" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Turnover" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Selected Broker Trends */}
              {Object.keys(trends.brokerTrends).length > 0 && (
                <div className="card-3d p-5">
                  <h3 className="text-sm font-semibold text-primary-theme mb-3">Selected Broker Buy/Sell Trends</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={(trends.brokerTrends as any)[Object.keys(trends.brokerTrends)[0]] || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={v => formatAmt(v)} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#8892a0" }} formatter={(v) => formatAmt(Number(v))} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {Object.entries(trends.brokerTrends).map(([bNo, data], i) => (
                        <Line key={`buy-${bNo}`} type="monotone" data={data} dataKey="buyAmt"
                          stroke={COLORS[i % COLORS.length]} strokeWidth={1.5} dot={false}
                          name={`#${bNo} Buy`} strokeDasharray={i > 3 ? "5 3" : undefined} />
                      ))}
                      {Object.entries(trends.brokerTrends).map(([bNo, data], i) => (
                        <Line key={`sell-${bNo}`} type="monotone" data={data} dataKey="sellAmt"
                          stroke={COLORS[i % COLORS.length]} strokeWidth={1.5} dot={false}
                          name={`#${bNo} Sell`} strokeDasharray="3 3" opacity={0.6} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-2 flex gap-3 text-[10px] text-muted-theme">
                    <span>Solid = Buy</span><span>Dashed = Sell</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ BROKER RANKINGS ═══ */}
          {tab === "ranking" && rankings && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="card-3d p-4">
                  <div className="text-xs text-muted-theme">Total Brokers</div>
                  <div className="text-xl font-bold text-primary-theme font-mono">{rankings.totalBrokers}</div>
                </div>
                <div className="card-3d p-4">
                  <div className="text-xs text-muted-theme">Analyzed Days</div>
                  <div className="text-xl font-bold text-primary-theme font-mono">{rankings.days}</div>
                </div>
                <div className="card-3d p-4">
                  <div className="text-xs text-muted-theme">Avg Turnover</div>
                  <div className="text-xl font-bold text-accent-theme font-mono">
                    {formatAmt(rankings.rankings.reduce((s, r) => s + r.avgTurnover, 0) / rankings.rankings.length)}
                  </div>
                </div>
                <div className="card-3d p-4">
                  <div className="text-xs text-muted-theme">Net Buyer Ratio</div>
                  <div className="text-xl font-bold text-green-theme font-mono">
                    {((rankings.rankings.filter(r => r.netDirection === "net_buy").length / rankings.totalBrokers) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-theme" />
                <span className="text-xs text-muted-theme">Rank by:</span>
                {(["score", "turnover", "consistency", "participation", "netQty"] as const).map(s => (
                  <button key={s} onClick={() => setRankingSort(s)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      rankingSort === s ? "bg-accent-theme text-primary-theme" : "bg-input-theme text-body-theme border border-theme hover:bg-hover-theme"
                    }`}>
                    {s === "score" ? "Score" : s === "turnover" ? "Turnover" : s === "consistency" ? "Consistency" : s === "participation" ? "Activity" : "Net Position"}
                  </button>
                ))}
              </div>

              {/* Score Distribution Chart */}
              <div className="card-3d p-5">
                <h3 className="text-sm font-semibold text-primary-theme mb-3">Score Distribution (Top 30)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={rankings.rankings.slice(0, 30)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="brokerNo" tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={v => `#${v}`} />
                    <YAxis tick={{ fontSize: 10, fill: "#8892a0" }} domain={[0, 1]} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#8892a0" }}
                      formatter={(v, name) => [Number(v).toFixed(4), name === "score" ? "Score" : name === "turnoverScore" ? "Turnover" : name === "consistencyScore" ? "Consistency" : "Participation"]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="score" fill="#D4A017" radius={[2, 2, 0, 0]} name="Score" />
                    <Bar dataKey="turnoverScore" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Turnover" opacity={0.7} />
                    <Bar dataKey="consistencyScore" fill="#22c55e" radius={[2, 2, 0, 0]} name="Consistency" opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Rankings Table */}
              <div className="card-3d overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="table-header">
                        <th className="text-left px-4 py-3 text-xs">#</th>
                        <th className="text-left px-4 py-3 text-xs">Broker</th>
                        <th className="text-right px-4 py-3 text-xs">Score</th>
                        <th className="text-right px-4 py-3 text-xs">Turnover</th>
                        <th className="text-right px-4 py-3 text-xs">Avg Turn.</th>
                        <th className="text-right px-4 py-3 text-xs">Consistency</th>
                        <th className="text-right px-4 py-3 text-xs">Activity</th>
                        <th className="text-right px-4 py-3 text-xs">Net</th>
                        <th className="text-center px-4 py-3 text-xs">Direction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.rankings.map((r, i) => (
                        <tr key={r.brokerNo} className="table-row">
                          <td className="px-4 py-2.5 text-muted-theme font-mono text-xs">{i + 1}</td>
                          <td className="px-4 py-2.5 font-bold text-primary-theme">#{r.brokerNo}</td>
                          <td className="text-right px-4 py-2.5 font-mono text-accent-theme font-bold">{r.score.toFixed(4)}</td>
                          <td className="text-right px-4 py-2.5 font-mono text-body-theme">{formatAmt(r.totalTurnover)}</td>
                          <td className="text-right px-4 py-2.5 font-mono text-body-theme">{formatAmt(r.avgTurnover)}</td>
                          <td className="text-right px-4 py-2.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <div className="w-16 h-1.5 rounded-full bg-kbd-theme overflow-hidden">
                                <div className="h-full rounded-full bg-green-theme" style={{ width: `${r.consistencyScore * 100}%` }} />
                              </div>
                              <span className="font-mono text-xs text-body-theme">{(r.consistencyScore * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="text-right px-4 py-2.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <div className="w-16 h-1.5 rounded-full bg-kbd-theme overflow-hidden">
                                <div className="h-full rounded-full bg-blue-theme" style={{ width: `${r.participationScore * 100}%` }} />
                              </div>
                              <span className="font-mono text-xs text-body-theme">{(r.participationScore * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="text-right px-4 py-2.5">
                            <span className={`font-mono text-xs font-medium ${r.netQty > 0 ? "text-green-theme" : r.netQty < 0 ? "text-red-theme" : "text-muted-theme"}`}>
                              {r.netQty > 0 ? "+" : ""}{formatQty(Math.abs(r.netQty))}
                            </span>
                          </td>
                          <td className="text-center px-4 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                              r.netDirection === "net_buy" ? "bg-green-theme text-green-theme"
                                : r.netDirection === "net_sell" ? "bg-red-theme text-red-theme"
                                : "bg-muted-theme text-muted-theme"
                            }`}>
                              {r.netDirection === "net_buy" ? "Buyer" : r.netDirection === "net_sell" ? "Seller" : "Neutral"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══ BROKER COMPARISON ═══ */}
          {tab === "compare" && compare && (
            <div className="space-y-4">
              {compare.comparisons.map((comp, idx) => (
                <div key={comp.brokerNo} className="card-3d p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-primary-theme flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                      Broker #{comp.brokerNo}
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                        comp.summary.netDirection === "net_buy" ? "bg-green-theme text-green-theme"
                          : comp.summary.netDirection === "net_sell" ? "bg-red-theme text-red-theme"
                          : "bg-muted-theme text-muted-theme"
                      }`}>
                        {comp.summary.netDirection === "net_buy" ? "Net Buyer" : comp.summary.netDirection === "net_sell" ? "Net Seller" : "Neutral"}
                      </span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-lg bg-input-theme border border-theme p-3">
                      <div className="text-[10px] text-muted-theme uppercase">Total Turnover</div>
                      <div className="text-sm font-bold text-accent-theme font-mono">{formatAmt(comp.summary.totalTurnover)}</div>
                    </div>
                    <div className="rounded-lg bg-input-theme border border-theme p-3">
                      <div className="text-[10px] text-muted-theme uppercase">Avg Turnover</div>
                      <div className="text-sm font-bold text-primary-theme font-mono">{formatAmt(comp.summary.avgTurnover)}</div>
                    </div>
                    <div className="rounded-lg bg-input-theme border border-theme p-3">
                      <div className="text-[10px] text-muted-theme uppercase">Buy/Sell Ratio</div>
                      <div className={`text-sm font-bold font-mono ${comp.summary.buyRatio > 1 ? "text-green-theme" : "text-red-theme"}`}>
                        {comp.summary.buyRatio}x
                      </div>
                    </div>
                    <div className="rounded-lg bg-input-theme border border-theme p-3">
                      <div className="text-[10px] text-muted-theme uppercase">Buy Days / Sell Days</div>
                      <div className="text-sm font-bold font-mono">
                        <span className="text-green-theme">{comp.summary.netBuyDays}</span>
                        <span className="text-muted-theme"> / </span>
                        <span className="text-red-theme">{comp.summary.netSellDays}</span>
                      </div>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={comp.daily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={v => formatAmt(v)} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#8892a0" }} formatter={(v) => formatAmt(Number(v))} />
                      <Bar dataKey="buyAmt" fill="#22c55e" radius={[2, 2, 0, 0]} name="Buy" />
                      <Bar dataKey="sellAmt" fill="#ef4444" radius={[2, 2, 0, 0]} name="Sell" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}

              {/* Overlaid Comparison Chart */}
              {compare.comparisons.length >= 2 && (
                <div className="card-3d p-5">
                  <h3 className="text-sm font-semibold text-primary-theme mb-3">Turnover Comparison (Overlaid)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={compare.comparisons[0].daily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={v => formatAmt(v)} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#8892a0" }} formatter={(v) => formatAmt(Number(v))} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {compare.comparisons.map((comp, i) => (
                        <Line key={comp.brokerNo} type="monotone" data={comp.daily} dataKey="turnover"
                          stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false}
                          name={`#${comp.brokerNo}`} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Radar Comparison */}
              {compare.comparisons.length >= 2 && (
                <div className="card-3d p-5">
                  <h3 className="text-sm font-semibold text-primary-theme mb-3">Broker Profile Comparison</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={[
                      { metric: "Turnover", ...Object.fromEntries(compare.comparisons.map((c, i) => [`b${c.brokerNo}`, c.summary.totalTurnover / Math.max(...compare.comparisons.map(x => x.summary.totalTurnover))])), },
                      { metric: "Buy Ratio", ...Object.fromEntries(compare.comparisons.map((c, i) => [`b${c.brokerNo}`, Math.min(c.summary.buyRatio / 2, 1)])), },
                      { metric: "Buy Days", ...Object.fromEntries(compare.comparisons.map((c, i) => [`b${c.brokerNo}`, c.summary.netBuyDays / Math.max(...compare.comparisons.map(x => Math.max(x.summary.netBuyDays, x.summary.netSellDays)))])), },
                      { metric: "Consistency", ...Object.fromEntries(compare.comparisons.map((c, i) => {
                        const avg = c.summary.avgTurnover;
                        const range = c.summary.maxTurnover - c.summary.minTurnover;
                        return [`b${c.brokerNo}`, avg > 0 ? Math.max(0, 1 - range / (avg * 2)) : 0.5];
                      })), },
                      { metric: "Volume", ...Object.fromEntries(compare.comparisons.map((c, i) => [`b${c.brokerNo}`, c.daily.reduce((s, d) => s + d.buyAmt + d.sellAmt, 0) / Math.max(...compare.comparisons.map(x => x.daily.reduce((s, d) => s + d.buyAmt + d.sellAmt, 0)))])), },
                    ]}>
                      <PolarGrid stroke="#27272a" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#8892a0" }} />
                      <PolarRadiusAxis tick={{ fontSize: 9, fill: "#8892a0" }} domain={[0, 1]} />
                      {compare.comparisons.map((comp, i) => (
                        <Radar key={comp.brokerNo} name={`#${comp.brokerNo}`} dataKey={`b${comp.brokerNo}`}
                          stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.15} strokeWidth={2} />
                      ))}
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ═══ MARKET PARTICIPATION ═══ */}
          {tab === "participation" && participation && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="card-3d p-4">
                  <div className="text-xs text-muted-theme">Avg Buy/Sell Ratio</div>
                  <div className={`text-xl font-bold font-mono ${participation.summary.avgBuySellRatio > 1 ? "text-green-theme" : "text-red-theme"}`}>
                    {participation.summary.avgBuySellRatio}x
                  </div>
                </div>
                <div className="card-3d p-4">
                  <div className="text-xs text-muted-theme">Trend Direction</div>
                  <div className={`text-xl font-bold font-mono ${
                    participation.summary.trendDirection === "bullish" ? "text-green-theme"
                      : participation.summary.trendDirection === "bearish" ? "text-red-theme" : "text-muted-theme"
                  }`}>
                    {participation.summary.trendDirection === "bullish" ? "Bullish" : participation.summary.trendDirection === "bearish" ? "Bearish" : "Neutral"}
                  </div>
                </div>
                <div className="card-3d p-4">
                  <div className="text-xs text-muted-theme">Bullish Days</div>
                  <div className="text-xl font-bold text-green-theme font-mono">{participation.summary.bullishDays}</div>
                </div>
                <div className="card-3d p-4">
                  <div className="text-xs text-muted-theme">Bearish Days</div>
                  <div className="text-xl font-bold text-red-theme font-mono">{participation.summary.bearishDays}</div>
                </div>
              </div>

              {/* Pie Chart: Avg Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-3d p-5">
                  <h3 className="text-sm font-semibold text-primary-theme mb-3">Avg Broker Distribution</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Net Buyers", value: participation.summary.avgNetBuyers, fill: "#22c55e" },
                          { name: "Net Sellers", value: participation.summary.avgNetSellers, fill: "#ef4444" },
                          { name: "Neutral", value: 91 - participation.summary.avgNetBuyers - participation.summary.avgNetSellers, fill: "#8892a0" },
                        ]}
                        cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value"
                      >
                        {[0, 1, 2].map(i => <Cell key={i} fill={["#22c55e", "#ef4444", "#8892a0"][i]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="card-3d p-5">
                  <h3 className="text-sm font-semibold text-primary-theme mb-3">Buy/Sell Ratio Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={participation.participation}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: "#8892a0" }} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#8892a0" }} />
                      <Line type="monotone" dataKey="buySellRatio" stroke="#D4A017" strokeWidth={2} dot={false} name="Buy/Sell Ratio" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Participation Over Time */}
              <div className="card-3d p-5">
                <h3 className="text-sm font-semibold text-primary-theme mb-3">Market Participation Over Time</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={participation.participation}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: "#8892a0" }} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#8892a0" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="netBuyers" fill="#22c55e" radius={[2, 2, 0, 0]} name="Net Buyers" stackId="a" />
                    <Bar dataKey="netSellers" fill="#ef4444" radius={[0, 0, 0, 0]} name="Net Sellers" stackId="a" />
                    <Bar dataKey="unchanged" fill="#8892a0" radius={[2, 2, 0, 0]} name="Neutral" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Days */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-3d p-5">
                  <h3 className="text-sm font-semibold text-primary-theme mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-theme" />
                    Top Turnover Days
                  </h3>
                  <div className="space-y-2">
                    {participation.topTurnoverDays.map((d, i) => (
                      <div key={d.date} className="flex items-center justify-between py-1.5 border-b border-theme last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-theme w-5">{i + 1}.</span>
                          <span className="text-sm text-primary-theme font-mono">{d.date}</span>
                        </div>
                        <span className="text-sm font-bold text-accent-theme font-mono">{formatAmt(d.turnover)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-3d p-5">
                  <h3 className="text-sm font-semibold text-primary-theme mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-theme" />
                    Strongest Buyer Days
                  </h3>
                  <div className="space-y-2">
                    {participation.strongestBuyerDays.map((d, i) => (
                      <div key={d.date} className="flex items-center justify-between py-1.5 border-b border-theme last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-theme w-5">{i + 1}.</span>
                          <span className="text-sm text-primary-theme font-mono">{d.date}</span>
                        </div>
                        <span className="text-sm font-bold text-green-theme font-mono">{d.buySellRatio}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
