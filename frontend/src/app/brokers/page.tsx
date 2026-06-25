"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, ArrowUpDown, ChevronDown, ChevronUp,
  Activity, Users, Search, Star, Download, Filter, ChevronLeft, ChevronRight,
  PieChart, Layers, X,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { API_BASE, getBrokerName, type BrokersResponse, type BrokerData, type BrokerDetailResponse, type BrokerHoldingsResponse, type TopStocksByBrokerResponse, type BrokerHoldingStock, type BrokerTopTradesResponse, type BrokerTopTradeBroker } from "@/lib/api";

const PAGE_SIZE = 25;

function formatQty(qty: number): string {
  if (qty >= 1e7) return `${(qty / 1e7).toFixed(2)}Cr`;
  if (qty >= 1e5) return `${(qty / 1e5).toFixed(2)}L`;
  if (qty >= 1e3) return `${(qty / 1e3).toFixed(1)}K`;
  return qty.toLocaleString();
}

function formatAmt(amt: number): string {
  if (amt >= 1e9) return `Rs ${(amt / 1e9).toFixed(2)}B`;
  if (amt >= 1e7) return `Rs ${(amt / 1e7).toFixed(2)}Cr`;
  if (amt >= 1e5) return `Rs ${(amt / 1e5).toFixed(1)}L`;
  if (amt >= 1e3) return `Rs ${(amt / 1e3).toFixed(1)}K`;
  return `Rs ${amt.toLocaleString()}`;
}

function formatTurnover(amt: number): string {
  if (amt >= 1e9) return `${(amt / 1e9).toFixed(2)}Cr`;
  if (amt >= 1e7) return `${(amt / 1e7).toFixed(2)}L`;
  if (amt >= 1e5) return `${(amt / 1e5).toFixed(1)}K`;
  return amt.toLocaleString();
}

type SortField = "brokerNo" | "buyQty" | "buyAmt" | "sellQty" | "sellAmt" | "turnover" | "netQty" | "marketShare" | "buyRatio";
type FilterPreset = "all" | "netBuyers" | "netSellers" | "favorites";

const FAVORITES_KEY = "nepse_broker_favorites";

function loadFavorites(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveFavorites(favs: number[]) {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs)); } catch {}
}

function downloadCSV(brokers: BrokerData[], summary: { totalTurnover: number }, date: string) {
  const header = "Broker #,Broker Name,Buy Qty,Buy Amount,Sell Qty,Sell Amount,Turnover,Net Qty,Direction,Market Share (%),Buy %";
  const rows = brokers.map(b => {
    const ms = summary.totalTurnover > 0 ? ((b.turnover / summary.totalTurnover) * 100).toFixed(2) : "0.00";
    const buyPct = (b.buyAmt + b.sellAmt) > 0 ? ((b.buyAmt / (b.buyAmt + b.sellAmt)) * 100).toFixed(1) : "50.0";
    const name = getBrokerName(b.brokerNo).replace(/,/g, " ");
    return `${b.brokerNo},${name},${b.buyQty},${b.buyAmt},${b.sellQty},${b.sellAmt},${b.turnover},${b.netQty},${b.netDirection},${ms},${buyPct}`;
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `nepse-brokers-${date}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function BrokersPage() {
  const [data, setData] = useState<BrokersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>("turnover");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [tab, setTab] = useState<"turnover" | "volume" | "chart" | "topstocks" | "bybroker">("turnover");
  const [selectedBroker, setSelectedBroker] = useState<number | null>(null);
  const [detail, setDetail] = useState<BrokerDetailResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPreset, setFilterPreset] = useState<FilterPreset>("all");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [brokerHoldings, setBrokerHoldings] = useState<BrokerHoldingsResponse | null>(null);
  const [topStocks, setTopStocks] = useState<TopStocksByBrokerResponse | null>(null);
  const [loadingHoldings, setLoadingHoldings] = useState(false);
  const [loadingTopStocks, setLoadingTopStocks] = useState(false);
  const [topTrades, setTopTrades] = useState<BrokerTopTradesResponse | null>(null);
  const [loadingTopTrades, setLoadingTopTrades] = useState(false);
  const [tradesViewMode, setTradesViewMode] = useState<"byTurnover" | "byVolume">("byTurnover");
  const [tradesDisplayMode, setTradesDisplayMode] = useState<"table" | "badges">("badges");

  useEffect(() => { setFavorites(loadFavorites()); }, []);

  const toggleFavorite = useCallback((brokerNo: number) => {
    setFavorites(prev => {
      const next = prev.includes(brokerNo) ? prev.filter(n => n !== brokerNo) : [...prev, brokerNo];
      saveFavorites(next);
      return next;
    });
  }, []);

  const fetchData = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/brokers?sortBy=${sortBy}&sortDir=${sortDir}&limit=100`)
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
      setLoadingHoldings(true);
      fetch(`${API_BASE}/api/brokers/${selectedBroker}/holdings`)
        .then((r) => r.json())
        .then((d) => { setBrokerHoldings(d); setLoadingHoldings(false); })
        .catch(() => setLoadingHoldings(false));
    } else {
      setBrokerHoldings(null);
    }
  }, [selectedBroker]);

  useEffect(() => {
    if (tab === "topstocks" && !topStocks) {
      setLoadingTopStocks(true);
      fetch(`${API_BASE}/api/brokers/holdings/top-stocks`)
        .then((r) => r.json())
        .then((d) => { setTopStocks(d); setLoadingTopStocks(false); })
        .catch(() => setLoadingTopStocks(false));
    }
  }, [tab, topStocks]);

  useEffect(() => {
    if (tab === "bybroker") {
      setLoadingTopTrades(true);
      fetch(`${API_BASE}/api/brokers/top-trades?sortBy=${tradesViewMode === "byVolume" ? "volume" : "turnover"}`)
        .then((r) => r.json())
        .then((d) => { setTopTrades(d); setLoadingTopTrades(false); })
        .catch(() => setLoadingTopTrades(false));
    }
  }, [tab, tradesViewMode]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 text-muted-theme" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3 text-accent-theme" /> : <ChevronDown className="h-3 w-3 text-accent-theme" />;
  };

  const allBrokers = data?.brokers || [];

  const filteredBrokers = useMemo(() => {
    let list = [...allBrokers];
    if (filterPreset === "netBuyers") list = list.filter(b => b.netDirection === "net_buy");
    else if (filterPreset === "netSellers") list = list.filter(b => b.netDirection === "net_sell");
    else if (filterPreset === "favorites") list = list.filter(b => favorites.includes(b.brokerNo));
    if (searchQuery) {
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const n = parseInt(q);
        list = list.filter(b =>
          (!isNaN(n) && b.brokerNo === n) ||
          getBrokerName(b.brokerNo).toLowerCase().includes(q)
        );
      }
    }
    return list;
  }, [allBrokers, filterPreset, favorites, searchQuery]);

  useEffect(() => { setPage(1); }, [filterPreset, searchQuery]);

  const totalPages = Math.ceil(filteredBrokers.length / PAGE_SIZE);
  const pagedBrokers = filteredBrokers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalTurnover = data?.summary?.totalTurnover || 0;

  const concentration = useMemo(() => {
    const sorted = [...allBrokers].sort((a, b) => b.turnover - a.turnover);
    const top5 = sorted.slice(0, 5).reduce((s, b) => s + b.turnover, 0);
    const top10 = sorted.slice(0, 10).reduce((s, b) => s + b.turnover, 0);
    const top20 = sorted.slice(0, 20).reduce((s, b) => s + b.turnover, 0);
    return {
      top5: totalTurnover > 0 ? (top5 / totalTurnover * 100).toFixed(1) : "0",
      top10: totalTurnover > 0 ? (top10 / totalTurnover * 100).toFixed(1) : "0",
      top20: totalTurnover > 0 ? (top20 / totalTurnover * 100).toFixed(1) : "0",
    };
  }, [allBrokers, totalTurnover]);

  const chartData = useMemo(() =>
    [...allBrokers].sort((a, b) => b.turnover - a.turnover).slice(0, 20).map((b) => ({
      name: `#${b.brokerNo}`,
      buy: b.buyAmt,
      sell: b.sellAmt,
      turnover: b.turnover,
      net: b.netQty,
    })), [allBrokers]);

  return (
    <div className="space-y-5">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-theme flex items-center gap-2">
            <Users className="h-6 w-6 text-accent-theme" />
            Top Brokers
            <span className="text-sm font-normal text-muted-theme">(1D)</span>
          </h1>
          <p className="text-muted-theme text-sm mt-0.5">Broker-wise buy/sell trading statistics &middot; {data?.date || ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {(["turnover", "volume", "chart", "topstocks", "bybroker"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === t
                  ? "bg-accent-theme text-primary-theme"
                  : "bg-input-theme text-body-theme border border-theme hover:bg-hover-theme"
              }`}
            >
              {t === "turnover" ? "Turn." : t === "volume" ? "Vol." : t === "chart" ? "Chart" : t === "topstocks" ? "Top Stocks" : "By Broker"}
            </button>
          ))}
          <button
            onClick={() => data && downloadCSV(allBrokers, data.summary, data.date)}
            disabled={!data}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-input-theme text-body-theme border border-theme hover:bg-hover-theme transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* ═══ SUMMARY CARDS ═══ */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
          <div className="card-3d p-4 col-span-2 md:col-span-1">
            <div className="text-xs text-muted-theme flex items-center gap-1">
              <Layers className="h-3 w-3" /> Top 5 Share
            </div>
            <div className="text-xl font-bold text-blue-theme font-mono">{concentration.top5}%</div>
            <div className="text-[10px] text-muted-theme mt-1">Top 10: {concentration.top10}% &middot; Top 20: {concentration.top20}%</div>
          </div>
        </div>
      )}

      {/* ═══ CHART VIEW ═══ */}
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

      {/* ═══ TOP STOCKS BY BROKER VIEW ═══ */}
      {tab === "topstocks" && topStocks && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-theme">Data source:</span>
            <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${topStocks.source === "floorsheet" ? "bg-green-theme text-green-theme" : "bg-accent-theme/20 text-accent-theme"}`}>
              {topStocks.source === "floorsheet" ? "Live Floor Sheet" : "Generated Data"}
            </span>
          </div>
          {loadingTopStocks ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="card-3d h-20 animate-pulse bg-input-theme" />)}
            </div>
          ) : (
            <div className="card-3d overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-header">
                      <th className="text-left px-4 py-3">#</th>
                      <th className="text-left px-4 py-3">Symbol</th>
                      <th className="text-right px-4 py-3">Total Buy</th>
                      <th className="text-right px-4 py-3">Total Sell</th>
                      <th className="text-right px-4 py-3">Net</th>
                      <th className="text-right px-4 py-3">Brokers</th>
                      <th className="text-center px-4 py-3">Top Buyer</th>
                      <th className="text-center px-4 py-3">Top Seller</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topStocks.stocks.map((s, i) => {
                      const totalAmt = s.totalBuyAmt + s.totalSellAmt;
                      const buyRatio = totalAmt > 0 ? (s.totalBuyAmt / totalAmt) * 100 : 50;
                      return (
                        <tr key={s.symbol} className="table-row">
                          <td className="px-4 py-2.5 text-muted-theme font-mono text-xs">{i + 1}</td>
                          <td className="px-4 py-2.5 font-bold text-primary-theme">{s.symbol}</td>
                          <td className="text-right px-4 py-2.5 font-mono text-xs text-green-theme">{formatAmt(s.totalBuyAmt)}</td>
                          <td className="text-right px-4 py-2.5 font-mono text-xs text-red-theme">{formatAmt(s.totalSellAmt)}</td>
                          <td className="text-right px-4 py-2.5">
                            <span className={`font-mono text-xs font-medium ${s.netAmt > 0 ? "text-green-theme" : s.netAmt < 0 ? "text-red-theme" : "text-muted-theme"}`}>
                              {s.netAmt > 0 ? "+" : ""}{formatAmt(Math.abs(s.netAmt))}
                            </span>
                          </td>
                          <td className="text-right px-4 py-2.5 text-xs text-body-theme">{s.brokerCount}</td>
                          <td className="px-4 py-2.5">
                            <div className="text-xs font-bold text-green-theme">#{s.topBuyer.brokerNo}</div>
                            <div className="text-[10px] text-muted-theme truncate max-w-[100px]">{getBrokerName(s.topBuyer.brokerNo)}</div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="text-xs font-bold text-red-theme">#{s.topSeller.brokerNo}</div>
                            <div className="text-[10px] text-muted-theme truncate max-w-[100px]">{getBrokerName(s.topSeller.brokerNo)}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ BY BROKER - BADGE VIEWS ═══ */}
      {tab === "bybroker" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex rounded-lg bg-input-theme border border-theme overflow-hidden">
              <button
                onClick={() => setTradesViewMode("byTurnover")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-r border-theme ${
                  tradesViewMode === "byTurnover" ? "bg-accent-theme text-primary-theme" : "text-body-theme hover:bg-hover-theme"
                }`}
              >
                By Turnover (1D)
              </button>
              <button
                onClick={() => setTradesViewMode("byVolume")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  tradesViewMode === "byVolume" ? "bg-accent-theme text-primary-theme" : "text-body-theme hover:bg-hover-theme"
                }`}
              >
                By Volume (1D)
              </button>
            </div>
            <div className="flex rounded-lg bg-input-theme border border-theme overflow-hidden">
              <button
                onClick={() => setTradesDisplayMode("badges")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-r border-theme ${
                  tradesDisplayMode === "badges" ? "bg-accent-theme text-primary-theme" : "text-body-theme hover:bg-hover-theme"
                }`}
              >
                Badges
              </button>
              <button
                onClick={() => setTradesDisplayMode("table")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  tradesDisplayMode === "table" ? "bg-accent-theme text-primary-theme" : "text-body-theme hover:bg-hover-theme"
                }`}
              >
                Table
              </button>
            </div>
            {topTrades && (
              <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${
                topTrades.source === "floorsheet" ? "bg-green-theme/20 text-green-theme" : "bg-accent-theme/20 text-accent-theme"
              }`}>
                {topTrades.source === "floorsheet" ? "Live" : "Generated"}
              </span>
            )}
          </div>

          {loadingTopTrades ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => <div key={i} className="card-3d h-80 animate-pulse bg-input-theme" />)}
            </div>
          ) : topTrades && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ═══ LEFT PANEL: Top Buyers ═══ */}
              <div className="card-3d overflow-hidden">
                <div className="px-4 py-3 border-b border-theme bg-input-theme/50">
                  <h3 className="text-sm font-semibold text-primary-theme flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-theme" />
                    {tradesViewMode === "byTurnover" ? "By Turnover" : "By Volume"} (1D)
                    <span className="text-xs text-muted-theme ml-auto">BNo ({topTrades.brokers.length})</span>
                  </h3>
                </div>
                <div className="overflow-y-auto max-h-[500px]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="table-header">
                        <th className="text-left px-3 py-2 w-12">BNo</th>
                        <th className="text-left px-3 py-2">Top ~5 Buys</th>
                        <th className="text-left px-3 py-2">Top ~5 Sells</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topTrades.brokers.slice(0, 20).map((b) => (
                        <tr key={b.brokerNo} className="table-row">
                          <td className="px-3 py-2">
                            <div className="font-bold text-primary-theme">#{b.brokerNo}</div>
                            <div className="text-[10px] text-muted-theme truncate max-w-[80px]">{getBrokerName(b.brokerNo)}</div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {b.topBuys.map(s => (
                                <span key={s.symbol} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-theme/20 text-green-theme border border-green-theme/30">
                                  {s.symbol}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {b.topSells.map(s => (
                                <span key={s.symbol} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-theme/20 text-red-theme border border-red-theme/30">
                                  {s.symbol}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ═══ RIGHT PANEL: By Volume ═══ */}
              <div className="card-3d overflow-hidden">
                <div className="px-4 py-3 border-b border-theme bg-input-theme/50">
                  <h3 className="text-sm font-semibold text-primary-theme flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-theme" />
                    {tradesViewMode === "byTurnover" ? "By Volume" : "By Turnover"} (1D)
                    <span className="text-xs text-muted-theme ml-auto">BNo ({topTrades.brokers.length})</span>
                  </h3>
                </div>
                <div className="overflow-y-auto max-h-[500px]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="table-header">
                        <th className="text-left px-3 py-2 w-12">BNo</th>
                        <th className="text-left px-3 py-2">Top ~5 Buys</th>
                        <th className="text-left px-3 py-2">Top ~5 Sells</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const sorted = [...topTrades.brokers].sort((a, b) =>
                          tradesViewMode === "byTurnover" ? b.volume - a.volume : b.turnover - a.turnover
                        );
                        return sorted.slice(0, 20).map((b) => (
                          <tr key={b.brokerNo} className="table-row">
                            <td className="px-3 py-2">
                              <div className="font-bold text-primary-theme">#{b.brokerNo}</div>
                              <div className="text-[10px] text-muted-theme truncate max-w-[80px]">{getBrokerName(b.brokerNo)}</div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {b.topBuys.map(s => (
                                  <span key={s.symbol} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-theme/20 text-green-theme border border-green-theme/30">
                                    {s.symbol}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {b.topSells.map(s => (
                                  <span key={s.symbol} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-theme/20 text-red-theme border border-red-theme/30">
                                    {s.symbol}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ FILTERS + SEARCH BAR ═══ */}
      {tab !== "chart" && tab !== "topstocks" && tab !== "bybroker" && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg bg-input-theme border border-theme overflow-hidden">
            {([
              { key: "all", label: "All", count: allBrokers.length },
              { key: "netBuyers", label: "Buyers", count: data?.summary?.netBuyers || 0 },
              { key: "netSellers", label: "Sellers", count: data?.summary?.netSellers || 0 },
              { key: "favorites", label: "Favs", count: favorites.length },
            ] as const).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilterPreset(key)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-r border-theme last:border-r-0 ${
                  filterPreset === key
                    ? "bg-accent-theme text-primary-theme"
                    : "text-body-theme hover:bg-hover-theme"
                }`}
              >
                {label} <span className="opacity-60 ml-0.5">({count})</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[160px] max-w-[260px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-theme" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or # ..."
              className="w-full bg-input-theme border border-theme rounded-lg pl-8 pr-3 py-1.5 text-xs text-primary-theme placeholder:text-muted-theme focus:outline-none focus:border-accent-theme"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-theme hover:text-primary-theme">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ TABLE VIEW ═══ */}
      {tab !== "chart" && tab !== "topstocks" && tab !== "bybroker" && (
        <div className="card-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-center px-2 py-3 w-8" />
                  <th className="text-left px-3 py-3 cursor-pointer" onClick={() => handleSort("brokerNo")}>
                    <span className="flex items-center gap-1">Broker <SortIcon field="brokerNo" /></span>
                  </th>
                  <th className="text-right px-2 py-3 cursor-pointer" onClick={() => handleSort("marketShare")}>
                    <span className="flex items-center justify-end gap-1">Mkt% <SortIcon field="marketShare" /></span>
                  </th>
                  <th className="text-right px-3 py-3 cursor-pointer" onClick={() => handleSort("buyAmt")}>
                    <span className="flex items-center justify-end gap-1">Buy Amt <SortIcon field="buyAmt" /></span>
                  </th>
                  <th className="text-right px-3 py-3 cursor-pointer" onClick={() => handleSort("sellAmt")}>
                    <span className="flex items-center justify-end gap-1">Sell Amt <SortIcon field="sellAmt" /></span>
                  </th>
                  <th className="hidden md:table-cell text-right px-3 py-3 cursor-pointer" onClick={() => handleSort("buyRatio")}>
                    <span className="flex items-center justify-end gap-1">Buy% <SortIcon field="buyRatio" /></span>
                  </th>
                  <th className="text-right px-3 py-3 cursor-pointer" onClick={() => handleSort("turnover")}>
                    <span className="flex items-center justify-end gap-1 text-accent-theme">Turnover <SortIcon field="turnover" /></span>
                  </th>
                  <th className="text-right px-2 py-3 cursor-pointer" onClick={() => handleSort("netQty")}>
                    <span className="flex items-center justify-end gap-1">Net <SortIcon field="netQty" /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="px-3 py-3">
                        <div className="h-8 rounded bg-input-theme animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : pagedBrokers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-muted-theme text-sm">
                      {filterPreset === "favorites" ? "No favorite brokers yet. Click the star to add." : "No brokers match your filter."}
                    </td>
                  </tr>
                ) : (
                  pagedBrokers.map((b) => {
                    const marketShare = totalTurnover > 0 ? ((b.turnover / totalTurnover) * 100) : 0;
                    const totalAmt = b.buyAmt + b.sellAmt;
                    const buyRatio = totalAmt > 0 ? (b.buyAmt / totalAmt) * 100 : 50;
                    const isFav = favorites.includes(b.brokerNo);
                    return (
                      <tr
                        key={b.brokerNo}
                        className={`table-row cursor-pointer ${selectedBroker === b.brokerNo ? "bg-accent-theme/5" : ""}`}
                        onClick={() => setSelectedBroker(selectedBroker === b.brokerNo ? null : b.brokerNo)}
                      >
                        <td className="px-2 py-2.5 text-center">
                          <button
                            onClick={e => { e.stopPropagation(); toggleFavorite(b.brokerNo); }}
                            className={`transition-colors ${isFav ? "text-accent-theme" : "text-muted-theme hover:text-accent-theme"}`}
                          >
                            <Star className={`h-3.5 w-3.5 ${isFav ? "fill-accent-theme" : ""}`} />
                          </button>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-primary-theme">#{b.brokerNo}</span>
                            <span className={`text-[10px] font-normal ${b.netDirection === "net_buy" ? "text-green-theme" : b.netDirection === "net_sell" ? "text-red-theme" : "text-muted-theme"}`}>
                              {b.netDirection === "net_buy" ? "△" : b.netDirection === "net_sell" ? "▽" : "—"}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-theme mt-0.5 truncate max-w-[140px]">{getBrokerName(b.brokerNo)}</div>
                        </td>
                        <td className="text-right px-2 py-2.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-12 h-1.5 rounded-full bg-kbd-theme overflow-hidden hidden md:block">
                              <div className="h-full rounded-full bg-accent-theme" style={{ width: `${Math.min(marketShare * 2, 100)}%` }} />
                            </div>
                            <span className="font-mono text-xs text-body-theme">{marketShare.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="text-right px-3 py-2.5 font-mono text-xs text-green-theme whitespace-nowrap">{formatAmt(b.buyAmt)}</td>
                        <td className="text-right px-3 py-2.5 font-mono text-xs text-red-theme whitespace-nowrap">{formatAmt(b.sellAmt)}</td>
                        <td className="hidden md:table-cell text-right px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-14 h-1.5 rounded-full bg-kbd-theme overflow-hidden">
                              <div className="h-full rounded-full bg-green-theme" style={{ width: `${buyRatio}%` }} />
                            </div>
                            <span className="font-mono text-xs text-body-theme">{buyRatio.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="text-right px-3 py-2.5 font-mono text-accent-theme font-bold text-xs whitespace-nowrap">{formatTurnover(b.turnover)}</td>
                        <td className="text-right px-2 py-2.5">
                          <span className={`font-mono text-xs font-medium ${b.netQty > 0 ? "text-green-theme" : b.netQty < 0 ? "text-red-theme" : "text-muted-theme"}`}>
                            {b.netQty > 0 ? "+" : ""}{formatQty(Math.abs(b.netQty))}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ═══ PAGINATION ═══ */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
              <span className="text-xs text-muted-theme">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredBrokers.length)} of {filteredBrokers.length} brokers
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded text-muted-theme hover:text-primary-theme hover:bg-hover-theme disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) { pageNum = i + 1; }
                  else if (page <= 3) { pageNum = i + 1; }
                  else if (page >= totalPages - 2) { pageNum = totalPages - 4 + i; }
                  else { pageNum = page - 2 + i; }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                        page === pageNum ? "bg-accent-theme text-primary-theme" : "text-body-theme hover:bg-hover-theme"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded text-muted-theme hover:text-primary-theme hover:bg-hover-theme disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ BROKER DETAIL PANEL ═══ */}
      {detail && selectedBroker && (
        <div className="card-3d p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary-theme flex items-center gap-2">
                #{detail.broker.brokerNo} &mdash; {getBrokerName(detail.broker.brokerNo)}
                <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                  detail.broker.netDirection === "net_buy" ? "bg-green-theme/20 text-green-theme" : "bg-red-theme/20 text-red-theme"
                }`}>
                  {detail.broker.netDirection === "net_buy" ? "Net Buyer" : "Net Seller"}
                </span>
              </h2>
            </div>
            <button onClick={() => setSelectedBroker(null)} className="text-muted-theme hover:text-primary-theme text-sm">Close</button>
          </div>

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

          {/* ═══ BROKER STOCK HOLDINGS ═══ */}
          {brokerHoldings && brokerHoldings.holdings.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-primary-theme mb-2 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-accent-theme" />
                Stocks Traded by Broker #{selectedBroker}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  brokerHoldings.source === "floorsheet" ? "bg-green-theme/20 text-green-theme" : "bg-accent-theme/20 text-accent-theme"
                }`}>
                  {brokerHoldings.source === "floorsheet" ? "Live" : "Mock"}
                </span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="table-header">
                      <th className="text-left px-3 py-2">Symbol</th>
                      <th className="text-right px-3 py-2">Buy Qty</th>
                      <th className="text-right px-3 py-2">Sell Qty</th>
                      <th className="text-right px-3 py-2">Buy Amt</th>
                      <th className="text-right px-3 py-2">Sell Amt</th>
                      <th className="text-right px-3 py-2">Net</th>
                      <th className="text-right px-3 py-2">Avg Rate</th>
                      <th className="text-right px-3 py-2">Trades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brokerHoldings.holdings.map((h) => (
                      <tr key={h.symbol} className="table-row">
                        <td className="px-3 py-2 font-bold text-primary-theme">{h.symbol}</td>
                        <td className="text-right px-3 py-2 font-mono text-green-theme">{formatQty(h.buyQty)}</td>
                        <td className="text-right px-3 py-2 font-mono text-red-theme">{formatQty(h.sellQty)}</td>
                        <td className="text-right px-3 py-2 font-mono text-green-theme">{formatAmt(h.buyAmt)}</td>
                        <td className="text-right px-3 py-2 font-mono text-red-theme">{formatAmt(h.sellAmt)}</td>
                        <td className="text-right px-3 py-2">
                          <span className={`font-mono font-medium ${h.netQty > 0 ? "text-green-theme" : h.netQty < 0 ? "text-red-theme" : "text-muted-theme"}`}>
                            {h.netQty > 0 ? "+" : ""}{formatQty(Math.abs(h.netQty))}
                          </span>
                        </td>
                        <td className="text-right px-3 py-2 font-mono text-body-theme">Rs {h.avgRate.toLocaleString()}</td>
                        <td className="text-right px-3 py-2 font-mono text-muted-theme">{h.trades}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {loadingHoldings && (
            <div className="flex items-center gap-2 text-xs text-muted-theme">
              <div className="w-3 h-3 rounded-full border-2 border-accent-theme border-t-transparent animate-spin" />
              Loading stock holdings...
            </div>
          )}

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