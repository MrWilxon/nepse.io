"use client";

import { Smartphone, Wifi, Bell, Database, BarChart3, BookOpen, Terminal, QrCode } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function MobileAppPage() {
  const { t } = useI18n();

  const features = [
    { icon: <Wifi className="h-6 w-6 text-green-theme" />, title: t("mobile.realTimePrices"), desc: t("mobile.realTimePricesDesc") },
    { icon: <BarChart3 className="h-6 w-6 text-blue-theme" />, title: t("mobile.portfolio"), desc: t("mobile.portfolioDesc") },
    { icon: <Bell className="h-6 w-6 text-amber-theme" />, title: t("mobile.pushAlerts"), desc: t("mobile.pushAlertsDesc") },
    { icon: <Database className="h-6 w-6 text-violet-theme" />, title: t("mobile.offlineMode"), desc: t("mobile.offlineModeDesc") },
    { icon: <BarChart3 className="h-6 w-6 text-accent-theme" />, title: t("mobile.technicalCharts"), desc: t("mobile.technicalChartsDesc") },
    { icon: <BookOpen className="h-6 w-6 text-red-theme" />, title: t("mobile.quickTrade"), desc: t("mobile.quickTradeDesc") },
  ];

  const techStack = [
    { name: t("mobile.reactNative"), color: "#61DAFB" },
    { name: t("mobile.state"), color: "#F59E0B" },
    { name: t("mobile.storage"), color: "#3B82F6" },
    { name: t("mobile.notifications"), color: "#22C55E" },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#E8B830] shadow-lg shadow-[#D4A017]/20">
            <Smartphone className="h-8 w-8 text-primary-theme" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-primary-theme">{t("mobile.title")}</h1>
        <p className="text-muted-theme text-sm mt-2 max-w-lg mx-auto">{t("mobile.subtitle")}</p>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-lg font-semibold text-primary-theme mb-4">{t("mobile.features")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="card-3d p-5 hover:border-hover-theme transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-input-theme mb-3">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-primary-theme mb-1">{f.title}</h3>
              <p className="text-xs text-muted-theme leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div>
        <h2 className="text-lg font-semibold text-primary-theme mb-4">{t("mobile.techStack")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {techStack.map((tech, i) => (
            <div key={i} className="card-3d p-4 text-center">
              <div className="h-2 w-12 rounded-full mx-auto mb-2" style={{ background: tech.color }} />
              <div className="text-xs font-medium text-primary-theme">{tech.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="card-3d p-6">
        <h2 className="text-lg font-semibold text-primary-theme mb-4">{t("mobile.setupTitle")}</h2>
        <div className="space-y-4">
          <SetupStep num={1} label={t("mobile.installDeps")} code="cd mobile-app && npm install" />
          <SetupStep num={2} label={t("mobile.startDev")} code="npx expo start" />
          <SetupStep num={3} label={t("mobile.buildRelease")} code="eas build -p android --profile preview" />
          <SetupStep num={4} label={t("mobile.scanQr")} code="" />
        </div>
      </div>

      {/* QR Code placeholder */}
      <div className="card-3d p-8 text-center">
        <QrCode className="h-24 w-24 text-border-theme mx-auto mb-4" />
        <p className="text-sm text-muted-theme">Scan with Expo Go to preview the app</p>
      </div>
    </div>
  );
}

function SetupStep({ num, label, code }: { num: number; label: string; code: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-theme text-accent-theme text-xs font-bold flex-shrink-0 mt-0.5">
        {num}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-primary-theme">{label}</div>
        {code && (
          <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-surface-2 border border-theme px-3 py-2">
            <Terminal className="h-3.5 w-3.5 text-muted-theme flex-shrink-0" />
            <code className="text-xs font-mono text-accent-theme">{code}</code>
          </div>
        )}
      </div>
    </div>
  );
}
