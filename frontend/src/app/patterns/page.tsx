"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function PatternsPage() {
  const [symbol, setSymbol] = useState("NMB");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/patterns/advanced/${symbol}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const signalColor = (t: string) => t === "bullish" ? "text-[var(--green)]" : t === "bearish" ? "text-[var(--red)]" : "text-[var(--text-muted)]";
  const signalBg = (t: string) => t === "bullish" ? "bg-[var(--green)]/10 text-[var(--green)] border-[var(--green)]/30" : t === "bearish" ? "bg-[var(--red)]/10 text-[var(--red)] border-[var(--red)]/30" : "bg-[var(--bg-hover)] text-[var(--text-muted)] border-[var(--border-primary)]";

  const patterns = data?.patterns ?? [];
  const bullishCount = patterns.filter((p: any) => p.signal === "bullish").length;
  const bearishCount = patterns.filter((p: any) => p.signal === "bearish").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Chart Patterns Library</h1>
        <p className="text-[var(--text-muted)] text-sm mt-0.5">Automated pattern detection and breakout analysis</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" placeholder="Symbol..." value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
            className="w-32 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-hover)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-[var(--accent)] text-black text-sm font-medium hover:opacity-90">Scan Patterns</button>
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 rounded-xl bg-[var(--bg-hover)] animate-pulse" />)}</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="card-3d p-4">
              <div className="text-xs text-[var(--text-muted)]">Total Patterns</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{data.patternCount}</div>
            </div>
            <div className="card-3d p-4">
              <div className="text-xs text-[var(--text-muted)]">Bullish</div>
              <div className="text-2xl font-bold text-[var(--green)]">{bullishCount}</div>
            </div>
            <div className="card-3d p-4">
              <div className="text-xs text-[var(--text-muted)]">Bearish</div>
              <div className="text-2xl font-bold text-[var(--red)]">{bearishCount}</div>
            </div>
          </div>

          <div className="space-y-3">
            {patterns.map((p: any, i: number) => (
              <div key={i} className="card-3d p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">{p.name}</h3>
                    <div className="text-xs text-[var(--text-muted)]">{p.type} · {p.confidence}% confidence · {p.date}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${signalBg(p.signal)}`}>
                    {p.signal}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mb-3">{p.detail}</p>
                <div className="flex items-center gap-4">
                  <div className="text-xs text-[var(--text-muted)]">Price at detection: <span className="text-[var(--text-primary)] font-mono font-bold">Rs {p.price}</span></div>
                </div>
              </div>
            ))}
            {patterns.length === 0 && (
              <div className="card-3d p-8 text-center text-[var(--text-muted)] text-sm">No patterns detected for {symbol}</div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
