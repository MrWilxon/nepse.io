const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface CompanySummary {
  symbol: string;
  category: string;
  records: number;
  latestClose: number | null;
  latestDate: string | null;
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
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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

export async function fetchCompanies(): Promise<CompanySummary[]> {
  const res = await fetch(`${API_BASE}/api/companies`);
  return res.json();
}

export async function fetchCompany(
  symbol: string,
  from?: string,
  to?: string,
  limit?: string
): Promise<CompanyDetail> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (limit) params.set("limit", limit);
  const qs = params.toString();
  const res = await fetch(
    `${API_BASE}/api/companies/${symbol}${qs ? `?${qs}` : ""}`
  );
  return res.json();
}

export async function fetchCompanyStats(
  symbol: string
): Promise<CompanyStats> {
  const res = await fetch(`${API_BASE}/api/companies/${symbol}/stats`);
  return res.json();
}

export async function fetchIndicators(
  symbol: string,
  from?: string,
  to?: string,
  limit?: string
): Promise<IndicatorData[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (limit) params.set("limit", limit);
  const qs = params.toString();
  const res = await fetch(
    `${API_BASE}/api/companies/${symbol}/indicators${qs ? `?${qs}` : ""}`
  );
  const data = await res.json();
  return data.data || data;
}

export async function fetchTopMovers(): Promise<{
  gainers: TopMover[];
  losers: TopMover[];
  mostActive: TopMover[];
}> {
  const res = await fetch(`${API_BASE}/api/top-movers`);
  return res.json();
}

export async function fetchSectors(): Promise<SectorData[]> {
  const res = await fetch(`${API_BASE}/api/sectors`);
  return res.json();
}

export async function fetchHeatmap(): Promise<HeatmapData[]> {
  const res = await fetch(`${API_BASE}/api/sectors/heatmap`);
  return res.json();
}

export async function fetchMarketSummary(): Promise<MarketSummary> {
  const res = await fetch(`${API_BASE}/api/market-summary`);
  return res.json();
}

export async function fetchDividends(
  symbol: string
): Promise<DividendRecord[]> {
  const res = await fetch(`${API_BASE}/api/dividends/${symbol}`);
  return res.json();
}

export async function fetchIPO(): Promise<IPORecord[]> {
  const res = await fetch(`${API_BASE}/api/ipo`);
  return res.json();
}

export interface BacktestResult {
  trades: { date: string; action: string; price: number; shares: number; pnl: number }[];
  finalValue: number;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export interface CorrelationMatrix {
  matrix: Record<string, Record<string, number>>;
  labels: string[];
}

export interface AlertCheck {
  triggered: boolean;
  currentValue: number;
  threshold: number;
  message: string;
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

export async function runBacktest(symbol: string, strategy: string, startCapital: number, fromDate?: string): Promise<BacktestResult> {
  const res = await fetch(`${API_BASE}/api/backtest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, strategy, startCapital, fromDate }),
  });
  return res.json();
}

export async function fetchCorrelation(symbols: string[], period?: number): Promise<CorrelationMatrix> {
  const params = new URLSearchParams({ symbols: symbols.join(",") });
  if (period) params.set("period", String(period));
  const res = await fetch(`${API_BASE}/api/correlation?${params}`);
  return res.json();
}

export async function checkAlert(symbol: string, type: string, threshold: number): Promise<AlertCheck> {
  const res = await fetch(`${API_BASE}/api/alerts/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, type, threshold }),
  });
  return res.json();
}

export async function fetchPrediction(symbol: string): Promise<Prediction> {
  const res = await fetch(`${API_BASE}/api/predictions/${symbol}`);
  return res.json();
}

export async function fetchSentiment(symbol: string): Promise<SentimentData> {
  const res = await fetch(`${API_BASE}/api/sentiment/${symbol}`);
  return res.json();
}

export interface ScreenerFilter {
  field: string;
  op: "gt" | "gte" | "lt" | "lte" | "eq" | "neq" | "between";
  value: number | number[] | boolean | string;
}

export interface ScreenerRequest {
  filters: ScreenerFilter[];
  sort?: { field: string; order: "asc" | "desc" };
  limit?: number;
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
  macd_signal: number | null;
  macd_histogram: number | null;
  sma_20: number | null;
  sma_50: number | null;
  ema_12: number | null;
  ema_26: number | null;
  bb_upper: number | null;
  bb_middle: number | null;
  bb_lower: number | null;
  bb_position: number | null;
  stoch_k: number | null;
  stoch_d: number | null;
  mfi_14: number | null;
  williams_r: number | null;
  adx_14: number | null;
  cci_20: number | null;
  atr_14: number | null;
  obv: number | null;
  obv_trend: string;
  volume_ratio: number | null;
  sma_20_above_sma_50: boolean | null;
  sma_20_crossed_above_sma_50: boolean;
  ema_12_above_ema_26: boolean | null;
  price_above_sma_20: boolean | null;
  price_above_sma_50: boolean | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  eps: number | null;
  roe: number | null;
  dividend_yield: number | null;
  book_value: number | null;
  market_cap: number | null;
  peg_ratio: number | null;
  turnover_ratio: number | null;
  volatility_20d: number | null;
  volume_change: number | null;
  avg_volume_20d: number | null;
}

export async function runScreener(request: ScreenerRequest): Promise<{ results: ScreenerResult[]; total: number }> {
  const res = await fetch(`${API_BASE}/api/screener`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return res.json();
}

export interface MarketStatus {
  status: "open" | "closed" | "pre_open";
  reason: string;
  nextOpen?: string;
  closesAt?: string;
}

export async function fetchMarketStatus(): Promise<MarketStatus> {
  const res = await fetch(`${API_BASE}/api/market-status`);
  return res.json();
}

export interface RotationCompany {
  symbol: string;
  price: number;
  change: number;
  periodReturn: number;
  sma50: number | null;
  rsi: number | null;
  aboveSMA50: boolean | null;
}

export interface RotationSector {
  sector: string;
  rank: number;
  companyCount: number;
  avgReturn: number;
  avgChange: number;
  totalVolume: number;
  totalTurnover: number;
  aboveSMA50Pct: number;
  momentum: "strong" | "weak" | "weak_neg" | "strong_neg";
  companies: RotationCompany[];
}

export async function fetchSectorRotation(period?: number): Promise<{ period: number; sectors: RotationSector[] }> {
  const params = period ? `?period=${period}` : "";
  const res = await fetch(`${API_BASE}/api/sectors/rotation${params}`);
  return res.json();
}

export interface ChartPattern {
  type: string;
  name: string;
  signal: "bullish" | "bearish" | "neutral" | "forming";
  confidence: number;
  price: number;
  date: string;
  detail: string;
}

export async function fetchPatterns(symbol: string): Promise<{ symbol: string; patterns: ChartPattern[] }> {
  const res = await fetch(`${API_BASE}/api/patterns/${symbol}`);
  return res.json();
}

export interface TaxTransaction {
  symbol: string;
  category: string;
  buyDate: string;
  sellDate: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  totalBuyValue: number;
  totalSellValue: number;
  pnl: number;
  pnlPct: number;
  holdingPeriod: "short_term" | "long_term";
  holdingDays: number;
}

export interface TaxReport {
  fiscalYear: string;
  generatedAt: string;
  summary: {
    totalTransactions: number;
    totalGains: number;
    totalLosses: number;
    netPnL: number;
    shortTermGains: number;
    longTermGains: number;
    shortTermLosses: number;
    longTermLosses: number;
    taxLiability: number;
  };
  transactions: TaxTransaction[];
}

export async function fetchTaxReport(fy?: string): Promise<TaxReport> {
  const params = fy ? `?fy=${fy}` : "";
  const res = await fetch(`${API_BASE}/api/tax-report${params}`);
  return res.json();
}

export interface DividendCalendarEntry {
  symbol: string;
  companyName: string;
  sector: string;
  type: "cash" | "bonus" | "rights";
  amount: number;
  exDate: string;
  recordDate: string;
  paymentDate: string;
  currentPrice: number;
  dividendYield: number;
  isUpcoming: boolean;
  status: "upcoming" | "completed";
}

export interface DividendCalendarResponse {
  calendar: DividendCalendarEntry[];
  summary: {
    totalEntries: number;
    upcomingCount: number;
    totalCashDividends: number;
    avgDividendYield: number;
  };
}

export async function fetchDividendCalendar(upcoming?: boolean): Promise<DividendCalendarResponse> {
  const params = upcoming ? "?upcoming=true" : "";
  const res = await fetch(`${API_BASE}/api/dividend-calendar${params}`);
  return res.json();
}

// --- Community ---
export interface CommunityPost {
  id: number;
  symbol: string;
  author: string;
  title: string | null;
  content: string;
  parentId: number | null;
  votes: number;
  replies: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityResponse {
  symbol: string;
  posts: CommunityPost[];
  total: number;
  page: number;
  pages: number;
  hot: CommunityPost[];
  recent: CommunityPost[];
}

export async function fetchCommunity(symbol: string, page?: number, limit?: number): Promise<CommunityResponse> {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/api/community/${symbol}${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function postCommunityComment(symbol: string, data: { author?: string; content: string; title?: string; parentId?: number }): Promise<CommunityPost> {
  const res = await fetch(`${API_BASE}/api/community/${symbol}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function voteCommunityPost(symbol: string, id: number, direction: "up" | "down"): Promise<{ id: number; votes: number }> {
  const res = await fetch(`${API_BASE}/api/community/${symbol}/${id}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direction }),
  });
  return res.json();
}

// --- Analyst Ratings ---
export interface AnalystRating {
  analyst: string;
  rating: string;
  priceTarget: number;
  date: string;
  confidence: number;
}

export interface AnalystRatingsResponse {
  symbol: string;
  consensus: string;
  buyCount: number;
  holdCount: number;
  sellCount: number;
  avgTarget: number;
  totalAnalysts: number;
  ratings: AnalystRating[];
}

export interface AnalystRatingsListResponse {
  ratings: AnalystRatingsResponse[];
  summary: { totalCompanies: number; avgBuyPct: number; avgHoldPct: number; avgSellPct: number };
}

export async function fetchAnalystRatings(): Promise<AnalystRatingsListResponse> {
  const res = await fetch(`${API_BASE}/api/analyst-ratings`);
  return res.json();
}

export async function fetchAnalystRatingsForSymbol(symbol: string): Promise<AnalystRatingsResponse> {
  const res = await fetch(`${API_BASE}/api/analyst-ratings/${symbol}`);
  return res.json();
}

// --- Social Sentiment ---
export interface SocialPlatform {
  platform: string;
  sentiment: string;
  mentions: number;
  positivePct: number;
  negativePct: number;
}

export interface TrendingTopic {
  topic: string;
  count: number;
  sentiment: string;
}

export interface DailySentiment {
  date: string;
  score: number;
  mentions: number;
}

export interface SocialSentimentDetail {
  symbol: string;
  overall: string;
  score: number;
  platforms: SocialPlatform[];
  trendingTopics: TrendingTopic[];
  dailySentiment: DailySentiment[];
}

export interface SocialSentimentSummary {
  symbol: string;
  overall: string;
  score: number;
  totalMentions: number;
}

export interface SocialSentimentListResponse {
  companies: SocialSentimentSummary[];
  topBullish: SocialSentimentSummary[];
  topBearish: SocialSentimentSummary[];
}

export async function fetchSocialSentiment(): Promise<SocialSentimentListResponse> {
  const res = await fetch(`${API_BASE}/api/social-sentiment`);
  return res.json();
}

export async function fetchSocialSentimentForSymbol(symbol: string): Promise<SocialSentimentDetail> {
  const res = await fetch(`${API_BASE}/api/social-sentiment/${symbol}`);
  return res.json();
}

// --- Top Investor Holdings ---
export interface InstitutionalHolding {
  institution: string;
  shares: number;
  value: number;
  percentage: number;
  change: number;
  lastUpdated: string;
}

export interface HoldingsSummary {
  totalInstitutions: number;
  totalValue: number;
  totalPctHeld: number;
  increasing: number;
  decreasing: number;
  unchanged: number;
}

export interface HoldingsDetail {
  symbol: string;
  holdings: InstitutionalHolding[];
  summary: HoldingsSummary;
}

export interface HoldingsListResponse {
  companies: { symbol: string; summary: HoldingsSummary }[];
}

export async function fetchHoldings(): Promise<HoldingsListResponse> {
  const res = await fetch(`${API_BASE}/api/holdings`);
  return res.json();
}

export async function fetchHoldingsForSymbol(symbol: string): Promise<HoldingsDetail> {
  const res = await fetch(`${API_BASE}/api/holdings/${symbol}`);
  return res.json();
}

// --- Top Brokers ---
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

export interface BrokerSummary {
  totalBuyQty: number;
  totalBuyAmt: number;
  totalSellQty: number;
  totalSellAmt: number;
  totalTurnover: number;
  netBuyers: number;
  netSellers: number;
  unchanged: number;
}

export interface BrokersResponse {
  date: string;
  totalBrokers: number;
  summary: BrokerSummary;
  brokers: BrokerData[];
  page: number;
  pages: number;
}

export interface BrokerDetailResponse {
  broker: BrokerData;
  history: BrokerHistoryDay[];
  date: string;
}

export interface BrokerHistoryDay {
  date: string;
  topBuyer: { brokerNo: number; turnover: number };
  topSeller: { brokerNo: number; turnover: number };
  totalTurnover: number;
  buyQty: number;
  sellQty: number;
}

export interface BrokerHistoryOverview {
  history: BrokerHistoryDay[];
  topBuyers: { brokerNo: number; daysOnTop: number }[];
  topSellers: { brokerNo: number; daysOnTop: number }[];
  days: number;
}

export async function fetchBrokers(sortBy?: string, sortDir?: string, page?: number, limit?: number): Promise<BrokersResponse> {
  const params = new URLSearchParams();
  if (sortBy) params.set("sortBy", sortBy);
  if (sortDir) params.set("sortDir", sortDir);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/api/brokers${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function fetchBrokerDetail(brokerNo: number): Promise<BrokerDetailResponse> {
  const res = await fetch(`${API_BASE}/api/brokers/${brokerNo}`);
  return res.json();
}

export async function fetchBrokerHistoryOverview(days?: number): Promise<BrokerHistoryOverview> {
  const params = days ? `?days=${days}` : "";
  const res = await fetch(`${API_BASE}/api/brokers/history/overview${params}`);
  return res.json();
}

// --- Broker Analysis ---
export interface BrokerTrendDay {
  date: string;
  totalBuyAmt: number;
  totalSellAmt: number;
  totalBuyQty: number;
  totalSellQty: number;
  netBuyers: number;
  netSellers: number;
  turnover: number;
  buySellRatio: number;
}

export interface BrokerTrendDetail {
  date: string;
  buyAmt: number;
  sellAmt: number;
  turnover: number;
  netQty: number;
  buyQty: number;
  sellQty: number;
}

export interface BrokerTrendsResponse {
  marketTrend: BrokerTrendDay[];
  brokerTrends: Record<number, BrokerTrendDetail[]>;
  days: number;
  brokerNos: number[];
}

export interface BrokerRanking {
  brokerNo: number;
  totalTurnover: number;
  totalBuyAmt: number;
  totalSellAmt: number;
  totalBuyQty: number;
  totalSellQty: number;
  netQty: number;
  avgTurnover: number;
  maxTurnover: number;
  daysActive: number;
  netBuyDays: number;
  netSellDays: number;
  netDirection: "net_buy" | "net_sell" | "neutral";
  score: number;
  turnoverScore: number;
  consistencyScore: number;
  participationScore: number;
  buySellBalance: number;
}

export interface BrokerRankingsResponse {
  rankings: BrokerRanking[];
  days: number;
  sortBy: string;
  totalBrokers: number;
}

export interface BrokerComparisonSummary {
  totalBuyAmt: number;
  totalSellAmt: number;
  totalTurnover: number;
  avgTurnover: number;
  maxTurnover: number;
  minTurnover: number;
  netBuyDays: number;
  netSellDays: number;
  netDirection: "net_buy" | "net_sell" | "neutral";
  buyRatio: number;
}

export interface BrokerComparisonItem {
  brokerNo: number;
  summary: BrokerComparisonSummary;
  daily: BrokerTrendDetail[];
}

export interface BrokerCompareResponse {
  comparisons: BrokerComparisonItem[];
  days: number;
  brokerNos: number[];
}

export interface BrokerParticipationDay {
  date: string;
  netBuyers: number;
  netSellers: number;
  unchanged: number;
  totalBuyAmt: number;
  totalSellAmt: number;
  buySellRatio: number;
  turnover: number;
}

export interface BrokerParticipationSummary {
  avgNetBuyers: number;
  avgNetSellers: number;
  avgBuySellRatio: number;
  avgTurnover: number;
  trendDirection: "bullish" | "bearish" | "neutral";
  totalDays: number;
  bullishDays: number;
  bearishDays: number;
}

export interface BrokerParticipationResponse {
  participation: BrokerParticipationDay[];
  summary: BrokerParticipationSummary;
  topTurnoverDays: BrokerParticipationDay[];
  strongestBuyerDays: BrokerParticipationDay[];
  days: number;
}

export async function fetchBrokerTrends(days?: number, brokerNos?: number[]): Promise<BrokerTrendsResponse> {
  const params = new URLSearchParams();
  if (days) params.set("days", String(days));
  if (brokerNos && brokerNos.length > 0) params.set("brokers", brokerNos.join(","));
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/api/brokers/analysis/trends${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function fetchBrokerRankings(days?: number, sortBy?: string): Promise<BrokerRankingsResponse> {
  const params = new URLSearchParams();
  if (days) params.set("days", String(days));
  if (sortBy) params.set("sortBy", sortBy);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/api/brokers/analysis/ranking${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function fetchBrokerCompare(brokerNos: number[], days?: number): Promise<BrokerCompareResponse> {
  const params = new URLSearchParams();
  params.set("brokers", brokerNos.join(","));
  if (days) params.set("days", String(days));
  const res = await fetch(`${API_BASE}/api/brokers/analysis/compare?${params.toString()}`);
  return res.json();
}

export async function fetchBrokerParticipation(days?: number): Promise<BrokerParticipationResponse> {
  const params = days ? `?days=${days}` : "";
  const res = await fetch(`${API_BASE}/api/brokers/analysis/participation${params}`);
  return res.json();
}

// --- Floor Sheet ---
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

export interface FloorSheetSummary {
  uniqueSymbols: number;
  totalAmount: number;
  totalQuantity: number;
}

export interface FloorSheetResponse {
  date: string | null;
  totalRecords: number;
  page: number;
  pages: number;
  summary: FloorSheetSummary;
  records: FloorSheetRecord[];
}

export async function fetchFloorSheet(params?: {
  symbol?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: string;
}): Promise<FloorSheetResponse> {
  const searchParams = new URLSearchParams();
  if (params?.symbol) searchParams.set("symbol", params.symbol);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortDir) searchParams.set("sortDir", params.sortDir);
  const qs = searchParams.toString();
  const res = await fetch(`${API_BASE}/api/floorsheet${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function scrapeFloorSheet(): Promise<{ message: string; timestamp: string; result: unknown }> {
  const res = await fetch(`${API_BASE}/api/floorsheet/scrape`);
  return res.json();
}
