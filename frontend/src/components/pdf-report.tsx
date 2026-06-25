"use client";

import { useState } from "react";
import { FileText, Download, Loader2, Check } from "lucide-react";

interface ReportData {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  volume: number;
  sector: string;
  high52w: number;
  low52w: number;
  pe: number;
  dividendYield: number;
  signals: string[];
}

export default function PDFReportGenerator({ symbol, data }: { symbol: string; data?: ReportData }) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const reportContent = [
        `NEPSE Stock Report: ${symbol}`,
        `Generated: ${new Date().toLocaleString()}`,
        "",
        data ? [
          `Company: ${data.name}`,
          `Sector: ${data.sector}`,
          `LTP: Rs. ${data.ltp?.toFixed(2)}`,
          `Change: ${data.change?.toFixed(2)}%`,
          `Volume: ${data.volume?.toLocaleString()}`,
          `52-Week High: Rs. ${data.high52w?.toFixed(2)}`,
          `52-Week Low: Rs. ${data.low52w?.toFixed(2)}`,
          `P/E Ratio: ${data.pe?.toFixed(2)}`,
          `Dividend Yield: ${data.dividendYield?.toFixed(2)}%`,
          "",
          "Technical Signals:",
          ...(data.signals || []).map((s) => `  - ${s}`),
        ].join("\n") : "No data available",
      ].join("\n");

      const blob = new Blob([reportContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${symbol}_report.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setGenerated(true);
      setTimeout(() => setGenerated(false), 3000);
    } catch {
      // silently fail
    }
    setGenerating(false);
  };

  return (
    <button
      onClick={generateReport}
      disabled={generating}
      className="flex items-center gap-2 rounded-lg border border-[var(--border-primary)] px-4 py-2 text-sm text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
    >
      {generating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : generated ? (
        <Check className="h-4 w-4 text-[var(--green)]" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {generating ? "Generating..." : generated ? "Downloaded!" : "Generate PDF Report"}
    </button>
  );
}
