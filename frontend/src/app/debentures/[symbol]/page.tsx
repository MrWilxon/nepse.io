"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface BondDetail {
  symbol: string;
  name: string;
  issuer: string;
  couponRate: number;
  maturityDate: string;
  faceValue: number;
  creditRating: string;
  listingDate: string;
  outstanding: number;
  currentPrice: number;
  yieldToMaturity: number;
  dayChange: number;
  history: { date: string; price: number; yield: number; volume: number }[];
}

export default function DebentureDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const [bond, setBond] = useState<BondDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/debentures/${symbol}`)
      .then((r) => r.json())
      .then((d) => { setBond(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-xl bg-input-theme animate-pulse" />)}</div>;
  }

  if (!bond) return <div className="text-center py-12 text-muted-theme">Bond not found</div>;

  const recentData = bond.history.slice(-180);

  return (
    <div className="space-y-6">
      <Link href="/debentures" className="inline-flex items-center gap-2 text-sm text-muted-theme hover:text-primary-theme transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Debentures
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary-theme">{bond.symbol}</h1>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${bond.creditRating.startsWith("AAA") || bond.creditRating.startsWith("AA") ? "text-green-theme" : "text-accent-theme"} bg-kbd-theme`}>
              {bond.creditRating}
            </span>
          </div>
          <p className="text-muted-theme text-sm mt-0.5">{bond.name}</p>
          <p className="text-muted-theme text-xs">Issuer: {bond.issuer}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono text-primary-theme">Rs {bond.currentPrice}</div>
          <div className={`text-sm font-bold flex items-center gap-1 justify-end ${bond.dayChange >= 0 ? "text-green-theme" : "text-red-theme"}`}>
            {bond.dayChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {bond.dayChange >= 0 ? "+" : ""}{bond.dayChange.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card-3d p-4">
          <div className="text-xs text-muted-theme">Coupon Rate</div>
          <div className="text-lg font-bold text-accent-theme font-mono">{bond.couponRate}%</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-xs text-muted-theme">Yield to Maturity</div>
          <div className="text-lg font-bold text-primary-theme font-mono">{bond.yieldToMaturity}%</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-xs text-muted-theme">Face Value</div>
          <div className="text-lg font-bold text-primary-theme font-mono">Rs {bond.faceValue}</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-xs text-muted-theme">Maturity Date</div>
          <div className="text-lg font-bold text-primary-theme font-mono">{bond.maturityDate}</div>
        </div>
        <div className="card-3d p-4">
          <div className="text-xs text-muted-theme">Listing Date</div>
          <div className="text-lg font-bold text-primary-theme font-mono">{bond.listingDate}</div>
        </div>
      </div>

      <div className="card-3d p-6">
        <h2 className="text-sm font-semibold text-primary-theme mb-4">Price History</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={recentData}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8892a0", fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8892a0", fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "#1a1a25", border: "1px solid #27272a", borderRadius: "0.75rem", color: "#f0f0f5", fontSize: 12 }} />
              <Line type="monotone" dataKey="price" stroke="#D4A017" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-3d p-6">
        <h2 className="text-sm font-semibold text-primary-theme mb-4">Trading Volume</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recentData.slice(-30)}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8892a0", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8892a0", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#1a1a25", border: "1px solid #27272a", borderRadius: "0.75rem", color: "#f0f0f5", fontSize: 12 }} />
              <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                {recentData.slice(-30).map((_, i) => (
                  <Cell key={i} fill="#D4A01780" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
