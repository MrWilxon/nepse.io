"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Gift,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Percent,
  TrendingUp,
  Clock,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { API_BASE, fetchDividendCalendar, type DividendCalendarEntry } from "@/lib/api";

type SortField = "symbol" | "type" | "amount" | "exDate" | "currentPrice" | "dividendYield";
type SortOrder = "asc" | "desc";

export default function DividendCalendarPage() {
  const [calendar, setCalendar] = useState<DividendCalendarEntry[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("exDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  useEffect(() => {
    fetchDividendCalendar()
      .then((data) => {
        if (data) {
          setCalendar(data.calendar || []);
          setSummary(data.summary || null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dividend calendar:", err);
        setLoading(false);
      });
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    return calendar
      .filter((item) => {
        // Search filter
        const matchSearch =
          item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.companyName || "").toLowerCase().includes(searchQuery.toLowerCase());

        // Type filter
        const matchType =
          typeFilter === "all" ||
          item.type === typeFilter ||
          (typeFilter === "cash+bonus" && item.type === "cash+bonus");

        // Status filter
        const matchStatus =
          statusFilter === "all" ||
          (statusFilter === "upcoming" && (item.status === "upcoming" || item.status === "open" || item.isUpcoming)) ||
          (statusFilter === "completed" && (item.status === "completed" || item.status === "closed" || !item.isUpcoming));

        return matchSearch && matchType && matchStatus;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        // Format/normalize values for comparison
        if (sortField === "amount") {
          valA = a.amount || 0;
          valB = b.amount || 0;
        } else if (sortField === "dividendYield") {
          valA = parseFloat(String(a.dividendYield || 0));
          valB = parseFloat(String(b.dividendYield || 0));
        } else if (sortField === "currentPrice") {
          valA = a.currentPrice || 0;
          valB = b.currentPrice || 0;
        } else if (sortField === "exDate") {
          valA = a.exDate || "";
          valB = b.exDate || "";
        } else {
          valA = String(valA || "").toLowerCase();
          valB = String(valB || "").toLowerCase();
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [calendar, searchQuery, typeFilter, statusFilter, sortField, sortOrder]);

  // Derived Summary stats from current filtered data
  const stats = useMemo(() => {
    const totalCount = filteredAndSorted.length;
    const upcomingCount = filteredAndSorted.filter((i) => i.status === "upcoming" || i.status === "open" || i.isUpcoming).length;
    
    // Average yield calculation
    const yields = filteredAndSorted
      .map((i) => parseFloat(String(i.dividendYield || 0)))
      .filter((y) => y > 0);
    const avgYield = yields.length > 0 ? yields.reduce((a, b) => a + b, 0) / yields.length : 0;

    return {
      totalCount,
      upcomingCount,
      avgYield: avgYield.toFixed(2),
    };
  }, [filteredAndSorted]);

  const renderDividendDetails = (item: any) => {
    // If we have detailed breakdown fields
    const bonus = item.bonusDividend;
    const cash = item.cashDividend;
    
    if (bonus > 0 && cash > 0) {
      return (
        <div className="text-xs">
          <div className="font-semibold text-primary-theme">Total: {item.amount}%</div>
          <div className="text-[10px] text-muted-theme">Bonus: {bonus}%, Cash: {cash}%</div>
        </div>
      );
    }
    
    if (bonus > 0) {
      return (
        <div className="text-xs font-semibold text-blue-400">
          {bonus}% Bonus
        </div>
      );
    }
    
    if (cash > 0) {
      return (
        <div className="text-xs font-semibold text-green-400">
          {cash}% Cash
        </div>
      );
    }

    return (
      <div className="text-xs font-semibold text-primary-theme">
        {item.amount}%
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Dividend Calendar</h1>
        <p className="text-muted-theme text-sm mt-0.5">
          Upcoming corporate dividends, cash payouts, and bonus share distributions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-3d p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-muted-theme">Total Events</div>
            <div className="mt-1 text-2xl font-bold text-primary-theme">
              {loading ? "..." : stats.totalCount}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-pink-500/10 text-pink-400">
            <Gift className="h-5 w-5" />
          </div>
        </div>

        <div className="card-3d p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-amber-500">Upcoming / Open</div>
            <div className="mt-1 text-2xl font-bold text-amber-400">
              {loading ? "..." : stats.upcomingCount}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="card-3d p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-green-500">Average Yield</div>
            <div className="mt-1 text-2xl font-bold text-green-400">
              {loading ? "..." : `${stats.avgYield}%`}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-green-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-input-theme border border-theme rounded-xl p-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
          <input
            type="text"
            placeholder="Search symbol or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-theme bg-header-theme py-2.5 pl-9 pr-3 text-xs text-primary-theme placeholder-text-placeholder outline-none focus:border-accent-theme transition-colors"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-theme" />
            <span className="text-xs text-muted-theme mr-1">Type:</span>
            {["all", "cash", "bonus", "cash+bonus", "rights"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors border capitalize ${
                  typeFilter === t
                    ? "bg-accent-theme text-primary-theme border-accent-theme"
                    : "text-muted-theme border-theme bg-header-theme hover:text-primary-theme"
                }`}
              >
                {t === "cash+bonus" ? "Cash & Bonus" : t}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 border-l border-theme pl-3">
            <span className="text-xs text-muted-theme mr-1">Status:</span>
            {["all", "upcoming", "completed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors border capitalize ${
                  statusFilter === s
                    ? "bg-accent-theme text-primary-theme border-accent-theme"
                    : "text-muted-theme border-theme bg-header-theme hover:text-primary-theme"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="card-3d flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-primary)] border-t-[var(--accent)]" />
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="card-3d flex flex-col items-center justify-center py-16">
          <Calendar className="mb-3 h-10 w-10 text-[var(--border-primary)]" />
          <p className="text-sm text-muted-theme">No dividends match your filters</p>
        </div>
      ) : (
        <div className="card-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-hover)] text-left text-xs font-medium uppercase tracking-wider text-muted-theme">
                  <th
                    className="px-4 py-3.5 cursor-pointer hover:text-primary-theme transition-colors"
                    onClick={() => handleSort("symbol")}
                  >
                    <div className="flex items-center gap-1">
                      Symbol <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3.5">Company</th>
                  <th className="px-4 py-3.5">Sector</th>
                  <th
                    className="px-4 py-3.5 cursor-pointer hover:text-primary-theme transition-colors"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center gap-1">
                      Type <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3.5 text-right cursor-pointer hover:text-primary-theme transition-colors"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Amount (%) <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3.5 cursor-pointer hover:text-primary-theme transition-colors"
                    onClick={() => handleSort("exDate")}
                  >
                    <div className="flex items-center gap-1">
                      Book Close / Ex-Date <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3.5 text-right cursor-pointer hover:text-primary-theme transition-colors"
                    onClick={() => handleSort("currentPrice")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      LTP (Rs) <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3.5 text-right cursor-pointer hover:text-primary-theme transition-colors"
                    onClick={() => handleSort("dividendYield")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Yield (%) <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {filteredAndSorted.map((item, index) => {
                  const isUpc = item.status === "upcoming" || item.status === "open" || item.isUpcoming;
                  const ltp = item.currentPrice || item.ltp;
                  const divYield = parseFloat(String(item.dividendYield || 0));

                  return (
                    <tr
                      key={`${item.symbol}-${index}`}
                      className="cursor-pointer transition-colors hover:bg-[var(--bg-hover)]"
                      onClick={() => (window.location.href = `/company/${item.symbol}`)}
                    >
                      <td className="px-4 py-3.5 font-bold text-accent-theme">{item.symbol}</td>
                      <td className="px-4 py-3.5 text-xs text-primary-theme max-w-[220px] truncate">
                        {item.companyName || item.symbol}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-theme">{item.sector || "Other"}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold ${
                            item.type === "cash"
                              ? "bg-green-500/10 text-green-400"
                              : item.type === "bonus"
                              ? "bg-blue-500/10 text-blue-400"
                              : item.type === "cash+bonus"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-purple-500/10 text-purple-400"
                          }`}
                        >
                          {item.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono">{renderDividendDetails(item)}</td>
                      <td className="px-4 py-3.5 text-xs font-mono text-muted-theme">
                        {item.exDate || item.recordDate || "N/A"}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-primary-theme">
                        {ltp != null && ltp > 0 ? `Rs ${ltp.toLocaleString()}` : "-"}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-primary-theme">
                        {divYield > 0 ? `${divYield.toFixed(2)}%` : "-"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isUpc
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-green-500/10 text-green-400 border border-green-500/30"
                          }`}
                        >
                          {isUpc ? <Clock className="h-2.5 w-2.5" /> : <CheckCircle className="h-2.5 w-2.5" />}
                          {isUpc ? "Upcoming" : "Completed"}
                        </span>
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
  );
}
