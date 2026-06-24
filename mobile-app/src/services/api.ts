import { Config } from "../constants/config";

const API_BASE = Config.API_BASE;

async function safeFetch<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    const text = await res.text();
    if (!text) return fallback;
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

async function apiPost<T>(url: string, body: unknown, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return fallback;
    const text = await res.text();
    if (!text) return fallback;
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export interface CompanySummary {
  symbol: string;
  name: string;
  ltp: number;
  percentChange: number;
  volume: number;
  sector: string;
}

export interface StockRecord {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  volume: number;
  turnover: number;
}

export interface CompanyDetail {
  symbol: string;
  category: string;
  data: StockRecord[];
}

export interface CompanyStats {
  symbol: string;
  category: string;
  totalRecords: number;
  firstDate: string;
  lastDate: string;
  latestClose: number;
  allTimeHigh: number;
  allTimeLow: number;
  avgVolume: number;
}

export interface IndicatorData {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  sma20?: number;
  sma50?: number;
  ema12?: number;
  ema26?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
}

export interface TopMover {
  symbol: string;
  category: string;
  close: number;
  change: number;
  changePct: number;
  volume: number;
}

export interface SectorData {
  sector: string;
  avgChange: number;
  totalVolume: number;
  totalTurnover: number;
  companyCount: number;
  companies: { symbol: string; latestClose: number; change: number }[];
}

export interface HeatmapData {
  sector: string;
  change: number;
  marketShare: number;
}

export interface MarketSummary {
  totalCompanies: number;
  totalVolume: number;
  totalTurnover: number;
  advance: number;
  decline: number;
  unchanged: number;
  latestDate: string;
}

export interface MarketStatus {
  status: "open" | "closed" | "pre_open";
  reason: string;
  nextOpen?: string;
  closesAt?: string;
}

export interface DividendRecord {
  year: number;
  amount: number;
  type: string;
}

export interface IPORecord {
  symbol: string;
  name: string;
  sector: string;
  issuePrice: number;
  issueDate: string;
  status: string;
  lots: number;
  price: number;
  change: number;
}

export interface BacktestResult {
  trades: { date: string; action: string; price: number; shares: number; pnl: number }[];
  finalValue: number;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export interface ScreenerFilter {
  field: string;
  op: "gt" | "gte" | "lt" | "lte" | "eq" | "neq" | "between";
  value: number | number[] | boolean | string;
}

export interface ScreenerResult {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  change: number;
  volume: number;
  turnover: number;
  date: string;
  rsi_14: number | null;
  macd_line: number | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  eps: number | null;
  roe: number | null;
  dividend_yield: number | null;
  market_cap: number | null;
}

export interface BrokerData {
  brokerNo: number;
  buyQty: number;
  buyAmt: number;
  sellQty: number;
  sellAmt: number;
  turnover: number;
  netQty: number;
  netDirection: "net_buy" | "net_sell" | "neutral";
}

export interface FloorSheetRecord {
  sn: number;
  contractNo: string;
  symbol: string;
  buyerBroker: number;
  sellerBroker: number;
  quantity: number;
  rate: number;
  amount: number;
}

export interface CommunityPost {
  id: number;
  symbol: string;
  author: string;
  title: string | null;
  content: string;
  votes: number;
  replies: number;
  createdAt: string;
}

export interface Prediction {
  symbol: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  direction: string;
  factors: { sma: number; ema: number; momentum: number; volatility: number };
}

export interface SentimentData {
  symbol: string;
  overall: string;
  score: number;
  headlines: { title: string; sentiment: string; source: string; date: string }[];
}

export interface TaxReport {
  fiscalYear: string;
  summary: {
    totalTransactions: number;
    totalGains: number;
    totalLosses: number;
    netPnL: number;
    taxLiability: number;
  };
}

export interface DividendCalendarEntry {
  symbol: string;
  companyName: string;
  type: "cash" | "bonus" | "rights";
  amount: number;
  exDate: string;
  recordDate: string;
  dividendYield: number;
  isUpcoming: boolean;
}

export interface MutualFund {
  symbol: string;
  name: string;
  nav: number;
  change: number;
  changePct: number;
}

export interface Debenture {
  symbol: string;
  name: string;
  couponRate: number;
  yieldToMaturity: number;
  maturityDate: string;
}

export interface InsiderTrade {
  symbol: string;
  name: string;
  action: "buy" | "sell";
  quantity: number;
  rate: number;
  date: string;
}

export interface EarningsEntry {
  symbol: string;
  companyName: string;
  date: string;
  time: string;
  epsEstimate: number | null;
  status: string;
}

export interface Announcement {
  date: string;
  title: string;
  symbol?: string;
  type: string;
}

export interface ChartPattern {
  type: string;
  name: string;
  signal: "bullish" | "bearish" | "neutral" | "forming";
  confidence: number;
}

export interface Fundamentals {
  symbol: string;
  pe: number | null;
  pb: number | null;
  eps: number | null;
  roe: number | null;
  dividendYield: number | null;
  marketCap: number | null;
  bookValue: number | null;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  orders: number;
}

export interface JournalEntry {
  id: number;
  symbol: string;
  type: string;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  pnl: number | null;
  notes: string;
  date: string;
}

export interface AlertConfig {
  symbol: string;
  type: string;
  threshold: number;
  active: boolean;
}

// --- API Functions ---

export async function fetchCompanies(): Promise<CompanySummary[]> {
  return safeFetch(`${API_BASE}/api/companies`, []);
}

export async function fetchCompany(symbol: string, from?: string, to?: string, limit?: string): Promise<CompanyDetail> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (limit) params.set("limit", limit);
  const qs = params.toString();
  return safeFetch(`${API_BASE}/api/companies/${symbol}${qs ? `?${qs}` : ""}`, { symbol: "", category: "", data: [] });
}

export async function fetchCompanyStats(symbol: string): Promise<CompanyStats | null> {
  return safeFetch(`${API_BASE}/api/companies/${symbol}/stats`, null);
}

export async function fetchIndicators(symbol: string, limit?: string): Promise<IndicatorData[]> {
  const params = limit ? `?limit=${limit}` : "";
  const data = await safeFetch<any>(`${API_BASE}/api/companies/${symbol}/indicators${params}`, []);
  return data.data || data;
}

export async function fetchTopMovers(): Promise<{ gainers: TopMover[]; losers: TopMover[]; mostActive: TopMover[] }> {
  return safeFetch(`${API_BASE}/api/top-movers`, { gainers: [], losers: [], mostActive: [] });
}

export async function fetchSectors(): Promise<SectorData[]> {
  return safeFetch(`${API_BASE}/api/sectors`, []);
}

export async function fetchHeatmap(): Promise<HeatmapData[]> {
  return safeFetch(`${API_BASE}/api/sectors/heatmap`, []);
}

export async function fetchMarketSummary(): Promise<MarketSummary | null> {
  return safeFetch(`${API_BASE}/api/market-summary`, null);
}

export async function fetchMarketStatus(): Promise<MarketStatus> {
  return safeFetch(`${API_BASE}/api/market-status`, { status: "closed", reason: "Unknown" });
}

export async function fetchDividends(symbol: string): Promise<DividendRecord[]> {
  return safeFetch(`${API_BASE}/api/dividends/${symbol}`, []);
}

export async function fetchIPO(): Promise<IPORecord[]> {
  return safeFetch(`${API_BASE}/api/ipo`, []);
}

export async function runBacktest(symbol: string, strategy: string, startCapital: number): Promise<BacktestResult | null> {
  return apiPost(`${API_BASE}/api/backtest`, { symbol, strategy, startCapital }, null);
}

export async function runScreener(filters: ScreenerFilter[], sort?: { field: string; order: "asc" | "desc" }): Promise<{ results: ScreenerResult[]; total: number }> {
  return apiPost(`${API_BASE}/api/screener`, { filters, sort, limit: 100 }, { results: [], total: 0 });
}

export async function fetchBrokers(): Promise<BrokerData[]> {
  const data = await safeFetch<any>(`${API_BASE}/api/brokers`, { brokers: [] });
  return data.brokers || [];
}

export async function fetchFloorSheet(params?: { symbol?: string; page?: number; limit?: number }): Promise<FloorSheetRecord[]> {
  const searchParams = new URLSearchParams();
  if (params?.symbol) searchParams.set("symbol", params.symbol);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  const data = await safeFetch<any>(`${API_BASE}/api/floorsheet${qs ? `?${qs}` : ""}`, { records: [] });
  return data.records || [];
}

export async function fetchCommunity(symbol: string): Promise<CommunityPost[]> {
  const data = await safeFetch<any>(`${API_BASE}/api/community/${symbol}`, { posts: [] });
  return data.posts || [];
}

export async function fetchPrediction(symbol: string): Promise<Prediction | null> {
  return safeFetch(`${API_BASE}/api/predictions/${symbol}`, null);
}

export async function fetchSentiment(symbol: string): Promise<SentimentData | null> {
  return safeFetch(`${API_BASE}/api/sentiment/${symbol}`, null);
}

export async function fetchMutualFunds(): Promise<MutualFund[]> {
  return safeFetch(`${API_BASE}/api/mutual-funds`, []);
}

export async function fetchDebentures(): Promise<Debenture[]> {
  return safeFetch(`${API_BASE}/api/debentures`, []);
}

export async function fetchInsiderTrading(): Promise<InsiderTrade[]> {
  return safeFetch(`${API_BASE}/api/insider-trading`, []);
}

export async function fetchEarningsCalendar(): Promise<EarningsEntry[]> {
  return safeFetch(`${API_BASE}/api/earnings-calendar`, []);
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  return safeFetch(`${API_BASE}/api/announcements`, []);
}

export async function fetchPatterns(symbol: string): Promise<ChartPattern[]> {
  const data = await safeFetch<any>(`${API_BASE}/api/patterns/${symbol}`, { patterns: [] });
  return data.patterns || [];
}

export async function fetchFundamentals(): Promise<Fundamentals[]> {
  return safeFetch(`${API_BASE}/api/fundamentals`, []);
}

export async function fetchOrderBook(symbol: string): Promise<{ bids: OrderBookEntry[]; asks: OrderBookEntry[] }> {
  return safeFetch(`${API_BASE}/api/order-book/${symbol}`, { bids: [], asks: [] });
}

export async function fetchJournal(): Promise<JournalEntry[]> {
  return safeFetch(`${API_BASE}/api/journal`, []);
}

export async function addJournalEntry(entry: { symbol: string; type: string; entryPrice: number; quantity: number; notes: string }): Promise<JournalEntry | null> {
  return apiPost(`${API_BASE}/api/journal`, entry, null);
}

export async function fetchTaxReport(): Promise<TaxReport | null> {
  return safeFetch(`${API_BASE}/api/tax-report`, null);
}

export async function fetchDividendCalendar(): Promise<DividendCalendarEntry[]> {
  const data = await safeFetch<any>(`${API_BASE}/api/dividend-calendar`, { calendar: [] });
  return data.calendar || [];
}

export async function checkAlert(symbol: string, type: string, threshold: number): Promise<{ triggered: boolean; message: string }> {
  return apiPost(`${API_BASE}/api/alerts/check`, { symbol, type, threshold }, { triggered: false, message: "" });
}

export async function fetchCorrelation(symbols: string[]): Promise<Record<string, Record<string, number>>> {
  const params = new URLSearchParams({ symbols: symbols.join(",") });
  const data = await safeFetch<any>(`${API_BASE}/api/correlation?${params}`, { matrix: {} });
  return data.matrix || {};
}

export async function fetchSectorRotation(period?: number): Promise<any[]> {
  const params = period ? `?period=${period}` : "";
  const data = await safeFetch<any>(`${API_BASE}/api/sectors/rotation${params}`, { sectors: [] });
  return data.sectors || [];
}

export async function fetchAnalystRatings(): Promise<any[]> {
  const data = await safeFetch<any>(`${API_BASE}/api/analyst-ratings`, { ratings: [] });
  return data.ratings || [];
}

export async function fetchSocialSentiment(): Promise<any> {
  return safeFetch(`${API_BASE}/api/social-sentiment`, { companies: [] });
}

export async function fetchHoldings(): Promise<any[]> {
  const data = await safeFetch<any>(`${API_BASE}/api/holdings`, { companies: [] });
  return data.companies || [];
}

export function getWsUrl(): string {
  return Config.WS_URL;
}
