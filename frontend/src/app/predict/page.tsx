"use client";

import { useState, useEffect } from "react";
import { Brain, Search, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { safeFetch, API_BASE, fetchPrediction, fetchSentiment, type Prediction, type SentimentData, type CompanySummary } from "@/lib/api";

export default function PredictPage() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [selected, setSelected] = useState("NABIL");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    safeFetch<CompanySummary[]>(`${API_BASE}/api/companies`, []).then(setCompanies);
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    Promise.all([
      fetchPrediction(selected),
      fetchSentiment(selected),
    ])
      .then(([pred, sent]) => {
        setPrediction(pred);
        setSentiment(sent);
      })
      .finally(() => setLoading(false));
  }, [selected]);

  const filtered = companies.filter(
    (c) => c.symbol?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 15);

  const getSentimentColor = (s: string) => {
    if (s === "bullish") return "text-[var(--green)] bg-[var(--green)]/10 border-[var(--green)]/30";
    if (s === "bearish") return "text-[var(--red)] bg-[var(--red)]/10 border-[var(--red)]/30";
    return "text-[var(--text-muted)] bg-[var(--bg-hover)] border-[var(--border-primary)]";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Price Prediction</h1>
        <p className="text-[var(--text-muted)]">ML-based price forecasting and sentiment analysis</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search || selected}
          onChange={(e) => { setSearch(e.target.value); setSelected(""); }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Search company..."
          className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-hover)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
        {showDropdown && search && !selected && (
          <div className="absolute top-full z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-lg">
            {filtered.map((c) => (
              <button
                key={c.symbol}
                onClick={() => { setSelected(c.symbol); setSearch(""); setShowDropdown(false); }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-[var(--bg-hover)]"
              >
                <span className="font-medium text-[var(--text-primary)]">{c.symbol}</span>
                <span className="text-xs text-[var(--text-muted)]">{c.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-[var(--text-muted)]">Analyzing {selected}...</div>
      ) : prediction && sentiment ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card-3d p-6">
              <div className="mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold text-[var(--text-primary)]">Price Prediction</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Current Price</div>
                  <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">Rs {prediction.currentPrice?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Predicted Price</div>
                  <div className={`text-2xl font-bold font-mono ${
                    prediction.predictedPrice >= prediction.currentPrice ? "text-[var(--green)]" : "text-[var(--red)]"
                  }`}>
                    Rs {prediction.predictedPrice?.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Confidence</div>
                  <div className="text-lg font-bold font-mono text-[var(--text-primary)]">{prediction.confidence?.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Direction</div>
                  <div className={`flex items-center gap-1 text-lg font-bold ${
                    prediction.direction === "up" ? "text-[var(--green)]" : prediction.direction === "down" ? "text-[var(--red)]" : "text-[var(--text-muted)]"
                  }`}>
                    {prediction.direction === "up" ? <ArrowUpRight className="h-5 w-5" /> : prediction.direction === "down" ? <ArrowDownRight className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                    {prediction.direction?.toUpperCase()}
                  </div>
                </div>
              </div>
              {prediction.factors && (
                <div className="mt-4 border-t border-[var(--border-primary)] pt-4">
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-2">Prediction Factors</div>
                  <div className="space-y-2">
                    {Object.entries(prediction.factors).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-muted)] capitalize">{key}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-[var(--bg-hover)]">
                            <div
                              className="h-full rounded-full bg-[var(--green)]"
                              style={{ width: `${Math.min(Math.abs(val) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-[var(--text-primary)]">{val.toFixed(3)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card-3d p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className={`rounded-lg px-2 py-1 text-xs font-bold ${getSentimentColor(sentiment.overall)}`}>
                  {sentiment.overall?.toUpperCase()}
                </div>
                <h3 className="font-bold text-[var(--text-primary)]">Market Sentiment</h3>
                <span className="ml-auto text-sm text-[var(--text-muted)]">
                  Score: {(sentiment.score * 100).toFixed(0)}%
                </span>
              </div>
              {sentiment.headlines && sentiment.headlines.length > 0 ? (
                <div className="space-y-3">
                  {sentiment.headlines.map((h, i) => (
                    <div key={i} className="rounded-lg border border-[var(--border-primary)] p-3">
                      <div className="text-sm font-medium text-[var(--text-primary)]">{h.title}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getSentimentColor(h.sentiment)}`}>
                          {h.sentiment}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">{h.source}</span>
                        <span className="text-xs text-[var(--text-muted)]">{h.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No sentiment headlines available</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
          <Brain className="mb-4 h-12 w-12" />
          <p>Select a company to see AI predictions</p>
        </div>
      )}

      <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4 text-xs">
        <p className="font-semibold mb-1 text-[var(--text-primary)]">Disclaimer</p>
        <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)]">
          <li>AI predictions are for informational purposes only and should not be considered financial advice.</li>
          <li>Past performance does not guarantee future results.</li>
          <li>Trading involves risk; consult a financial advisor before making investment decisions.</li>
        </ul>
      </div>
    </div>
  );
}
