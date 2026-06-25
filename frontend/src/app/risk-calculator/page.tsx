"use client";

import { useState } from "react";
import { Calculator, Target, TrendingUp, TrendingDown } from "lucide-react";

export default function RiskCalculatorPage() {
  const [form, setForm] = useState({
    portfolioBalance: "840795.9109053698",
    riskPercent: "1",
    entryPrice: "213",
    stopLoss: "198",
    takeProfit: "260",
    sharesQty: "",
  });

  const entry = parseFloat(form.entryPrice) || 0;
  const sl = parseFloat(form.stopLoss) || 0;
  const tp = parseFloat(form.takeProfit) || 0;
  const portfolio = parseFloat(form.portfolioBalance) || 0;
  const riskPct = parseFloat(form.riskPercent) || 0;
  const overrideQty = parseInt(form.sharesQty) || 0;

  const slSize = Math.abs(entry - sl);
  const tpSize = Math.abs(tp - entry);
  const riskedAmount = portfolio * (riskPct / 100);
  const rrRatio = slSize > 0 ? tpSize / slSize : 0;

  const calculatedQty = slSize > 0 ? Math.floor(riskedAmount / slSize) : 0;
  const buyableQty = overrideQty > 0 ? overrideQty : calculatedQty;
  const investmentAmount = buyableQty * entry;
  const potentialReward = buyableQty * tpSize;
  const capitalAllocation = portfolio > 0 ? (investmentAmount / portfolio) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Risk Calculator</h1>
        <p className="text-muted-theme text-sm mt-0.5">Position sizing, stop-loss placement and risk/reward analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="card-3d p-6">
          <h2 className="text-sm font-semibold text-primary-theme mb-4 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-accent-theme" /> Inputs
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-muted-theme mb-1 block">Portfolio Balance (NRs.)</label>
              <input
                type="number"
                value={form.portfolioBalance}
                onChange={e => setForm({ ...form, portfolioBalance: e.target.value })}
                className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-theme mb-1 block">Risk % per Trade</label>
              <input
                type="number"
                step="0.1"
                value={form.riskPercent}
                onChange={e => setForm({ ...form, riskPercent: e.target.value })}
                className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme"
              />
              <div className="flex gap-2 mt-1">
                {[0.5, 1, 2, 3].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setForm({ ...form, riskPercent: String(pct) })}
                    className={`text-[10px] px-2 py-0.5 rounded ${form.riskPercent === String(pct) ? "bg-[#D4A017] text-primary-theme" : "bg-kbd-theme text-muted-theme hover:text-primary-theme"}`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-muted-theme mb-1 block">Entry Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.entryPrice}
                  onChange={e => setForm({ ...form, entryPrice: e.target.value })}
                  className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-theme mb-1 block">SL Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.stopLoss}
                  onChange={e => setForm({ ...form, stopLoss: e.target.value })}
                  className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-theme mb-1 block">TP Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.takeProfit}
                  onChange={e => setForm({ ...form, takeProfit: e.target.value })}
                  className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-theme mb-1 block">Shares Qty (Optional)</label>
              <input
                type="number"
                value={form.sharesQty}
                onChange={e => setForm({ ...form, sharesQty: e.target.value })}
                placeholder="Override calculated qty"
                className="w-full rounded-lg border border-theme bg-input-theme py-2.5 px-3 text-sm text-primary-theme outline-none focus:border-accent-theme placeholder:text-muted-theme"
              />
            </div>
          </div>
        </div>

        {/* Calculated Metrics + Key Metrics */}
        <div className="space-y-4">
          {/* Calculated Metrics */}
          <div className="card-3d p-6">
            <h2 className="text-sm font-semibold text-primary-theme mb-4">Calculated Metrics</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-theme">
                <span className="text-xs text-muted-theme">SL Size (Price/Share):</span>
                <span className="text-sm font-mono font-bold text-primary-theme">NRs. {slSize.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-theme">
                <span className="text-xs text-muted-theme">TP Size (Price/Share):</span>
                <span className="text-sm font-mono font-bold text-primary-theme">NRs. {tpSize.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-theme">
                <span className="text-xs text-muted-theme">Risked Amount:</span>
                <span className="text-sm font-mono font-bold text-primary-theme">NRs. {riskedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-muted-theme">Risk : Reward Ratio:</span>
                <span className={`text-sm font-mono font-bold ${rrRatio >= 2 ? "text-green-theme" : rrRatio >= 1 ? "text-accent-theme" : "text-red-theme"}`}>
                  1 : {rrRatio.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics & Potential */}
          <div className="rounded-xl border border-accent-theme bg-accent-theme/5 p-6">
            <h2 className="text-sm font-semibold text-accent-theme mb-4">Key Metrics & Potential</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-accent-theme/20">
                <span className="text-xs text-muted-theme">Buyable Quantity:</span>
                <span className="text-sm font-mono font-bold text-accent-theme">{buyableQty} Shares</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-accent-theme/20">
                <span className="text-xs text-muted-theme">Investment Amount:</span>
                <span className="text-sm font-mono font-bold text-accent-theme">NRs. {investmentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-accent-theme/20">
                <span className="text-xs text-muted-theme">Potential Reward:</span>
                <span className="text-sm font-mono font-bold text-accent-theme">NRs. {potentialReward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-muted-theme">Capital Allocation:</span>
                <span className="text-sm font-mono font-bold text-accent-theme">{capitalAllocation.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
