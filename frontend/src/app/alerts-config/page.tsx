"use client";

import { useEffect, useState } from "react";
import { Bell, Plus, Trash2, Mail, Send, Target, X, AlertCircle, CheckCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AlertsConfigPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: "", upperTarget: "", lowerTarget: "", name: "", notifyEmail: "", notifyTelegram: "", message: "" });

  const fetchData = () => {
    fetch(`${API}/api/watchlist`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  };
  useEffect(() => { fetchData(); }, []);

  const addAlert = () => {
    fetch(`${API}/api/watchlist`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      .then(r => r.json()).then(() => { setShowForm(false); setForm({ symbol: "", upperTarget: "", lowerTarget: "", name: "", notifyEmail: "", notifyTelegram: "", message: "" }); fetchData(); });
  };

  const deleteAlert = (id: number) => {
    if (!confirm("Delete alert?")) return;
    fetch(`${API}/api/watchlist/${id}`, { method: "DELETE" }).then(() => fetchData());
  };

  if (loading) return <div className="h-96 rounded-xl bg-input-theme animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-theme">Watchlist Alerts</h1>
          <p className="text-muted-theme text-sm mt-0.5">Set price targets and get notified on Telegram or Email</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A017] text-primary-theme text-sm font-medium hover:bg-accent-theme">
          <Plus className="h-4 w-4" /> Add Alert
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-3d p-4">
          <div className="text-[10px] text-muted-theme">Total Alerts</div>
          <div className="text-xl font-bold text-primary-theme font-mono">{data.count}</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-[10px] text-muted-theme">Triggered</div>
          <div className="text-xl font-bold text-accent-theme font-mono">{data.triggeredCount}</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-[10px] text-muted-theme">Watching</div>
          <div className="text-xl font-bold text-primary-theme font-mono">{data.count - data.triggeredCount}</div>
        </div>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card-3d p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-primary-theme">Add Alert</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-theme hover:text-primary-theme"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-theme mb-1 block">Symbol</label>
                  <input type="text" value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value.toUpperCase()})}
                    className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-[#D4A017]" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-theme mb-1 block">Alert Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. NMB Breakout"
                    className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-[#D4A017]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-theme mb-1 block">Upper Target (Rs) — Price above this triggers alert</label>
                  <input type="number" step="0.01" value={form.upperTarget} onChange={e => setForm({...form, upperTarget: e.target.value})}
                    className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-[#D4A017]" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-theme mb-1 block">Lower Target (Rs) — Price below this triggers alert</label>
                  <input type="number" step="0.01" value={form.lowerTarget} onChange={e => setForm({...form, lowerTarget: e.target.value})}
                    className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-[#D4A017]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-theme mb-1 block flex items-center gap-1"><Mail className="h-3 w-3" /> Email</label>
                  <input type="email" value={form.notifyEmail} onChange={e => setForm({...form, notifyEmail: e.target.value})} placeholder="you@email.com"
                    className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-[#D4A017]" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-theme mb-1 block flex items-center gap-1"><Send className="h-3 w-3" /> Telegram Chat ID</label>
                  <input type="text" value={form.notifyTelegram} onChange={e => setForm({...form, notifyTelegram: e.target.value})} placeholder="@username or chat_id"
                    className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-[#D4A017]" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-theme mb-1 block">Custom Message</label>
                <input type="text" value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="NMB hit target price!"
                  className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-[#D4A017]" />
              </div>
              <button onClick={addAlert} className="w-full py-2.5 rounded-lg bg-[#D4A017] text-primary-theme text-sm font-bold hover:bg-accent-theme">Create Alert</button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="card-3d p-5">
        <h2 className="text-sm font-semibold text-primary-theme mb-3 flex items-center gap-2"><Bell className="h-4 w-4 text-accent-theme" /> Active Alerts</h2>
        {data.alerts.length === 0 ? (
          <p className="text-xs text-muted-theme text-center py-8">No alerts set. Create your first alert!</p>
        ) : (
          <div className="space-y-2">
            {data.alerts.map((a: any) => (
              <div key={a.id} className={`flex items-center justify-between p-4 rounded-lg border ${a.triggered ? "bg-[#D4A017]/5 border-accent-theme" : "bg-input-theme border-theme"}`}>
                <div>
                  <div className="flex items-center gap-2">
                    {a.triggered ? <CheckCircle className="h-4 w-4 text-accent-theme" /> : <Target className="h-4 w-4 text-muted-theme" />}
                    <span className="text-sm font-bold text-primary-theme">{a.symbol}</span>
                    <span className="text-xs text-muted-theme">{a.name || "Alert"}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {a.upperTarget && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-theme text-green-theme">Above Rs {a.upperTarget}</span>}
                    {a.lowerTarget && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-theme text-red-theme">Below Rs {a.lowerTarget}</span>}
                    <span className="text-[10px] text-muted-theme">Current: Rs {a.currentPrice?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {a.notifyEmail && <span className="text-[10px] text-muted-theme flex items-center gap-1"><Mail className="h-3 w-3" /> {a.notifyEmail}</span>}
                    {a.notifyTelegram && <span className="text-[10px] text-muted-theme flex items-center gap-1"><Send className="h-3 w-3" /> {a.notifyTelegram}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {a.triggered && <span className="text-[10px] px-2 py-0.5 rounded bg-accent-theme text-accent-theme font-bold">TRIGGERED</span>}
                  <button onClick={() => deleteAlert(a.id)} className="text-muted-theme hover:text-red-theme"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="card-3d p-4 border border-theme">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-accent-theme mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-bold text-primary-theme mb-1">Notification Setup</div>
            <p className="text-[10px] text-muted-theme leading-relaxed">
              To receive Telegram notifications, create a bot via @BotFather and use your chat ID.
              For email alerts, configure an SMTP server in your environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS).
              Alerts are checked every 60 seconds when the market is open.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
