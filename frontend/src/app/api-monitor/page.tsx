"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { RefreshCw, Shield, AlertTriangle, Activity, Users, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { API_BASE } from "@/lib/api";

interface RateLimitStatus {
  windowMs: number;
  maxRequests: number;
  currentUsage: number;
  uniqueIPs: number;
  blockedRequests: number;
  totalRequests: number;
  activeConnections: number;
  endpoints: { endpoint: string; method: string; count: number; avgResponseTime: number }[];
  topIPs: { ip: string; count: number; blocked: boolean }[];
  history: { time: string; requests: number; blocked: number }[];
}

export default function APIMonitorPage() {
  const { t } = useI18n();
  const [status, setStatus] = useState<RateLimitStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/rate-limit-status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {}
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const usagePercent = status
    ? Math.min(100, (status.currentUsage / status.maxRequests) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-theme">{t("apiMonitor.title")}</h1>
          <p className="text-muted-theme text-sm mt-0.5">{t("apiMonitor.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[10px] text-dim-theme">
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchStatus}
            className="flex items-center gap-2 rounded-lg border border-theme bg-input-theme px-3 py-2 text-xs font-medium text-body-theme hover:bg-hover-theme transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {t("apiMonitor.refresh")}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          icon={<Activity className="h-5 w-5 text-accent-theme" />}
          label={t("apiMonitor.totalRequests")}
          value={status?.totalRequests?.toLocaleString() ?? "-"}
          bg="bg-accent-theme"
        />
        <MetricCard
          icon={<Zap className="h-5 w-5 text-green-theme" />}
          label={t("apiMonitor.requestsPerMin")}
          value={status?.currentUsage?.toString() ?? "-"}
          bg="bg-green-theme"
        />
        <MetricCard
          icon={<AlertTriangle className="h-5 w-5 text-red-theme" />}
          label={t("apiMonitor.blockedRequests")}
          value={status?.blockedRequests?.toString() ?? "-"}
          bg="bg-red-theme"
        />
        <MetricCard
          icon={<Users className="h-5 w-5 text-blue-theme" />}
          label={t("apiMonitor.uniqueIPs")}
          value={status?.uniqueIPs?.toString() ?? "-"}
          bg="bg-blue-theme"
        />
        <MetricCard
          icon={<Shield className="h-5 w-5 text-violet-theme" />}
          label={t("apiMonitor.activeConnections")}
          value={status?.activeConnections?.toString() ?? "-"}
          bg="bg-violet-theme"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rate Limit Config */}
        <div className="card-3d p-6">
          <h3 className="text-sm font-semibold text-primary-theme mb-4">{t("apiMonitor.rateLimitConfig")}</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-theme">{t("apiMonitor.windowMs")}</span>
              <span className="text-sm font-mono text-primary-theme">{status?.windowMs ?? 60000}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-theme">{t("apiMonitor.maxRequests")}</span>
              <span className="text-sm font-mono text-primary-theme">{status?.maxRequests ?? 30}</span>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-muted-theme">{t("apiMonitor.currentUsage")}</span>
                <span className="text-xs font-mono text-body-theme">
                  {status?.currentUsage ?? 0} / {status?.maxRequests ?? 30}
                </span>
              </div>
              <div className="h-2.5 w-full bg-hover-theme rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usagePercent > 80 ? "bg-[#ef4444]" : usagePercent > 50 ? "bg-[#f59e0b]" : "bg-[#22c55e]"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Request History Chart */}
        <div className="card-3d p-6">
          <h3 className="text-sm font-semibold text-primary-theme mb-4">{t("apiMonitor.requestHistory")}</h3>
          {status?.history?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={status.history}>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#8892a0" }} />
                <YAxis tick={{ fontSize: 10, fill: "#8892a0" }} />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a25",
                    border: "1px solid #27272a",
                    borderRadius: "0.5rem",
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="requests" stroke="#D4A017" strokeWidth={2} dot={false} name="Requests" />
                <Line type="monotone" dataKey="blocked" stroke="#ef4444" strokeWidth={2} dot={false} name="Blocked" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-theme text-sm">
              {t("common.noData")}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top IPs */}
        <div className="card-3d p-6">
          <h3 className="text-sm font-semibold text-primary-theme mb-4">{t("apiMonitor.topIPs")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-theme border-b border-theme text-xs">
                  <th className="px-3 py-2 text-left">IP</th>
                  <th className="px-3 py-2 text-right">{t("apiMonitor.count")}</th>
                  <th className="px-3 py-2 text-center">{t("apiMonitor.status")}</th>
                </tr>
              </thead>
              <tbody>
                {status?.topIPs?.map((ip) => (
                  <tr key={ip.ip} className="border-b border-theme/50">
                    <td className="px-3 py-2 font-mono text-xs text-primary-theme">{ip.ip}</td>
                    <td className="px-3 py-2 text-right font-mono text-body-theme">{ip.count}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        ip.blocked
                          ? "bg-red-theme text-red-theme"
                          : "bg-green-theme text-green-theme"
                      }`}>
                        {ip.blocked ? t("apiMonitor.blocked") : t("apiMonitor.allowed")}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!status?.topIPs || status.topIPs.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-muted-theme text-xs">
                      {t("common.noData")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Endpoint Stats */}
        <div className="card-3d p-6">
          <h3 className="text-sm font-semibold text-primary-theme mb-4">{t("apiMonitor.endpointStats")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-theme border-b border-theme text-xs">
                  <th className="px-3 py-2 text-left">{t("apiMonitor.endpoint")}</th>
                  <th className="px-3 py-2 text-center">{t("apiMonitor.method")}</th>
                  <th className="px-3 py-2 text-right">{t("apiMonitor.count")}</th>
                  <th className="px-3 py-2 text-right">{t("apiMonitor.avgResponseTime")}</th>
                </tr>
              </thead>
              <tbody>
                {status?.endpoints?.map((ep, i) => (
                  <tr key={i} className="border-b border-theme/50">
                    <td className="px-3 py-2 font-mono text-xs text-primary-theme max-w-[200px] truncate">{ep.endpoint}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="rounded bg-kbd-theme px-1.5 py-0.5 text-[10px] font-mono text-body-theme">
                        {ep.method}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-body-theme">{ep.count}</td>
                    <td className="px-3 py-2 text-right font-mono text-muted-theme">{ep.avgResponseTime}ms</td>
                  </tr>
                ))}
                {(!status?.endpoints || status.endpoints.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-muted-theme text-xs">
                      {t("common.noData")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <div className="metric-card p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
          {icon}
        </div>
        <div>
          <div className="text-[10px] font-medium text-muted-theme">{label}</div>
          <div className="text-lg font-bold text-primary-theme font-mono">{value}</div>
        </div>
      </div>
    </div>
  );
}
