"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Activity, Building2, BarChart3, ArrowUpRight,
} from "lucide-react";
import type { SectorData, HeatmapData } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getHeatColor(change: number): string {
  const abs = Math.min(Math.abs(change), 5);
  const alpha = 0.12 + (abs / 5) * 0.78;
  return change >= 0
    ? `rgba(34, 197, 94, ${alpha})`
    : `rgba(239, 68, 68, ${alpha})`;
}

function getHeatBorder(change: number): string {
  const abs = Math.min(Math.abs(change), 5);
  const alpha = 0.2 + (abs / 5) * 0.6;
  return change >= 0
    ? `rgba(34, 197, 94, ${alpha})`
    : `rgba(239, 68, 68, ${alpha})`;
}

function abbreviateSector(sector: string): string {
  return sector
    .replace("/", " / ")
    .split(" ")
    .slice(0, 3)
    .join(" ");
}

export default function SectorsPage() {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSector, setExpandedSector] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/sectors`).then((r) => r.json()),
      fetch(`${API_BASE}/api/sectors/heatmap`).then((r) => r.json()),
    ])
      .then(([sectorsData, heatData]) => {
        setSectors(sectorsData);
        setHeatmap(heatData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-theme border-t-[#D4A017]" />
          <span className="text-sm text-muted-theme">Loading sector data...</span>
        </div>
      </div>
    );
  }

  const totalCompanies = sectors.reduce((s, sec) => s + sec.companyCount, 0);
  const totalVolume = sectors.reduce((s, sec) => s + sec.totalVolume, 0);
  const sectorsWithPositive = heatmap.filter((s) => s.change > 0).length;
  const sectorsWithNegative = heatmap.filter((s) => s.change < 0).length;

  const chartData = [...sectors]
    .sort((a, b) => b.avgChange - a.avgChange)
    .map((s) => ({
      sector: s.sector.length > 18 ? s.sector.slice(0, 16) + "..." : s.sector,
      avgChange: Number(s.avgChange.toFixed(2)),
      fullName: s.sector,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-theme">Sector Performance</h1>
          <p className="mt-1 text-sm text-muted-theme">
            Real-time sector analysis across {totalCompanies} companies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-green-theme px-3 py-1 text-xs font-medium text-green-theme">
            <TrendingUp className="h-3 w-3" />
            {sectorsWithPositive} up
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-red-theme px-3 py-1 text-xs font-medium text-red-theme">
            <TrendingDown className="h-3 w-3" />
            {sectorsWithNegative} down
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card-3d p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent-theme" />
            <span className="text-[10px] text-muted-theme">Sectors</span>
          </div>
          <div className="mt-1 text-lg font-bold text-primary-theme">{sectors.length}</div>
        </div>
        <div className="card-3d p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent-theme" />
            <span className="text-[10px] text-muted-theme">Total Volume</span>
          </div>
          <div className="mt-1 text-lg font-bold text-primary-theme font-mono">
            {(totalVolume / 1_000_000).toFixed(1)}M
          </div>
        </div>
        <div className="card-3d p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent-theme" />
            <span className="text-[10px] text-muted-theme">Avg Change</span>
          </div>
          <div className={`mt-1 text-lg font-bold font-mono ${
            sectors.reduce((s, sec) => s + sec.avgChange, 0) / Math.max(sectors.length, 1) >= 0
              ? "text-green-theme" : "text-red-theme"
          }`}>
            {(sectors.reduce((s, sec) => s + sec.avgChange, 0) / Math.max(sectors.length, 1)).toFixed(2)}%
          </div>
        </div>
        <div className="card-3d p-4">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-accent-theme" />
            <span className="text-[10px] text-muted-theme">Best Sector</span>
          </div>
          <div className="mt-1 text-lg font-bold text-primary-theme truncate">
            {sectors.length > 0
              ? [...sectors].sort((a, b) => b.avgChange - a.avgChange)[0].sector.slice(0, 12)
              : "-"}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="card-3d p-6">
        <h2 className="mb-4 text-sm font-medium text-muted-theme">Sector Heatmap</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
          {heatmap.map((s) => (
            <div
              key={s.sector}
              className="flex flex-col items-center justify-center rounded-lg p-3 text-center transition-all hover:scale-105"
              style={{
                backgroundColor: getHeatColor(s.change),
                border: `1px solid ${getHeatBorder(s.change)}`,
              }}
            >
              <div className="text-[11px] font-bold leading-tight text-primary-theme">
                {abbreviateSector(s.sector)}
              </div>
              <div
                className={`mt-1 text-sm font-bold font-mono ${
                  s.change >= 0 ? "text-green-theme" : "text-red-theme"
                }`}
              >
                {s.change >= 0 ? "+" : ""}
                {s.change.toFixed(2)}%
              </div>
              <div className="mt-0.5 text-[10px] text-muted-theme">
                {s.marketShare.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card-3d p-6">
        <h2 className="mb-4 text-sm font-medium text-muted-theme">Average Change by Sector</h2>
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 44)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#8892a0" }}
              tickFormatter={(v) => `${v}%`}
              domain={["auto", "auto"]}
            />
            <YAxis
              dataKey="sector"
              type="category"
              tick={{ fontSize: 11, fill: "#8892a0" }}
              width={150}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a25",
                border: "1px solid #27272a",
                borderRadius: "0.5rem",
                color: "#fff",
              }}
              formatter={(value, _name, props) => [
                `${Number(value).toFixed(2)}%`,
                props?.payload?.fullName || "Avg Change",
              ]}
              labelStyle={{ color: "#8892a0" }}
            />
            <Bar dataKey="avgChange" radius={[0, 6, 6, 0]} barSize={28}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.avgChange >= 0 ? "#22c55e" : "#ef4444"}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sector Details */}
      <div className="space-y-3">
        {sectors.map((sector) => {
          const isExpanded = expandedSector === sector.sector;
          return (
            <div key={sector.sector} className="card-3d overflow-hidden">
              {/* Sector Header */}
              <button
                onClick={() => setExpandedSector(isExpanded ? null : sector.sector)}
                className="flex w-full items-center justify-between p-5 transition-colors hover:bg-input-theme"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    sector.avgChange >= 0 ? "bg-green-theme" : "bg-red-theme"
                  }`}>
                    {sector.avgChange >= 0
                      ? <TrendingUp className="h-5 w-5 text-green-theme" />
                      : <TrendingDown className="h-5 w-5 text-red-theme" />}
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-primary-theme">{sector.sector}</h3>
                    <p className="text-xs text-muted-theme">
                      {sector.companyCount} companies · {sector.totalVolume.toLocaleString()} vol
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-muted-theme">Total Turnover</div>
                    <div className="text-xs font-mono text-primary-theme">
                      Rs {(sector.totalTurnover / 1_000_000).toFixed(1)}M
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-theme">Avg Change</div>
                    <div className={`text-sm font-bold font-mono ${
                      sector.avgChange >= 0 ? "text-green-theme" : "text-red-theme"
                    }`}>
                      {sector.avgChange >= 0 ? "+" : ""}
                      {sector.avgChange.toFixed(2)}%
                    </div>
                  </div>
                  <svg
                    className={`h-4 w-4 text-muted-theme transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded Company Grid */}
              {isExpanded && (
                <div className="border-t border-theme px-5 pb-5 pt-4">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {sector.companies.map((c) => (
                      <a
                        key={c.symbol}
                        href={`/company/${c.symbol}`}
                        className="group flex items-center justify-between rounded-lg border border-theme bg-table-header-theme p-3 transition-all hover:border-hover-theme hover:bg-hover-theme"
                      >
                        <div>
                          <div className="text-sm font-bold text-primary-theme group-hover:text-accent-theme">
                            {c.symbol}
                          </div>
                          <div className="font-mono text-[11px] text-muted-theme">
                            Rs {c.latestClose.toLocaleString()}
                          </div>
                        </div>
                        <div
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            c.change >= 0
                              ? "bg-green-theme text-green-theme"
                              : "bg-red-theme text-red-theme"
                          }`}
                        >
                          {c.change >= 0
                            ? <TrendingUp className="h-3 w-3" />
                            : <TrendingDown className="h-3 w-3" />}
                          {c.change >= 0 ? "+" : ""}
                          {c.change.toFixed(2)}%
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
