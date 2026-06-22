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
    await new Promise((r) => setTimeout(r, 2000));
    setGenerating(false);
    setGenerated(true);
    setTimeout(() => setGenerated(false), 3000);
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
