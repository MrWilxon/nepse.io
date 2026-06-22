"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  FileText,
  BarChart3,
  Hash,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import type { FloorSheetRecord, FloorSheetResponse } from "@/lib/api";
import { fetchFloorSheet, scrapeFloorSheet } from "@/lib/api";
import { ErrorBoundary } from "@/components/error-boundary";

const PAGE_SIZE = 50;

export default function FloorSheetPage() {
  const [data, setData] = useState<FloorSheetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [symbolFilter, setSymbolFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("sn");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchFloorSheet({
        symbol: symbolFilter || undefined,
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortDir,
      });
      setData(res);
    } catch {
      setData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [symbolFilter, page, sortBy, sortDir]);

  const handleScrape = async () => {
    setScraping(true);
    try {
      await scrapeFloorSheet();
      await loadData();
    } catch {
      // ignore
    }
    setScraping(false);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 text-dim-theme" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-[#ff6b35]" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#ff6b35]" />
    );
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-theme tracking-tight">Floor Sheet</h1>
            <p className="text-dim-theme text-sm mt-0.5">
              {data?.date ? `Trading date: ${data.date}` : "No data available"}
              {data?.totalRecords ? ` · ${data.totalRecords} transactions` : ""}
            </p>
          </div>
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="btn-accent flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${scraping ? "animate-spin" : ""}`} />
            {scraping ? "Scraping..." : "Scrape Live"}
          </button>
        </div>

        {/* Summary Cards */}
        {data?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="metric-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6b35]/10">
                  <Hash className="h-5 w-5 text-[#ff6b35]" />
                </div>
                <div>
                  <div className="text-xs text-dim-theme">Total Trades</div>
                  <div className="text-lg font-bold text-primary-theme font-mono">
                    {data.totalRecords.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="metric-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22c55e]/10">
                  <DollarSign className="h-5 w-5 text-[#22c55e]" />
                </div>
                <div>
                  <div className="text-xs text-dim-theme">Total Turnover</div>
                  <div className="text-lg font-bold text-primary-theme font-mono">
                    Rs {(data.summary.totalAmount / 1_000_000).toFixed(1)}M
                  </div>
                </div>
              </div>
            </div>
            <div className="metric-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22c55e]/10">
                  <BarChart3 className="h-5 w-5 text-[#22c55e]" />
                </div>
                <div>
                  <div className="text-xs text-dim-theme">Total Quantity</div>
                  <div className="text-lg font-bold text-primary-theme font-mono">
                    {(data.summary.totalQuantity / 1000).toFixed(0)}K
                  </div>
                </div>
              </div>
            </div>
            <div className="metric-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6b35]/10">
                  <TrendingUp className="h-5 w-5 text-[#ff6b35]" />
                </div>
                <div>
                  <div className="text-xs text-dim-theme">Unique Symbols</div>
                  <div className="text-lg font-bold text-primary-theme font-mono">
                    {data.summary.uniqueSymbols}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim-theme" />
            <input
              type="text"
              placeholder="Filter by symbol..."
              value={symbolFilter}
              onChange={(e) => {
                setSymbolFilter(e.target.value.toUpperCase());
                setPage(1);
              }}
              className="w-full rounded-lg border border-theme bg-input-theme py-2.5 pl-10 pr-4 text-sm text-primary-theme outline-none focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]/50 placeholder:text-dim-theme"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-input-theme animate-pulse" />
            ))}
          </div>
        ) : !data || data.records.length === 0 ? (
          <div className="card-3d p-12 text-center">
            <FileText className="h-12 w-12 text-dim-theme mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-primary-theme mb-1">No Floor Sheet Data</h3>
            <p className="text-sm text-dim-theme mb-4">
              Click &quot;Scrape Live&quot; to fetch today&apos;s floor sheet from NEPSE.
            </p>
            <button onClick={handleScrape} disabled={scraping} className="btn-accent text-sm">
              {scraping ? "Scraping..." : "Scrape Now"}
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-theme">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 w-12">#</th>
                    <th
                      className="px-4 py-3 text-left cursor-pointer hover:text-primary-theme transition-colors"
                      onClick={() => handleSort("contractNo")}
                    >
                      <div className="flex items-center gap-1">
                        Contract <SortIcon field="contractNo" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left cursor-pointer hover:text-primary-theme transition-colors"
                      onClick={() => handleSort("symbol")}
                    >
                      <div className="flex items-center gap-1">
                        Symbol <SortIcon field="symbol" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right">Buyer</th>
                    <th className="px-4 py-3 text-right">Seller</th>
                    <th
                      className="px-4 py-3 text-right cursor-pointer hover:text-primary-theme transition-colors"
                      onClick={() => handleSort("quantity")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Qty <SortIcon field="quantity" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-right cursor-pointer hover:text-primary-theme transition-colors"
                      onClick={() => handleSort("rate")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Rate <SortIcon field="rate" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-right cursor-pointer hover:text-primary-theme transition-colors"
                      onClick={() => handleSort("amount")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Amount <SortIcon field="amount" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((r) => (
                    <tr key={`${r.contractNo}-${r.sn}`} className="table-row">
                      <td className="px-4 py-3 text-dim-theme font-mono text-xs">{r.sn}</td>
                      <td className="px-4 py-3 font-mono text-xs text-subtle-theme">{r.contractNo}</td>
                      <td className="px-4 py-3 font-semibold text-primary-theme">
                        <a href={`/company/${r.symbol}`} className="hover:text-[#ff6b35] transition-colors">
                          {r.symbol}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-subtle-theme">{r.buyerBroker}</td>
                      <td className="px-4 py-3 text-right font-mono text-subtle-theme">{r.sellerBroker}</td>
                      <td className="px-4 py-3 text-right font-mono text-primary-theme">{r.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-primary-theme">Rs {r.rate.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#ff6b35] font-semibold">
                        Rs {r.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-dim-theme">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.totalRecords)} of {data.totalRecords}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-theme bg-input-theme p-2 text-subtle-theme hover:bg-hover-theme disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: Math.min(5, data.pages) }, (_, i) => {
                    let pageNum: number;
                    if (data.pages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= data.pages - 2) pageNum = data.pages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                          page === pageNum
                            ? "bg-[#ff6b35] text-primary-theme"
                            : "border border-theme bg-input-theme text-subtle-theme hover:bg-hover-theme"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="rounded-lg border border-theme bg-input-theme p-2 text-subtle-theme hover:bg-hover-theme disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
