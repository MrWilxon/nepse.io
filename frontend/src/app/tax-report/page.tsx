"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Calculator,
  Calendar,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { exportTaxReport, exportCSV } from "@/lib/export";
import { API_BASE } from "@/lib/api";

interface TaxTransaction {
  symbol: string;
  category: string;
  buyDate: string;
  sellDate: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  totalBuyValue: number;
  totalSellValue: number;
  pnl: number;
  pnlPct: number;
  holdingPeriod: "short_term" | "long_term";
  holdingDays: number;
}

interface TaxSummary {
  totalTransactions: number;
  totalGains: number;
  totalLosses: number;
  netPnL: number;
  shortTermGains: number;
  longTermGains: number;
  shortTermLosses: number;
  longTermLosses: number;
  taxLiability: number;
}

export default function TaxReportPage() {
  const [transactions, setTransactions] = useState<TaxTransaction[]>([]);
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [fiscalYear, setFiscalYear] = useState("2025/26");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "gains" | "losses" | "short" | "long">("all");

  const fetchReport = useCallback(async (fy: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tax-report?fy=${fy.replace("/", "-")}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setSummary(data.summary || null);
    } catch {
      setTransactions([]);
      setSummary(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReport(fiscalYear);
  }, [fiscalYear, fetchReport]);

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "gains") return t.pnl > 0;
    if (filter === "losses") return t.pnl < 0;
    if (filter === "short") return t.holdingPeriod === "short_term";
    if (filter === "long") return t.holdingPeriod === "long_term";
    return true;
  });

  const generatePDF = useCallback(() => {
    if (!summary) return;
    exportTaxReport(summary, transactions, fiscalYear);
  }, [summary, transactions, fiscalYear]);

  const generateCSV = useCallback(() => {
    exportCSV(
      transactions.map((t) => ({
        Symbol: t.symbol,
        Category: t.category,
        "Buy Date": t.buyDate,
        "Sell Date": t.sellDate,
        "Buy Price": t.buyPrice,
        "Sell Price": t.sellPrice,
        Quantity: t.quantity,
        "P&L": t.pnl,
        "P&L %": t.pnlPct,
        "Holding Period": t.holdingPeriod === "short_term" ? "Short-term" : "Long-term",
        "Holding Days": t.holdingDays,
      })),
      `tax_report_${fiscalYear.replace("/", "-")}`
    );
  }, [transactions, fiscalYear]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-theme tracking-tight">Tax Report Generator</h1>
          <p className="text-muted-theme text-sm mt-0.5">
            Capital gains/losses summary for tax filing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            className="rounded-lg border border-theme bg-input-theme px-3 py-2 text-sm text-primary-theme outline-none focus:border-accent-theme"
          >
            <option value="2025/26">FY 2025/26</option>
            <option value="2024/25">FY 2024/25</option>
            <option value="2023/24">FY 2023/24</option>
          </select>
          <button
            onClick={generatePDF}
            disabled={!summary}
            className="btn-accent flex items-center gap-2 text-sm py-2 px-4 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button
            onClick={generateCSV}
            disabled={transactions.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-theme bg-input-theme text-body-theme hover:bg-hover-theme text-sm disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-accent-theme animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="metric-card p-4">
                <div className="text-xs text-muted-theme mb-1">Total Transactions</div>
                <div className="text-xl font-bold text-primary-theme font-mono">{summary.totalTransactions}</div>
              </div>
              <div className="metric-card p-4">
                <div className="flex items-center gap-1 text-xs text-green-theme mb-1">
                  <TrendingUp className="h-3 w-3" />
                  Total Gains
                </div>
                <div className="text-xl font-bold text-green-theme font-mono">Rs {summary.totalGains.toLocaleString()}</div>
              </div>
              <div className="metric-card p-4">
                <div className="flex items-center gap-1 text-xs text-red-theme mb-1">
                  <TrendingDown className="h-3 w-3" />
                  Total Losses
                </div>
                <div className="text-xl font-bold text-red-theme font-mono">Rs {summary.totalLosses.toLocaleString()}</div>
              </div>
              <div className="metric-card p-4">
                <div className="flex items-center gap-1 text-xs text-accent-theme mb-1">
                  <Calculator className="h-3 w-3" />
                  Net P&L
                </div>
                <div className={`text-xl font-bold font-mono ${summary.netPnL >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                  Rs {summary.netPnL.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Breakdown */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card-3d p-5">
                <h3 className="text-sm font-semibold text-primary-theme mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent-theme" />
                  Gains Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-input-theme">
                    <span className="text-sm text-muted-theme">Short-term Gains</span>
                    <span className="font-mono text-sm text-green-theme">Rs {summary.shortTermGains.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-input-theme">
                    <span className="text-sm text-muted-theme">Long-term Gains</span>
                    <span className="font-mono text-sm text-green-theme">Rs {summary.longTermGains.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-input-theme">
                    <span className="text-sm text-muted-theme">Short-term Losses</span>
                    <span className="font-mono text-sm text-red-theme">Rs {summary.shortTermLosses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-input-theme">
                    <span className="text-sm text-muted-theme">Long-term Losses</span>
                    <span className="font-mono text-sm text-red-theme">Rs {summary.longTermLosses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="card-3d p-5">
                <h3 className="text-sm font-semibold text-primary-theme mb-4 flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-accent-theme" />
                  Tax Estimation
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-input-theme">
                    <span className="text-sm text-muted-theme">Net Taxable Income</span>
                    <span className={`font-mono text-sm ${summary.netPnL >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                      Rs {summary.netPnL.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-input-theme">
                    <span className="text-sm text-muted-theme">Tax Rate</span>
                    <span className="font-mono text-sm text-primary-theme">5%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-accent-theme border border-accent-theme">
                    <span className="text-sm font-medium text-accent-theme">Estimated Tax Liability</span>
                    <span className="font-mono text-sm font-bold text-accent-theme">
                      Rs {summary.taxLiability.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-theme leading-relaxed">
                    * Tax estimation is based on 5% capital gains tax rate for NEPSE. Actual tax liability may vary. Please consult a tax professional.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {[
              { key: "all" as const, label: "All" },
              { key: "gains" as const, label: "Gains" },
              { key: "losses" as const, label: "Losses" },
              { key: "short" as const, label: "Short-term" },
              { key: "long" as const, label: "Long-term" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f.key
                    ? "bg-accent-theme text-primary-theme"
                    : "bg-input-theme text-body-theme border border-theme hover:bg-hover-theme"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Transactions Table */}
          <div className="card-3d overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-left">Symbol</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Buy Date</th>
                    <th className="px-4 py-3 text-left">Sell Date</th>
                    <th className="px-4 py-3 text-right">Buy Price</th>
                    <th className="px-4 py-3 text-right">Sell Price</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">P&L</th>
                    <th className="px-4 py-3 text-right">P&L %</th>
                    <th className="px-4 py-3 text-center">Period</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t, i) => (
                    <tr key={`${t.symbol}-${i}`} className="table-row">
                      <td className="px-4 py-3 font-semibold text-primary-theme">{t.symbol}</td>
                      <td className="px-4 py-3 text-body-theme text-xs">{t.category}</td>
                      <td className="px-4 py-3 text-muted-theme text-xs">{t.buyDate}</td>
                      <td className="px-4 py-3 text-muted-theme text-xs">{t.sellDate}</td>
                      <td className="px-4 py-3 text-right font-mono text-primary-theme">Rs {t.buyPrice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-primary-theme">Rs {t.sellPrice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-primary-theme">{t.quantity}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        <span className={`flex items-center justify-end gap-1 ${t.pnl >= 0 ? "text-green-theme" : "text-red-theme"}`}>
                          {t.pnl >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          Rs {Math.abs(t.pnl).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <span className={t.pnlPct >= 0 ? "text-green-theme" : "text-red-theme"}>
                          {t.pnlPct >= 0 ? "+" : ""}{t.pnlPct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                          t.holdingPeriod === "short_term"
                            ? "bg-amber-theme text-amber-theme"
                            : "bg-green-theme text-green-theme"
                        }`}>
                          {t.holdingPeriod === "short_term" ? "Short" : "Long"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-muted-theme">
                        No transactions found for the selected filter
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
