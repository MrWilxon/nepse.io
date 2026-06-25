"use client";

import { useEffect, useState } from "react";
import { Briefcase, Plus, Trash2, TrendingUp, TrendingDown, Search, X } from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function PortfolioPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: "", type: "buy", quantity: "10", price: "" });

  const fetchData = () => {
    fetch(`${API_BASE}/api/portfolio`).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, []);

  const addHolding = () => {
    fetch(`${API_BASE}/api/portfolio/holdings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      .then(r => r.json()).then(() => { setShowForm(false); setForm({ symbol: "", type: "buy", quantity: "10", price: "" }); fetchData(); });
  };

  const removeHolding = (sym: string) => {
    if (!confirm(`Remove ${sym}?`)) return;
    fetch(`${API_BASE}/api/portfolio/holdings/${sym}`, { method: "DELETE" }).then(() => fetchData());
  };

  if (loading) return <div className="h-96 rounded-xl bg-input-theme animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-theme">Portfolio Tracker</h1>
          <p className="text-muted-theme text-sm mt-0.5">Track your holdings with real-time P&L</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A017] text-primary-theme text-sm font-medium hover:bg-accent-theme">
          <Plus className="h-4 w-4" /> Add Holding
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card-3d p-4">
          <div className="text-[10px] text-muted-theme">Total Value</div>
          <div className="text-xl font-bold text-primary-theme font-mono">Rs {data.summary.totalValue.toLocaleString()}</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-[10px] text-muted-theme">Total Invested</div>
          <div className="text-xl font-bold text-primary-theme font-mono">Rs {data.summary.totalInvested.toLocaleString()}</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-[10px] text-muted-theme">Total P&L</div>
          <div className={`text-xl font-bold font-mono ${data.summary.totalPnL >= 0 ? "text-green-theme" : "text-red-theme"}`}>
            Rs {data.summary.totalPnL.toLocaleString()}
          </div>
        </div>
        <div className="card-3d p-4">
          <div className="text-[10px] text-muted-theme">Return %</div>
          <div className={`text-xl font-bold font-mono ${data.summary.totalPnLPct >= 0 ? "text-green-theme" : "text-red-theme"}`}>
            {data.summary.totalPnLPct >= 0 ? "+" : ""}{data.summary.totalPnLPct}%
          </div>
        </div>
        <div className="card-3d p-4">
          <div className="text-[10px] text-muted-theme">Holdings</div>
          <div className="text-xl font-bold text-primary-theme font-mono">{data.summary.holdingsCount}</div>
        </div>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card-3d p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-primary-theme">Add Holding</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-theme hover:text-primary-theme"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-muted-theme mb-1 block">Symbol</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
                  <input type="text" value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value.toUpperCase()})}
                    className="w-full rounded-lg border border-theme bg-input-theme py-2.5 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-accent-theme" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-theme mb-1 block">Type</label>
                <div className="flex gap-1">
                  <button onClick={() => setForm({...form, type: "buy"})} className={`flex-1 py-2 rounded text-xs font-bold ${form.type === "buy" ? "bg-[#22c55e] text-primary-theme" : "bg-input-theme text-muted-theme border border-theme"}`}>BUY</button>
                  <button onClick={() => setForm({...form, type: "sell"})} className={`flex-1 py-2 rounded text-xs font-bold ${form.type === "sell" ? "bg-[#ef4444] text-primary-theme" : "bg-input-theme text-muted-theme border border-theme"}`}>SELL</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-theme mb-1 block">Quantity</label>
                  <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}
                    className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-theme mb-1 block">Avg Price (Rs)</label>
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                    className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" />
                </div>
              </div>
              <button onClick={addHolding} className="w-full py-2.5 rounded-lg bg-[#D4A017] text-primary-theme text-sm font-bold hover:bg-accent-theme">Add to Portfolio</button>
            </div>
          </div>
        </div>
      )}

      {/* Holdings */}
      <div className="card-3d p-5">
        <h2 className="text-sm font-semibold text-primary-theme mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-accent-theme" /> Holdings</h2>
        {data.holdings.length === 0 ? (
          <p className="text-xs text-muted-theme text-center py-8">No holdings yet. Add your first holding!</p>
        ) : (
          <div className="space-y-2">
            {data.holdings.map((h: any) => (
              <div key={h.symbol} className="flex items-center justify-between p-4 rounded-lg bg-input-theme border border-theme">
                <div>
                  <div className="text-sm font-bold text-primary-theme">{h.symbol}</div>
                  <div className="text-[10px] text-muted-theme">{h.shares} shares · Avg Rs {h.avgPrice.toFixed(2)} · Current Rs {h.currentPrice.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-primary-theme">Rs {h.marketValue.toLocaleString()}</div>
                    <div className={`text-[10px] font-mono ${h.pnl >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                      {h.pnl >= 0 ? "+" : ""}Rs {h.pnl.toFixed(0)} ({h.pnlPct}%)
                    </div>
                  </div>
                  <button onClick={() => removeHolding(h.symbol)} className="text-muted-theme hover:text-red-theme"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
