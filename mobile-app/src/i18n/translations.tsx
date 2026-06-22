import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

type Lang = "en" | "ne";

const translations = {
  en: {
    nav: { dashboard: "Dashboard", watchlist: "Watchlist", backtest: "Backtest", export: "Export", settings: "Settings" },
    dashboard: { title: "Market Overview", topGainers: "Top Gainers", topLosers: "Top Losers", mostActive: "Most Active" },
    watchlist: { title: "Watchlist", addCompany: "Add Company" },
    backtest: { title: "Backtest", runBacktest: "Run Backtest", strategy: "Strategy" },
    common: { loading: "Loading...", error: "Error", price: "Price", change: "Change", volume: "Volume", date: "Date" },
  },
  ne: {
    nav: { dashboard: "ड्यासबोर्ड", watchlist: "वाचलिस्ट", backtest: "ब्याकटेस्ट", export: "निर्यात", settings: "सेटिङ" },
    dashboard: { title: "बजार अवलोकन", topGainers: "शीर्ष लाभान्वित", topLosers: "शीर्ष हानि", mostActive: "सबैभन्दा सक्रिय" },
    watchlist: { title: "वाचलिस्ट", addCompany: "कम्पनी थप्नुहोस्" },
    backtest: { title: "ब्याकटेस्ट", runBacktest: "ब्याकटेस्ट चलाउनुहोस्", strategy: "रणनीति" },
    common: { loading: "लोड हुँदैछ...", error: "त्रुटि", price: "मूल्य", change: "परिवर्तन", volume: "भोल्युम", date: "मिति" },
  },
} as const;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({ lang: "en", setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  const t = useCallback(
    (key: string): string => {
      const keys = key.split(".");
      let val: any = translations[lang];
      for (const k of keys) {
        val = val?.[k];
      }
      return (typeof val === "string" ? val : key);
    },
    [lang]
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
