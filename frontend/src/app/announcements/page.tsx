"use client";

import { useEffect, useState } from "react";
import { Bell, Calendar, Info, Search, Filter } from "lucide-react";
import { API_BASE } from "@/lib/api";

type Tab = "updates" | "holidays";

const typeColors: Record<string, string> = {
  ipo: "bg-green-theme text-green-theme border-green-theme",
  dividend: "bg-accent-theme text-accent-theme border-accent-theme",
  agm: "bg-blue-theme text-blue-theme border-blue-theme",
  report: "bg-purple-theme text-purple-theme border-purple-theme",
  book_closure: "bg-amber-theme text-amber-theme border-amber-theme",
  right_share: "bg-cyan-theme text-cyan-theme border-cyan-theme",
  delisting: "bg-red-theme text-red-theme border-red-theme",
  sgm: "bg-pink-theme text-pink-theme border-pink-theme",
  governance: "bg-[#8892a0]/10 text-muted-theme border-[#8892a0]/30",
  holiday: "bg-orange-theme text-orange-theme border-orange-theme",
  corporate: "bg-slate-theme text-slate-theme border-slate-theme",
  news: "bg-blue-theme text-blue-theme border-blue-theme",
  interview: "bg-purple-theme text-purple-theme border-purple-theme",
  analysis: "bg-amber-theme text-amber-theme border-amber-theme",
  exclusive: "bg-accent-theme text-accent-theme border-accent-theme",
  listing: "bg-green-theme text-green-theme border-green-theme",
};

const typeLabels: Record<string, string> = {
  ipo: "IPO",
  dividend: "Dividend",
  agm: "AGM",
  report: "Report",
  book_closure: "Book Closure",
  right_share: "Right Share",
  delisting: "Delisting",
  sgm: "SGM",
  governance: "Governance",
  holiday: "Holiday",
  corporate: "Corporate",
  news: "News",
  interview: "Interview",
  analysis: "Analysis",
  exclusive: "Exclusive",
  listing: "Listing",
};

export default function AnnouncementsPage() {
  const [tab, setTab] = useState<Tab>("updates");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/announcements`).then(r => r.json()),
      fetch(`${API_BASE}/api/holidays`).then(r => r.json()),
    ]).then(([ann, hol]) => {
      setAnnouncements(ann.announcements || []);
      setHolidays(hol.upcoming || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = announcements.filter(a => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (a.symbol || "").toLowerCase().includes(q) || (a.title || "").toLowerCase().includes(q);
    }
    return true;
  });

  const types = ["all", ...new Set(announcements.map(a => a.type))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Market Announcements</h1>
        <p className="text-muted-theme text-sm mt-0.5">Latest NEPSE notices, corporate actions, and market holidays</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-theme">
        <button
          onClick={() => setTab("updates")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "updates"
              ? "border-accent-theme text-accent-theme"
              : "border-transparent text-muted-theme hover:text-primary-theme"
          }`}
        >
          <Bell className="h-4 w-4" />
          Updates ({announcements.length})
        </button>
        <button
          onClick={() => setTab("holidays")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "holidays"
              ? "border-accent-theme text-accent-theme"
              : "border-transparent text-muted-theme hover:text-primary-theme"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Holidays ({holidays.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-input-theme animate-pulse" />
          ))}
        </div>
      ) : tab === "updates" ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
              <input
                type="text"
                placeholder="Search by symbol or title..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-xs text-primary-theme placeholder-text-placeholder outline-none focus:border-accent-theme"
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Filter className="h-3.5 w-3.5 text-muted-theme" />
              {types.map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                    filterType === t
                      ? "bg-accent-theme text-accent-theme border border-accent-theme"
                      : "text-muted-theme hover:text-primary-theme border border-transparent"
                  }`}
                >
                  {t === "all" ? "All" : typeLabels[t] || t}
                </button>
              ))}
            </div>
          </div>

          {/* Announcements Table */}
          <div className="card-3d overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-theme">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-theme uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-theme uppercase tracking-wider">Symbol</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-theme uppercase tracking-wider">Title</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-theme uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-xs text-muted-theme">No announcements found</td>
                    </tr>
                  ) : (
                    filtered.map((a, i) => (
                      <tr key={a.id} className={`border-b border-theme/50 hover:bg-input-theme transition-colors ${i % 2 === 0 ? "" : "bg-page/30"}`}>
                        <td className="px-4 py-3 text-xs text-body-theme font-mono whitespace-nowrap">{a.date}</td>
                        <td className="px-4 py-3">
                          {a.symbol ? (
                            <span className="text-xs font-bold text-primary-theme bg-kbd-theme px-2 py-0.5 rounded">{a.symbol}</span>
                          ) : (
                            <span className="text-xs text-muted-theme">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-body-theme max-w-md">
                          {a.url ? (
                            <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent-theme hover:underline transition-colors">{a.title}</a>
                          ) : a.title}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${typeColors[a.type] || "bg-kbd-theme text-muted-theme border-hover-theme"}`}>
                            {typeLabels[a.type] || a.type}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-theme">
            <Info className="h-3 w-3" />
            Showing {filtered.length} of {announcements.length} announcements
          </div>
        </>
      ) : (
        <>
          {/* Holidays */}
          <div className="card-3d overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-theme">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-theme uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-theme uppercase tracking-wider">Day</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-theme uppercase tracking-wider">Holiday</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.map((h, i) => {
                    const today = new Date().toISOString().split("T")[0];
                    const isPast = h.date < today;
                    return (
                      <tr key={h.id} className={`border-b border-theme/50 hover:bg-input-theme transition-colors ${i % 2 === 0 ? "" : "bg-page/30"}`}>
                        <td className="px-4 py-3 text-xs text-body-theme font-mono whitespace-nowrap">{h.date}</td>
                        <td className="px-4 py-3 text-xs text-muted-theme">{h.day}</td>
                        <td className="px-4 py-3 text-xs text-primary-theme font-medium">{h.title}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-theme">
            <Info className="h-3 w-3" />
            Showing {holidays.length} upcoming market holidays
          </div>
        </>
      )}
    </div>
  );
}
