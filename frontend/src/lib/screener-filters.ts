import { ScreenerFilter, ScreenerResult } from "./api";

export interface FilterField {
  key: string;
  label: string;
  type: "number" | "boolean" | "select";
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface FilterGroup {
  label: string;
  fields: FilterField[];
}

export const FILTER_GROUPS: FilterGroup[] = [
  {
    label: "Basic",
    fields: [
      { key: "symbol", label: "Symbol", type: "select", options: [] },
      {
        key: "sector",
        label: "Sector",
        type: "select",
        options: [
          { label: "Commercial Bank", value: "Commercial Bank" },
          { label: "Development Bank", value: "Development Bank" },
          { label: "Finance", value: "Finance" },
          { label: "Hydropower", value: "Hydropower" },
          { label: "Life Insurance", value: "Life Insurance" },
          { label: "Non-Life Insurance", value: "Non-Life Insurance" },
          { label: "Manufacturing", value: "Manufacturing" },
          { label: "Microfinance", value: "Microfinance" },
          { label: "Trading", value: "Trading" },
          { label: "Hotel", value: "Hotel" },
          { label: "Investment", value: "Investment" },
          { label: "IT", value: "IT" },
        ],
      },
    ],
  },
  {
    label: "Price",
    fields: [
      { key: "price", label: "Current Price", type: "number", min: 0, step: 10 },
      { key: "change", label: "Change %", type: "number", step: 0.5 },
      { key: "open", label: "Open", type: "number", min: 0, step: 10 },
      { key: "high", label: "High", type: "number", min: 0, step: 10 },
      { key: "low", label: "Low", type: "number", min: 0, step: 10 },
    ],
  },
  {
    label: "Volume",
    fields: [
      { key: "volume", label: "Volume", type: "number", min: 0, step: 1000 },
      { key: "turnover", label: "Turnover", type: "number", min: 0, step: 100000 },
      { key: "volume_ratio", label: "Volume Ratio (vs 20d avg)", type: "number", min: 0, step: 0.1 },
    ],
  },
  {
    label: "Fundamentals",
    fields: [
      { key: "pe_ratio", label: "P/E Ratio", type: "number", min: 0, step: 1 },
      { key: "pb_ratio", label: "P/B Ratio", type: "number", min: 0, step: 0.1 },
      { key: "eps", label: "EPS", type: "number", step: 0.5 },
      { key: "peg_ratio", label: "PEG Ratio", type: "number", min: 0, step: 0.1 },
      { key: "dividend_yield", label: "Dividend Yield %", type: "number", min: 0, max: 100, step: 0.1 },
      { key: "book_value", label: "Book Value", type: "number", min: 0, step: 10 },
      { key: "market_cap", label: "Market Cap (Cr)", type: "number", min: 0, step: 100 },
    ],
  },
  {
    label: "Trend",
    fields: [
      { key: "sma_20_above_sma_50", label: "SMA 20 > SMA 50 (Golden Cross zone)", type: "boolean" },
      { key: "ema_12_above_ema_26", label: "EMA 12 > EMA 26", type: "boolean" },
      { key: "price_above_sma_20", label: "Price > SMA 20", type: "boolean" },
      { key: "price_above_sma_50", label: "Price > SMA 50", type: "boolean" },
    ],
  },
  {
    label: "Momentum",
    fields: [
      { key: "rsi_14", label: "RSI (14)", type: "number", min: 0, max: 100, step: 1 },
      { key: "macd_histogram", label: "MACD Histogram", type: "select", options: [
        { label: "Positive (Bullish)", value: "positive" },
        { label: "Negative (Bearish)", value: "negative" },
        { label: "Zero crossover", value: "crossover" },
      ]},
      { key: "stoch_k", label: "Stochastic %K (14)", type: "number", min: 0, max: 100, step: 1 },
      { key: "stoch_d", label: "Stochastic %D (14)", type: "number", min: 0, max: 100, step: 1 },
      { key: "williams_r", label: "Williams %R (14)", type: "number", min: -100, max: 0, step: 1 },
      { key: "mfi_14", label: "MFI (14)", type: "number", min: 0, max: 100, step: 1 },
      { key: "cci_20", label: "CCI (20)", type: "number", step: 5 },
    ],
  },
  {
    label: "Volatility",
    fields: [
      { key: "adx_14", label: "ADX (14)", type: "number", min: 0, max: 100, step: 1 },
      { key: "atr_14", label: "ATR (14)", type: "number", min: 0, step: 0.5 },
      { key: "bb_position", label: "Bollinger Band Position", type: "select", options: [
        { label: "Above upper band", value: "above_upper" },
        { label: "Between upper & middle", value: "upper_half" },
        { label: "Between middle & lower", value: "lower_half" },
        { label: "Below lower band", value: "below_lower" },
      ]},
    ],
  },
  {
    label: "Volume Trend",
    fields: [
      { key: "obv_trend", label: "OBV Trend", type: "select", options: [
        { label: "Rising (accumulation)", value: "up" },
        { label: "Falling (distribution)", value: "down" },
        { label: "Flat", value: "flat" },
      ]},
    ],
  },
];

export interface FilterTemplate {
  name: string;
  filters: ScreenerFilter[];
  sort?: { field: string; order: "asc" | "desc" };
}

export const DEFAULT_TEMPLATES: FilterTemplate[] = [
  {
    name: "Oversold RSI",
    filters: [{ field: "rsi_14", op: "lt", value: 30 }],
    sort: { field: "rsi_14", order: "asc" },
  },
  {
    name: "Overbought RSI",
    filters: [{ field: "rsi_14", op: "gt", value: 70 }],
    sort: { field: "rsi_14", order: "desc" },
  },
  {
    name: "Golden Cross",
    filters: [{ field: "sma_20_crossed_above_sma_50", op: "eq", value: true }],
    sort: { field: "change", order: "desc" },
  },
  {
    name: "High Momentum",
    filters: [
      { field: "rsi_14", op: "between", value: [50, 70] },
      { field: "macd_histogram", op: "eq", value: "positive" },
      { field: "volume_ratio", op: "gt", value: 1.5 },
    ],
    sort: { field: "volume_ratio", order: "desc" },
  },
  {
    name: "Low Volatility Trending",
    filters: [
      { field: "adx_14", op: "gt", value: 25 },
      { field: "atr_14", op: "lt", value: 30 },
      { field: "sma_20_above_sma_50", op: "eq", value: true },
    ],
    sort: { field: "adx_14", order: "desc" },
  },
  {
    name: "Bollinger Squeeze",
    filters: [
      { field: "bb_position", op: "eq", value: "below_lower" },
      { field: "rsi_14", op: "lt", value: 40 },
    ],
    sort: { field: "rsi_14", order: "asc" },
  },
  {
    name: "Volume Breakout",
    filters: [
      { field: "volume_ratio", op: "gt", value: 2 },
      { field: "change", op: "gt", value: 0 },
    ],
    sort: { field: "volume_ratio", order: "desc" },
  },
  {
    name: "Value Stocks (Low P/E + High Dividend)",
    filters: [
      { field: "pe_ratio", op: "between", value: [0, 15] },
      { field: "dividend_yield", op: "gt", value: 3 },
    ],
    sort: { field: "dividend_yield", order: "desc" },
  },
  {
    name: "Growth Stocks (High EPS + Low PEG)",
    filters: [
      { field: "eps", op: "gt", value: 20 },
      { field: "peg_ratio", op: "between", value: [0, 1] },
    ],
    sort: { field: "peg_ratio", order: "asc" },
  },
  {
    name: "Undervalued (Low P/B)",
    filters: [
      { field: "pb_ratio", op: "between", value: [0, 1] },
      { field: "eps", op: "gt", value: 0 },
    ],
    sort: { field: "pb_ratio", order: "asc" },
  },
  {
    name: "Large Cap Stable",
    filters: [
      { field: "market_cap", op: "gt", value: 10000 },
      { field: "rsi_14", op: "between", value: [40, 60] },
    ],
    sort: { field: "market_cap", order: "desc" },
  },
];

export function buildFilterLabel(filter: ScreenerFilter): string {
  const allFields = FILTER_GROUPS.flatMap((g) => g.fields);
  const field = allFields.find((f) => f.key === filter.field);
  const fieldLabel = field?.label || filter.field;
  const opMap: Record<string, string> = {
    gt: ">", gte: ">=", lt: "<", lte: "<=", eq: "=", neq: "!=",
    between: "between",
  };
  if (filter.op === "between" && Array.isArray(filter.value)) {
    return `${fieldLabel} ${opMap[filter.op]} ${filter.value[0]} and ${filter.value[1]}`;
  }
  return `${fieldLabel} ${opMap[filter.op]} ${filter.value}`;
}

export function saveTemplates(templates: FilterTemplate[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("screener_templates", JSON.stringify(templates));
  }
}

export function loadTemplates(): FilterTemplate[] {
  if (typeof window === "undefined") return DEFAULT_TEMPLATES;
  const stored = localStorage.getItem("screener_templates");
  if (!stored) return DEFAULT_TEMPLATES;
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_TEMPLATES;
  }
}
