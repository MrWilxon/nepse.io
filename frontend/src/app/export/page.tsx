"use client";

import { useEffect, useState, useMemo } from "react";
import { Download, Check, ChevronDown, ChevronUp, FileSpreadsheet, FileText, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { CompanySummary } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ExportPage() {
  const { t } = useI18n();
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fromDate, setFromDate] = useState("2020-01-01");
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [format, setFormat] = useState<"csv" | "excel">("csv");
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewSymbol, setPreviewSymbol] = useState("");
  const [exportedCount, setExportedCount] = useState(0);
  const [totalToExport, setTotalToExport] = useState(0);
  const [sectorFilter, setSectorFilter] = useState("All");

  useEffect(() => {
    fetch(`${API_BASE}/api/companies`)
      .then((r) => r.json())
      .then(setCompanies);
  }, []);

  const sectors = useMemo(() => {
    const s = new Set(companies.map((c) => c.category));
    return ["All", ...Array.from(s).sort()];
  }, [companies]);

  const filtered = companies.filter((c) => {
    const matchSearch = c.symbol.toLowerCase().includes(search.toLowerCase());
    const matchSector = sectorFilter === "All" || c.category === sectorFilter;
    return matchSearch && matchSector;
  });

  const allVisibleSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.symbol));

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.symbol)));
    }
  };

  const toggleOne = (symbol: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  };

  const handlePreview = async (symbol: string) => {
    setPreviewSymbol(symbol);
    try {
      const res = await fetch(
        `${API_BASE}/api/companies/${symbol}?from=${fromDate}&to=${toDate}&limit=20`
      );
      const data = await res.json();
      setPreviewData(data.data?.slice(0, 10) || []);
    } catch {
      setPreviewData(null);
    }
  };

  const downloadCSV = (symbol: string) => {
    const link = document.createElement("a");
    link.href = `${API_BASE}/api/export/${symbol}/csv?from=${fromDate}&to=${toDate}`;
    link.download = `${symbol}_data.csv`;
    link.click();
  };

  const downloadExcel = async (symbol: string) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/companies/${symbol}?from=${fromDate}&to=${toDate}`
      );
      const data = await res.json();
      const records = data.data || [];
      if (!records.length) return;

      const headers = ["Date", "Open", "High", "Low", "Close", "Change", "Volume", "Turnover"];
      const rows = records.map((r: any) => [
        r.date, r.open, r.high, r.low, r.close, r.change, r.volume, r.turnover,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${symbol}_data.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const handleExportAll = async () => {
    const symbols = Array.from(selected);
    if (!symbols.length) return;
    setExporting(true);
    setTotalToExport(symbols.length);
    setExportedCount(0);

    for (const symbol of symbols) {
      if (format === "csv") {
        downloadCSV(symbol);
      } else {
        await downloadExcel(symbol);
      }
      setExportedCount((prev) => prev + 1);
      await new Promise((r) => setTimeout(r, 300));
    }
    setExporting(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">{t("export.title")}</h1>
        <p className="text-muted-theme text-sm mt-0.5">{t("export.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          {/* Format */}
          <div className="card-3d p-4">
            <label className="text-xs font-medium text-muted-theme">{t("export.format")}</label>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setFormat("csv")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  format === "csv"
                    ? "bg-accent-theme border border-accent-theme text-accent-theme"
                    : "border border-theme bg-input-theme text-body-theme hover:bg-hover-theme"
                }`}
              >
                <FileText className="h-4 w-4" />
                CSV
              </button>
              <button
                onClick={() => setFormat("excel")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  format === "excel"
                    ? "bg-accent-theme border border-accent-theme text-accent-theme"
                    : "border border-theme bg-input-theme text-body-theme hover:bg-hover-theme"
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {t("export.excel")}
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div className="card-3d p-4">
            <label className="text-xs font-medium text-muted-theme">{t("export.dateRange")}</label>
            <div className="mt-2 space-y-2">
              <div>
                <label className="text-[10px] text-dim-theme">{t("export.from")}</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-lg border border-theme bg-input-theme px-3 py-2 text-sm text-primary-theme outline-none focus:border-accent-theme"
                />
              </div>
              <div>
                <label className="text-[10px] text-dim-theme">{t("export.to")}</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-lg border border-theme bg-input-theme px-3 py-2 text-sm text-primary-theme outline-none focus:border-accent-theme"
                />
              </div>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportAll}
            disabled={!selected.size || exporting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-theme px-4 py-3 text-sm font-semibold text-primary-theme transition-colors hover:bg-accent-theme disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t("export.exporting")} {exportedCount}/{totalToExport}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {t("export.downloadAll")} ({selected.size})
              </>
            )}
          </button>
        </div>

        {/* Company List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filters */}
          <div className="card-3d p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={t("dashboard.searchSymbol")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-theme bg-input-theme px-3 py-2 pl-9 text-sm text-primary-theme outline-none focus:border-accent-theme"
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-theme" />
              </div>
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="rounded-lg border border-theme bg-input-theme px-3 py-2 text-sm text-primary-theme outline-none focus:border-accent-theme"
              >
                {sectors.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={toggleAll}
                className={`rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${
                  allVisibleSelected
                    ? "bg-accent-theme border-accent-theme text-accent-theme"
                    : "border-theme bg-input-theme text-body-theme hover:bg-hover-theme"
                }`}
              >
                {allVisibleSelected ? t("export.deselectAll") : t("export.selectAll")}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="card-3d overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="table-header">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAll}
                        className="rounded border-hover-theme bg-input-theme accent-[#D4A017]"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">{t("common.symbol")}</th>
                    <th className="px-4 py-3 text-left">{t("common.category")}</th>
                    <th className="px-4 py-3 text-right">{t("common.records")}</th>
                    <th className="px-4 py-3 text-center">{t("export.preview")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.symbol}
                      className={`table-row cursor-pointer ${selected.has(c.symbol) ? "bg-accent-theme/5" : ""}`}
                      onClick={() => toggleOne(c.symbol)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(c.symbol)}
                          onChange={() => toggleOne(c.symbol)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-hover-theme bg-input-theme accent-[#D4A017]"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary-theme">{c.symbol}</td>
                      <td className="px-4 py-3 text-body-theme">{c.category}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-theme">
                        {c.records.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePreview(c.symbol); }}
                          className="text-xs text-accent-theme hover:text-accent-theme font-medium"
                        >
                          {previewSymbol === c.symbol && previewData ? (
                            <ChevronUp className="h-4 w-4 inline" />
                          ) : (
                            <ChevronDown className="h-4 w-4 inline" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preview */}
          {previewData && previewSymbol && (
            <div className="card-3d p-4">
              <h3 className="text-sm font-semibold text-primary-theme mb-3">
                {t("export.dataPreview")} - {previewSymbol}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-theme border-b border-theme">
                      <th className="px-2 py-1.5 text-left">{t("common.date")}</th>
                      <th className="px-2 py-1.5 text-right">{t("common.open")}</th>
                      <th className="px-2 py-1.5 text-right">{t("common.high")}</th>
                      <th className="px-2 py-1.5 text-right">{t("common.low")}</th>
                      <th className="px-2 py-1.5 text-right">{t("common.close")}</th>
                      <th className="px-2 py-1.5 text-right">{t("common.volume")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((r, i) => (
                      <tr key={i} className="border-b border-theme/50">
                        <td className="px-2 py-1.5 font-mono text-primary-theme">{r.date}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-body-theme">{r.open}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-body-theme">{r.high}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-body-theme">{r.low}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-primary-theme">{r.close}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-muted-theme">{r.volume?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
