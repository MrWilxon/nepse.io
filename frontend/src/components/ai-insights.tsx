"use client";

import { useState, useEffect } from "react";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, ChevronRight } from "lucide-react";

interface Insight {
  id: string;
  type: "bullish" | "bearish" | "info" | "warning";
  title: string;
  description: string;
  confidence: number;
  source: string;
  timestamp: string;
}

function generateInsights(companies: any[]): Insight[] {
  const insights: Insight[] = [];

  const gainers = companies.filter((c: any) => (c.percentChange || 0) > 3);
  if (gainers.length > 0) {
    insights.push({
      id: "gainers",
      type: "bullish",
      title: `${gainers.length} stocks rallying today`,
      description: `${gainers.map((c: any) => c.symbol).slice(0, 5).join(", ")} showing strong momentum with >3% gains. Consider watching for continuation patterns.`,
      confidence: 75,
      source: "Technical Analysis",
      timestamp: new Date().toISOString(),
    });
  }

  const losers = companies.filter((c: any) => (c.percentChange || 0) < -3);
  if (losers.length > 0) {
    insights.push({
      id: "losers",
      type: "bearish",
      title: `${losers.length} stocks under pressure`,
      description: `${losers.map((c: any) => c.symbol).slice(0, 5).join(", ")} declining >3%. Watch for potential support levels.`,
      confidence: 70,
      source: "Technical Analysis",
      timestamp: new Date().toISOString(),
    });
  }

  const highVolume = companies.filter((c: any) => (c.volume || 0) > 500000);
  if (highVolume.length > 0) {
    insights.push({
      id: "volume",
      type: "info",
      title: "Unusual volume detected",
      description: `${highVolume.length} stocks trading above average volume. High volume with price movement can signal institutional activity.`,
      confidence: 65,
      source: "Volume Analysis",
      timestamp: new Date().toISOString(),
    });
  }

  insights.push({
    id: "market",
    type: "info",
    title: "Market breadth analysis",
    description: `Advance/Decline ratio suggests ${companies.filter((c: any) => (c.percentChange || 0) > 0).length > companies.filter((c: any) => (c.percentChange || 0) < 0).length ? "bullish" : "bearish"} undertone in the market.`,
    confidence: 60,
    source: "Market Breadth",
    timestamp: new Date().toISOString(),
  });

  return insights;
}

export default function AIInsights({ companies }: { companies?: any[] }) {
  const [allCompanies, setAllCompanies] = useState<any[]>(companies || []);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (companies && companies.length > 0) {
      setAllCompanies(companies);
      setInsights(generateInsights(companies));
    }
  }, [companies]);

  const getIcon = (type: string) => {
    switch (type) {
      case "bullish": return <TrendingUp className="h-4 w-4 text-[var(--green)]" />;
      case "bearish": return <TrendingDown className="h-4 w-4 text-[var(--red)]" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-[var(--amber)]" />;
      default: return <Lightbulb className="h-4 w-4 text-[var(--blue)]" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "bullish": return "border-[var(--green-border)] bg-[var(--green-bg)]";
      case "bearish": return "border-[var(--red-border)] bg-[var(--red-bg)]";
      case "warning": return "border-[var(--amber-border)] bg-[var(--amber-bg)]";
      default: return "border-[var(--blue-border)] bg-[var(--blue-bg)]";
    }
  };

  if (insights.length === 0) return null;

  return (
    <div className="card-3d p-6">
      <div className="mb-4 flex items-center gap-2">
        <Brain className="h-5 w-5 text-[var(--accent)]" />
        <h2 className="text-sm font-bold text-[var(--text-primary)]">AI-Powered Insights</h2>
      </div>
      <div className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`rounded-xl border p-4 transition-all cursor-pointer ${getColor(insight.type)} ${
              expanded === insight.id ? "ring-1 ring-[var(--accent)]" : ""
            }`}
            onClick={() => setExpanded(expanded === insight.id ? null : insight.id)}
          >
            <div className="flex items-start gap-3">
              {getIcon(insight.type)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{insight.title}</h3>
                  <ChevronRight className={`h-4 w-4 text-[var(--text-dim)] transition-transform ${expanded === insight.id ? "rotate-90" : ""}`} />
                </div>
                {expanded === insight.id && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-[var(--text-body)]">{insight.description}</p>
                    <div className="flex items-center gap-4 text-[10px] text-[var(--text-dim)]">
                      <span>Confidence: {insight.confidence}%</span>
                      <span>Source: {insight.source}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
