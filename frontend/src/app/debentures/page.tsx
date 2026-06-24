"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Search } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Debenture {
  symbol: string;
  name: string;
  issuer: string;
  couponRate: number;
  maturityDate: string;
  faceValue: number;
  creditRating: string;
  listingDate: string;
  outstanding: number;
  currentPrice: number;
  yieldToMaturity: number;
  dayChange: number;
  volume: number;
}

export default function DebenturesPage() {
  const [debentures, setDebentures] = useState<Debenture[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/debentures`)
      .then((r) => r.json())
      .then((d) => { setDebentures(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = debentures.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.symbol.toLowerCase().includes(search.toLowerCase()) ||
    d.issuer.toLowerCase().includes(search.toLowerCase())
  );

  const formatOutstanding = (val: number) => {
    if (val >= 1e9) return `Rs ${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `Rs ${(val / 1e6).toFixed(0)}M`;
    return `Rs ${val}`;
  };

  const getRatingColor = (rating: string) => {
    if (!rating) return "text-muted-theme";
    if (rating.startsWith("AAA")) return "text-green-theme";
    if (rating.startsWith("AA")) return "text-green-theme";
    if (rating.startsWith("A")) return "text-accent-theme";
    return "text-muted-theme";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Debentures & Bonds</h1>
        <p className="text-muted-theme text-sm mt-0.5">Fixed income securities, yields, and credit ratings</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
        <input
          type="text"
          placeholder="Search bonds..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-accent-theme placeholder:text-placeholder"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-input-theme animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-theme">No debentures found</div>
          )}
          {filtered.map((d) => (
            <div key={d.symbol} className="card-3d p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-primary-theme">{d.symbol}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${getRatingColor(d.creditRating || "")} bg-kbd-theme`}>
                      {d.creditRating || "N/A"}
                    </span>
                  </div>
                  <div className="text-sm text-body-theme">{d.name}</div>
                  <div className="text-xs text-muted-theme mt-0.5">Issuer: {d.issuer}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-primary-theme">Rs {d.currentPrice ?? "—"}</div>
                  <div className={`text-xs font-bold flex items-center gap-1 justify-end ${(d.dayChange ?? 0) >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                    {(d.dayChange ?? 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {(d.dayChange ?? 0) >= 0 ? "+" : ""}{(d.dayChange ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-theme">
                <div>
                  <div className="text-[10px] text-muted-theme">Coupon Rate</div>
                  <div className="text-sm font-mono font-bold text-accent-theme">{d.couponRate}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-theme">Yield to Maturity</div>
                  <div className="text-sm font-mono font-bold text-primary-theme">{d.yieldToMaturity}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-theme">Maturity</div>
                  <div className="text-sm font-mono text-primary-theme">{d.maturityDate}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-theme">Outstanding</div>
                  <div className="text-sm font-mono text-primary-theme">{formatOutstanding(d.outstanding)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
