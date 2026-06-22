"use client";

import { useI18n, type Locale } from "@/lib/i18n";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "ne" : "en")}
      className="flex items-center gap-1.5 rounded-lg border border-theme bg-input-theme px-2.5 py-1.5 text-xs font-medium text-body-theme hover:bg-hover-theme hover:text-primary-theme transition-colors"
      title={t("common.language")}
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{locale === "en" ? "NE" : "EN"}</span>
    </button>
  );
}
