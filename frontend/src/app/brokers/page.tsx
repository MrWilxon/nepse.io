"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, ArrowUpDown, ChevronDown, ChevronUp, Activity, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import type { BrokersResponse, BrokerData, BrokerDetailResponse } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function formatQty(qty: number): string {
  if (qty >= 1e7) return `${(qty / 1e7).toFixed(2)}Cr`;
  if (qty >= 1e5) return `${(qty / 1e5).toFixed(2)}L`;
  if (qty >= 1e3) return `${(qty / 1e3).toFixed(1)}K`;
  return qty.toLocaleString();
}

function formatAmt(amt: number): string {
  if (amt >= 1e9) return `${(amt / 1e9).toFixed(2)}Cr`;
  if (amt >= 1e7) return `${(amt / 1e7).toFixed(2)}L`;
  if (amt >= 1e5) return `${(amt / 1e5).toFixed(1)}K`;
  return `Rs ${amt.toLocaleString()}`;
}

function formatTurnover(amt: number): string {
  if (amt >= 1e9) return `${(amt / 1e9).toFixed(2)}Cr`;
  if (amt >= 1e7) return `${(amt / 1e7).toFixed(2)}L`;
  if (amt >= 1e5) return `${(amt / 1e5).toFixed(1)}K`;
  return amt.toLocaleString();
}

type SortField = "brokerNo" | "buyQty" | "buyAmt" | "sellQty" | "sellAmt" | "turnover" | "netQty";

export default function BrokersPage() {
  const [data, setData] = useState<BrokersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>("turnover");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [tab, setTab] = useState<"turnover" | "volume" | "chart">("turnover");
  const [selectedBroker, setSelectedBroker] = useState<number | null>(null);
  const [detail, setDetail] = useState<BrokerDetailResponse | null>(null);

  const fetchData = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/brokers?sortBy=${sortBy}&sortDir=${sortDir}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [sortBy, sortDir]);

  useEffect(() => {
    if (selectedBroker) {
      fetch(`${API_BASE}/api/brokers/${selectedBroker}`)
        .then((r) => r.json())
        .then(setDetail);
    }
  }, [selectedBroker]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 text-muted-theme" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3 text-accent-theme" /> : <ChevronDown className="h-3 w-3 text-accent-theme" />;
  };

  const chartData = data?.brokers.slice(0, 20).map((b) => ({
    name: `#${b.brokerNo}`,
    buy: b.buyAmt,
    sell: b.sellAmt,
    turnover: b.turnover,
    net: b.netQty,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-theme flex items-center gap-2">
            <Users className="h-6 w-6 text-accent-theme" />
            Top Brokers
            <span className="text-sm font-normal text-muted-theme">(1D)</span>
          </h1>
          <p className="text-muted-theme text-sm mt-0.5">Broker-wise buy/sell trading statistics &middot; {data?.date || ""}</p>
        </div>
        <div className="flex gap-2">
          {(["turnover", "volume", "chart"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === t
                  ? "bg-accent-theme text-primary-theme"
                  : "bg-input-theme text-body-theme border border-theme hover:bg-hover-theme"
              }`}
            >
              {t === "turnover" ? "Turn." : t === "volume" ? "Vol." : "Chart"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-3d p-4">
            <div className="text-xs text-muted-theme">Total Brokers</div>
            <div className="text-xl font-bold text-primary-theme font-mono">{data.totalBrokers}</div>
          </div>
          <div className="card-3d p-4">
            <div className="text-xs text-muted-theme">Net Buyers</div>
            <div className="text-xl font-bold text-green-theme font-mono">{data.summary.netBuyers}</div>
          </div>
          <div className="card-3d p-4">
            <div className="text-xs text-muted-theme">Net Sellers</div>
            <div className="text-xl font-bold text-red-theme font-mono">{data.summary.netSellers}</div>
          </div>
          <div className="card-3d p-4">
            <div className="text-xs text-muted-theme">Total Turnover</div>
            <div className="text-xl font-bold text-accent-theme font-mono">{formatTurnover(data.summary.totalTurnover)}</div>
          </div>
        </div>
      )}

      {/* Chart View */}
      {tab === "chart" && (
        <div className="card-3d p-5">
          <h3 className="text-sm font-semibold text-primary-theme mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent-theme" />
            Top 20 Brokers by Turnover
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8892a0" }} />
              <YAxis tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={(v) => formatTurnover(v)} />
              <Tooltip
                contentStyle={{ background: "#13131a", border: "1px solid #27272a", borderRadius: "0.5rem", fontSize: 12, color: "#f0f0f5" }}
                labelStyle={{ color: "#8892a0" }}
              />
              <Bar dataKey="buy" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="sell" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table View */}
      {tab !== "chart" && (
        <div className="card-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3 cursor-pointer" onClick={() => handleSort("brokerNo")}>
                    <span className="flex items-center gap-1">BNo <span className="text-[10px] text-muted-theme">({data?.totalBrokers || 91})</span> <SortIcon field="brokerNo" /></span>
                  </th>
                  <th className="text-right px-4 py-3 cursor-pointer" onClick={() => handleSort("buyQty")}>
                    <span className="flex items-center justify-end gap-1">B.Qty <SortIcon field="buyQty" /></span>
                  </th>
                  <th className="text-right px-4 py-3 cursor-pointer" onClick={() => handleSort("buyAmt")}>
                    <span className="flex items-center justify-end gap-1">B.Amt <SortIcon field="buyAmt" /></span>
                  </th>
                  <th className="text-right px-4 py-3 cursor-pointer" onClick={() => handleSort("sellQty")}>
                    <span className="flex items-center justify-end gap-1">S.Qty <SortIcon field="sellQty" /></span>
                  </th>
                  <th className="text-right px-4 py-3 cursor-pointer" onClick={() => handleSort("sellAmt")}>
                    <span className="flex items-center justify-end gap-1">S.Amt <SortIcon field="sellAmt" /></span>
                  </th>
                  <th className="text-right px-4 py-3 cursor-pointer" onClick={() => handleSort("turnover")}>
                    <span className="flex items-center justify-end gap-1 text-accent-theme">Turn. <SortIcon field="turnover" /></span>
                  </th>
                  <th className="text-right px-4 py-3 cursor-pointer" onClick={() => handleSort("netQty")}>
                    <span className="flex items-center justify-end gap-1">Net <SortIcon field="netQty" /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 15 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-8 rounded bg-input-theme animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : (
                  data?.brokers.map((b) => (
                    <tr
                      key={b.brokerNo}
                      className={`table-row cursor-pointer ${selectedBroker === b.brokerNo ? "bg-accent-theme/5" : ""}`}
                      onClick={() => setSelectedBroker(selectedBroker === b.brokerNo ? null : b.brokerNo)}
                    >
                      <td className="px-4 py-2.5 font-bold text-primary-theme">#{b.brokerNo}</td>
                      <td className="text-right px-4 py-2.5 font-mono text-body-theme">{formatQty(b.buyQty)}</td>
                      <td className="text-right px-4 py-2.5 font-mono text-body-theme">{formatAmt(b.buyAmt)}</td>
                      <td className="text-right px-4 py-2.5 font-mono text-body-theme">{formatQty(b.sellQty)}</td>
                      <td className="text-right px-4 py-2.5 font-mono text-body-theme">{formatAmt(b.sellAmt)}</td>
                      <td className="text-right px-4 py-2.5 font-mono text-accent-theme font-bold">{formatTurnover(b.turnover)}</td>
                      <td className="text-right px-4 py-2.5">
                        <span className={`font-mono text-xs font-medium ${b.netQty > 0 ? "text-green-theme" : b.netQty < 0 ? "text-red-theme" : "text-muted-theme"}`}>
                          {b.netQty > 0 ? "+" : ""}{formatQty(Math.abs(b.netQty))}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Broker Detail Panel */}
      {detail && selectedBroker && (
        <div className="card-3d p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary-theme flex items-center gap-2">
              Broker #{detail.broker.brokerNo}
              <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                detail.broker.netDirection === "net_buy" ? "bg-green-theme text-green-theme" : "bg-red-theme text-red-theme"
              }`}>
                {detail.broker.netDirection === "net_buy" ? "Net Buyer" : "Net Seller"}
              </span>
            </h2>
            <button onClick={() => setSelectedBroker(null)} className="text-muted-theme hover:text-primary-theme text-sm">Close</button>
          </div>

          {/* Broker Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-input-theme border border-theme p-3">
              <div className="text-[10px] text-muted-theme uppercase">Buy Qty</div>
              <div className="text-sm font-bold text-green-theme font-mono">{formatQty(detail.broker.buyQty)}</div>
            </div>
            <div className="rounded-lg bg-input-theme border border-theme p-3">
              <div className="text-[10px] text-muted-theme uppercase">Buy Amount</div>
              <div className="text-sm font-bold text-green-theme font-mono">{formatAmt(detail.broker.buyAmt)}</div>
            </div>
            <div className="rounded-lg bg-input-theme border border-theme p-3">
              <div className="text-[10px] text-muted-theme uppercase">Sell Qty</div>
              <div className="text-sm font-bold text-red-theme font-mono">{formatQty(detail.broker.sellQty)}</div>
            </div>
            <div className="rounded-lg bg-input-theme border border-theme p-3">
              <div className="text-[10px] text-muted-theme uppercase">Sell Amount</div>
              <div className="text-sm font-bold text-red-theme font-mono">{formatAmt(detail.broker.sellAmt)}</div>
            </div>
          </div>

          {/* 30-Day Turnover Chart */}
          {detail.history.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-primary-theme mb-2">30-Day Turnover History</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={detail.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={(v) => formatTurnover(v)} />
                  <Tooltip
                    contentStyle={{ background: "#13131a", border: "1px solid #27272a", borderRadius: "0.5rem", fontSize: 12, color: "#f0f0f5" }}
                    labelStyle={{ color: "#8892a0" }}
                  />
                  <Bar dataKey="totalTurnover" radius={[3, 3, 0, 0]}>
                    {detail.history.map((_, i) => (
                      <Cell key={i} fill={i === detail.history.length - 1 ? "#D4A017" : "#D4A01760"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
