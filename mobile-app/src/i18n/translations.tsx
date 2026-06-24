import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

type Lang = "en" | "ne";

const translations = {
  en: {
    nav: {
      home: "Home",
      markets: "Markets",
      trade: "Trade",
      research: "Research",
      profile: "Profile",
    },
    dashboard: {
      title: "Market Overview",
      topGainers: "Top Gainers",
      topLosers: "Top Losers",
      mostActive: "Most Active",
      myWatchlist: "My Watchlist",
      viewAll: "View All",
      sectorHeatmap: "Sector Heatmap",
      upcomingEvents: "Upcoming Events",
      quickActions: "Quick Actions",
    },
    markets: {
      title: "Markets",
      search: "Search stocks...",
      sectors: "Sectors",
      topBrokers: "Top Brokers",
      floorSheet: "Floor Sheet",
      mutualFunds: "Mutual Funds",
      debentures: "Debentures",
      ipo: "IPO / FPO",
      insiderTrading: "Insider Trading",
      earnings: "Earnings Calendar",
      announcements: "Announcements",
    },
    trade: {
      title: "Trade Tools",
      paperTrading: "Paper Trading",
      portfolio: "Portfolio",
      tradeJournal: "Trade Journal",
      watchlist: "Watchlist",
      riskCalculator: "Risk Calculator",
      orderBook: "Order Book",
      dividendCalendar: "Dividend Calendar",
      quickTrade: "Quick Trade",
      buy: "BUY",
      sell: "SELL",
      balance: "Cash Balance",
      holdings: "Holdings",
      totalValue: "Portfolio Value",
      pnl: "P&L",
    },
    research: {
      title: "Research",
      screener: "Stock Screener",
      indicators: "Technical Indicators",
      patterns: "Chart Patterns",
      backtest: "Backtesting",
      correlation: "Correlation",
      prediction: "Price Prediction",
      sentiment: "Market Sentiment",
      analysts: "Analyst Ratings",
      holdings: "Institutional Holdings",
    },
    profile: {
      title: "Profile",
      theme: "Theme",
      language: "Language",
      dark: "Dark",
      light: "Light",
      english: "English",
      nepali: "Nepali",
      export: "Export Data",
      taxReport: "Tax Report",
      apiStatus: "API Status",
      about: "About",
      version: "Version",
    },
    backtest: {
      title: "Backtest",
      runBacktest: "Run Backtest",
      strategy: "Strategy",
      symbol: "Symbol",
      capital: "Initial Capital (Rs)",
      return: "Total Return",
      sharpe: "Sharpe Ratio",
      maxDD: "Max Drawdown",
      winRate: "Win Rate",
      trades: "Trades",
    },
    watchlist: {
      title: "Watchlist",
      addCompany: "Add to Watchlist",
      empty: "Your watchlist is empty",
      emptyDesc: "Start adding stocks to track them here",
    },
    screener: {
      title: "Screener",
      applyFilters: "Apply Filters",
      reset: "Reset",
      results: "results",
      priceRange: "Price Range",
      technical: "Technical",
      fundamental: "Fundamental",
    },
    common: {
      loading: "Loading...",
      error: "Error",
      retry: "Retry",
      price: "Price",
      change: "Change",
      volume: "Volume",
      date: "Date",
      open: "Open",
      high: "High",
      low: "Low",
      close: "Close",
      noData: "No data available",
      pullToRefresh: "Pull to refresh",
    },
  },
  ne: {
    nav: {
      home: "होम",
      markets: "बजार",
      trade: "व्यापार",
      research: "अनुसन्धान",
      profile: "प्रोफाइल",
    },
    dashboard: {
      title: "बजार अवलोकन",
      topGainers: "शीर्ष लाभान्वित",
      topLosers: "शीर्ष हानि",
      mostActive: "सबैभन्दा सक्रिय",
      myWatchlist: "मेरो वाचलिस्ट",
      viewAll: "सबै हेर्नुहोस्",
      sectorHeatmap: "सेक्टर हिटम्याप",
      upcomingEvents: "आगामी कार्यक्रम",
      quickActions: "छिटो कार्य",
    },
    markets: {
      title: "बजार",
      search: "शेयर खोज्नुहोस्...",
      sectors: "सेक्टरहरू",
      topBrokers: "शीर्ष ब्रोकरहरू",
      floorSheet: "फ्लोर शीट",
      mutualFunds: "म्युचुअल फण्ड",
      debentures: "डिबेञ्चर",
      ipo: "IPO / FPO",
      insiderTrading: "भित्री व्यापार",
      earnings: "आम्दानी क्यालेन्डर",
      announcements: "घोषणाहरू",
    },
    trade: {
      title: "व्यापार उपकरण",
      paperTrading: "पेपर ट्रेडिङ",
      portfolio: "पोर्टफोलियो",
      tradeJournal: "ट्रेड जर्नल",
      watchlist: "वाचलिस्ट",
      riskCalculator: "जोखिम क्यालकुलेटर",
      orderBook: "अर्डर बुक",
      dividendCalendar: "लाभांश क्यालेन्डर",
      quickTrade: "छिटो व्यापार",
      buy: "खरिद",
      sell: "बिक्री",
      balance: "नगद शेष",
      holdings: "होल्डिङ",
      totalValue: "पोर्टफोलियो मूल्य",
      pnl: "P&L",
    },
    research: {
      title: "अनुसन्धान",
      screener: "स्टक स्क्रिनर",
      indicators: "प्राविधिक सूचक",
      patterns: "चार्ट प्याटर्न",
      backtest: "ब्याकटेस्ट",
      correlation: "सहसम्बन्ध",
      prediction: "मूल्य पूर्वानुमान",
      sentiment: "बजार भावना",
      analysts: "विश्लेषक रेटिङ",
      holdings: "संस्थागत होल्डिङ",
    },
    profile: {
      title: "प्रोफाइल",
      theme: "थिम",
      language: "भाषा",
      dark: "गाढा",
      light: "हल्का",
      english: "अंग्रेजी",
      nepali: "नेपाली",
      export: "डाटा निर्यात",
      taxReport: "कर प्रतिवेदन",
      apiStatus: "API स्थिति",
      about: "बारेमा",
      version: "संस्करण",
    },
    backtest: {
      title: "ब्याकटेस्ट",
      runBacktest: "ब्याकटेस्ट चलाउनुहोस्",
      strategy: "रणनीति",
      symbol: "सिम्बल",
      capital: "प्रारम्भिक पुँजी (Rs)",
      return: "कुल प्रतिफल",
      sharpe: "शार्प अनुपात",
      maxDD: "अधिकतम ड्राडाउन",
      winRate: "जित्ने दर",
      trades: "व्यापार",
    },
    watchlist: {
      title: "वाचलिस्ट",
      addCompany: "वाचलिस्टमा थप्नुहोस्",
      empty: "तपाईंको वाचलिस्ट खाली छ",
      emptyDesc: "यहाँ ट्र्याक गर्न शेयरहरू थप्नुहोस्",
    },
    screener: {
      title: "स्क्रिनर",
      applyFilters: "फिल्टर लागू गर्नुहोस्",
      reset: "रिसेट",
      results: "परिणाम",
      priceRange: "मूल्य दायरा",
      technical: "प्राविधिक",
      fundamental: "मौलिक",
    },
    common: {
      loading: "लोड हुँदैछ...",
      error: "त्रुटि",
      retry: "पुन: प्रयास",
      price: "मूल्य",
      change: "परिवर्तन",
      volume: "भोल्युम",
      date: "मिति",
      open: "खुला",
      high: "उच्च",
      low: "न्यून",
      close: "बन्द",
      noData: "डाटा उपलब्ध छैन",
      pullToRefresh: "रिफ्रेस गर्न तान्नुहोस्",
    },
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
      return typeof val === "string" ? val : key;
    },
    [lang]
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
