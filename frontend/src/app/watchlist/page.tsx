"use client";

import { useEffect, useState } from "react";
import { Star, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { useWatchlist } from "@/lib/watchlist";
import type { CompanySummary } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function WatchlistPage() {
  const { watchlist, toggle } = useWatchlist();
  const [companies, setCompanies] = useState<CompanySummary[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/companies`).then((r) => r.json()).then(setCompanies);
  }, []);

  const watched = companies.filter((c) => watchlist.includes(c.symbol));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Watchlist</h1>
        <p className="text-[var(--text-muted)]">
          {watched.length} {watched.length === 1 ? "company" : "companies"} tracked
        </p>
      </div>

      {watched.length === 0 ? (
        <div className="card-3d flex flex-col items-center justify-center py-20">
          <Star className="mb-4 h-12 w-12 text-[var(--border-primary)]" />
          <p className="text-[var(--text-muted)]">Your watchlist is empty</p>
          <p className="text-sm mt-1 text-[var(--text-dim)]">Click the star icon on any company to add it</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {watched.map((c) => (
            <div
              key={c.symbol}
              className="card-3d group relative p-5 transition-all"
            >
              <button
                onClick={() => toggle(c.symbol)}
                className="absolute right-3 top-3 text-yellow-400 transition-transform hover:scale-110"
              >
                <Star className="h-5 w-5 fill-current" />
              </button>
              <a href={`/company/${c.symbol}`} className="block">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{c.symbol}</h3>
                  <ExternalLink className="h-3 w-3 text-[var(--text-dim)] opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="text-xs text-[var(--text-dim)]">{c.category}</p>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="text-xs text-[var(--text-dim)]">Latest Price</div>
                    <div className="text-xl font-bold font-mono text-[var(--text-primary)]">
                      {c.latestClose !== null ? `Rs ${c.latestClose.toLocaleString()}` : "-"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[var(--text-dim)]">Records</div>
                    <div className="font-mono text-sm text-[var(--text-muted)]">{c.records.toLocaleString()}</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-[var(--text-dim)]">
                  Last updated: {c.latestDate || "-"}
                </div>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
