"use client";

import { useEffect, useState } from "react";
import { Settings, Plus, X, Search } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { API_BASE } from "@/lib/api";

interface IndicatorConfig {
  type: string;
  period?: number;
  fast?: number;
  slow?: number;
  signal?: number;
  multiplier?: number;
  field?: string;
}

const INDICATOR_TYPES = [
  { value: "sma", label: "SMA", params: ["period", "field"] },
  { value: "ema", label: "EMA", params: ["period", "field"] },
  { value: "rsi", label: "RSI", params: ["period"] },
  { value: "macd", label: "MACD", params: ["fast", "slow", "signal"] },
  { value: "bollinger", label: "Bollinger Bands", params: ["period", "multiplier"] },
  { value: "stochastic", label: "Stochastic", params: ["period"] },
  { value: "atr", label: "ATR", params: ["period"] },
  { value: "obv", label: "OBV", params: [] },
  { value: "cci", label: "CCI", params: ["period"] },
  { value: "adx", label: "ADX", params: ["period"] },
  { value: "mfi", label: "MFI", params: ["period"] },
  { value: "williams_r", label: "Williams %R", params: ["period"] },
  { value: "vwma", label: "VWMA", params: ["period"] },
  { value: "ichimoku", label: "Ichimoku Cloud", params: [] },
];

const COLORS = ["#D4A017", "#22c55e", "#ef4444", "#2563eb", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"];

export default function IndicatorsPage() {
  const [symbol, setSymbol] = useState("NMB");
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([{ type: "sma", period: 20 }]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/indicators/custom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, indicators }),
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const addIndicator = () => {
    setIndicators([...indicators, { type: "sma", period: 20 }]);
  };

  const removeIndicator = (idx: number) => {
    setIndicators(indicators.filter((_, i) => i !== idx));
  };

  const updateIndicator = (idx: number, field: string, value: any) => {
    const updated = [...indicators];
    updated[idx] = { ...updated[idx], [field]: value };
    setIndicators(updated);
  };

  const chartData = data?.data?.slice(-120) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Custom Indicator Builder</h1>
        <p className="text-muted-theme text-sm mt-0.5">Build custom SMA/EMA combinations and technical indicators</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
          <input
            type="text"
            placeholder="Symbol..."
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
            className="w-32 rounded-lg border border-theme bg-input-theme py-2 pl-9 pr-3 text-sm text-primary-theme outline-none focus:border-accent-theme"
          />
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-accent-theme text-primary-theme text-sm font-medium hover:bg-accent-theme">
          Load Data
        </button>
      </div>

      <div className="card-3d p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-primary-theme flex items-center gap-2"><Settings className="h-4 w-4" /> Indicators</h2>
          <button onClick={addIndicator} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-theme text-accent-theme text-xs font-medium hover:bg-accent-theme">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {indicators.map((ind, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-input-theme border border-theme">
              <select value={ind.type} onChange={(e) => updateIndicator(idx, "type", e.target.value)}
                className="rounded border border-theme bg-page py-1 px-2 text-xs text-primary-theme outline-none">
                {INDICATOR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {INDICATOR_TYPES.find((t) => t.value === ind.type)?.params.includes("period") && (
                <input type="number" value={ind.period || 20} onChange={(e) => updateIndicator(idx, "period", parseInt(e.target.value))}
                  className="w-16 rounded border border-theme bg-page py-1 px-2 text-xs text-primary-theme outline-none" placeholder="Period" />
              )}
              {INDICATOR_TYPES.find((t) => t.value === ind.type)?.params.includes("fast") && (
                <input type="number" value={ind.fast || 12} onChange={(e) => updateIndicator(idx, "fast", parseInt(e.target.value))}
                  className="w-16 rounded border border-theme bg-page py-1 px-2 text-xs text-primary-theme outline-none" placeholder="Fast" />
              )}
              {INDICATOR_TYPES.find((t) => t.value === ind.type)?.params.includes("slow") && (
                <input type="number" value={ind.slow || 26} onChange={(e) => updateIndicator(idx, "slow", parseInt(e.target.value))}
                  className="w-16 rounded border border-theme bg-page py-1 px-2 text-xs text-primary-theme outline-none" placeholder="Slow" />
              )}
              {INDICATOR_TYPES.find((t) => t.value === ind.type)?.params.includes("signal") && (
                <input type="number" value={ind.signal || 9} onChange={(e) => updateIndicator(idx, "signal", parseInt(e.target.value))}
                  className="w-16 rounded border border-theme bg-page py-1 px-2 text-xs text-primary-theme outline-none" placeholder="Signal" />
              )}
              {INDICATOR_TYPES.find((t) => t.value === ind.type)?.params.includes("multiplier") && (
                <input type="number" value={ind.multiplier || 2} onChange={(e) => updateIndicator(idx, "multiplier", parseFloat(e.target.value))}
                  className="w-16 rounded border border-theme bg-page py-1 px-2 text-xs text-primary-theme outline-none" placeholder="Mult" />
              )}
              {INDICATOR_TYPES.find((t) => t.value === ind.type)?.params.includes("field") && (
                <select value={ind.field || "close"} onChange={(e) => updateIndicator(idx, "field", e.target.value)}
                  className="rounded border border-theme bg-page py-1 px-2 text-xs text-primary-theme outline-none">
                  <option value="close">Close</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                  <option value="volume">Volume</option>
                </select>
              )}
              <button onClick={() => removeIndicator(idx)} className="ml-auto text-red-theme hover:text-red-theme/80"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-96 rounded-xl bg-input-theme animate-pulse" />
      ) : data ? (
        <div className="card-3d p-6">
          <h2 className="text-sm font-semibold text-primary-theme mb-4">Chart - {data.symbol}</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8892a0", fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8892a0", fontSize: 10 }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "#1a1a25", border: "1px solid #27272a", borderRadius: "0.75rem", color: "#f0f0f5", fontSize: 12 }} />
                <Line type="monotone" dataKey="close" stroke="#8892a0" strokeWidth={1} dot={false} name="Close" />
                {Object.keys(data.data[0] || {}).filter((k) => k !== "date" && k !== "close" && k !== "high" && k !== "low" && k !== "volume").map((key, i) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={1.5} dot={false} name={key} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-2 py-1 rounded text-xs bg-[#8892a0]/20 text-muted-theme">Close</span>
            {Object.keys(data.data[0] || {}).filter((k) => k !== "date" && k !== "close" && k !== "high" && k !== "low" && k !== "volume").map((key, i) => (
              <span key={key} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: COLORS[i % COLORS.length] + "20", color: COLORS[i % COLORS.length] }}>{key}</span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
