"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface MFDetail {
  symbol: string;
  name: string;
  category: string;
  nav: number;
  aum: number;
  expenseRatio: number;
  manager: string;
  history: { date: string; nav: number; change: number; changePct: number }[];
}

export default function MutualFundDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const [fund, setFund] = useState<MFDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/mutual-funds/${symbol}`)
      .then((r) => r.json())
      .then((d) => { setFund(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-xl bg-input-theme animate-pulse" />)}</div>;
  }

  if (!fund) return <div className="text-center py-12 text-muted-theme">Fund not found</div>;

  const latestChange = fund.history[fund.history.length - 1]?.change || 0;
  const ytdData = fund.history.slice(-250);

  return (
    <div className="space-y-6">
      <Link href="/mutual-funds" className="inline-flex items-center gap-2 text-sm text-muted-theme hover:text-primary-theme transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Mutual Funds
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-theme">{fund.name}</h1>
          <p className="text-muted-theme text-sm mt-0.5">{fund.symbol} · {fund.category} · {fund.manager}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono text-primary-theme">Rs {fund.nav}</div>
          <div className={`text-sm font-bold flex items-center gap-1 justify-end ${latestChange >= 0 ? "text-green-theme" : "text-red-theme"}`}>
            {latestChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {latestChange >= 0 ? "+" : ""}{latestChange.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-3d p-4">
          <div className="text-xs text-muted-theme">AUM</div>
          <div className="text-lg font-bold text-primary-theme font-mono">Rs {(fund.aum / 1e9).toFixed(1)}B</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-xs text-muted-theme">Expense Ratio</div>
          <div className="text-lg font-bold text-accent-theme font-mono">{fund.expenseRatio}%</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-xs text-muted-theme">1 Year High</div>
          <div className="text-lg font-bold text-primary-theme font-mono">Rs {Math.max(...ytdData.map((d) => d.nav)).toFixed(2)}</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-xs text-muted-theme">1 Year Low</div>
          <div className="text-lg font-bold text-primary-theme font-mono">Rs {Math.min(...ytdData.map((d) => d.nav)).toFixed(2)}</div>
        </div>
      </div>

      <div className="card-3d p-6">
        <h2 className="text-sm font-semibold text-primary-theme mb-4">NAV History</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ytdData}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8892a0", fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8892a0", fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ background: "#1a1a25", border: "1px solid #27272a", borderRadius: "0.75rem", color: "#f0f0f5", fontSize: 12 }}
              />
              <Line type="monotone" dataKey="nav" stroke="#D4A017" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
