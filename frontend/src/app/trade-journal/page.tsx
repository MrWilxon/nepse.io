"use client";

import { useEffect, useState } from "react";
import { Plus, TrendingUp, TrendingDown, Trash2, BookOpen, X } from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function TradeJournalPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: "", type: "buy", entryPrice: "", exitPrice: "", quantity: "10", strategy: "Technical", notes: "", entryDate: "", exitDate: "", stopLoss: "", takeProfit: "" });

  const fetchData = () => {
    fetch(`${API_BASE}/api/journal`).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, []);

  const addEntry = () => {
    fetch(`${API_BASE}/api/journal`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      .then(r => r.json()).then(() => { setShowForm(false); setForm({ symbol: "", type: "buy", entryPrice: "", exitPrice: "", quantity: "10", strategy: "Technical", notes: "", entryDate: "", exitDate: "", stopLoss: "", takeProfit: "" }); fetchData(); });
  };

  const deleteEntry = (id: number) => {
    if (!confirm("Delete this entry?")) return;
    fetch(`${API_BASE}/api/journal/${id}`, { method: "DELETE" }).then(() => fetchData());
  };

  if (loading) return <div className="h-96 rounded-xl bg-input-theme animate-pulse" />;

  const strategies = ["Technical", "Fundamental", "Swing", "Scalp", "Day", "Momentum", "Breakout", "Other"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-theme">Trade Journal</h1>
          <p className="text-muted-theme text-sm mt-0.5">Log, review and analyze your trading performance</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A017] text-primary-theme text-sm font-medium hover:bg-accent-theme">
          <Plus className="h-4 w-4" /> Add Trade
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "Total Trades", value: data.stats.totalTrades, color: "text-primary-theme" },
          { label: "Win Rate", value: `${data.stats.winRate}%`, color: data.stats.winRate >= 50 ? "text-green-theme" : "text-red-theme" },
          { label: "Wins / Losses", value: `${data.stats.wins}/${data.stats.losses}`, color: "text-primary-theme" },
          { label: "Total P&L", value: `Rs ${data.stats.totalPnL.toLocaleString()}`, color: data.stats.totalPnL >= 0 ? "text-green-theme" : "text-red-theme" },
          { label: "Profit Factor", value: data.stats.profitFactor, color: data.stats.profitFactor >= 1.5 ? "text-green-theme" : "text-accent-theme" },
          { label: "Expectancy", value: `Rs ${data.stats.expectancy}`, color: data.stats.expectancy >= 0 ? "text-green-theme" : "text-red-theme" },
        ].map((s, i) => (
          <div key={i} className="card-3d p-3">
            <div className="text-[10px] text-muted-theme">{s.label}</div>
            <div className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card-3d p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-primary-theme">Add Trade</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-theme hover:text-primary-theme"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-muted-theme block mb-1">Symbol</label>
                  <input type="text" value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value.toUpperCase()})} className="w-full rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" /></div>
                <div><label className="text-[10px] text-muted-theme block mb-1">Type</label>
                  <div className="flex gap-1">
                    <button onClick={() => setForm({...form, type: "buy"})} className={`flex-1 py-2 rounded text-xs font-bold ${form.type === "buy" ? "bg-[#22c55e] text-primary-theme" : "bg-input-theme text-muted-theme border border-theme"}`}>BUY</button>
                    <button onClick={() => setForm({...form, type: "sell"})} className={`flex-1 py-2 rounded text-xs font-bold ${form.type === "sell" ? "bg-[#ef4444] text-primary-theme" : "bg-input-theme text-muted-theme border border-theme"}`}>SELL</button>
                  </div></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-muted-theme block mb-1">Entry Price</label>
                  <input type="number" value={form.entryPrice} onChange={e => setForm({...form, entryPrice: e.target.value})} className="w-full rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" /></div>
                <div><label className="text-[10px] text-muted-theme block mb-1">Exit Price</label>
                  <input type="number" value={form.exitPrice} onChange={e => setForm({...form, exitPrice: e.target.value})} className="w-full rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-muted-theme block mb-1">Quantity</label>
                  <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" /></div>
                <div><label className="text-[10px] text-muted-theme block mb-1">Strategy</label>
                  <select value={form.strategy} onChange={e => setForm({...form, strategy: e.target.value})} className="w-full rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none">
                    {strategies.map(s => <option key={s} value={s}>{s}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-muted-theme block mb-1">Entry Date</label>
                  <input type="date" value={form.entryDate} onChange={e => setForm({...form, entryDate: e.target.value})} className="w-full rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" /></div>
                <div><label className="text-[10px] text-muted-theme block mb-1">Exit Date</label>
                  <input type="date" value={form.exitDate} onChange={e => setForm({...form, exitDate: e.target.value})} className="w-full rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-muted-theme block mb-1">Stop Loss</label>
                  <input type="number" value={form.stopLoss} onChange={e => setForm({...form, stopLoss: e.target.value})} className="w-full rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" /></div>
                <div><label className="text-[10px] text-muted-theme block mb-1">Take Profit</label>
                  <input type="number" value={form.takeProfit} onChange={e => setForm({...form, takeProfit: e.target.value})} className="w-full rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" /></div>
              </div>
              <div><label className="text-[10px] text-muted-theme block mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full rounded-lg border border-theme bg-input-theme py-2 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" /></div>
              <button onClick={addEntry} className="w-full py-2 rounded-lg bg-[#D4A017] text-primary-theme text-sm font-bold hover:bg-accent-theme">Save Trade</button>
            </div>
          </div>
        </div>
      )}

      {/* Trades List */}
      <div className="card-3d p-5">
        <h2 className="text-sm font-semibold text-primary-theme mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent-theme" /> Trades ({data.entries.length})</h2>
        {data.entries.length === 0 ? (
          <p className="text-xs text-muted-theme text-center py-8">No trades logged yet. Add your first trade!</p>
        ) : (
          <div className="space-y-2">
            {data.entries.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-input-theme border border-theme">
                <div className="flex items-center gap-3">
                  {e.type === "buy" ? <TrendingUp className="h-4 w-4 text-green-theme" /> : <TrendingDown className="h-4 w-4 text-red-theme" />}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${e.type === "buy" ? "text-green-theme" : "text-red-theme"}`}>{e.type.toUpperCase()}</span>
                      <span className="text-sm font-bold text-primary-theme">{e.symbol}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-kbd-theme text-muted-theme">{e.strategy}</span>
                    </div>
                    <div className="text-[10px] text-muted-theme">Entry: Rs {e.entryPrice} → Exit: Rs {e.exitPrice} · {e.quantity} shares · {e.entryDate} to {e.exitDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-sm font-bold font-mono ${e.pnl >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                      {e.pnl >= 0 ? "+" : ""}Rs {e.pnl.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-muted-theme">{e.pnlPct}% {e.riskReward ? `· R:R ${e.riskReward}` : ""}</div>
                  </div>
                  <button onClick={() => deleteEntry(e.id)} className="text-muted-theme hover:text-red-theme"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
