"use client";

import { useEffect, useState } from "react";
import { BarChart3, Hash } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { safeFetch, API_BASE, type SocialSentimentListResponse, type SocialSentimentDetail } from "@/lib/api";

export default function SentimentPage() {
  const [data, setData] = useState<SocialSentimentListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [detail, setDetail] = useState<SocialSentimentDetail | null>(null);
  const [tab, setTab] = useState<"overview" | "bullish" | "bearish">("overview");

  useEffect(() => {
    safeFetch<SocialSentimentListResponse | null>(`${API_BASE}/api/social-sentiment`, null).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedSymbol) {
      safeFetch<SocialSentimentDetail | null>(`${API_BASE}/api/social-sentiment/${selectedSymbol}`, null).then(setDetail);
    }
  }, [selectedSymbol]);

  const getSentimentColor = (sentiment: string) => {
    if (!sentiment) return "#f59e0b";
    if (sentiment.includes("bullish")) return "#22c55e";
    if (sentiment.includes("bearish")) return "#ef4444";
    return "#f59e0b";
  };

  const getSentimentLabel = (sentiment: string) => {
    if (!sentiment) return "Neutral";
    return sentiment.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getScoreColor = (score: number) => {
    if (score == null) return "text-[var(--text-muted)]";
    if (score >= 60) return "text-[var(--green)]";
    if (score <= 40) return "text-[var(--red)]";
    return "text-[var(--accent)]";
  };

  const companies = tab === "bullish" ? data?.topBullish : tab === "bearish" ? data?.topBearish : data?.companies;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Social Sentiment Tracker</h1>
        <p className="text-[var(--text-muted)] text-sm mt-0.5">Twitter, Reddit, and forum sentiment analysis</p>
      </div>

      <div className="flex gap-2">
        {(["overview", "bullish", "bearish"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? t === "bullish" ? "bg-[var(--green)] text-black" : t === "bearish" ? "bg-[var(--red)] text-black" : "bg-[var(--accent)] text-black"
                : "bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-primary)]"
            }`}
          >
            {t === "overview" ? "All Companies" : t === "bullish" ? "Top Bullish" : "Top Bearish"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-[var(--bg-hover)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(!companies || companies.length === 0) && (
            <div className="text-center py-12 text-[var(--text-muted)]">No sentiment data available</div>
          )}
          {companies?.map((c) => (
            <div
              key={c.symbol}
              onClick={() => setSelectedSymbol(selectedSymbol === c.symbol ? null : c.symbol)}
              className={`card-3d p-4 cursor-pointer transition-all ${selectedSymbol === c.symbol ? "border-[var(--accent)]" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${getSentimentColor(c.overall)}15` }}>
                    <BarChart3 className="h-5 w-5" style={{ color: getSentimentColor(c.overall) }} />
                  </div>
                  <div>
                    <a href={`/company/${c.symbol}`} onClick={(e) => e.stopPropagation()} className="font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
                      {c.symbol}
                    </a>
                    <div className="text-xs text-[var(--text-muted)]">{c.totalMentions} mentions</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-bold font-mono ${getScoreColor(c.score)}`}>
                    {c.score}/100
                  </span>
                  <span className="text-xs px-3 py-1 rounded-lg font-semibold" style={{ background: `${getSentimentColor(c.overall)}15`, color: getSentimentColor(c.overall) }}>
                    {getSentimentLabel(c.overall)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && selectedSymbol && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{detail.symbol} - Sentiment Detail</h2>
            <button onClick={() => setSelectedSymbol(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Close</button>
          </div>

          <div className="card-3d p-5">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-4xl font-bold font-mono ${getScoreColor(detail.score)}`}>{detail.score}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Sentiment Score</div>
              </div>
              <div className="flex-1">
                <div className="h-3 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${detail.score}%`,
                      background: `linear-gradient(90deg, #ef4444, #f59e0b 40%, #22c55e)`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                  <span>Bearish</span>
                  <span>Neutral</span>
                  <span>Bullish</span>
                </div>
              </div>
              <span className="text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: `${getSentimentColor(detail.overall)}15`, color: getSentimentColor(detail.overall) }}>
                {getSentimentLabel(detail.overall)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(detail.platforms || []).map((p) => (
              <div key={p.platform} className="card-3d p-4">
                <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">{p.platform}</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${getSentimentColor(p.sentiment)}15`, color: getSentimentColor(p.sentiment) }}>
                    {getSentimentLabel(p.sentiment)}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{p.mentions} mentions</span>
                </div>
                <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                  <div className="bg-[var(--green)] rounded-l-full" style={{ width: `${p.positivePct}%` }} />
                  <div className="bg-[var(--red)] rounded-r-full" style={{ width: `${p.negativePct}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                  <span>{p.positivePct}% positive</span>
                  <span>{p.negativePct}% negative</span>
                </div>
              </div>
            ))}
          </div>

          {detail.trendingTopics && detail.trendingTopics.length > 0 && (
            <div className="card-3d p-5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <Hash className="h-4 w-4 text-[var(--accent)]" />
                Trending Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {detail.trendingTopics.map((t, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                    style={{
                      borderColor: `${getSentimentColor(t.sentiment)}40`,
                      color: getSentimentColor(t.sentiment),
                      background: `${getSentimentColor(t.sentiment)}10`,
                    }}
                  >
                    #{t.topic} ({t.count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {detail.dailySentiment && detail.dailySentiment.length > 0 && (
            <div className="card-3d p-5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[var(--accent)]" />
                30-Day Sentiment Trend
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={detail.dailySentiment}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8892a0" }} tickFormatter={(d) => d?.slice(5)} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#8892a0" }} />
                  <Tooltip
                    contentStyle={{ background: "#13131a", border: "1px solid #27272a", borderRadius: "0.5rem", fontSize: 12 }}
                    labelStyle={{ color: "#8892a0" }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#D4A017" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
