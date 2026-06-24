"use client";

import { useState, useEffect, useMemo } from "react";
import { Grid, Info } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface CompanySummary {
  symbol: string;
  ltp: number;
  percentChange: number;
  sector: string;
}

function getCorrelationColor(value: number): string {
  if (value >= 0.7) return "bg-[var(--green)] text-primary-theme";
  if (value >= 0.3) return "bg-[var(--green)]/30 text-[var(--text-primary)]";
  if (value >= -0.3) return "bg-[var(--bg-hover)] text-[var(--text-muted)]";
  if (value >= -0.7) return "bg-[var(--red)]/30 text-[var(--text-primary)]";
  return "bg-[var(--red)] text-primary-theme";
}

function computeCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const xSlice = x.slice(0, n);
  const ySlice = y.slice(0, n);
  const meanX = xSlice.reduce((s, v) => s + v, 0) / n;
  const meanY = ySlice.reduce((s, v) => s + v, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - meanX;
    const dy = ySlice[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

export default function CorrelationPage() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string; value: number } | null>(null);

  const [priceChanges, setPriceChanges] = useState<Record<string, number[]>>({});

  useEffect(() => {
    fetch(`${API_BASE}/api/companies`)
      .then((r) => r.json())
      .then((data) => {
        setCompanies(data);
        const top = data.slice(0, 10).map((c: any) => c.symbol);
        setSelected(top);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected.length === 0) return;
    const changes: Record<string, number[]> = {};
    let loaded = 0;
    selected.forEach((sym) => {
      fetch(`${API_BASE}/api/historical/${sym}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data) && data.length >= 2) {
            const closes = data.slice(-30).map((d: any) => parseFloat(d.close || d.Close || "0")).filter((v) => v > 0);
            if (closes.length >= 2) {
              const pctChanges = [];
              for (let i = 1; i < closes.length; i++) {
                pctChanges.push(((closes[i] - closes[i - 1]) / closes[i - 1]) * 100);
              }
              changes[sym] = pctChanges;
            }
          }
          loaded++;
          if (loaded === selected.length) setPriceChanges({ ...changes });
        })
        .catch(() => { loaded++; if (loaded === selected.length) setPriceChanges({ ...changes }); });
    });
  }, [selected]);

  const correlationMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    selected.forEach((row) => {
      matrix[row] = {};
      selected.forEach((col) => {
        if (row === col) {
          matrix[row][col] = 1;
        } else if (matrix[col]?.[row] !== undefined) {
          matrix[row][col] = matrix[col][row];
        } else {
          matrix[row][col] = computeCorrelation(
            priceChanges[row] || [],
            priceChanges[col] || []
          );
        }
      });
    });
    return matrix;
  }, [selected, priceChanges]);

  const toggleSymbol = (sym: string) => {
    setSelected((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym].slice(0, 15)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Correlation Matrix</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">See how stocks move relative to each other</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5" />
          <span>Strong Positive</span>
          <div className="h-4 w-8 rounded bg-[var(--green)]" />
          <span>Strong Negative</span>
          <div className="h-4 w-8 rounded bg-[var(--red)]" />
        </div>
      </div>

      {/* Company Selector */}
      <div className="card-3d p-4">
        <h3 className="mb-3 text-xs font-medium text-[var(--text-muted)]">Select Companies (max 15)</h3>
        <div className="flex flex-wrap gap-2">
          {companies.slice(0, 30).map((c) => (
            <button
              key={c.symbol}
              onClick={() => toggleSymbol(c.symbol)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                selected.includes(c.symbol)
                  ? "bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)]"
                  : "border border-[var(--border-primary)] text-[var(--text-muted)] hover:border-[var(--border-hover)]"
              }`}
            >
              {c.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix */}
      {loading ? (
        <div className="card-3d flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-primary)] border-t-[var(--accent)]" />
        </div>
      ) : (
        <div className="card-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-3 py-3"></th>
                  {selected.map((sym) => (
                    <th key={sym} className="px-3 py-3 text-center text-[10px] font-bold">{sym}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selected.map((row) => (
                  <tr key={row} className="table-row">
                    <td className="px-3 py-2 text-[10px] font-bold text-[var(--text-primary)]">{row}</td>
                    {selected.map((col) => {
                      const val = correlationMatrix[row]?.[col] ?? 0;
                      return (
                        <td
                          key={col}
                          className={`px-3 py-2 text-center text-[10px] font-mono font-bold cursor-pointer transition-transform hover:scale-110 ${getCorrelationColor(val)}`}
                          onMouseEnter={() => setHoveredCell({ row, col, value: val })}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {row === col ? "1.00" : val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {hoveredCell && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-2 shadow-xl z-50">
          <span className="text-xs text-[var(--text-primary)]">
            <strong>{hoveredCell.row}</strong> vs <strong>{hoveredCell.col}</strong>:{" "}
            <span className={`font-bold ${hoveredCell.value >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
              {hoveredCell.value.toFixed(3)}
            </span>
            <span className="ml-2 text-[var(--text-dim)]">
              ({Math.abs(hoveredCell.value) > 0.7 ? "Strong" : Math.abs(hoveredCell.value) > 0.3 ? "Moderate" : "Weak"}{" "}
              {hoveredCell.value >= 0 ? "positive" : "negative"})
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
