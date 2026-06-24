"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Search } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function CommunityPage() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/companies`)
      .then((r) => r.json())
      .then((data) => {
        const syms = Array.isArray(data) ? data.map((c: any) => c.symbol).sort() : [];
        setSymbols(syms);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = symbols.filter((s) => s.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Community Discussions</h1>
        <p className="text-muted-theme text-sm mt-0.5">Per-company discussion threads</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-accent-theme placeholder:text-placeholder"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-input-theme animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filtered.map((sym) => (
            <Link
              key={sym}
              href={`/community/${sym}`}
              className="card-3d p-4 flex items-center gap-3 hover:border-accent-theme transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-muted-theme flex-shrink-0" />
              <span className="font-bold text-primary-theme text-sm">{sym}</span>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-theme">
              No companies found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
