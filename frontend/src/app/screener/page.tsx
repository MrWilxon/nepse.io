"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, Download, TrendingUp, TrendingDown, ArrowUpDown, RotateCcw, Minus } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface ScreenerResult {
  symbol: string;
  name: string;
  sector: string;
  ltp: number;
  change: number;
  volume: number;
  marketCap: number;
  pe: number;
  week52High: number;
  week52Low: number;
  rsi?: number;
}

interface FilterState {
  sector: string;
  minPrice: number | null;
  maxPrice: number | null;
  minVolume: number | null;
  minChange: number | null;
  maxChange: number | null;
  minMarketCap: number | null;
  rsiFilter: "oversold" | "overbought" | "neutral" | "";
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const PRESETS = [
  { name: "Oversold RSI", filters: { rsiFilter: "oversold" as const } },
  { name: "Top Gainers", filters: { minChange: 2, sortBy: "change", sortOrder: "desc" as const } },
  { name: "High Volume", filters: { minVolume: 100000, sortBy: "volume", sortOrder: "desc" as const } },
  { name: "Blue Chips", filters: { minMarketCap: 50000000000, sortBy: "marketCap", sortOrder: "desc" as const } },
];

export default function ScreenerPage() {
  const [data, setData] = useState<ScreenerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    sector: "",
    minPrice: null,
    maxPrice: null,
    minVolume: null,
    minChange: null,
    maxChange: null,
    minMarketCap: null,
    rsiFilter: "",
    sortBy: "symbol",
    sortOrder: "asc",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/companies`)
      .then((r) => r.json())
      .then((d) => {
        const enriched = d.map((c: any) => ({
          symbol: c.symbol,
          name: c.name || c.symbol,
          sector: c.sector || c.category || "Other",
          ltp: c.ltp || c.latestClose || 0,
          change: c.percentChange || c.change || 0,
          volume: c.volume || 0,
          marketCap: c.marketCap || 0,
          pe: c.pe || 0,
          week52High: c.week52High || 0,
          week52Low: c.week52Low || 0,
          rsi: c.rsi,
        }));
        setData(enriched);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sectors = useMemo(() => {
    const set = new Set(data.map((d) => d.sector));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    let result = [...data];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.symbol.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
      );
    }

    if (filters.sector) result = result.filter((r) => r.sector === filters.sector);
    if (filters.minPrice !== null) result = result.filter((r) => r.ltp >= filters.minPrice!);
    if (filters.maxPrice !== null) result = result.filter((r) => r.ltp <= filters.maxPrice!);
    if (filters.minVolume !== null) result = result.filter((r) => r.volume >= filters.minVolume!);
    if (filters.minChange !== null) result = result.filter((r) => r.change >= filters.minChange!);
    if (filters.maxChange !== null) result = result.filter((r) => r.change <= filters.maxChange!);
    if (filters.minMarketCap !== null) result = result.filter((r) => r.marketCap >= filters.minMarketCap!);
    if (filters.rsiFilter === "oversold") result = result.filter((r) => r.rsi !== undefined && r.rsi < 30);
    if (filters.rsiFilter === "overbought") result = result.filter((r) => r.rsi !== undefined && r.rsi > 70);
    if (filters.rsiFilter === "neutral") result = result.filter((r) => r.rsi !== undefined && r.rsi >= 30 && r.rsi <= 70);

    result.sort((a: any, b: any) => {
      const aVal = a[filters.sortBy] ?? 0;
      const bVal = b[filters.sortBy] ?? 0;
      if (typeof aVal === "string") return filters.sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return filters.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [data, search, filters]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setFilters((prev) => ({ ...prev, ...preset.filters }));
  };

  const resetFilters = () => {
    setFilters({
      sector: "", minPrice: null, maxPrice: null, minVolume: null,
      minChange: null, maxChange: null, minMarketCap: null, rsiFilter: "",
      sortBy: "symbol", sortOrder: "asc",
    });
    setSearch("");
  };

  const exportCSV = () => {
    const headers = ["Symbol", "Name", "Sector", "LTP", "Change%", "Volume", "Market Cap", "P/E"];
    const rows = filtered.map((r) => [r.symbol, r.name, r.sector, r.ltp, r.change, r.volume, r.marketCap, r.pe]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `screener_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortHeader = ({ field, label }: { field: string; label: string }) => (
    <th
      className="px-4 py-3 text-left cursor-pointer select-none hover:text-[var(--accent)]"
      onClick={() => setFilters((p) => ({ ...p, sortBy: field, sortOrder: p.sortBy === field && p.sortOrder === "asc" ? "desc" : "asc" }))}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </th>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Stock Screener</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {filtered.length} of {data.length} companies
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 rounded-lg border border-[var(--border-primary)] px-3 py-2 text-xs text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button onClick={resetFilters} className="flex items-center gap-2 rounded-lg border border-[var(--border-primary)] px-3 py-2 text-xs text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <button key={p.name} onClick={() => applyPreset(p)} className="rounded-full border border-[var(--border-primary)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]">
            {p.name}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder="Search by symbol or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm ${showFilters ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-bg)]" : "border-[var(--border-primary)] text-[var(--text-muted)]"}`}>
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card-3d p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">Sector</label>
              <select value={filters.sector} onChange={(e) => setFilters((p) => ({ ...p, sector: e.target.value }))} className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">
                <option value="">All Sectors</option>
                {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">Min Price</label>
              <input type="number" value={filters.minPrice ?? ""} onChange={(e) => setFilters((p) => ({ ...p, minPrice: e.target.value ? Number(e.target.value) : null }))} className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">Max Price</label>
              <input type="number" value={filters.maxPrice ?? ""} onChange={(e) => setFilters((p) => ({ ...p, maxPrice: e.target.value ? Number(e.target.value) : null }))} className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">Min Volume</label>
              <input type="number" value={filters.minVolume ?? ""} onChange={(e) => setFilters((p) => ({ ...p, minVolume: e.target.value ? Number(e.target.value) : null }))} className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">Min Change %</label>
              <input type="number" value={filters.minChange ?? ""} onChange={(e) => setFilters((p) => ({ ...p, minChange: e.target.value ? Number(e.target.value) : null }))} className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">Max Change %</label>
              <input type="number" value={filters.maxChange ?? ""} onChange={(e) => setFilters((p) => ({ ...p, maxChange: e.target.value ? Number(e.target.value) : null }))} className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">RSI Filter</label>
              <select value={filters.rsiFilter} onChange={(e) => setFilters((p) => ({ ...p, rsiFilter: e.target.value as any }))} className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">
                <option value="">Any</option>
                <option value="oversold">Oversold (&lt;30)</option>
                <option value="overbought">Overbought (&gt;70)</option>
                <option value="neutral">Neutral (30-70)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">Min Market Cap</label>
              <input type="number" value={filters.minMarketCap ?? ""} onChange={(e) => setFilters((p) => ({ ...p, minMarketCap: e.target.value ? Number(e.target.value) : null }))} className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="card-3d flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-primary)] border-t-[var(--accent)]" />
        </div>
      ) : (
        <div className="card-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <SortHeader field="symbol" label="Symbol" />
                  <SortHeader field="ltp" label="LTP" />
                  <SortHeader field="change" label="Change %" />
                  <SortHeader field="volume" label="Volume" />
                  <SortHeader field="marketCap" label="Market Cap" />
                  <SortHeader field="pe" label="P/E" />
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((r) => (
                  <tr key={r.symbol} className="table-row">
                    <td className="px-4 py-3">
                      <a href={`/company/${r.symbol}`} className="font-bold text-[var(--text-primary)] hover:text-[var(--accent)]">{r.symbol}</a>
                      <div className="text-[10px] text-[var(--text-dim)]">{r.sector}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--text-primary)]">Rs {r.ltp.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const formatted = r.change.toFixed(2);
                        const isFlat = formatted === "0.00" || formatted === "-0.00";
                        const isPositive = !isFlat && r.change > 0;
                        const isNegative = !isFlat && r.change < 0;
                        return (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                            isPositive ? "bg-[var(--green-bg)] text-[var(--green)]"
                              : isNegative ? "bg-[var(--red-bg)] text-[var(--red)]"
                              : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                          }`}>
                            {isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : isNegative ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                            {isPositive ? "+" : ""}
                            {isFlat ? "0.00" : formatted}%
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--text-muted)]">{r.volume.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-[var(--text-muted)]">{r.marketCap > 0 ? `Rs ${(r.marketCap / 1e9).toFixed(1)}B` : "-"}</td>
                    <td className="px-4 py-3 font-mono text-[var(--text-muted)]">{r.pe > 0 ? r.pe.toFixed(1) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 50 && (
            <div className="border-t border-[var(--border-primary)] px-4 py-3 text-center text-xs text-[var(--text-dim)]">
              Showing 50 of {filtered.length} results
            </div>
          )}
        </div>
      )}
    </div>
  );
}
