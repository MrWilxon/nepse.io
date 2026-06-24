"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Building2, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Search, ArrowUpRight, ArrowDownRight, Minus, Package } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface StockData {
  symbol: string;
  name: string;
  sector: string;
  buyQty: number;
  sellQty: number;
  buyAmt: number;
  sellAmt: number;
  netQty: number;
  netAmt: number;
  brokerCount: number;
  trades: number;
}

interface BrokerData {
  brokerNo: number;
  buyQty: number;
  sellQty: number;
  buyAmt: number;
  sellAmt: number;
  netQty: number;
  netAmt: number;
  stocksTraded: number;
}

interface SectorData {
  sector: string;
  buyQty: number;
  sellQty: number;
  buyAmt: number;
  sellAmt: number;
  netQty: number;
  netAmt: number;
}

interface AggregatedData {
  stocks: StockData[];
  brokers: BrokerData[];
  sectorFlow: SectorData[];
  summary: {
    totalStocks: number;
    totalBrokers: number;
    totalVolume: number;
    netBuy: number;
    netSell: number;
    netSentiment: string;
    date: string;
  };
  source: string;
}

const SECTOR_COLORS: Record<string, string> = {
  "Com. Banks": "#D4A017",
  "Dev. Banks": "#3b82f6",
  "Hydro Power": "#22c55e",
  "Finance": "#f59e0b",
  "Life Insu.": "#8b5cf6",
  "Tourism": "#ec4899",
  "Investment": "#06b6d4",
  "Non Life Insu.": "#f97316",
};

const TABS = ["Stocks", "Brokers", "Sector Flow"] as const;

export default function HoldingsPage() {
  const [data, setData] = useState<AggregatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("Stocks");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("totalVolume");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/holdings/aggregated`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field: string) => {
    if (sortBy === field) setSortAsc(!sortAsc);
    else { setSortBy(field); setSortAsc(false); }
  };

  const formatAmt = (v: number) => {
    if (v >= 1e9) return `Rs ${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `Rs ${(v / 1e6).toFixed(1)}M`;
    return `Rs ${(v / 1e3).toFixed(0)}K`;
  };

  const formatQty = (v: number) => {
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v.toLocaleString();
  };

  const filteredStocks = useMemo(() => {
    if (!data) return [];
    let list = [...data.stocks];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const aVal = a[sortBy as keyof StockData] ?? 0;
      const bVal = b[sortBy as keyof StockData] ?? 0;
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return list;
  }, [data, search, sortBy, sortAsc]);

  const filteredBrokers = useMemo(() => {
    if (!data) return [];
    let list = [...data.brokers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((b) => `broker ${b.brokerNo}`.includes(q));
    }
    list.sort((a, b) => {
      const aVal = a[sortBy as keyof BrokerData] ?? 0;
      const bVal = b[sortBy as keyof BrokerData] ?? 0;
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return list;
  }, [data, search, sortBy, sortAsc]);

  const sectorChartData = useMemo(() => {
    if (!data) return [];
    return data.sectorFlow.map((s) => ({
      name: s.sector,
      net: Number((s.netAmt / 1e6).toFixed(1)),
      buy: Number((s.buyAmt / 1e6).toFixed(1)),
      sell: Number((s.sellAmt / 1e6).toFixed(1)),
      color: SECTOR_COLORS[s.sector] || "#6b7280",
    }));
  }, [data]);

  const topBrokersData = useMemo(() => {
    if (!data) return [];
    return data.brokers.slice(0, 10).map((b) => ({
      name: `B${b.brokerNo}`,
      net: Number((b.netAmt / 1e6).toFixed(1)),
      buy: Number((b.buyAmt / 1e6).toFixed(1)),
      sell: Number((b.sellAmt / 1e6).toFixed(1)),
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--bg-secondary)]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card-3d h-24 animate-pulse bg-[var(--bg-secondary)]" />)}
        </div>
      </div>
    );
  }

  if (!data || data.source === "empty") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Broker Holdings</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Real broker activity from floorsheet data</p>
        </div>
        <div className="card-3d flex flex-col items-center justify-center py-16 text-center">
          <Package className="mb-4 h-12 w-12 text-[var(--text-dim)]" />
          <h3 className="text-lg font-medium text-[var(--text-primary)]">No Floorsheet Data Available</h3>
          <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">
            Broker holdings are calculated from the daily floorsheet. The floorsheet has not been scraped yet today.
          </p>
          <button
            onClick={() => { setLoading(true); fetch(`${API_BASE}/api/floorsheet/scrape`).then(() => window.location.reload()); }}
            className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black hover:bg-[var(--accent-hover)]"
          >
            Scrape Floorsheet Now
          </button>
        </div>
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Broker Holdings</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Real broker activity from floorsheet · {summary.date || "Today"} · {summary.totalStocks} stocks · {summary.totalBrokers} brokers
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="card-3d p-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Total Volume</span>
          </div>
          <div className="mt-1 text-lg font-bold font-mono text-[var(--text-primary)]">
            {formatAmt(summary.totalVolume)}
          </div>
          <div className="mt-1 text-[10px] text-[var(--text-dim)]">
            buy + sell turnover
          </div>
        </div>
        <div className="card-3d p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--green)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Net Buy</span>
          </div>
          <div className={`mt-1 text-lg font-bold font-mono ${summary.netBuy >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
            {summary.netBuy >= 0 ? "+" : ""}{formatAmt(Math.abs(summary.netBuy))}
          </div>
          <div className="mt-1 text-[10px] text-[var(--text-dim)]">
            net institutional flow
          </div>
        </div>
        <div className="card-3d p-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[var(--blue)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Active Brokers</span>
          </div>
          <div className="mt-1 text-lg font-bold font-mono text-[var(--text-primary)]">
            {summary.totalBrokers}
          </div>
          <div className="mt-1 text-[10px] text-[var(--text-dim)]">
            of 91 total
          </div>
        </div>
        <div className="card-3d p-5">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-[10px] text-[var(--text-muted)]">Market Sentiment</span>
          </div>
          <div className={`mt-1 text-lg font-bold ${summary.netSentiment === "bullish" ? "text-[var(--green)]" : summary.netSentiment === "bearish" ? "text-[var(--red)]" : "text-[var(--text-muted)]"}`}>
            {summary.netSentiment === "bullish" ? "Bullish" : summary.netSentiment === "bearish" ? "Bearish" : "Neutral"}
          </div>
          <div className="mt-1 text-[10px] text-[var(--text-dim)]">
            based on net flow
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sector Flow */}
        <div className="card-3d p-6">
          <h2 className="mb-4 text-sm font-medium text-[var(--text-muted)]">Net Flow by Sector (Rs Millions)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sectorChartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickFormatter={(v) => `${v}M`} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "0.5rem", color: "var(--text-primary)" }}
                formatter={(value: any) => [`Rs ${value}M`]}
              />
              <Bar dataKey="net" radius={[0, 4, 4, 0]}>
                {sectorChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.net >= 0 ? "#22c55e" : "#ef4444"} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Brokers */}
        <div className="card-3d p-6">
          <h2 className="mb-4 text-sm font-medium text-[var(--text-muted)]">Top 10 Brokers by Volume (Rs Millions)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topBrokersData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickFormatter={(v) => `${v}M`} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "0.5rem", color: "var(--text-primary)" }}
                formatter={(value: any, name: any) => [`Rs ${value}M`, name === "buy" ? "Buy" : name === "sell" ? "Sell" : "Net"]}
              />
              <Bar dataKey="buy" fill="#22c55e" radius={[2, 2, 0, 0]} opacity={0.7} />
              <Bar dataKey="sell" fill="#ef4444" radius={[2, 2, 0, 0]} opacity={0.7} />
              <Bar dataKey="net" radius={[2, 2, 0, 0]}>
                {topBrokersData.map((entry, i) => (
                  <Cell key={i} fill={entry.net >= 0 ? "#D4A017" : "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-[var(--bg-secondary)] p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSortBy(t === "Stocks" ? "totalVolume" : t === "Brokers" ? "buyAmt" : "netAmt"); setSortAsc(false); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t
                  ? "bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder={tab === "Stocks" ? "Search stock..." : tab === "Brokers" ? "Search broker..." : "Search sector..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] pl-8 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>

      {/* Stocks Table */}
      {tab === "Stocks" && (
        <div className="card-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">Sector</th>
                  <th className="px-4 py-3 text-right cursor-pointer hover:text-[var(--accent)]" onClick={() => handleSort("buyAmt")}>
                    Buy {sortBy === "buyAmt" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-4 py-3 text-right cursor-pointer hover:text-[var(--accent)]" onClick={() => handleSort("sellAmt")}>
                    Sell {sortBy === "sellAmt" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-4 py-3 text-right cursor-pointer hover:text-[var(--accent)]" onClick={() => handleSort("netAmt")}>
                    Net {sortBy === "netAmt" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-4 py-3 text-right cursor-pointer hover:text-[var(--accent)]" onClick={() => handleSort("brokerCount")}>
                    Brokers {sortBy === "brokerCount" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-4 py-3 text-right cursor-pointer hover:text-[var(--accent)]" onClick={() => handleSort("trades")}>
                    Trades {sortBy === "trades" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((s) => (
                  <tr key={s.symbol} className="table-row">
                    <td className="px-4 py-3">
                      <a href={`/company/${s.symbol}`} className="font-bold text-[var(--text-primary)] hover:text-[var(--accent)]">{s.symbol}</a>
                      <div className="text-[10px] text-[var(--text-dim)]">{s.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${SECTOR_COLORS[s.sector] || "#6b7280"}20`, color: SECTOR_COLORS[s.sector] || "#6b7280" }}>
                        {s.sector}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--green)]">{formatAmt(s.buyAmt)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--red)]">{formatAmt(s.sellAmt)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-0.5 font-mono text-xs font-bold ${s.netAmt >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                        {s.netAmt >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {formatAmt(Math.abs(s.netAmt))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-primary)]">{s.brokerCount}</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-muted)]">{s.trades}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredStocks.length === 0 && (
            <div className="flex h-32 items-center justify-center text-xs text-[var(--text-muted)]">No stocks match your search</div>
          )}
        </div>
      )}

      {/* Brokers Table */}
      {tab === "Brokers" && (
        <div className="card-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left cursor-pointer hover:text-[var(--accent)]" onClick={() => handleSort("brokerNo")}>
                    Broker {sortBy === "brokerNo" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-4 py-3 text-right cursor-pointer hover:text-[var(--accent)]" onClick={() => handleSort("buyAmt")}>
                    Buy {sortBy === "buyAmt" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-4 py-3 text-right cursor-pointer hover:text-[var(--accent)]" onClick={() => handleSort("sellAmt")}>
                    Sell {sortBy === "sellAmt" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-4 py-3 text-right cursor-pointer hover:text-[var(--accent)]" onClick={() => handleSort("netAmt")}>
                    Net {sortBy === "netAmt" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-4 py-3 text-center">Sentiment</th>
                  <th className="px-4 py-3 text-right cursor-pointer hover:text-[var(--accent)]" onClick={() => handleSort("stocksTraded")}>
                    Stocks {sortBy === "stocksTraded" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBrokers.map((b) => (
                  <tr key={b.brokerNo} className="table-row">
                    <td className="px-4 py-3">
                      <a href={`/brokers/${b.brokerNo}`} className="font-bold text-[var(--text-primary)] hover:text-[var(--accent)]">
                        Broker {b.brokerNo}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--green)]">{formatAmt(b.buyAmt)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--red)]">{formatAmt(b.sellAmt)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-0.5 font-mono text-xs font-bold ${b.netAmt >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                        {b.netAmt >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {formatAmt(Math.abs(b.netAmt))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${b.netAmt >= 0 ? "bg-[var(--green-bg)] text-[var(--green)]" : "bg-[var(--red-bg)] text-[var(--red)]"}`}>
                        {b.netAmt >= 0 ? "Net Buyer" : "Net Seller"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-muted)]">{b.stocksTraded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sector Flow Table */}
      {tab === "Sector Flow" && (
        <div className="card-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Sector</th>
                  <th className="px-4 py-3 text-right">Buy Volume</th>
                  <th className="px-4 py-3 text-right">Sell Volume</th>
                  <th className="px-4 py-3 text-right">Buy Value</th>
                  <th className="px-4 py-3 text-right">Sell Value</th>
                  <th className="px-4 py-3 text-right">Net Value</th>
                  <th className="px-4 py-3 text-center">Flow</th>
                </tr>
              </thead>
              <tbody>
                {data.sectorFlow.filter((s) => !search || s.sector.toLowerCase().includes(search.toLowerCase())).map((s) => (
                  <tr key={s.sector} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: SECTOR_COLORS[s.sector] || "#6b7280" }} />
                        <span className="font-medium text-[var(--text-primary)]">{s.sector}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--green)]">{formatQty(s.buyQty)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--red)]">{formatQty(s.sellQty)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--green)]">{formatAmt(s.buyAmt)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--red)]">{formatAmt(s.sellAmt)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-0.5 font-mono text-xs font-bold ${s.netAmt >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                        {s.netAmt >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {formatAmt(Math.abs(s.netAmt))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="mx-auto h-2 w-24 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                        <div
                          className={`h-full ${s.netAmt >= 0 ? "bg-[var(--green)]" : "bg-[var(--red)]"}`}
                          style={{ width: `${Math.min(100, (Math.abs(s.netAmt) / (s.buyAmt + s.sellAmt || 1)) * 100)}%` }}
                        />
                      </div>
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
