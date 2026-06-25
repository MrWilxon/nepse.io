"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from "recharts";
import { API_BASE } from "@/lib/api";

export default function BreadthPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/breadth`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 rounded-xl bg-input-theme animate-pulse" />)}</div>;
  if (!data) return null;

  const { current, adLine, trin, history } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Market Breadth Indicators</h1>
        <p className="text-muted-theme text-sm mt-0.5">AD Line, TRIN, and advance/decline analysis</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="card-3d p-4">
          <div className="text-xs text-muted-theme">Advances</div>
          <div className="text-xl font-bold text-green-theme font-mono">{current.advances}</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-xs text-muted-theme">Declines</div>
          <div className="text-xl font-bold text-red-theme font-mono">{current.declines}</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-xs text-muted-theme">AD Ratio</div>
          <div className={`text-xl font-bold font-mono ${current.advanceRatio > 50 ? "text-green-theme" : "text-red-theme"}`}>{current.advanceRatio}%</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-xs text-muted-theme">TRIN</div>
          <div className={`text-xl font-bold font-mono ${current.trin < 1 ? "text-green-theme" : current.trin > 1.5 ? "text-red-theme" : "text-accent-theme"}`}>{current.trin}</div>
          <div className="text-[10px] text-muted-theme">{current.trin < 1 ? "Bullish" : current.trin > 1.5 ? "Bearish" : "Neutral"}</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-xs text-muted-theme">VIX</div>
          <div className={`text-xl font-bold font-mono ${current.vix < 15 ? "text-green-theme" : current.vix > 25 ? "text-red-theme" : "text-accent-theme"}`}>{current.vix}</div>
          <div className="text-[10px] text-muted-theme">{current.vix < 15 ? "Low Vol" : current.vix > 25 ? "High Vol" : "Normal"}</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-xs text-muted-theme">Momentum</div>
          <div className={`text-xl font-bold flex items-center gap-1 ${current.breadthMomentum === "bullish" ? "text-green-theme" : "text-red-theme"}`}>
            {current.breadthMomentum === "bullish" ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {current.breadthMomentum}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-3d p-6">
          <h2 className="text-sm font-semibold text-primary-theme mb-4">AD Line</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={adLine.slice(-60)}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8892a0", fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8892a0", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#1a1a25", border: "1px solid #27272a", borderRadius: "0.75rem", color: "#f0f0f5", fontSize: 12 }} />
                <ReferenceLine y={0} stroke="#3f3f46" />
                <Line type="monotone" dataKey="value" stroke="#D4A017" strokeWidth={2} dot={false} name="AD Line" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-3d p-6">
          <h2 className="text-sm font-semibold text-primary-theme mb-4">TRIN (Arms Index)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trin.slice(-60)}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8892a0", fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8892a0", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#1a1a25", border: "1px solid #27272a", borderRadius: "0.75rem", color: "#f0f0f5", fontSize: 12 }} />
                <ReferenceLine y={1} stroke="#D4A017" strokeDasharray="3 3" />
                <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} name="TRIN" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2"><div className="h-2 w-6 bg-green-theme" /><span className="text-[10px] text-muted-theme">Bullish (&lt;1)</span></div>
            <div className="flex items-center gap-2"><div className="h-2 w-6 bg-accent-theme" /><span className="text-[10px] text-muted-theme">Neutral (1-1.5)</span></div>
            <div className="flex items-center gap-2"><div className="h-2 w-6 bg-red-theme" /><span className="text-[10px] text-muted-theme">Bearish (&gt;1.5)</span></div>
          </div>
        </div>
      </div>

      <div className="card-3d p-6">
        <h2 className="text-sm font-semibold text-primary-theme mb-4">Daily Advance/Decline</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={history.slice(-30)}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8892a0", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8892a0", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#1a1a25", border: "1px solid #27272a", borderRadius: "0.75rem", color: "#f0f0f5", fontSize: 12 }} />
              <ReferenceLine y={0} stroke="#3f3f46" />
              <Bar dataKey="advances" name="Advances" radius={[4, 4, 0, 0]}>
                {history.slice(-30).map((_: any, i: number) => <Cell key={i} fill="#22c55e" />)}
              </Bar>
              <Bar dataKey="declines" name="Declines" radius={[4, 4, 0, 0]}>
                {history.slice(-30).map((_: any, i: number) => <Cell key={i} fill="#ef4444" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
