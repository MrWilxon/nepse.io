"use client";

import { useState } from "react";
import { Calculator, AlertTriangle, Target, Shield } from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function RiskCalculatorPage() {
  const [form, setForm] = useState({ accountSize: "1000000", riskPercent: "2", entryPrice: "", stopLoss: "", takeProfit: "", symbol: "NMB" });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/risk-calculator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      .then(r => r.json()).then(d => { setResult(d); setLoading(false); }).catch(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Risk Calculator</h1>
        <p className="text-muted-theme text-sm mt-0.5">Position sizing, stop-loss placement and risk/reward analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card-3d p-6">
          <h2 className="text-sm font-semibold text-primary-theme mb-4 flex items-center gap-2"><Calculator className="h-4 w-4 text-accent-theme" /> Parameters</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-theme mb-1 block">Symbol</label>
                <input type="text" value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value.toUpperCase()})} className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" />
              </div>
              <div>
                <label className="text-[10px] text-muted-theme mb-1 block">Account Size (Rs)</label>
                <input type="number" value={form.accountSize} onChange={e => setForm({...form, accountSize: e.target.value})} className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-theme mb-1 block">Risk Per Trade (%)</label>
              <input type="number" step="0.1" value={form.riskPercent} onChange={e => setForm({...form, riskPercent: e.target.value})}
                className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" />
              <div className="flex gap-2 mt-1">
                {[0.5, 1, 2, 3].map(pct => (
                  <button key={pct} onClick={() => setForm({...form, riskPercent: String(pct)})}
                    className={`text-[10px] px-2 py-0.5 rounded ${form.riskPercent === String(pct) ? "bg-[#D4A017] text-primary-theme" : "bg-kbd-theme text-muted-theme hover:text-primary-theme"}`}>
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-theme mb-1 block">Entry Price (Rs)</label>
                <input type="number" step="0.01" value={form.entryPrice} onChange={e => setForm({...form, entryPrice: e.target.value})}
                  className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" />
              </div>
              <div>
                <label className="text-[10px] text-muted-theme mb-1 block">Stop Loss (Rs)</label>
                <input type="number" step="0.01" value={form.stopLoss} onChange={e => setForm({...form, stopLoss: e.target.value})}
                  className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-theme mb-1 block">Take Profit (Rs) — optional</label>
              <input type="number" step="0.01" value={form.takeProfit} onChange={e => setForm({...form, takeProfit: e.target.value})}
                className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme" />
            </div>
            <button onClick={calculate}
              className="w-full py-2.5 rounded-lg bg-[#D4A017] text-primary-theme text-sm font-bold hover:bg-[#E8B830]">
              {loading ? "Calculating..." : "Calculate Position"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result && !result.error ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="card-3d p-5">
                  <div className="flex items-center gap-2 mb-2"><Target className="h-4 w-4 text-accent-theme" /><div className="text-[10px] text-muted-theme">Position Size</div></div>
                  <div className="text-3xl font-bold text-primary-theme font-mono">{result.positionSize}</div>
                  <div className="text-xs text-muted-theme">shares</div>
                </div>
                <div className="card-3d p-5">
                  <div className="flex items-center gap-2 mb-2"><Shield className="h-4 w-4 text-red-theme" /><div className="text-[10px] text-muted-theme">Risk Amount</div></div>
                  <div className="text-3xl font-bold text-red-theme font-mono">Rs {result.riskAmount.toLocaleString()}</div>
                  <div className="text-xs text-muted-theme">{result.riskPercent}% of account</div>
                </div>
              </div>

              <div className="card-3d p-5">
                <h3 className="text-sm font-semibold text-primary-theme mb-3">Trade Summary</h3>
                <div className="space-y-2">
                  {[
                    { label: "Symbol", value: result.symbol, color: "text-primary-theme" },
                    { label: "Entry Price", value: `Rs ${result.entryPrice}`, color: "text-primary-theme" },
                    { label: "Stop Loss", value: `Rs ${result.stopLoss}`, color: "text-red-theme" },
                    { label: "Stop Loss %", value: `${result.stopLossPercent}%`, color: "text-red-theme" },
                    { label: "Risk per Share", value: `Rs ${result.riskPerShare}`, color: "text-red-theme" },
                    { label: "Position Value", value: `Rs ${result.positionValue.toLocaleString()}`, color: "text-primary-theme" },
                    { label: "Risk Amount", value: `Rs ${result.riskAmount.toLocaleString()}`, color: "text-red-theme" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-theme last:border-0">
                      <span className="text-xs text-muted-theme">{r.label}</span>
                      <span className={`text-sm font-mono font-bold ${r.color}`}>{r.value}</span>
                    </div>
                  ))}
                  {result.riskRewardRatio && (
                    <>
                      <div className="flex items-center justify-between py-1.5 border-b border-theme">
                        <span className="text-xs text-muted-theme">Take Profit</span>
                        <span className="text-sm font-mono font-bold text-green-theme">Rs {result.takeProfit}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-theme">
                        <span className="text-xs text-muted-theme">Take Profit %</span>
                        <span className="text-sm font-mono font-bold text-green-theme">{result.takeProfitPercent}%</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-theme">
                        <span className="text-xs text-muted-theme">Risk/Reward Ratio</span>
                        <span className={`text-sm font-mono font-bold ${result.riskRewardRatio >= 2 ? "text-green-theme" : result.riskRewardRatio >= 1 ? "text-accent-theme" : "text-red-theme"}`}>
                          1:{result.riskRewardRatio}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-xs text-muted-theme">Potential Profit</span>
                        <span className="text-sm font-mono font-bold text-green-theme">Rs {result.potentialProfit?.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {result.riskRewardRatio && (
                <div className={`p-4 rounded-lg border ${result.riskRewardRatio >= 2 ? "bg-[#22c55e]/5 border-green-theme" : result.riskRewardRatio >= 1 ? "bg-[#D4A017]/5 border-accent-theme" : "bg-[#ef4444]/5 border-red-theme"}`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${result.riskRewardRatio >= 2 ? "text-green-theme" : result.riskRewardRatio >= 1 ? "text-accent-theme" : "text-red-theme"}`} />
                    <span className="text-xs font-bold text-primary-theme">
                      {result.riskRewardRatio >= 2 ? "Good" : result.riskRewardRatio >= 1 ? "Acceptable" : "Poor"} Risk/Reward Ratio
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-theme mt-1">
                    {result.riskRewardRatio >= 2
                      ? "This trade offers favorable risk/reward. Consider taking the position."
                      : result.riskRewardRatio >= 1
                        ? "Acceptable but consider widening your take profit target."
                        : "Risk exceeds reward. Adjust entry or stop loss to improve this ratio."}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="card-3d p-8 text-center">
              <Calculator className="h-12 w-12 text-border-theme mx-auto mb-3" />
              <p className="text-xs text-muted-theme">Enter your trade parameters and click Calculate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
