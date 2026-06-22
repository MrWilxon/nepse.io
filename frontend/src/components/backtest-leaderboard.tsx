"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Share2, Copy, Check, TrendingUp, ArrowUpRight } from "lucide-react";

interface Strategy {
  id: string;
  name: string;
  author: string;
  sharpe: number;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  trades: number;
  createdAt: string;
}

const STORAGE_KEY = "nepse_shared_strategies";

function loadStrategies(): Strategy[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [
    { id: "1", name: "Golden Crossover Master", author: "TraderX", sharpe: 2.4, totalReturn: 34.5, winRate: 62, maxDrawdown: -8.2, trades: 48, createdAt: "2025-01-10" },
    { id: "2", name: "RSI Mean Reversion", author: "NepsePro", sharpe: 1.8, totalReturn: 22.1, winRate: 58, maxDrawdown: -12.5, trades: 72, createdAt: "2025-01-08" },
    { id: "3", name: "MACD Momentum", author: "BullRunner", sharpe: 1.5, totalReturn: 18.7, winRate: 55, maxDrawdown: -15.1, trades: 95, createdAt: "2025-01-05" },
  ];
}

export default function BacktestLeaderboard() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setStrategies(loadStrategies());
  }, []);

  const shareStrategy = (strategy: Strategy) => {
    const shareText = `${strategy.name} by ${strategy.author}\nSharpe: ${strategy.sharpe} | Return: ${strategy.totalReturn}% | Win Rate: ${strategy.winRate}%`;
    navigator.clipboard.writeText(shareText).then(() => {
      setCopiedId(strategy.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const medals = ["text-[#D4A017]", "text-[#b0b8c4]", "text-[#cd7f32]"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Strategy Leaderboard</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Top performing backtested strategies</p>
        </div>
      </div>

      <div className="card-3d overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Strategy</th>
                <th className="px-4 py-3 text-left">Author</th>
                <th className="px-4 py-3 text-right">Sharpe</th>
                <th className="px-4 py-3 text-right">Return</th>
                <th className="px-4 py-3 text-right">Win Rate</th>
                <th className="px-4 py-3 text-right">Max DD</th>
                <th className="px-4 py-3 text-right">Trades</th>
                <th className="px-4 py-3 text-center">Share</th>
              </tr>
            </thead>
            <tbody>
              {[...strategies].sort((a, b) => b.sharpe - a.sharpe).map((s, i) => (
                <tr key={s.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${i < 3 ? "bg-[var(--accent-bg)]" : "bg-[var(--bg-hover)]"}`}>
                      {i < 3 ? (
                        <Trophy className={`h-3.5 w-3.5 ${medals[i]}`} />
                      ) : (
                        <span className="text-xs font-bold text-[var(--text-dim)]">{i + 1}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{s.name}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{s.author}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-bold text-[var(--accent)]">{s.sharpe.toFixed(1)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-mono font-bold ${s.totalReturn >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                      {s.totalReturn >= 0 ? "+" : ""}{s.totalReturn.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--text-primary)]">{s.winRate}%</td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--red)]">{s.maxDrawdown}%</td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--text-muted)]">{s.trades}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => shareStrategy(s)}
                      className="rounded-lg p-1.5 text-[var(--text-dim)] hover:bg-[var(--bg-hover)] hover:text-[var(--accent)]"
                    >
                      {copiedId === s.id ? <Check className="h-4 w-4 text-[var(--green)]" /> : <Share2 className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
