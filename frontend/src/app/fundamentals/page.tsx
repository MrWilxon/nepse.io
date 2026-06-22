"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Search, ArrowUpDown } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Fundamental {
  symbol: string;
  category: string;
  marketCap: number;
  marketCapFormatted: string;
  pe: number;
  pb: number;
  eps: number;
  roe: number;
  roce: number;
  dividendYield: number;
  debtToEquity: number;
  interestCoverage: number;
  currentRatio: number;
  quickRatio: number;
  bookValue: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  beta: number;
  latestClose: number;
  latestDate: string;
}

export default function FundamentalsPage() {
  const [data, setData] = useState<Fundamental[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string>("-marketCap");
  const [selectedSector, setSelectedSector] = useState("");

  useEffect(() => {
    const url = selectedSector
      ? `${API_BASE}/api/fundamentals?sort=${sortField}&sector=${encodeURIComponent(selectedSector)}`
      : `${API_BASE}/api/fundamentals?sort=${sortField}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sortField, selectedSector]);

  const filtered = data.filter((d) =>
    d.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const sectors = [...new Set(data.map((d) => d.category))].sort();

  const handleSort = (field: string) => {
    setSortField((prev) => (prev === field ? `-${field}` : field));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Fundamental Analysis</h1>
        <p className="text-muted-theme text-sm mt-0.5">P/E, P/B, EPS, ROE and key financial ratios</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
          <input
            type="text"
            placeholder="Search symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none border-accent-theme placeholder:text-muted-theme"
          />
        </div>
        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none border-accent-theme"
        >
          <option value="">All Sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-input-theme animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-theme">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-table-header-theme">
                <th className="px-4 py-3 text-left text-xs font-semibold text-body-theme uppercase">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-body-theme uppercase">Sector</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-body-theme uppercase cursor-pointer hover:text-primary-theme" onClick={() => handleSort("marketCap")}>Mkt Cap <ArrowUpDown className="inline h-3 w-3" /></th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-body-theme uppercase cursor-pointer hover:text-primary-theme" onClick={() => handleSort("pe")}>P/E <ArrowUpDown className="inline h-3 w-3" /></th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-body-theme uppercase cursor-pointer hover:text-primary-theme" onClick={() => handleSort("pb")}>P/B <ArrowUpDown className="inline h-3 w-3" /></th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-body-theme uppercase cursor-pointer hover:text-primary-theme" onClick={() => handleSort("eps")}>EPS <ArrowUpDown className="inline h-3 w-3" /></th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-body-theme uppercase cursor-pointer hover:text-primary-theme" onClick={() => handleSort("roe")}>ROE <ArrowUpDown className="inline h-3 w-3" /></th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-body-theme uppercase cursor-pointer hover:text-primary-theme" onClick={() => handleSort("dividendYield")}>Div Yield <ArrowUpDown className="inline h-3 w-3" /></th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-body-theme uppercase">Price</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.symbol} className="border-t border-theme hover:bg-hover-theme cursor-pointer" onClick={() => window.location.href = `/company/${d.symbol}`}>
                  <td className="px-4 py-3 font-semibold text-primary-theme">{d.symbol}</td>
                  <td className="px-4 py-3 text-body-theme">{d.category}</td>
                  <td className="px-4 py-3 text-right font-mono text-primary-theme">{d.marketCapFormatted}</td>
                  <td className="px-4 py-3 text-right font-mono text-primary-theme">{d.pe}</td>
                  <td className="px-4 py-3 text-right font-mono text-primary-theme">{d.pb}</td>
                  <td className="px-4 py-3 text-right font-mono text-primary-theme">Rs {d.eps}</td>
                  <td className="px-4 py-3 text-right font-mono text-green-theme">{d.roe}%</td>
                  <td className="px-4 py-3 text-right font-mono text-accent-theme">{d.dividendYield}%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary-theme">Rs {d.latestClose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
