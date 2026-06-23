"use client";

import { useEffect, useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Search, ArrowUpDown, ChevronDown, ChevronUp, Building2, Filter } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Fundamental {
  symbol: string;
  companyName: string;
  category: string;
  shortCategory: string;
  group: string;
  marketCap: number;
  marketCapFormatted: string;
  units: number;
  unitsFormatted: string;
  float: number;
  floatFormatted: string;
  floatCap: number;
  floatCapFormatted: string;
  pe: number;
  pb: number;
  eps: number;
  roe: number;
  roce: number;
  dividendYield: number;
  debtToEquity: number;
  bookValue: number;
  latestClose: number;
  change: number;
  changePct: number;
  bonusPct: number;
  cashDividendPct: number;
  bookClose: string;
  latestDate: string;
}

type SortField = "symbol" | "latestClose" | "changePct" | "marketCap" | "floatCap" | "eps" | "pe" | "pb" | "bookValue" | "bonusPct" | "cashDividendPct" | "bookClose";

function formatNumber(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}Ar`;
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)}L`;
  return n.toLocaleString();
}

const GROUP_COLORS: Record<string, string> = {
  A: "bg-green-theme/20 text-green-theme border-green-theme/30",
  B: "bg-blue-theme/20 text-blue-theme border-blue-theme/30",
  F: "bg-purple-theme/20 text-purple-theme border-purple-theme/30",
  G: "bg-amber-theme/20 text-amber-theme border-amber-theme/30",
  Z: "bg-accent-theme/20 text-accent-theme border-accent-theme/30",
};

export default function FundamentalsPage() {
  const [data, setData] = useState<Fundamental[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("marketCap");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/fundamentals?sort=-marketCap`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sectors = useMemo(() => [...new Set(data.map((d) => d.shortCategory))].sort(), [data]);
  const groups = useMemo(() => [...new Set(data.map((d) => d.group))].sort(), [data]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-muted-theme inline ml-1" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-accent-theme inline ml-1" />
      : <ChevronDown className="h-3 w-3 text-accent-theme inline ml-1" />;
  };

  const filtered = useMemo(() => {
    let list = [...data];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        d.symbol.toLowerCase().includes(q) || d.companyName.toLowerCase().includes(q)
      );
    }
    if (selectedSector) list = list.filter((d) => d.shortCategory === selectedSector);
    if (selectedGroup) list = list.filter((d) => d.group === selectedGroup);
    list.sort((a, b) => {
      const av = a[sortField] ?? 0;
      const bv = b[sortField] ?? 0;
      if (typeof av === "string" && typeof bv === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return list;
  }, [data, search, selectedSector, selectedGroup, sortField, sortDir]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-theme flex items-center gap-2">
          <Building2 className="h-6 w-6 text-accent-theme" />
          Stock Fundamentals
        </h1>
        <p className="text-muted-theme text-sm mt-0.5">Key financial metrics &middot; {data.length} companies &middot; {data[0]?.latestDate || ""}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
          <input
            type="text"
            placeholder="Search symbol or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-accent-theme placeholder:text-muted-theme"
          />
        </div>
        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme"
        >
          <option value="">All Sectors</option>
          {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme"
        >
          <option value="">All Groups</option>
          {groups.map((g) => <option key={g} value={g}>Group {g}</option>)}
        </select>
        <span className="text-xs text-muted-theme">{filtered.length} results</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-input-theme animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="card-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-3 py-3 cursor-pointer" onClick={() => handleSort("symbol")}>
                    <span className="text-xs">Symbol <SortIcon field="symbol" /></span>
                  </th>
                  <th className="text-left px-3 py-3 text-xs">Sector / Group</th>
                  <th className="text-right px-3 py-3 cursor-pointer" onClick={() => handleSort("latestClose")}>
                    <span className="text-xs">Price / Chg. <SortIcon field="latestClose" /></span>
                  </th>
                  <th className="text-right px-3 py-3 cursor-pointer" onClick={() => handleSort("marketCap")}>
                    <span className="text-xs">Units / MktCap <SortIcon field="marketCap" /></span>
                  </th>
                  <th className="text-right px-3 py-3 cursor-pointer" onClick={() => handleSort("floatCap")}>
                    <span className="text-xs">Float / FloatCap <SortIcon field="floatCap" /></span>
                  </th>
                  <th className="text-right px-3 py-3 cursor-pointer" onClick={() => handleSort("eps")}>
                    <span className="text-xs">EPS / P-E <SortIcon field="eps" /></span>
                  </th>
                  <th className="text-right px-3 py-3 cursor-pointer" onClick={() => handleSort("pb")}>
                    <span className="text-xs">BV / P/BV <SortIcon field="pb" /></span>
                  </th>
                  <th className="text-right px-3 py-3 cursor-pointer" onClick={() => handleSort("bonusPct")}>
                    <span className="text-xs">Bonus / Cash <SortIcon field="bonusPct" /></span>
                  </th>
                  <th className="text-right px-3 py-3 cursor-pointer" onClick={() => handleSort("bookClose")}>
                    <span className="text-xs">BookClose <SortIcon field="bookClose" /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr
                    key={d.symbol}
                    className="table-row cursor-pointer"
                    onClick={() => window.location.href = `/company/${d.symbol}`}
                  >
                    {/* Symbol + Company Name */}
                    <td className="px-3 py-3">
                      <div className="font-bold text-primary-theme text-sm">{d.symbol}</div>
                      <div className="text-[10px] text-muted-theme truncate max-w-[180px]">{d.companyName}</div>
                    </td>

                    {/* Sector / Group */}
                    <td className="px-3 py-3">
                      <div className="text-xs text-body-theme">{d.shortCategory}</div>
                      <span className={`inline-flex items-center justify-center w-5 h-5 mt-0.5 rounded text-[10px] font-bold border ${GROUP_COLORS[d.group] || GROUP_COLORS.Z}`}>
                        {d.group}
                      </span>
                    </td>

                    {/* Price / Chg */}
                    <td className="text-right px-3 py-3">
                      <div className="font-mono font-bold text-primary-theme">{d.latestClose.toLocaleString()}</div>
                      <div className={`font-mono text-[11px] ${d.changePct >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                        {d.changePct >= 0 ? "+" : ""}{d.change} &middot; {d.changePct >= 0 ? "+" : ""}{d.changePct}%
                      </div>
                    </td>

                    {/* Units / MktCap */}
                    <td className="text-right px-3 py-3">
                      <div className="font-mono text-xs text-primary-theme">{d.unitsFormatted}</div>
                      <div className="font-mono text-[11px] text-muted-theme">{d.marketCapFormatted}</div>
                    </td>

                    {/* Float / FloatCap */}
                    <td className="text-right px-3 py-3">
                      <div className="font-mono text-xs text-primary-theme">{d.floatFormatted}</div>
                      <div className="font-mono text-[11px] text-muted-theme">{d.floatCapFormatted}</div>
                    </td>

                    {/* EPS / P-E */}
                    <td className="text-right px-3 py-3">
                      <div className="font-mono text-xs font-bold text-accent-theme">{d.eps}</div>
                      <div className="font-mono text-[11px] text-muted-theme">{d.pe}</div>
                    </td>

                    {/* BV / P-BV */}
                    <td className="text-right px-3 py-3">
                      <div className="font-mono text-xs text-primary-theme">{d.bookValue}</div>
                      <div className="font-mono text-[11px] text-muted-theme">{d.pb}</div>
                    </td>

                    {/* Bonus / Cash */}
                    <td className="text-right px-3 py-3">
                      <div className="font-mono text-xs font-bold text-accent-theme">{d.bonusPct}%</div>
                      <div className="font-mono text-[11px] text-muted-theme">{d.cashDividendPct}%</div>
                    </td>

                    {/* BookClose */}
                    <td className="text-right px-3 py-3">
                      <div className="font-mono text-xs text-body-theme">{d.bookClose}</div>
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