"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Download,
  Building2,
  TrendingUp,
  BarChart3,
  Loader2,
} from "lucide-react";
import { API_BASE, type CompanySummary } from "@/lib/api";
import { exportCompanyReport, exportCSV, exportPDF } from "@/lib/export";

export default function ReportsPage() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<"company" | "market" | "screener">("company");

  useEffect(() => {
    fetch(`${API_BASE}/api/companies`)
      .then((r) => r.json())
      .then(setCompanies)
      .catch(() => {});
  }, []);

  const generateCompanyReport = useCallback(async () => {
    if (!selectedSymbol) return;
    setLoading(true);
    try {
      const [statsRes, dataRes, indRes] = await Promise.all([
        fetch(`${API_BASE}/api/companies/${selectedSymbol}/stats`),
        fetch(`${API_BASE}/api/companies/${selectedSymbol}`),
        fetch(`${API_BASE}/api/companies/${selectedSymbol}/indicators`),
      ]);
      const stats = await statsRes.json();
      const detail = await dataRes.json();
      const indicators = await indRes.json();
      exportCompanyReport(selectedSymbol, stats, detail.data || [], indicators.data || []);
    } catch {
      alert("Failed to generate report");
    }
    setLoading(false);
  }, [selectedSymbol]);

  const generateMarketReport = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, moversRes, sectorsRes] = await Promise.all([
        fetch(`${API_BASE}/api/market-summary`),
        fetch(`${API_BASE}/api/top-movers`),
        fetch(`${API_BASE}/api/sectors`),
      ]);
      const summary = await summaryRes.json();
      const movers = await moversRes.json();
      const sectors = await sectorsRes.json();

      const reportData = [
        { metric: "Total Companies", value: summary.totalCompanies },
        { metric: "Total Volume", value: summary.totalVolume },
        { metric: "Total Turnover", value: `Rs ${summary.totalTurnover.toLocaleString()}` },
        { metric: "Advances", value: summary.advance },
        { metric: "Declines", value: summary.decline },
        { metric: "Unchanged", value: summary.unchanged },
        { metric: "Latest Date", value: summary.latestDate },
        ...sectors.map((s: any) => ({
          metric: `Sector: ${s.sector}`,
          value: `Avg Change: ${s.avgChange}% | Volume: ${s.totalVolume.toLocaleString()}`,
        })),
        ...movers.gainers.slice(0, 5).map((m: any) => ({
          metric: `Top Gainer: ${m.symbol}`,
          value: `Rs ${m.close} (${m.changePct > 0 ? "+" : ""}${m.changePct}%)`,
        })),
        ...movers.losers.slice(0, 5).map((m: any) => ({
          metric: `Top Loser: ${m.symbol}`,
          value: `Rs ${m.close} (${m.changePct > 0 ? "+" : ""}${m.changePct}%)`,
        })),
      ];
      exportPDF(reportData, "NEPSE Market Report", "nepse_market_report");
    } catch {
      alert("Failed to generate market report");
    }
    setLoading(false);
  }, []);

  const generateCSVExport = useCallback(async () => {
    if (!selectedSymbol) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/companies/${selectedSymbol}`);
      const detail = await res.json();
      exportCSV(detail.data || [], `${selectedSymbol}_data`);
    } catch {
      alert("Failed to export CSV");
    }
    setLoading(false);
  }, [selectedSymbol]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme tracking-tight">Report Generator</h1>
        <p className="text-muted-theme text-sm mt-0.5">
          Generate PDF reports, CSV exports, and analysis summaries
        </p>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2">
        {[
          { key: "company" as const, label: "Company Report", icon: Building2 },
          { key: "market" as const, label: "Market Report", icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setReportType(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              reportType === tab.key
                ? "bg-accent-theme text-primary-theme"
                : "bg-input-theme text-body-theme hover:bg-hover-theme border border-theme"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Company Report */}
      {reportType === "company" && (
        <div className="card-3d p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-primary-theme mb-1">Company Analysis Report</h2>
            <p className="text-sm text-muted-theme">
              Generate a comprehensive PDF report with key statistics, price history, and technical indicators
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-theme mb-2">Select Company</label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full rounded-lg border border-theme bg-input-theme px-4 py-3 text-sm text-primary-theme outline-none focus:border-accent-theme focus:ring-1 focus:ring-accent-theme/50"
            >
              <option value="">Choose a company...</option>
              {companies.map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.symbol} - {c.category}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={generateCompanyReport}
              disabled={!selectedSymbol || loading}
              className="btn-accent flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Generate PDF Report
            </button>
            <button
              onClick={generateCSVExport}
              disabled={!selectedSymbol || loading}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-theme bg-input-theme text-body-theme hover:bg-hover-theme hover:text-primary-theme transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Export CSV Data
            </button>
          </div>
        </div>
      )}

      {/* Market Report */}
      {reportType === "market" && (
        <div className="card-3d p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-primary-theme mb-1">Market Overview Report</h2>
            <p className="text-sm text-muted-theme">
              Generate a full market report with sector performance, top movers, and market statistics
            </p>
          </div>

          <button
            onClick={generateMarketReport}
            disabled={loading}
            className="btn-accent flex items-center justify-center gap-2 py-3 w-full sm:w-auto disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            Generate Market Report (PDF)
          </button>
        </div>
      )}

      {/* Info */}
      <div className="card-3d p-6">
        <h3 className="text-sm font-semibold text-primary-theme mb-3">Report Formats</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-input-theme border border-theme">
            <div className="text-accent-theme font-medium mb-1">PDF Report</div>
            <p className="text-muted-theme text-xs">
              Professional formatted document with tables, statistics, and technical indicators. Ideal for printing and sharing.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-input-theme border border-theme">
            <div className="text-accent-theme font-medium mb-1">CSV Export</div>
            <p className="text-muted-theme text-xs">
              Raw data in spreadsheet format. Compatible with Excel, Google Sheets, and data analysis tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
