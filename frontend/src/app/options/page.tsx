"use client";

import { useEffect, useState } from "react";
import { Search, ChevronDown } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface OptionData {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  impliedVol: number;
  volume: number;
  openInterest: number;
  bid: number;
  ask: number;
}

interface OptionChain {
  strike: number;
  call: OptionData;
  put: OptionData;
}

interface ChainResponse {
  symbol: string;
  spotPrice: number;
  chain: OptionChain[];
  expiry: string;
  expiryDates: string[];
  message?: string;
}

export default function OptionsPage() {
  const [symbol, setSymbol] = useState("NMB");
  const [chain, setChain] = useState<ChainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expiry, setExpiry] = useState("");

  const fetchChain = () => {
    setLoading(true);
    const url = expiry
      ? `${API_BASE}/api/options/${symbol}?expiry=${expiry}`
      : `${API_BASE}/api/options/${symbol}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setChain(d); setExpiry(d.expiry); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchChain(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Options Chain</h1>
        <p className="text-muted-theme text-sm mt-0.5">Options pricing, Greeks, and open interest</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
          <input
            type="text"
            placeholder="Symbol..."
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && fetchChain()}
            className="w-32 rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-[#D4A017] placeholder:text-muted-theme"
          />
        </div>
        {chain && (
          <select
            value={expiry}
            onChange={(e) => { setExpiry(e.target.value); }}
            className="rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none focus:border-[#D4A017]"
          >
            {chain.expiryDates.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
        <button
          onClick={fetchChain}
          className="px-4 py-2 rounded-lg bg-accent-theme text-primary-theme text-sm font-medium hover:bg-accent-theme transition-colors"
        >
          Load Chain
        </button>
      </div>

      {chain && (
        <div className="card-3d p-4 flex items-center gap-6">
          <div>
            <span className="text-xs text-muted-theme">Spot Price</span>
            <div className="text-xl font-bold text-primary-theme font-mono">Rs {chain.spotPrice}</div>
          </div>
          <div>
            <span className="text-xs text-muted-theme">Expiry</span>
            <div className="text-sm font-bold text-accent-theme">{chain.expiry}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-input-theme animate-pulse" />
          ))}
        </div>
      ) : chain ? (
        <div>
          {(!chain.chain || chain.chain.length === 0) ? (
            <div className="text-center py-12 text-muted-theme">
              {chain.message || "No options data available for this symbol"}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-theme">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-table-header-theme">
                    <th colSpan={7} className="px-4 py-2 text-center text-xs font-bold text-green-theme border-r border-theme">CALLS</th>
                    <th className="px-4 py-2 text-center text-xs font-bold text-accent-theme bg-input-theme">Strike</th>
                    <th colSpan={7} className="px-4 py-2 text-center text-xs font-bold text-red-theme border-l border-theme">PUTS</th>
                  </tr>
                  <tr className="bg-table-header-theme">
                    <th className="px-2 py-2 text-muted-theme">OI</th>
                    <th className="px-2 py-2 text-muted-theme">Vol</th>
                    <th className="px-2 py-2 text-muted-theme">Bid</th>
                    <th className="px-2 py-2 text-muted-theme">Price</th>
                    <th className="px-2 py-2 text-muted-theme">Ask</th>
                    <th className="px-2 py-2 text-muted-theme">IV</th>
                    <th className="px-2 py-2 text-muted-theme border-r border-theme">Delta</th>
                    <th className="px-4 py-2 text-accent-theme bg-input-theme">Price</th>
                    <th className="px-2 py-2 text-muted-theme border-l border-theme">Delta</th>
                    <th className="px-2 py-2 text-muted-theme">IV</th>
                    <th className="px-2 py-2 text-muted-theme">Ask</th>
                    <th className="px-2 py-2 text-muted-theme">Price</th>
                    <th className="px-2 py-2 text-muted-theme">Bid</th>
                    <th className="px-2 py-2 text-muted-theme">Vol</th>
                    <th className="px-2 py-2 text-muted-theme">OI</th>
                  </tr>
                </thead>
                <tbody>
                  {chain.chain.map((row) => {
                    const isATM = Math.abs(row.strike - chain.spotPrice) < (chain.spotPrice * 0.03);
                    const c = row.call || {};
                    const p = row.put || {};
                    return (
                      <tr key={row.strike} className={`border-t border-theme ${isATM ? "bg-accent-theme/5" : "hover:bg-hover-theme"}`}>
                        <td className="px-2 py-2 text-right font-mono text-body-theme">{(c.openInterest ?? 0).toLocaleString()}</td>
                        <td className="px-2 py-2 text-right font-mono text-body-theme">{(c.volume ?? 0).toLocaleString()}</td>
                        <td className="px-2 py-2 text-right font-mono text-green-theme">{c.bid ?? "—"}</td>
                        <td className="px-2 py-2 text-right font-mono font-bold text-primary-theme">{c.price ?? "—"}</td>
                        <td className="px-2 py-2 text-right font-mono text-green-theme">{c.ask ?? "—"}</td>
                        <td className="px-2 py-2 text-right font-mono text-muted-theme">{c.impliedVol != null ? `${c.impliedVol}%` : "—"}</td>
                        <td className="px-2 py-2 text-right font-mono text-muted-theme border-r border-theme">{c.delta ?? "—"}</td>
                        <td className={`px-4 py-2 text-center font-mono font-bold text-accent-theme bg-input-theme ${isATM ? "text-accent-theme" : "text-primary-theme"}`}>
                          {row.strike}
                        </td>
                        <td className="px-2 py-2 text-left font-mono text-muted-theme border-l border-theme">{p.delta ?? "—"}</td>
                        <td className="px-2 py-2 text-left font-mono text-muted-theme">{p.impliedVol != null ? `${p.impliedVol}%` : "—"}</td>
                        <td className="px-2 py-2 text-left font-mono text-red-theme">{p.ask ?? "—"}</td>
                        <td className="px-2 py-2 text-left font-mono font-bold text-primary-theme">{p.price ?? "—"}</td>
                        <td className="px-2 py-2 text-left font-mono text-red-theme">{p.bid ?? "—"}</td>
                        <td className="px-2 py-2 text-left font-mono text-body-theme">{(p.volume ?? 0).toLocaleString()}</td>
                        <td className="px-2 py-2 text-left font-mono text-body-theme">{(p.openInterest ?? 0).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-theme">Enter a symbol and click Load Chain</div>
      )}
    </div>
  );
}
