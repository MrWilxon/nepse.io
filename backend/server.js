require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { WebSocketServer } = require("ws");
const { parse } = require("csv-parse/sync");
const { createClient } = require("@supabase/supabase-js");
let dataProvider;
try {
  dataProvider = require("./data-provider");
} catch (e) {
  console.error("data-provider load failed:", e.message);
  dataProvider = {
    getMutualFunds: async () => [],
    getDebentures: async () => [],
    getInsiderTrading: async () => [],
    getEarningsCalendar: async () => [],
    getHoldings: async () => [],
    getAnnouncements: async () => [],
    getBrokers: async () => [],
    scraperStatus: {},
    companies: () => [],
  };
}

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

const supabase = process.env.SUPABASE_URL
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;
if (!supabase) console.warn("SUPABASE_URL not set — running without database");

const app = express();
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.get("/", (req, res) => res.json({ status: "ok", version: "2.0" }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

const clients = new Set();

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

const indicatorCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCachedIndicators(symbol) {
  const cached = indicatorCache.get(symbol);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;
  return null;
}

function setCachedIndicators(symbol, data) {
  indicatorCache.set(symbol, { data, ts: Date.now() });
  if (indicatorCache.size > 500) {
    const oldest = indicatorCache.keys().next().value;
    indicatorCache.delete(oldest);
  }
}

function invalidateCache() {
  indicatorCache.clear();
  invalidateCSVCache();
}

const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 30;

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(ip, { windowStart: now, count: 1 });
    return next();
  }
  record.count++;
  if (record.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW * 2) rateLimitStore.delete(ip);
  }
}, RATE_LIMIT_WINDOW * 2);

// ═══════════════════════════════════════════════════════════
// ROUTE MODULES (extracted from monolith for maintainability)
// ═══════════════════════════════════════════════════════════
const setupMarketRoutes = require("./routes/market");

const NEPSE_HOLIDAYS_2025_2026 = [
  "2025-01-01", "2025-02-01", "2025-02-02", "2025-02-19", "2025-03-14",
  "2025-03-29", "2025-04-10", "2025-04-11", "2025-04-14", "2025-05-01",
  "2025-06-06", "2025-08-15", "2025-09-23", "2025-10-02", "2025-10-20",
  "2025-10-21", "2025-11-05", "2025-12-25",
  "2026-01-01", "2026-01-30", "2026-02-17", "2026-03-04", "2026-03-29",
  "2026-04-02", "2026-04-03", "2026-04-13", "2026-05-01", "2026-06-26",
  "2026-08-15", "2026-09-12", "2026-10-02", "2026-11-09", "2026-11-10",
  "2026-12-25",
];

function getMarketStatus() {
  const now = new Date();
  const nepalTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
  const hours = nepalTime.getHours();
  const minutes = nepalTime.getMinutes();
  const timeMinutes = hours * 60 + minutes;
  const year = nepalTime.getFullYear();
  const month = String(nepalTime.getMonth() + 1).padStart(2, "0");
  const day = String(nepalTime.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  const dayOfWeek = nepalTime.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { status: "closed", reason: "Weekend", nextOpen: getNextOpenDate(nepalTime) };
  }
  if (NEPSE_HOLIDAYS_2025_2026.includes(dateStr)) {
    return { status: "closed", reason: "Holiday", nextOpen: getNextOpenDate(nepalTime) };
  }
  if (timeMinutes < 570) {
    return { status: "pre_open", reason: "Market opens at 11:15 AM NPT", nextOpen: dateStr };
  }
  if (timeMinutes >= 570 && timeMinutes <= 900) {
    return { status: "open", reason: "Market is open", closesAt: "3:00 PM NPT" };
  }
  return { status: "closed", reason: "Market closed for the day", nextOpen: getNextOpenDate(nepalTime) };
}

function getNextOpenDate(current) {
  let d = new Date(current);
  for (let i = 0; i < 10; i++) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const ds = `${y}-${m}-${dd}`;
    if (dow !== 0 && dow !== 6 && !NEPSE_HOLIDAYS_2025_2026.includes(ds)) {
      return ds;
    }
  }
  return "N/A";
}

let liveInterval = null;
function startLiveFeed() {
  if (liveInterval) return;
  liveInterval = setInterval(() => {
    const all = getAllCompanyData();
    const sample = all
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map(({ symbol, records }) => {
        const latest = records[records.length - 1];
        const close = parseFloat(latest.close) || 0;
        let changePct = parseFloat(latest.per_change);
        if (!Number.isFinite(changePct)) changePct = 0;
        const change = close * changePct / 100;
        return {
          symbol,
          lastClose: close,
          price: close,
          change: Math.round(change * 100) / 100,
          volume: parseInt(latest.traded_quantity) || 0,
          time: latest.published_date || new Date().toISOString(),
        };
      });
    broadcast({ type: "price_update", data: sample });
    broadcastScreenerUpdate();
  }, 5000);
}
startLiveFeed();

function broadcastScreenerUpdate() {
  try {
    const allData = getAllCompanyData();
    const startIdx = allData.length > 10 ? Math.floor(Math.random() * (allData.length - 10)) : 0;
    const sample = allData.slice(startIdx, startIdx + 10).map(({ symbol, records }) => {
      const data = parseRecords(records);
      if (data.length < 5) return null;
      const closes = data.map((r) => r.close);
      const n = data.length - 1;
      const rsi = RSI(closes, 14);
      const sma20 = SMA(closes, 20);
      const sma50 = SMA(closes, 50);
      return {
        symbol,
        price: data[n].close,
        change: data[n].change,
        rsi_14: rsi[n],
        sma_20: sma20[n],
        sma_50: sma50[n],
      };
    }).filter(Boolean);
    broadcast({ type: "screener_update", data: sample });
  } catch (e) { /* ignore */ }
}

const DATA_DIR = path.join(__dirname, "..", "data", "company-wise");

const CATEGORY_MAP = {
  ADBL: "Commercial Bank",
  NMB: "Commercial Bank",
  SBL: "Commercial Bank",
  NCCB: "Commercial Bank",
  KBL: "Commercial Bank",
  LBL: "Commercial Bank",
  MBL: "Commercial Bank",
  EBL: "Commercial Bank",
  NBB: "Commercial Bank",
  SBI: "Commercial Bank",
  HBL: "Commercial Bank",
  SCB: "Commercial Bank",
  NIB: "Commercial Bank",
  NABIL: "Commercial Bank",
  CZBIL: "Commercial Bank",
  PCBL: "Commercial Bank",
  SRBL: "Commercial Bank",
  SANIMA: "Commercial Bank",
  MEGA: "Commercial Bank",
  CBL: "Commercial Bank",
  CCBL: "Commercial Bank",
  NBL: "Commercial Bank",
  GBIME: "Commercial Bank",
  NICA: "Commercial Bank",
  PRVU: "Commercial Bank",
  BOKL: "Commercial Bank",
  CORBL: "Development Bank",
  EDBL: "Development Bank",
  GBBL: "Development Bank",
  GRDBL: "Development Bank",
  JBBL: "Development Bank",
  KRBL: "Development Bank",
  KSBBL: "Development Bank",
  LBBL: "Development Bank",
  MDB: "Development Bank",
  MLBL: "Development Bank",
  MNBBL: "Development Bank",
  NABBC: "Development Bank",
  SADBL: "Development Bank",
  SAPDBL: "Development Bank",
  SHBL: "Development Bank",
  SHINE: "Development Bank",
  SINDU: "Development Bank",
  BFC: "Finance",
  CFCL: "Finance",
  GFCL: "Finance",
  GMFIL: "Finance",
  GUFL: "Finance",
  ICFC: "Finance",
  JFL: "Finance",
  MFIL: "Finance",
  MPFL: "Finance",
  NFS: "Finance",
  PFL: "Finance",
  PROFL: "Finance",
  RLFL: "Finance",
  SFCL: "Finance",
  SIFC: "Finance",
  CGH: "Tourism/Hospitality",
  OHL: "Tourism/Hospitality",
  SHL: "Tourism/Hospitality",
  TRH: "Tourism/Hospitality",
  AHPC: "Hydropower",
  AKJCL: "Hydropower",
  AKPL: "Hydropower",
  API: "Hydropower",
  BARUN: "Hydropower",
  BPCL: "Hydropower",
  CHCL: "Hydropower",
  CHL: "Hydropower",
  DHPL: "Hydropower",
  GHL: "Hydropower",
  GLH: "Hydropower",
  HDHPC: "Hydropower",
  HPPL: "Hydropower",
  HURJA: "Hydropower",
  JOSHI: "Hydropower",
  KKHC: "Hydropower",
  KPCL: "Hydropower",
  LEC: "Hydropower",
  MEN: "Hydropower",
  MHNL: "Hydropower",
  MKJC: "Hydropower",
  NGPL: "Hydropower",
  NHDL: "Hydropower",
  NHPC: "Hydropower",
  NYADI: "Hydropower",
  PMHPL: "Hydropower",
  PPCL: "Hydropower",
  RADHI: "Hydropower",
  RHPC: "Hydropower",
  RHPL: "Hydropower",
  RRHP: "Hydropower",
  RURU: "Hydropower",
  SAHAS: "Hydropower",
  SHEL: "Hydropower",
  SHPC: "Hydropower",
  SJCL: "Hydropower",
  SPC: "Hydropower",
  SPDL: "Hydropower",
  SSHL: "Hydropower",
  TPC: "Hydropower",
  UMHL: "Hydropower",
  UMRH: "Hydropower",
  UNHPL: "Hydropower",
  UPCL: "Hydropower",
  UPPER: "Hydropower",
  CHDC: "Investment",
  CIT: "Investment",
  HIDCL: "Investment",
  NIFRA: "Investment",
  NRN: "Investment",
  ALICL: "Life Insurance",
  GLICL: "Life Insurance",
  JLI: "Life Insurance",
  LICN: "Life Insurance",
  NLIC: "Life Insurance",
  NLICL: "Life Insurance",
  PLI: "Life Insurance",
  PLIC: "Life Insurance",
  RLI: "Life Insurance",
  SLI: "Life Insurance",
  SLICL: "Life Insurance",
  ULI: "Life Insurance",
};

const NAME_MAP = {
  ADBL: "Agricultural Development Bank", NMB: "Nepal Merchantile Bank", SBL: "Siddhartha Bank", NCCB: "Nepal Credit & Commerce Bank",
  KBL: "Kumari Bank", LBL: "Lumbini Bank", MBL: "Machhapuchhre Bank", EBL: "Everest Bank", NBB: "Nepal Bangla Bank",
  SBI: "SBI Bank", HBL: "Himalayan Bank", SCB: "Standard Chartered Bank", NIB: "Nepal Investment Bank",
  NABIL: "Nabil Bank", CZBIL: "Citizens Intl Bank", PCBL: "Prime Commercial Bank", SRBL: "Sunrise Bank",
  SANIMA: "Sanima Bank", MEGA: "Mega Bank", CBL: "Century Commercial Bank", CCBL: "Central Jalpa Devi",
  NBL: "Nepal Bank", GBIME: "Global IME Bank", NICA: "Nepal Investment Mega Capital", PRVU: "Prabhu Bank",
  BOKL: "Bank of Kathmandu", CORBL: "Coronation Bank", EDBL: "Excel Dev Bank", GBBL: "Garima Bikas Bank",
  GRDBL: "Gurans Dev Bank", JBBL: "Jeevan Bikas Bank", KRBL: "Karnali Bank", KSBBL: "Koshi Sahakari",
  LBBL: "Lumbini Bikas Bank", MDB: "Muktinath Dev Bank", MLBL: "Mahalaxmi Bikas", MNBBL: "Mahalaxmi Bikas",
  NABBC: "Nepal Bank & Finance", SADBL: "Sahara Dev Bank", SAPDBL: "Saptagandaki Dev Bank",
  SHBL: "Shangrila Dev Bank", SHINE: "Shine Resources Dev", SINDU: "Sindhu Bikas Bank",
  BFC: "Best Finance", CFCL: "Chhimek Finance", GFCL: "Ghodighoda Finance", GMFIL: "Global Microfinance",
  GUFL: "Guheswori Finance", ICFC: "ICFC Finance", JFL: "Janaki Finance", MFIL: "Manushi Finance",
  MPFL: "Multipurpose Finance", NFS: "National Finance", PFL: "People's Finance", PROFL: "Progress Finance",
  RLFL: "Reliable Finance", SFCL: "Samriddhi Finance", SIFC: "Siddhartha Finance",
  CGH: "Chhimang Himalayan Resort", OHL: "Oriental Hotel", SHL: "Soaltee Hotel", TRH: "Tiger Mountain Resort",
  AHPC: "Arun Valley Hydropower", AKJCL: "Arun Kabeli Power", AKPL: "Arun Valley Hydro",
  API: "Api Power", BARUN: "Barun Hydropower", BPCL: "BPCL Hydro Power",
  CHCL: "Chilime Hydropower", CHL: "Chilime Hydro", DHPL: "Dolakha Hydro",
  GHL: "Green Hydro Power", GLH: "Green Life Hydro", HDHPC: "Himalayan Hydro",
  HPPL: "Himalayan Power Partner", HURJA: "HURJA Hydro", JOSHI: "Joshi Hydro",
  KKHC: "Kalinchowka Hydropower", KPCL: "Kurichhu Power", LEC: "Lower Solu Hydro",
  MEN: "Marsyangdi Hydro", MHNL: "Mahalaxmi Hydro", MKJC: "MKJC Hydro",
  NGPL: "Ngadi Group Power", NHDL: "NHDL Hydro", NHPC: "Nepal Hydro Power",
  NYADI: "Nyadi Hydro", PMHPL: "PMHP Hydro", PPCL: "PPCL Hydro",
  RADHI: "Radhi Hydro", RHPC: "Rasunagadha Hydro", RHPL: "Ratuwa Hydro",
  RRHP: "RRHP Hydro", RURU: "Ruru Hydro", SAHAS: "Sahas Power",
  SHEL: "Shel Hydro", SHPC: "Singati Hydro", SJCL: "SJVNL Jalpa",
  SPC: "Shree Power", SPDL: "SPDL Hydro", SSHL: "SSHL Hydro",
  TPC: "Terai Power", UMHL: "United Modi Hydro", UMRH: "Umarai Hydro",
  UNHPL: "Unat Hydro", UPCL: "Upper Pastchim Hydro", UPPER: "Upper Tamakoshi",
  CHDC: "Chandragiri Hills", CIT: "Citizen Investment", HIDCL: "Hydro Electricity",
  NIFRA: "Nepal Infrastructure Bank", NRN: "NRN Hydro",
  ALICL: "Asian Life Insurance", GLICL: "Guardian Life Insurance", JLI: "Jalpa Life Insurance",
  LICN: "Life Insurance Corp Nepal", NLIC: "Neco Insurance", NLICL: "NLG Insurance",
  PLI: "Prabhu Insurance", PLIC: "Prudential Insurance", RLI: "Rastriya Beema Sansthan",
  SLI: "Surya Life Insurance", SLICL: "Sanima Life Insurance", ULI: "United Life Insurance",
};

const GROUP_MAP = {
  ADBL: "A", NMB: "A", SBL: "A", NCCB: "A", KBL: "A", LBL: "A", MBL: "A", EBL: "A", NBB: "A",
  SBI: "A", HBL: "A", SCB: "A", NIB: "A", NABIL: "A", CZBIL: "A", PCBL: "A", SRBL: "A",
  SANIMA: "A", MEGA: "A", CBL: "A", CCBL: "A", NBL: "A", GBIME: "A", NICA: "A", PRVU: "A", BOKL: "A",
  CORBL: "B", EDBL: "B", GBBL: "B", GRDBL: "B", JBBL: "B", KRBL: "B", KSBBL: "B",
  LBBL: "B", MDB: "B", MLBL: "B", MNBBL: "B", NABBC: "B", SADBL: "B", SAPDBL: "B",
  SHBL: "B", SHINE: "B", SINDU: "B",
  BFC: "F", CFCL: "F", GFCL: "F", GMFIL: "F", GUFL: "F", ICFC: "F", JFL: "F", MFIL: "F",
  MPFL: "F", NFS: "F", PFL: "F", PROFL: "F", RLFL: "F", SFCL: "F", SIFC: "F",
  CGH: "Z", OHL: "Z", SHL: "Z", TRH: "Z",
  AHPC: "Z", AKJCL: "Z", AKPL: "Z", API: "Z", BARUN: "Z", BPCL: "Z", CHCL: "Z", CHL: "Z",
  DHPL: "Z", GHL: "Z", GLH: "Z", HDHPC: "Z", HPPL: "Z", HURJA: "Z", JOSHI: "Z",
  KKHC: "Z", KPCL: "Z", LEC: "Z", MEN: "Z", MHNL: "Z", MKJC: "Z",
  NGPL: "Z", NHDL: "Z", NHPC: "Z", NYADI: "Z", PMHPL: "Z", PPCL: "Z",
  RADHI: "Z", RHPC: "Z", RHPL: "Z", RRHP: "Z", RURU: "Z", SAHAS: "Z",
  SHEL: "Z", SHPC: "Z", SJCL: "Z", SPC: "Z", SPDL: "Z", SSHL: "Z",
  TPC: "Z", UMHL: "Z", UMRH: "Z", UNHPL: "Z", UPCL: "Z", UPPER: "Z",
  CHDC: "G", CIT: "G", HIDCL: "G", NIFRA: "G", NRN: "G",
  ALICL: "A", GLICL: "A", JLI: "A", LICN: "A", NLIC: "A", NLICL: "A",
  PLI: "A", PLIC: "A", RLI: "A", SLI: "A", SLICL: "A", ULI: "A",
};

const SHORT_CATEGORY_MAP = {
  "Commercial Bank": "Com. Banks", "Development Bank": "Dev. Banks", "Finance": "Finance",
  "Hydropower": "Hydro Power", "Life Insurance": "Life Insu.", "Non Life Insurance": "Non Life Insu.",
  "Tourism/Hospitality": "Tourism", "Investment": "Investment", "MicroFinance": "MicroFinance", "Other": "Others",
};

// Supabase data layer - preloaded into memory at startup
const companyDataCache = new Map();
let dataLoaded = false;

async function preloadAllCompanyData() {
  if (supabase) {
    try {
      console.log("Loading all company data from Supabase...");
      const { data: companies, error } = await Promise.race([
        supabase.from("companies").select("symbol"),
        new Promise((_, rej) => setTimeout(() => rej(new Error("Supabase timeout")), 10000)),
      ]);
      if (error) { console.error("Failed to load companies:", error.message); } else {
        const newCache = new Map();
        for (const { symbol } of companies) {
          let allRows = [];
          let offset = 0;
          const chunkSize = 1000;
          while (true) {
            const { data: chunk } = await Promise.race([
              supabase
                .from("stock_prices")
                .select("published_date, open, high, low, close, per_change, traded_quantity, traded_amount, status")
                .eq("symbol", symbol)
                .order("published_date", { ascending: true })
                .range(offset, offset + chunkSize - 1),
              new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 10000)),
            ]);
            if (!chunk || chunk.length === 0) break;
            allRows = allRows.concat(chunk);
            if (chunk.length < chunkSize) break;
            offset += chunkSize;
          }
          if (allRows.length > 0) {
            newCache.set(symbol, allRows.map(r => ({
              published_date: r.published_date,
              open: String(r.open ?? ""),
              high: String(r.high ?? ""),
              low: String(r.low ?? ""),
              close: String(r.close ?? ""),
              per_change: r.per_change == null ? "nan" : String(r.per_change),
              traded_quantity: String(r.traded_quantity ?? "0"),
              traded_amount: String(r.traded_amount ?? "0"),
              status: String(r.status ?? "0"),
            })).filter(r => {
              const close = parseFloat(r.close) || 0;
              const open = parseFloat(r.open) || 0;
              if (close <= 0 || open <= 0) return false;
              const pct = parseFloat(r.per_change);
              if (Number.isFinite(pct) && Math.abs(pct) > 25) return false;
              return true;
            }));
          }
        }
        for (const [k, v] of newCache) companyDataCache.set(k, v);
        for (const k of companyDataCache.keys()) { if (!newCache.has(k)) companyDataCache.delete(k); }
      }
    } catch (e) {
      console.error("Supabase preload failed:", e.message);
    }
  }

  if (companyDataCache.size === 0 && fs.existsSync(DATA_DIR)) {
    console.log("Loading company data from CSV files...");
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".csv"));
    for (const file of files) {
      const symbol = file.replace(".csv", "").toUpperCase();
      if (companyDataCache.has(symbol)) continue;
      try {
        const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
        const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
        if (records.length > 0) {
          companyDataCache.set(symbol, records.map(r => ({
            published_date: r.published_date || r.date || "",
            open: String(r.open ?? ""),
            high: String(r.high ?? ""),
            low: String(r.low ?? ""),
            close: String(r.close ?? ""),
            per_change: r.per_change == null ? "nan" : String(r.per_change),
            traded_quantity: String(r.traded_quantity ?? r.volume ?? "0"),
            traded_amount: String(r.traded_amount ?? r.turnover ?? "0"),
            status: String(r.status ?? "0"),
          })));
        }
      } catch {}
    }
    console.log(`Loaded ${companyDataCache.size} companies from CSV files`);
  }

  dataLoaded = true;
  console.log(`Total companies loaded: ${companyDataCache.size}`);
}

function readCompanyCSV(symbol) {
  if (!dataLoaded) return null;
  const data = companyDataCache.get(symbol);
  return data || null;
}

function invalidateCSVCache() {
  companyDataCache.clear();
}

// ═══════════════════════════════════════════════════════════
// NEPSE LIVE PRICE SCRAPER
// Fetches today's prices from NEPSE proxy API and upserts to Supabase
// ═══════════════════════════════════════════════════════════

const NEPSE_PROXY_URL = "https://nepseman-api-production.up.railway.app/api/v1/prices/today";

async function fetchWithTimeout(url, opts = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function safeNum(val, fallback = 0) {
  if (val == null || val === "" || val === "N/A" || val === "-") return fallback;
  const n = parseFloat(String(val).replace(/,/g, "").replace(/%/g, "").trim());
  return Number.isFinite(n) ? n : fallback;
}

async function scrapeLatestPrices() {
  if (!supabase) {
    console.log("[SCRAPE] No Supabase — skipping live price scrape");
    return;
  }
  const log = (msg) => console.log(`[SCRAPE ${new Date().toISOString()}] ${msg}`);

  let items = [];

  // ── Primary: NEPSE proxy API (handles auth internally) ──
  try {
    log("Fetching latest prices from NEPSE proxy...");
    const proxyRes = await fetchWithTimeout(NEPSE_PROXY_URL, {
      headers: { Accept: "application/json" },
    }, 30000);
    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      items = Array.isArray(proxyData) ? proxyData : proxyData?.data || [];
      log(`Proxy returned ${items.length} stocks`);
    } else {
      log(`Proxy returned HTTP ${proxyRes.status}`);
    }
  } catch (err) {
    log(`Proxy fetch failed: ${err.message}`);
  }

  if (items.length === 0) {
    log("No price data available (market may be closed or API down)");
    return;
  }

  // ── Normalize to Supabase schema ──
  const rows = items
    .filter((r) => r.symbol)
    .map((r) => {
      const open = safeNum(r.openPrice);
      const high = safeNum(r.highPrice);
      const low = safeNum(r.lowPrice);
      const close = safeNum(r.closePrice) || safeNum(r.lastUpdatedPrice) || safeNum(r.ltp) || open;
      const prevClose = safeNum(r.previousDayClosePrice);
      const pctChange = prevClose !== 0 ? Math.round(((close - prevClose) / prevClose) * 10000) / 100 : 0;
      const volume = safeNum(r.totalTradedQuantity) || safeNum(r.totalTradeQuantity) || safeNum(r.totalVolume);
      const turnover = safeNum(r.totalTradedValue) || safeNum(r.totalAmount);
      return {
        symbol: r.symbol,
        published_date: r.businessDate || new Date().toISOString().slice(0, 10),
        open: String(open),
        high: String(high),
        low: String(low),
        close: String(close),
        per_change: close > 0 ? pctChange : 0,
        traded_quantity: String(volume),
        traded_amount: String(turnover),
        status: String(close > open ? 1 : close < open ? -1 : 0),
      };
    })
    .filter((r) => {
      const close = parseFloat(r.close);
      const open = parseFloat(r.open);
      if (close <= 0 || open <= 0) return false;
      const pct = parseFloat(r.per_change);
      if (!Number.isFinite(pct) || Math.abs(pct) > 25) return false;
      if (close > open * 10 || open > close * 10) return false;
      return true;
    });

  if (rows.length === 0) {
    log("No valid rows after normalization");
    return;
  }

  const validRatio = rows.length / items.length;
  if (validRatio < 0.5 && items.length > 10) {
    log(`Suspicious: only ${rows.length}/${items.length} rows valid (${(validRatio * 100).toFixed(0)}%). Aborting to protect data.`);
    return;
  }

  // ── Check if data is newer than what Supabase has ──
  const newDate = rows[0].published_date;
  const { data: existing } = await supabase
    .from("stock_prices")
    .select("published_date")
    .eq("symbol", rows[0].symbol)
    .order("published_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && existing.published_date >= newDate) {
    log(`Supabase already has data for ${existing.published_date} (newest: ${newDate}) — upserting anyway`);
  }

  // ── Upsert to Supabase in batches ──
  log(`Upserting ${rows.length} rows for date ${newDate}...`);
  const BATCH = 500;
  let ok = 0;
  let batchErrors = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from("stock_prices")
      .upsert(batch, { onConflict: "symbol,published_date", ignoreDuplicates: false });
    if (error) {
      log(`Batch ${Math.floor(i / BATCH) + 1} error: ${error.message}`);
      batchErrors++;
      // If upsert constraint doesn't exist, fall back to delete+insert
      if (error.message.includes("on conflict") || error.message.includes("unique")) {
        log("Trying delete+insert fallback for this batch...");
        const syms = batch.map((r) => r.symbol);
        const date = batch[0].published_date;
        await supabase.from("stock_prices").delete().eq("published_date", date).in("symbol", syms);
        const { error: insErr } = await supabase.from("stock_prices").insert(batch);
        if (insErr) {
          log(`Insert fallback also failed: ${insErr.message}`);
        } else {
          ok += batch.length;
          batchErrors--;
        }
      }
    } else {
      ok += batch.length;
    }
  }
  log(`Upserted ${ok}/${rows.length} price records (${batchErrors} batch errors)`);

  // ── Ensure companies table has all symbols ──
  const symbols = [...new Set(rows.map((r) => r.symbol))];
  const symbolRows = symbols.map((s) => ({ symbol: s, category: CATEGORY_MAP[s] || "Other" }));
  const { error: coErr } = await supabase
    .from("companies")
    .upsert(symbolRows, { onConflict: "symbol", ignoreDuplicates: true });
  if (coErr) log(`Company upsert warning: ${coErr.message}`);

  // ── Reload in-memory cache (atomic swap, no invalidate needed) ──
  await preloadAllCompanyData();
  log("Cache reloaded with fresh data");
}

function SMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

function EMA(data, period) {
  const k = 2 / (period + 1);
  const result = [];
  let ema = null;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[j];
      }
      ema = sum / period;
      result.push(ema);
    } else {
      ema = data[i] * k + ema * (1 - k);
      result.push(ema);
    }
  }
  return result;
}

function RSI(data, period) {
  const result = [];
  const changes = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }
  let avgGain = null;
  let avgLoss = null;
  for (let i = 0; i < changes.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    if (avgGain === null) {
      let gainSum = 0;
      let lossSum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        if (changes[j] > 0) gainSum += changes[j];
        else lossSum += Math.abs(changes[j]);
      }
      avgGain = gainSum / period;
      avgLoss = lossSum / period;
    } else {
      const change = changes[i];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }
  result.unshift(null);
  return result;
}

function MACD(data, fastPeriod, slowPeriod, signalPeriod) {
  const emaFast = EMA(data, fastPeriod);
  const emaSlow = EMA(data, slowPeriod);
  const macdLine = [];
  for (let i = 0; i < data.length; i++) {
    if (emaFast[i] === null || emaSlow[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(emaFast[i] - emaSlow[i]);
    }
  }
  const validMacd = macdLine.filter((v) => v !== null);
  const signalRaw = EMA(validMacd, signalPeriod);
  const signalLine = [];
  let validIdx = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null);
    } else {
      signalLine.push(signalRaw[validIdx] || null);
      validIdx++;
    }
  }
  const histogram = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null || signalLine[i] === null) {
      histogram.push(null);
    } else {
      histogram.push(macdLine[i] - signalLine[i]);
    }
  }
  return { macdLine, signalLine, histogram };
}

function BollingerBands(data, period, multiplier) {
  const sma = SMA(data, period);
  const upper = [];
  const lower = [];
  for (let i = 0; i < data.length; i++) {
    if (sma[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      let sumSq = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sumSq += Math.pow(data[j] - sma[i], 2);
      }
      const stdDev = Math.sqrt(sumSq / period);
      upper.push(sma[i] + multiplier * stdDev);
      lower.push(sma[i] - multiplier * stdDev);
    }
  }
  return { middle: sma, upper, lower };
}

function Stochastic(highs, lows, closes, period) {
  const kLine = [];
  const dLine = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      kLine.push(null);
      dLine.push(null);
    } else {
      let highest = -Infinity;
      let lowest = Infinity;
      for (let j = i - period + 1; j <= i; j++) {
        if (highs[j] > highest) highest = highs[j];
        if (lows[j] < lowest) lowest = lows[j];
      }
      const k = highest === lowest ? 50 : ((closes[i] - lowest) / (highest - lowest)) * 100;
      kLine.push(k);
    }
  }
  for (let i = 0; i < kLine.length; i++) {
    if (i < period + 1) {
      dLine.push(null);
    } else {
      let sum = 0;
      let count = 0;
      for (let j = i - 2; j <= i; j++) {
        if (kLine[j] !== null) { sum += kLine[j]; count++; }
      }
      dLine.push(count === 3 ? sum / 3 : null);
    }
  }
  return { kLine, dLine };
}

function MFI(highs, lows, closes, volumes, period) {
  const result = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      result.push(null);
    } else {
      let posFlow = 0;
      let negFlow = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const tp = (highs[j] + lows[j] + closes[j]) / 3;
        const tpPrev = j > 0 ? (highs[j - 1] + lows[j - 1] + closes[j - 1]) / 3 : tp;
        const mf = tp * volumes[j];
        if (tp > tpPrev) posFlow += mf;
        else if (tp < tpPrev) negFlow += mf;
      }
      if (negFlow === 0) {
        result.push(100);
      } else {
        const ratio = posFlow / negFlow;
        result.push(100 - 100 / (1 + ratio));
      }
    }
  }
  return result;
}

function WilliamsR(highs, lows, closes, period) {
  const result = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let highest = -Infinity;
      let lowest = Infinity;
      for (let j = i - period + 1; j <= i; j++) {
        if (highs[j] > highest) highest = highs[j];
        if (lows[j] < lowest) lowest = lows[j];
      }
      result.push(highest === lowest ? -50 : ((highest - closes[i]) / (highest - lowest)) * -100);
    }
  }
  return result;
}

function ADX(highs, lows, closes, period) {
  const len = closes.length;
  const trArr = [];
  const plusDM = [];
  const minusDM = [];
  for (let i = 0; i < len; i++) {
    if (i === 0) {
      trArr.push(highs[i] - lows[i]);
      plusDM.push(0);
      minusDM.push(0);
    } else {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trArr.push(tr);
      const upMove = highs[i] - highs[i - 1];
      const downMove = lows[i - 1] - lows[i];
      plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    }
  }
  const atr = EMA(trArr, period);
  const smoothPlusDM = EMA(plusDM, period);
  const smoothMinusDM = EMA(minusDM, period);
  const plusDI = [];
  const minusDI = [];
  const dx = [];
  for (let i = 0; i < len; i++) {
    if (atr[i] === null || atr[i] === 0) {
      plusDI.push(null);
      minusDI.push(null);
      dx.push(null);
    } else {
      const pdi = (smoothPlusDM[i] / atr[i]) * 100;
      const mdi = (smoothMinusDM[i] / atr[i]) * 100;
      plusDI.push(pdi);
      minusDI.push(mdi);
      dx.push(pdi + mdi === 0 ? 0 : (Math.abs(pdi - mdi) / (pdi + mdi)) * 100);
    }
  }
  const adx = EMA(dx.filter((v) => v !== null), period);
  const result = [];
  let validIdx = 0;
  for (let i = 0; i < len; i++) {
    if (dx[i] === null) {
      result.push(null);
    } else {
      result.push(adx[validIdx] || null);
      validIdx++;
    }
  }
  return result;
}

function CCI(highs, lows, closes, period) {
  const result = [];
  const tp = [];
  for (let i = 0; i < closes.length; i++) {
    tp.push((highs[i] + lows[i] + closes[i]) / 3);
  }
  for (let i = 0; i < tp.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += tp[j];
      const mean = sum / period;
      let meanDev = 0;
      for (let j = i - period + 1; j <= i; j++) meanDev += Math.abs(tp[j] - mean);
      meanDev /= period;
      result.push(meanDev === 0 ? 0 : (tp[i] - mean) / (0.015 * meanDev));
    }
  }
  return result;
}

function ATR(highs, lows, closes, period) {
  const trArr = [];
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      trArr.push(highs[i] - lows[i]);
    } else {
      trArr.push(Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      ));
    }
  }
  return EMA(trArr, period);
}

function OBV(closes, volumes) {
  const result = [0];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) {
      result.push(result[i - 1] + volumes[i]);
    } else if (closes[i] < closes[i - 1]) {
      result.push(result[i - 1] - volumes[i]);
    } else {
      result.push(result[i - 1]);
    }
  }
  return result;
}

function getAllCompanyData() {
  const all = [];
  for (const [symbol, records] of companyDataCache) {
    if (!records || records.length === 0) continue;
    all.push({ symbol, records });
  }
  return all;
}

function parseRecords(records) {
  return records.map((r) => ({
    date: r.published_date,
    open: parseFloat(r.open) || 0,
    high: parseFloat(r.high) || 0,
    low: parseFloat(r.low) || 0,
    close: parseFloat(r.close) || 0,
    change: parseFloat(r.per_change) || 0,
    volume: parseInt(r.traded_quantity) || 0,
    turnover: parseFloat(r.traded_amount) || 0,
  }));
}

// Register route modules
setupMarketRoutes(app, {
  readCompanyCSV, parseRecords, getAllCompanyData,
  CATEGORY_MAP, NAME_MAP, GROUP_MAP, SHORT_CATEGORY_MAP,
  SMA, EMA, RSI, MACD, BollingerBands, Stochastic, MFI, WilliamsR, ADX, CCI, ATR, OBV,
  getCachedIndicators, setCachedIndicators, dataProvider, broadcast, rateLimit,
  companyDataCache, supabase, invalidateCache,
});

app.get("/api/dividends/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  if (!CATEGORY_MAP[symbol]) return res.status(404).json({ error: "Company not found" });
  try {
    const allDividends = await dataProvider.getDividends();
    const category = CATEGORY_MAP[symbol] || "Other";
    const dividends = allDividends[symbol] || [];
    res.json({ symbol, category, dividends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/backtest", (req, res) => {
  try {
    const { symbol, strategy, startCapital = 100000, fromDate, smaFast: smaFastParam, smaSlow: smaSlowParam, rsiBuy: rsiBuyParam, rsiSell: rsiSellParam, macdFast: macdFastParam, macdSlow: macdSlowParam, macdSignal: macdSignalParam } = req.body;
    if (!symbol || !strategy) return res.status(400).json({ error: "symbol and strategy are required" });
    const records = readCompanyCSV(symbol.toUpperCase());
    if (!records) return res.status(404).json({ error: "Company not found" });
    let data = parseRecords(records);
    if (fromDate) data = data.filter((d) => d.date >= fromDate);
    if (data.length < 2) return res.status(400).json({ error: "Not enough data" });
    const closes = data.map((d) => d.close);
    let smaFast, smaSlow, rsiValues, macdData;
    if (strategy === "sma_crossover") {
      const fast = Math.max(2, Math.round(smaFastParam) || 20);
      const slow = Math.max(fast + 1, Math.round(smaSlowParam) || 50);
      smaFast = SMA(closes, fast);
      smaSlow = SMA(closes, slow);
    } else if (strategy === "rsi") {
      rsiValues = RSI(closes, 14);
    } else if (strategy === "macd") {
      const fast = Math.max(2, Math.round(macdFastParam) || 12);
      const slow = Math.max(fast + 1, Math.round(macdSlowParam) || 26);
      const signal = Math.max(2, Math.round(macdSignalParam) || 9);
      macdData = MACD(closes, fast, slow, signal);
    } else {
      return res.status(400).json({ error: "Invalid strategy. Use sma_crossover, rsi, or macd" });
    }
    let capital = startCapital;
    let shares = 0;
    let holding = false;
    let entryPrice = 0;
    let buyDate = "";
    const trades = [];
    let peakValue = capital;
    let maxDrawdown = 0;
    const dailyReturns = [];
    let prevValue = capital;
    for (let i = 1; i < data.length; i++) {
      const date = data[i].date;
      const price = data[i].close;
      let signal = null;
      if (strategy === "sma_crossover") {
        if (smaFast[i] !== null && smaSlow[i] !== null && smaFast[i - 1] !== null && smaSlow[i - 1] !== null) {
          const prevCross = smaFast[i - 1] - smaSlow[i - 1];
          const currCross = smaFast[i] - smaSlow[i];
          if (prevCross <= 0 && currCross > 0) signal = "buy";
          else if (prevCross >= 0 && currCross < 0) signal = "sell";
        }
      } else if (strategy === "rsi") {
        const buyThreshold = Math.max(10, Math.min(50, Number(rsiBuyParam) || 30));
        const sellThreshold = Math.max(50, Math.min(90, Number(rsiSellParam) || 70));
        if (rsiValues[i] !== null) {
          if (rsiValues[i] < buyThreshold && !holding) signal = "buy";
          else if (rsiValues[i] > sellThreshold && holding) signal = "sell";
        }
      } else if (strategy === "macd") {
        if (macdData.macdLine[i] !== null && macdData.signalLine[i] !== null && macdData.macdLine[i - 1] !== null && macdData.signalLine[i - 1] !== null) {
          const prevDiff = macdData.macdLine[i - 1] - macdData.signalLine[i - 1];
          const currDiff = macdData.macdLine[i] - macdData.signalLine[i];
          if (prevDiff <= 0 && currDiff > 0) signal = "buy";
          else if (prevDiff >= 0 && currDiff < 0) signal = "sell";
        }
      }
      if (signal === "buy" && !holding) {
        shares = Math.floor(capital / price);
        if (shares > 0) {
          const cost = shares * price;
          capital -= cost;
          entryPrice = price;
          buyDate = date;
          holding = true;
          trades.push({ date, action: "BUY", price: Math.round(price * 100) / 100, shares, pnl: 0 });
        }
      } else if (signal === "sell" && holding) {
        const revenue = shares * price;
        const pnl = Math.round((price - entryPrice) * shares * 100) / 100;
        capital += revenue;
        trades.push({ date, action: "SELL", price: Math.round(price * 100) / 100, shares, pnl });
        shares = 0;
        holding = false;
        entryPrice = 0;
      }
      const portfolioValue = capital + shares * price;
      dailyReturns.push((portfolioValue - prevValue) / prevValue);
      prevValue = portfolioValue;
      if (portfolioValue > peakValue) peakValue = portfolioValue;
      const drawdown = (peakValue - portfolioValue) / peakValue;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    const finalPrice = closes[closes.length - 1];
    const finalValue = capital + shares * finalPrice;
    const totalReturn = Math.round(((finalValue - startCapital) / startCapital) * 10000) / 100;
    const sellTrades = trades.filter((t) => t.action === "SELL");
    const wins = sellTrades.filter((t) => t.pnl > 0).length;
    const winRate = sellTrades.length > 0 ? Math.round((wins / sellTrades.length) * 10000) / 100 : 0;
    const riskFreeRate = 0.05;
    const riskFreeDaily = Math.pow(1 + riskFreeRate, 1 / 252) - 1;
    const excessReturns = dailyReturns.map((r) => r - riskFreeDaily);
    const meanExcess = excessReturns.length > 0 ? excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length : 0;
    const variance = excessReturns.length > 0 ? excessReturns.reduce((a, b) => a + Math.pow(b - meanExcess, 2), 0) / excessReturns.length : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? Math.round((meanExcess / stdDev) * Math.sqrt(252) * 100) / 100 : 0;
    res.json({ trades, finalValue: Math.round(finalValue * 100) / 100, totalReturn, winRate, maxDrawdown: Math.round(maxDrawdown * 10000) / 100, sharpeRatio });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/correlation", (req, res) => {
  try {
    const { symbols: symbolsStr, period } = req.query;
    if (!symbolsStr) return res.status(400).json({ error: "symbols query parameter is required" });
    const symbols = symbolsStr.split(",").map((s) => s.trim().toUpperCase());
    const limit = parseInt(period) || 365;
    const returnSeries = {};
    for (const symbol of symbols) {
      const records = readCompanyCSV(symbol);
      if (!records) return res.status(404).json({ error: `Company ${symbol} not found` });
      let data = parseRecords(records).slice(-limit);
      const closes = data.map((d) => d.close);
      const returns = [];
      for (let i = 1; i < closes.length; i++) {
        returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
      }
      returnSeries[symbol] = returns;
    }
    const minLen = Math.min(...Object.values(returnSeries).map((r) => r.length));
    for (const s of symbols) {
      returnSeries[s] = returnSeries[s].slice(-minLen);
    }
    function pearson(x, y) {
      const n = x.length;
      if (n === 0) return 0;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
      const sumX2 = x.reduce((a, b) => a + b * b, 0);
      const sumY2 = y.reduce((a, b) => a + b * b, 0);
      const num = n * sumXY - sumX * sumY;
      const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      return den === 0 ? 0 : Math.round((num / den) * 100) / 100;
    }
    const matrix = {};
    for (const s1 of symbols) {
      matrix[s1] = {};
      for (const s2 of symbols) {
        matrix[s1][s2] = pearson(returnSeries[s1], returnSeries[s2]);
      }
    }
    res.json({ matrix, labels: symbols });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/alerts/check", (req, res) => {
  try {
    const { symbol, type, threshold } = req.body;
    if (!symbol || !type || threshold === undefined) return res.status(400).json({ error: "symbol, type, and threshold are required" });
    const records = readCompanyCSV(symbol.toUpperCase());
    if (!records) return res.status(404).json({ error: "Company not found" });
    const latest = records[records.length - 1];
    let currentValue = 0;
    let message = "";
    let triggered = false;
    const price = parseFloat(latest.close) || 0;
    const volume = parseInt(latest.traded_quantity) || 0;
    switch (type) {
      case "price_above":
        currentValue = price;
        triggered = price > parseFloat(threshold);
        message = triggered ? `${symbol} price ${price} is above threshold ${threshold}` : `${symbol} price ${price} is below threshold ${threshold}`;
        break;
      case "price_below":
        currentValue = price;
        triggered = price < parseFloat(threshold);
        message = triggered ? `${symbol} price ${price} is below threshold ${threshold}` : `${symbol} price ${price} is above threshold ${threshold}`;
        break;
      case "volume_above":
        currentValue = volume;
        triggered = volume > parseInt(threshold);
        message = triggered ? `${symbol} volume ${volume} is above threshold ${threshold}` : `${symbol} volume ${volume} is below threshold ${threshold}`;
        break;
      case "rsi_above": {
        const closes = records.map((r) => parseFloat(r.close)).filter((v) => !isNaN(v));
        const rsiValues = RSI(closes, 14);
        const latestRsi = rsiValues[rsiValues.length - 1];
        currentValue = latestRsi;
        triggered = latestRsi !== null && latestRsi > parseFloat(threshold);
        message = triggered ? `${symbol} RSI ${latestRsi} is above threshold ${threshold}` : `${symbol} RSI ${latestRsi} is below threshold ${threshold}`;
        break;
      }
      case "rsi_below": {
        const closes = records.map((r) => parseFloat(r.close)).filter((v) => !isNaN(v));
        const rsiValues = RSI(closes, 14);
        const latestRsi = rsiValues[rsiValues.length - 1];
        currentValue = latestRsi;
        triggered = latestRsi !== null && latestRsi < parseFloat(threshold);
        message = triggered ? `${symbol} RSI ${latestRsi} is below threshold ${threshold}` : `${symbol} RSI ${latestRsi} is above threshold ${threshold}`;
        break;
      }
      default:
        return res.status(400).json({ error: "Invalid alert type" });
    }
    res.json({ triggered, currentValue: Math.round(currentValue * 100) / 100, threshold: parseFloat(threshold), message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/predictions/:symbol", (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const records = readCompanyCSV(symbol);
    if (!records) return res.status(404).json({ error: "Company not found" });
    const data = parseRecords(records);
    const closes = data.map((d) => d.close);
    if (closes.length < 50) return res.status(400).json({ error: "Not enough data for prediction" });
    const sma20 = SMA(closes, 20);
    const ema12 = EMA(closes, 12);
    const currentPrice = closes[closes.length - 1];
    const smaPred = sma20[sma20.length - 1];
    const emaPred = ema12[ema12.length - 1];
    const recentReturns = [];
    for (let i = closes.length - 21; i < closes.length; i++) {
      recentReturns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
    const avgReturn = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
    const momentumPred = currentPrice * (1 + avgReturn);
    const volatility = Math.sqrt(recentReturns.reduce((a, r) => a + Math.pow(r - avgReturn, 2), 0) / recentReturns.length);
    const smaWeight = 0.35;
    const emaWeight = 0.3;
    const momentumWeight = 0.35;
    const predictedPrice = Math.round((smaWeight * smaPred + emaWeight * emaPred + momentumWeight * momentumPred) * 100) / 100;
    const direction = predictedPrice > currentPrice ? "up" : predictedPrice < currentPrice ? "down" : "flat";
    const diff = Math.abs(predictedPrice - currentPrice) / currentPrice;
    const confidence = Math.min(Math.round((1 - Math.min(diff / volatility, 1)) * 100), 95);
    res.json({
      symbol,
      currentPrice: Math.round(currentPrice * 100) / 100,
      predictedPrice,
      confidence,
      direction,
      factors: {
        sma: Math.round(smaPred * 100) / 100,
        ema: Math.round(emaPred * 100) / 100,
        momentum: Math.round(momentumPred * 100) / 100,
        volatility: Math.round(volatility * 10000) / 100,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/sentiment/:symbol", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const records = readCompanyCSV(symbol);
  if (!records) return res.status(404).json({ error: "Company not found" });
  res.json({ symbol, overall: "neutral", score: 50, platforms: [], trendingTopics: [], dailySentiment: [] });
});

app.get("/api/daily-scrape", rateLimit, (req, res) => {
  const { execFile } = require("child_process");
  const scriptPath = path.join(__dirname, "..", "src", "scraper.py");
  const timestamp = new Date().toISOString();
  broadcast({ type: "scrape_started", timestamp });
  execFile("python", [scriptPath, "daily"], { timeout: 120000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
    if (err) {
      console.error("Scraper error:", err.message);
      broadcast({ type: "scrape_error", timestamp: new Date().toISOString(), error: err.message });
      return res.status(500).json({ error: "Scraper failed", details: err.message });
    }
    let result;
    try {
      const lines = stdout.trim().split("\n");
      const jsonLine = lines.find((l) => l.startsWith("{"));
      result = jsonLine ? JSON.parse(jsonLine) : { raw: stdout };
    } catch {
      result = { raw: stdout };
    }
    broadcast({ type: "scrape_complete", timestamp: new Date().toISOString(), result });
    invalidateCache();
    res.json({ message: "Scrape completed", timestamp, result });
  });
});

app.get("/api/export/:symbol/csv", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const records = readCompanyCSV(symbol);
  if (!records) return res.status(404).json({ error: "Company not found" });
  const data = parseRecords(records);
  const header = "date,open,high,low,close,change,volume,turnover";
  const rows = data.map((r) => `${r.date},${r.open},${r.high},${r.low},${r.close},${r.change},${r.volume},${r.turnover}`);
  const csv = [header, ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${symbol}_data.csv"`);
  res.send(csv);
});

app.post("/api/screener", rateLimit, (req, res) => {
  try {
    const { filters = [], sort, limit = 50 } = req.body;
    const allData = getAllCompanyData();
    const results = [];

    for (const { symbol, records } of allData) {
      const data = parseRecords(records);
      if (data.length < 5) continue;
      const closes = data.map((r) => r.close);
      const highs = data.map((r) => r.high);
      const lows = data.map((r) => r.low);
      const volumes = data.map((r) => r.volume);
      const latest = data[data.length - 1];

      const sma20 = SMA(closes, 20);
      const sma50 = SMA(closes, 50);
      const ema12 = EMA(closes, 12);
      const ema26 = EMA(closes, 26);
      const rsi = RSI(closes, 14);
      const macd = MACD(closes, 12, 26, 9);
      const bb = BollingerBands(closes, 20, 2);
      const stoch = Stochastic(highs, lows, closes, 14);
      const mfi = MFI(highs, lows, closes, volumes, 14);
      const wr = WilliamsR(highs, lows, closes, 14);
      const adx = ADX(highs, lows, closes, 14);
      const cci = CCI(highs, lows, closes, 20);
      const atr = ATR(highs, lows, closes, 14);
      const obv = OBV(closes, volumes);
      const avgVol = SMA(volumes, 20);

      const n = data.length - 1;
      const prevClose = n > 0 ? data[n - 1].close : latest.close;
      const prevSma20 = sma20[n - 1] || sma20[n];
      const prevSma50 = sma50[n - 1] || sma50[n];
      const prevObv = n > 0 ? obv[n - 1] : 0;

      const company = {
        symbol,
        price: latest.close,
        open: latest.open,
        high: latest.high,
        low: latest.low,
        change: latest.change,
        volume: latest.volume,
        turnover: latest.turnover,
        date: latest.date,
        rsi_14: rsi[n],
        macd_line: macd.macdLine[n],
        macd_signal: macd.signalLine[n],
        macd_histogram: macd.histogram[n],
        sma_20: sma20[n],
        sma_50: sma50[n],
        ema_12: ema12[n],
        ema_26: ema26[n],
        bb_upper: bb.upper[n],
        bb_middle: bb.middle[n],
        bb_lower: bb.lower[n],
        bb_position: bb.upper[n] !== null && bb.lower[n] !== null && bb.upper[n] !== bb.lower[n]
          ? (latest.close - bb.lower[n]) / (bb.upper[n] - bb.lower[n]) : null,
        stoch_k: stoch.kLine[n],
        stoch_d: stoch.dLine[n],
        mfi_14: mfi[n],
        williams_r: wr[n],
        adx_14: adx[n],
        cci_20: cci[n],
        atr_14: atr[n],
        obv: obv[n],
        obv_trend: obv[n] > prevObv ? "up" : obv[n] < prevObv ? "down" : "flat",
        volume_ratio: avgVol[n] && avgVol[n] > 0 ? latest.volume / avgVol[n] : null,
        sma_20_above_sma_50: sma20[n] !== null && sma50[n] !== null ? sma20[n] > sma50[n] : null,
        sma_20_crossed_above_sma_50: sma20[n] !== null && sma50[n] !== null && prevSma20 !== null && prevSma50 !== null
          ? prevSma20 <= prevSma50 && sma20[n] > sma50[n] : false,
        ema_12_above_ema_26: ema12[n] !== null && ema26[n] !== null ? ema12[n] > ema26[n] : null,
        price_above_sma_20: sma20[n] !== null ? latest.close > sma20[n] : null,
        price_above_sma_50: sma50[n] !== null ? latest.close > sma50[n] : null,
      };

      let pass = true;
      for (const f of filters) {
        const val = company[f.field];
        if (val === undefined || val === null) { pass = false; break; }
        switch (f.op) {
          case "gt": if (!(val > f.value)) pass = false; break;
          case "gte": if (!(val >= f.value)) pass = false; break;
          case "lt": if (!(val < f.value)) pass = false; break;
          case "lte": if (!(val <= f.value)) pass = false; break;
          case "eq": if (val !== f.value) pass = false; break;
          case "neq": if (val === f.value) pass = false; break;
          case "between": if (val < f.value[0] || val > f.value[1]) pass = false; break;
          case "crosses_above": {
            const field = f.field;
            const pair = field.split("_crossed_above_");
            if (pair.length === 2) {
              const valA = company[pair[0]];
              const valB = company[pair[1]];
              if (valA === null || valA === undefined || valB === null || valB === undefined) {
                pass = false;
              } else {
                pass = valA > valB;
              }
            } else {
              pass = false;
            }
            break;
          }
        }
        if (!pass) break;
      }
      if (pass) results.push(company);
    }

    if (sort && sort.field) {
      const dir = sort.order === "asc" ? 1 : -1;
      results.sort((a, b) => {
        const va = a[sort.field] ?? -Infinity;
        const vb = b[sort.field] ?? -Infinity;
        return (va - vb) * dir;
      });
    }

    res.json({ results: results.slice(0, limit), total: results.length });
  } catch (err) {
    console.error("Screener error:", err);
    res.status(500).json({ error: "Screener computation failed" });
  }
});

app.get("/api/market-status", (req, res) => {
  res.json(getMarketStatus());
});

app.get("/api/debug/scrape", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Database not available" });
  try {
    await scrapeLatestPrices();
    const { data: latest } = await supabase
      .from("stock_prices")
      .select("symbol, published_date, close")
      .order("published_date", { ascending: false })
      .limit(5);
    res.json({ ok: true, latestRows: latest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/sectors/rotation", (req, res) => {
  try {
    const { period } = req.query;
    const days = parseInt(period) || 30;
    const allData = getAllCompanyData();
    const sectorMap = {};

    for (const { symbol, records } of allData) {
      const data = parseRecords(records);
      if (data.length < 2) continue;
      const sector = CATEGORY_MAP[symbol] || "Other";
      if (!sectorMap[sector]) sectorMap[sector] = { companies: [], totalVolume: 0, totalTurnover: 0 };
      const latest = data[data.length - 1];
      const lookback = Math.max(0, data.length - 1 - days);
      const periodStart = data[lookback];
      const periodReturn = periodStart.close > 0 ? ((latest.close - periodStart.close) / periodStart.close) * 100 : 0;

      const sma50 = SMA(data.map((r) => r.close), 50);
      const rsi14 = RSI(data.map((r) => r.close), 14);
      const n = data.length - 1;

      sectorMap[sector].companies.push({
        symbol,
        price: latest.close,
        change: latest.change,
        periodReturn: Math.round(periodReturn * 100) / 100,
        sma50: sma50[n],
        rsi: rsi14[n],
        aboveSMA50: sma50[n] !== null ? latest.close > sma50[n] : null,
      });
      sectorMap[sector].totalVolume += latest.volume;
      sectorMap[sector].totalTurnover += latest.turnover;
    }

    const sectors = Object.entries(sectorMap).map(([sector, info]) => {
      const avgReturn = info.companies.reduce((s, c) => s + c.periodReturn, 0) / info.companies.length;
      const avgChange = info.companies.reduce((s, c) => s + c.change, 0) / info.companies.length;
      const aboveSMA50Count = info.companies.filter((c) => c.aboveSMA50 === true).length;
      const momentum = avgReturn > 2 ? "strong" : avgReturn > 0 ? "weak" : avgReturn > -2 ? "weak_neg" : "strong_neg";
      return {
        sector,
        companyCount: info.companies.length,
        avgReturn: Math.round(avgReturn * 100) / 100,
        avgChange: Math.round(avgChange * 100) / 100,
        totalVolume: info.totalVolume,
        totalTurnover: info.totalTurnover,
        aboveSMA50Pct: Math.round((aboveSMA50Count / info.companies.length) * 100),
        momentum,
        companies: info.companies.sort((a, b) => b.periodReturn - a.periodReturn),
      };
    });

    sectors.sort((a, b) => b.avgReturn - a.avgReturn);
    sectors.forEach((s, i) => { s.rank = i + 1; });

    res.json({ period: days, sectors });
  } catch (err) {
    console.error("Sector rotation error:", err);
    res.status(500).json({ error: "Failed to compute sector rotation" });
  }
});

app.get("/api/patterns/:symbol", (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const records = readCompanyCSV(symbol);
    if (!records) return res.status(404).json({ error: "Company not found" });
    const data = parseRecords(records);
    if (data.length < 30) return res.json({ symbol, patterns: [] });

    const closes = data.map((r) => r.close);
    const highs = data.map((r) => r.high);
    const lows = data.map((r) => r.low);
    const patterns = [];

    const peaks = [];
    const troughs = [];
    for (let i = 2; i < data.length - 2; i++) {
      if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] && highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
        peaks.push({ idx: i, price: highs[i], date: data[i].date });
      }
      if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] && lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
        troughs.push({ idx: i, price: lows[i], date: data[i].date });
      }
    }

    if (peaks.length >= 2) {
      const last2 = peaks.slice(-2);
      const tolerance = last2[0].price * 0.03;
      if (Math.abs(last2[0].price - last2[1].price) < tolerance) {
        const neckline = troughs.filter((t) => t.idx > last2[0].idx && t.idx < last2[1].idx);
        if (neckline.length > 0) {
          const neckPrice = neckline.reduce((s, t) => s + t.price, 0) / neckline.length;
          const broken = closes[closes.length - 1] < neckPrice;
          patterns.push({
            type: "double_top",
            name: "Double Top",
            signal: broken ? "bearish" : "forming",
            confidence: broken ? 85 : 60,
            price: neckPrice,
            date: data[data.length - 1].date,
            detail: `Two peaks near Rs ${last2[0].price.toFixed(0)} with neckline at Rs ${neckPrice.toFixed(0)}${broken ? " - BROKEN" : ""}`,
          });
        }
      }
    }

    if (troughs.length >= 2) {
      const last2 = troughs.slice(-2);
      const tolerance = last2[0].price * 0.03;
      if (Math.abs(last2[0].price - last2[1].price) < tolerance) {
        const neckline = peaks.filter((p) => p.idx > last2[0].idx && p.idx < last2[1].idx);
        if (neckline.length > 0) {
          const neckPrice = neckline.reduce((s, p) => s + p.price, 0) / neckline.length;
          const broken = closes[closes.length - 1] > neckPrice;
          patterns.push({
            type: "double_bottom",
            name: "Double Bottom",
            signal: broken ? "bullish" : "forming",
            confidence: broken ? 85 : 60,
            price: neckPrice,
            date: data[data.length - 1].date,
            detail: `Two troughs near Rs ${last2[0].price.toFixed(0)} with neckline at Rs ${neckPrice.toFixed(0)}${broken ? " - BROKEN" : ""}`,
          });
        }
      }
    }

    if (peaks.length >= 3) {
      const last3 = peaks.slice(-3);
      const tolerance = last3[0].price * 0.03;
      const descending = last3[0].price > last3[1].price && last3[1].price > last3[2].price;
      const ascending = last3[0].price < last3[1].price && last3[1].price < last3[2].price;
      if (descending && Math.abs(last3[0].price - last3[2].price) / last3[0].price < 0.15) {
        const support = troughs.filter((t) => t.idx > last3[0].idx);
        if (support.length >= 2) {
          const supportPrice = Math.min(...support.map((s) => s.price));
          const broken = closes[closes.length - 1] < supportPrice;
          patterns.push({
            type: "descending_triangle",
            name: "Descending Triangle",
            signal: broken ? "bearish" : "forming",
            confidence: broken ? 80 : 55,
            price: supportPrice,
            date: data[data.length - 1].date,
            detail: `Lower highs with flat support at Rs ${supportPrice.toFixed(0)}${broken ? " - BROKEN" : ""}`,
          });
        }
      }
      if (ascending && Math.abs(last3[0].price - last3[2].price) / last3[0].price < 0.15) {
        const resistance = peaks.filter((p) => p.idx > last3[0].idx);
        if (resistance.length >= 1) {
          const resistPrice = Math.max(...resistance.map((r) => r.price));
          const broken = closes[closes.length - 1] > resistPrice;
          patterns.push({
            type: "ascending_triangle",
            name: "Ascending Triangle",
            signal: broken ? "bullish" : "forming",
            confidence: broken ? 80 : 55,
            price: resistPrice,
            date: data[data.length - 1].date,
            detail: `Higher lows with flat resistance at Rs ${resistPrice.toFixed(0)}${broken ? " - BROKEN" : ""}`,
          });
        }
      }
    }

    if (peaks.length >= 2 && troughs.length >= 2) {
      const recent = data.slice(-60);
      const recentHighs = recent.map((r) => r.high);
      const recentLows = recent.map((r) => r.low);
      const range = Math.max(...recentHighs) - Math.min(...recentLows);
      const midpoint = (Math.max(...recentHighs) + Math.min(...recentLows)) / 2;
      let converging = true;
      for (let i = 1; i < recentHighs.length; i++) {
        if (recentHighs[i] > recentHighs[i - 1] + range * 0.01) { converging = false; break; }
      }
      if (converging && range / midpoint < 0.1) {
        const direction = closes[closes.length - 1] > midpoint ? "bullish" : "bearish";
        patterns.push({
          type: "symmetrical_triangle",
          name: "Symmetrical Triangle",
          signal: "neutral",
          confidence: 50,
          price: midpoint,
          date: data[data.length - 1].date,
          detail: `Converging trendlines - breakout ${direction}ward possible`,
        });
      }
    }

    const sma20 = SMA(closes, 20);
    const sma50 = SMA(closes, 50);
    const n = data.length - 1;
    const n5 = Math.max(0, n - 5);
    if (sma20[n] !== null && sma50[n] !== null && sma20[n5] !== null && sma50[n5] !== null) {
      if (sma20[n5] <= sma50[n5] && sma20[n] > sma50[n]) {
        patterns.push({
          type: "golden_cross",
          name: "Golden Cross",
          signal: "bullish",
          confidence: 75,
          price: closes[n],
          date: data[n].date,
          detail: "SMA 20 crossed above SMA 50 - bullish trend reversal",
        });
      }
      if (sma20[n5] >= sma50[n5] && sma20[n] < sma50[n]) {
        patterns.push({
          type: "death_cross",
          name: "Death Cross",
          signal: "bearish",
          confidence: 75,
          price: closes[n],
          date: data[n].date,
          detail: "SMA 20 crossed below SMA 50 - bearish trend reversal",
        });
      }
    }

    res.json({ symbol, patterns });
  } catch (err) {
    console.error("Pattern recognition error:", err);
    res.status(500).json({ error: "Pattern recognition failed" });
  }
});

// ============ OPTIONS CHAIN DATA ============
const OPTIONS_EXPIRY_DATES = [
  "2026-07-30", "2026-08-27", "2026-09-30", "2026-10-29", "2026-11-26", "2026-12-31"
];

function generateOptionsChain(symbol) {
  const records = readCompanyCSV(symbol);
  if (!records || records.length === 0) return null;
  const latest = records[records.length - 1];
  const spotPrice = parseFloat(latest.close) || 0;
  const volatility = 0.25 + Math.random() * 0.15;
  const riskFreeRate = 0.08;
  const strikes = [];
  const step = Math.max(5, Math.round(spotPrice * 0.05 / 5) * 5);
  for (let i = -5; i <= 5; i++) {
    strikes.push(spotPrice + i * step);
  }
  const chain = strikes.map((strike) => {
    const moneyness = spotPrice / strike;
    const timeToExpiry = 30 / 365;
    const callIntrinsic = Math.max(0, spotPrice - strike);
    const putIntrinsic = Math.max(0, strike - spotPrice);
    const callTimeValue = spotPrice * volatility * Math.sqrt(timeToExpiry) * 0.4;
    const putTimeValue = strike * volatility * Math.sqrt(timeToExpiry) * 0.4;
    const callPrice = Math.round((callIntrinsic + callTimeValue) * 100) / 100;
    const putPrice = Math.round((putIntrinsic + putTimeValue) * 100) / 100;
    const callDelta = moneyness > 1 ? 0.6 + Math.random() * 0.3 : 0.2 + Math.random() * 0.3;
    const putDelta = -1 + callDelta;
    const gamma = Math.round((0.02 + Math.random() * 0.03) * 1000) / 1000;
    const theta = Math.round((-0.05 - Math.random() * 0.1) * 100) / 100;
    const vega = Math.round((0.1 + Math.random() * 0.2) * 100) / 100;
    const impliedVol = Math.round((volatility + (Math.random() - 0.5) * 0.1) * 10000) / 100;
    const callOIVolume = Math.floor(Math.random() * 5000) + 100;
    const putOIVolume = Math.floor(Math.random() * 5000) + 100;
    const callOI = Math.floor(Math.random() * 50000) + 1000;
    const putOI = Math.floor(Math.random() * 50000) + 1000;
    return {
      strike: Math.round(strike * 100) / 100,
      call: {
        price: callPrice,
        delta: Math.round(callDelta * 1000) / 1000,
        gamma, theta, vega,
        impliedVol,
        volume: callOIVolume,
        openInterest: callOI,
        bid: Math.round((callPrice - 0.5) * 100) / 100,
        ask: Math.round((callPrice + 0.5) * 100) / 100,
      },
      put: {
        price: putPrice,
        delta: Math.round(putDelta * 1000) / 1000,
        gamma, theta: Math.round(-theta * 100) / 100, vega,
        impliedVol,
        volume: putOIVolume,
        openInterest: putOI,
        bid: Math.round((putPrice - 0.5) * 100) / 100,
        ask: Math.round((putPrice + 0.5) * 100) / 100,
      },
    };
  });
  return { symbol, spotPrice, chain, strikes };
}

app.get("/api/options/:symbol", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  if (!CATEGORY_MAP[symbol]) return res.status(404).json({ error: "Company not found" });
  res.json({ symbol, spotPrice: null, chain: [], strikes: [], expiry: null, expiryDates: [], message: "Options market not available on NEPSE" });
});

// ============ MUTUAL FUND NAV TRACKING ============
function generateMFHistory(nav, days) {
  return [];
}

app.get("/api/mutual-funds", async (req, res) => {
  try {
    const funds = await dataProvider.getMutualFunds();
    const enriched = Array.isArray(funds) ? funds.map((f) => ({
      ...f,
      dayChange: f.dayChange ?? null,
      dayChangePct: f.dayChangePct ?? null,
      ytdReturn: f.ytdReturn ?? null,
      oneYearReturn: f.oneYearReturn ?? f.return ?? null,
    })) : [];
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/mutual-funds/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const funds = await dataProvider.getMutualFunds();
    const fund = Array.isArray(funds) ? funds.find((f) => f.symbol === symbol) : null;
    if (!fund) return res.status(404).json({ error: "Fund not found" });
    const history = fund.navHistory || generateMFHistory(fund.nav || 100, 365);
    res.json({ ...fund, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ DEBENTURE/BOND DATA ============
function generateBondHistory(faceValue, couponRate, days) {
  return [];
}

app.get("/api/debentures", async (req, res) => {
  try {
    const debentures = await dataProvider.getDebentures();
    const enriched = Array.isArray(debentures) ? debentures.map((d) => {
      const fv = d.faceValue || 1000;
      const cp = d.currentPrice ?? null;
      const cr = d.couponRate || d.coupon || 8.0;
      const ytm = cp ? ((cr * fv / cp) * 100) : null;
      return {
        ...d,
        currentPrice: cp,
        yieldToMaturity: d.ytm || (ytm ? Math.round(ytm * 100) / 100 : null),
        dayChange: d.dayChange ?? null,
        volume: d.volume ?? null,
      };
    }) : [];
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/debentures/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const debentures = await dataProvider.getDebentures();
    const debenture = Array.isArray(debentures) ? debentures.find((d) => d.symbol === symbol) : null;
    if (!debenture) return res.status(404).json({ error: "Debenture not found" });
    const history = debenture.history || generateBondHistory(debenture.faceValue || 1000, debenture.couponRate || debenture.coupon || 8.0, 365);
    res.json({ ...debenture, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ INSIDER TRADING ALERTS ============
app.get("/api/insider-trading", async (req, res) => {
  try {
    const { symbol, type, days } = req.query;
    let transactions = await dataProvider.getInsiderTrading();
    if (!Array.isArray(transactions)) transactions = [];
    if (symbol) transactions = transactions.filter((t) => t.symbol === symbol.toUpperCase());
    if (type) transactions = transactions.filter((t) => t.transactionType && t.transactionType.toLowerCase() === type.toLowerCase());
    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(days));
      transactions = transactions.filter((t) => new Date(t.date) >= cutoff);
    }
    const summary = {
      totalTransactions: transactions.length,
      totalBuyValue: transactions.filter((t) => t.transactionType === "Buy").reduce((s, t) => s + (t.totalValue || 0), 0),
      totalSellValue: transactions.filter((t) => t.transactionType === "Sell").reduce((s, t) => s + (t.totalValue || 0), 0),
      uniqueInsiders: new Set(transactions.map((t) => t.insiderName).filter(Boolean)).size,
      uniqueCompanies: new Set(transactions.map((t) => t.symbol).filter(Boolean)).size,
    };
    res.json({ transactions, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ EARNINGS CALENDAR ============
app.get("/api/earnings-calendar", async (req, res) => {
  try {
    const { upcoming, sector } = req.query;
    let calendar = await dataProvider.getEarningsCalendar();
    if (!Array.isArray(calendar)) calendar = [];
    if (upcoming === "true") {
      const today = new Date().toISOString().split("T")[0];
      calendar = calendar.filter((e) => e.announcementDate >= today);
    }
    if (sector) calendar = calendar.filter((e) => e.sector === sector);
    calendar.sort((a, b) => (a.announcementDate || "").localeCompare(b.announcementDate || ""));
    res.json(calendar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ FUNDAMENTAL DATA ============
let fundamentalsCache = null;

async function loadFundamentalsCache() {
  if (fundamentalsCache) return fundamentalsCache;
  try {
    fundamentalsCache = await dataProvider.getFundamentals();
  } catch (e) {
    fundamentalsCache = {};
  }
  return fundamentalsCache;
}

async function calculateFundamentals(symbol) {
  const records = readCompanyCSV(symbol);
  if (!records || records.length === 0) return null;
  const latest = records[records.length - 1];
  const close = parseFloat(latest.close) || 0;
  const category = CATEGORY_MAP[symbol] || "Other";
  const companyName = NAME_MAP[symbol] || symbol;
  const group = GROUP_MAP[symbol] || "Z";
  const shortCategory = SHORT_CATEGORY_MAP[category] || category;

  const allCloses = records.map((r) => parseFloat(r.close) || 0).filter((c) => c > 0);
  const fiftyTwoWeekHigh = allCloses.length > 0 ? Math.max(...allCloses) : null;
  const fiftyTwoWeekLow = allCloses.length > 0 ? Math.min(...allCloses) : null;

  const base = {
    symbol,
    companyName,
    category,
    shortCategory,
    group,
    latestClose: close,
    change: Math.round((parseFloat(latest.per_change) || 0) * 100) / 100,
    changePct: parseFloat(latest.per_change) || 0,
    latestDate: latest.published_date,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
  };

  const fundCache = await loadFundamentalsCache();
  const scraped = fundCache && fundCache[symbol];

  if (scraped && !scraped.error) {
    return {
      ...base,
      listedShares: scraped.listedShares || null,
      listedSharesFormatted: scraped.listedSharesFormatted || null,
      paidUpValue: scraped.paidUpValue || null,
      totalPaidUpValue: scraped.totalPaidUpValue || null,
      marketCap: scraped.marketCap || (close > 0 && scraped.listedShares ? close * scraped.listedShares : null),
      marketCapFormatted: scraped.marketCapFormatted || null,
      units: scraped.listedShares || null,
      unitsFormatted: scraped.listedSharesFormatted || null,
      float: scraped.float || null,
      floatFormatted: scraped.floatFormatted || null,
      floatCap: scraped.floatCap || null,
      floatCapFormatted: scraped.floatCapFormatted || null,
      pe: scraped.pe || null,
      pb: scraped.pb || null,
      eps: scraped.eps || null,
      roe: scraped.roe || null,
      roce: scraped.roce || null,
      dividendYield: scraped.dividendYield || null,
      debtToEquity: scraped.debtToEquity || null,
      bookValue: scraped.bookValue || null,
      beta: scraped.beta || null,
      bonusPct: scraped.bonusPct ?? null,
      cashDividendPct: scraped.cashDividendPct ?? null,
      bookClose: scraped.bookClose || null,
      dividendYear: scraped.dividendYear || null,
      ma5: scraped.ma5 || null,
      ma5Signal: scraped.ma5Signal || null,
      ma20: scraped.ma20 || null,
      ma20Signal: scraped.ma20Signal || null,
      ma180: scraped.ma180 || null,
      ma180Signal: scraped.ma180Signal || null,
      _dataSource: "scraped",
    };
  }

  return {
    ...base,
    pe: null,
    pb: null,
    eps: null,
    roe: null,
    roce: null,
    dividendYield: null,
    debtToEquity: null,
    bookValue: null,
    marketCap: null,
    marketCapFormatted: null,
    units: null,
    unitsFormatted: null,
    float: null,
    floatFormatted: null,
    floatCap: null,
    floatCapFormatted: null,
    beta: null,
    bonusPct: null,
    cashDividendPct: null,
    bookClose: null,
    _dataSource: "price_only",
  };
}

app.get("/api/fundamentals/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const fundamentals = await calculateFundamentals(symbol);
    if (!fundamentals) return res.status(404).json({ error: "Company not found" });
    res.json(fundamentals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/fundamentals", async (req, res) => {
  try {
    const { sort, sector } = req.query;
    const allData = getAllCompanyData();
    let results = [];
    for (const { symbol } of allData) {
      const fund = await calculateFundamentals(symbol);
      if (fund) {
        if (!sector || fund.category === sector) results.push(fund);
      }
    }
    if (sort) {
      const dir = sort.startsWith("-") ? -1 : 1;
      const field = sort.replace("-", "");
      results.sort((a, b) => ((a[field] ?? 0) - (b[field] ?? 0)) * dir);
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ ENHANCED WEBSOCKET ============
wss.on("connection", (ws, req) => {
  clients.add(ws);
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const symbols = url.searchParams.get("symbols");
  const subscribedSymbols = symbols ? symbols.split(",").map((s) => s.trim().toUpperCase()) : [];

  ws.send(JSON.stringify({ type: "connected", message: "Connected to NEPSE live feed", subscribedSymbols }));

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === "subscribe") {
        msg.symbols?.forEach((s) => subscribedSymbols.push(s.toUpperCase()));
        ws.send(JSON.stringify({ type: "subscribed", symbols: subscribedSymbols }));
      }
      if (msg.type === "unsubscribe") {
        const idx = subscribedSymbols.indexOf(msg.symbol?.toUpperCase());
        if (idx > -1) subscribedSymbols.splice(idx, 1);
        ws.send(JSON.stringify({ type: "unsubscribed", symbols: subscribedSymbols }));
      }
    } catch {}
  });

  ws.on("close", () => clients.delete(ws));
  ws.on("error", () => clients.delete(ws));
});

function broadcastPriceUpdate() {
  try {
    const all = getAllCompanyData();
    const sample = all
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)
      .map(({ symbol, records }) => {
        const latest = records[records.length - 1];
        const close = parseFloat(latest.close) || 0;
        let changePct = parseFloat(latest.per_change);
        if (!Number.isFinite(changePct)) changePct = 0;
        const change = close * changePct / 100;
        return {
          symbol,
          lastClose: close,
          price: close,
          change: Math.round(change * 100) / 100,
          changePct: Math.round(changePct * 100) / 100,
          volume: parseInt(latest.traded_quantity) || 0,
          time: latest.published_date || new Date().toISOString(),
        };
      });
    broadcast({ type: "price_update", data: sample });
  } catch {}
}

// ============ CUSTOM INDICATOR BUILDER ============
app.post("/api/indicators/custom", (req, res) => {
  try {
    const { symbol, indicators } = req.body;
    if (!symbol || !indicators || !Array.isArray(indicators)) {
      return res.status(400).json({ error: "symbol and indicators array required" });
    }
    const records = readCompanyCSV(symbol.toUpperCase());
    if (!records) return res.status(404).json({ error: "Company not found" });
    const data = parseRecords(records);
    const closes = data.map((r) => r.close);
    const highs = data.map((r) => r.high);
    const lows = data.map((r) => r.low);
    const volumes = data.map((r) => r.volume);
    const result = { symbol: symbol.toUpperCase(), data: [] };

    const calculated = {};
    for (const ind of indicators) {
      const key = `${ind.type}_${ind.period || ""}_${ind.field || "close"}`;
      switch (ind.type) {
        case "sma": {
          const period = ind.period || 20;
          const src = ind.field === "volume" ? volumes : ind.field === "high" ? highs : ind.field === "low" ? lows : closes;
          calculated[key] = SMA(src, period);
          break;
        }
        case "ema": {
          const period = ind.period || 12;
          const src = ind.field === "volume" ? volumes : ind.field === "high" ? highs : ind.field === "low" ? lows : closes;
          calculated[key] = EMA(src, period);
          break;
        }
        case "rsi": {
          calculated[key] = RSI(closes, ind.period || 14);
          break;
        }
        case "macd": {
          const macdData = MACD(closes, ind.fast || 12, ind.slow || 26, ind.signal || 9);
          calculated[key + "_line"] = macdData.macdLine;
          calculated[key + "_signal"] = macdData.signalLine;
          calculated[key + "_hist"] = macdData.histogram;
          break;
        }
        case "bollinger": {
          const bb = BollingerBands(closes, ind.period || 20, ind.multiplier || 2);
          calculated[key + "_upper"] = bb.upper;
          calculated[key + "_middle"] = bb.middle;
          calculated[key + "_lower"] = bb.lower;
          break;
        }
        case "stochastic": {
          const stoch = Stochastic(highs, lows, closes, ind.period || 14);
          calculated[key + "_k"] = stoch.kLine;
          calculated[key + "_d"] = stoch.dLine;
          break;
        }
        case "atr": {
          calculated[key] = ATR(highs, lows, closes, ind.period || 14);
          break;
        }
        case "obv": {
          calculated[key] = OBV(closes, volumes);
          break;
        }
        case "cci": {
          calculated[key] = CCI(highs, lows, closes, ind.period || 20);
          break;
        }
        case "adx": {
          calculated[key] = ADX(highs, lows, closes, ind.period || 14);
          break;
        }
        case "mfi": {
          calculated[key] = MFI(highs, lows, closes, volumes, ind.period || 14);
          break;
        }
        case "williams_r": {
          calculated[key] = WilliamsR(highs, lows, closes, ind.period || 14);
          break;
        }
        case "vwma": {
          const period = ind.period || 20;
          const resultArr = [];
          for (let i = 0; i < closes.length; i++) {
            if (i < period - 1) { resultArr.push(null); continue; }
            let sumPV = 0, sumV = 0;
            for (let j = i - period + 1; j <= i; j++) {
              sumPV += closes[j] * volumes[j];
              sumV += volumes[j];
            }
            resultArr.push(sumV > 0 ? Math.round((sumPV / sumV) * 100) / 100 : null);
          }
          calculated[key] = resultArr;
          break;
        }
        case "ichimoku": {
          const tenkan = [];
          const kijun = [];
          const senkouA = [];
          const senkouB = [];
          for (let i = 0; i < closes.length; i++) {
            if (i < 8) { tenkan.push(null); kijun.push(null); senkouA.push(null); senkouB.push(null); continue; }
            let high9 = -Infinity, low9 = Infinity;
            for (let j = i - 8; j <= i; j++) { if (highs[j] > high9) high9 = highs[j]; if (lows[j] < low9) low9 = lows[j]; }
            tenkan.push(Math.round(((high9 + low9) / 2) * 100) / 100);
            if (i >= 25) {
              let high26 = -Infinity, low26 = Infinity;
              for (let j = i - 25; j <= i; j++) { if (highs[j] > high26) high26 = highs[j]; if (lows[j] < low26) low26 = lows[j]; }
              kijun.push(Math.round(((high26 + low26) / 2) * 100) / 100);
              senkouA.push(Math.round(((tenkan[tenkan.length - 1] + kijun[kijun.length - 1]) / 2) * 100) / 100);
            } else { kijun.push(null); senkouA.push(null); }
            if (i >= 51) {
              let high52 = -Infinity, low52 = Infinity;
              for (let j = i - 51; j <= i; j++) { if (highs[j] > high52) high52 = highs[j]; if (lows[j] < low52) low52 = lows[j]; }
              senkouB.push(Math.round(((high52 + low52) / 2) * 100) / 100);
            } else { senkouB.push(null); }
          }
          calculated[key + "_tenkan"] = tenkan;
          calculated[key + "_kijun"] = kijun;
          calculated[key + "_senkou_a"] = senkouA;
          calculated[key + "_senkou_b"] = senkouB;
          break;
        }
      }
    }

    for (let i = 0; i < data.length; i++) {
      const point = { date: data[i].date, close: closes[i], high: highs[i], low: lows[i], volume: volumes[i] };
      for (const k of Object.keys(calculated)) {
        point[k] = calculated[k][i] !== null && calculated[k][i] !== undefined
          ? Math.round(calculated[k][i] * 100) / 100 : null;
      }
      result.data.push(point);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ FIBONACCI RETRACEMENT ============
app.get("/api/fibonacci/:symbol", (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const { period } = req.query;
    const records = readCompanyCSV(symbol);
    if (!records) return res.status(404).json({ error: "Company not found" });
    let data = parseRecords(records);
    const days = parseInt(period) || 180;
    data = data.slice(-days);
    if (data.length < 10) return res.status(400).json({ error: "Not enough data" });

    let high = -Infinity, low = Infinity, highIdx = 0, lowIdx = 0;
    data.forEach((d, i) => {
      if (d.high > high) { high = d.high; highIdx = i; }
      if (d.low < low) { low = d.low; lowIdx = i; }
    });

    const range = high - low;
    const isUptrend = highIdx > lowIdx;
    const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const fibNames = ["0%", "23.6%", "38.2%", "50%", "61.8%", "78.6%", "100%"];
    const levels = fibLevels.map((ratio, i) => {
      const price = isUptrend ? high - range * ratio : low + range * ratio;
      const proximity = data.slice(-10).some((d) => Math.abs(d.close - price) < price * 0.01);
      return {
        level: fibNames[i],
        ratio,
        price: Math.round(price * 100) / 100,
        type: ratio === 0.382 || ratio === 0.618 ? "strong" : ratio === 0.5 ? "medium" : "normal",
        isNear: proximity,
      };
    });

    const supportLevels = levels.filter((l) => l.ratio >= 0.382 && l.ratio <= 0.786);
    const resistanceLevels = levels.filter((l) => l.ratio <= 0.382);

    res.json({
      symbol, period: days, trend: isUptrend ? "uptrend" : "downtrend",
      swingHigh: { price: high, date: data[highIdx].date, index: highIdx },
      swingLow: { price: low, date: data[lowIdx].date, index: lowIdx },
      range: Math.round(range * 100) / 100,
      levels, supportLevels, resistanceLevels,
      currentPrice: data[data.length - 1].close,
      analysis: {
        pricePosition: ((data[data.length - 1].close - low) / range * 100).toFixed(1) + "%",
        nearestSupport: supportLevels.length > 0 ? supportLevels.reduce((prev, curr) =>
          Math.abs(curr.price - data[data.length - 1].close) < Math.abs(prev.price - data[data.length - 1].close) ? curr : prev
        ) : null,
        nearestResistance: resistanceLevels.length > 0 ? resistanceLevels.reduce((prev, curr) =>
          Math.abs(curr.price - data[data.length - 1].close) < Math.abs(prev.price - data[data.length - 1].close) ? curr : prev
        ) : null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ VOLUME PROFILE ============
app.get("/api/volume-profile/:symbol", (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const { period, bins } = req.query;
    const records = readCompanyCSV(symbol);
    if (!records) return res.status(404).json({ error: "Company not found" });
    let data = parseRecords(records);
    const days = parseInt(period) || 60;
    data = data.slice(-days);
    if (data.length < 5) return res.status(400).json({ error: "Not enough data" });

    const numBins = Math.max(1, parseInt(bins) || 20);
    let minPrice = Infinity, maxPrice = -Infinity;
    data.forEach((d) => {
      if (d.low < minPrice) minPrice = d.low;
      if (d.high > maxPrice) maxPrice = d.high;
    });
    if (minPrice === maxPrice) {
      minPrice = minPrice * 0.99;
      maxPrice = maxPrice * 1.01;
    }
    const binSize = (maxPrice - minPrice) / numBins;
    const profile = [];
    for (let i = 0; i < numBins; i++) {
      const priceLow = minPrice + i * binSize;
      const priceHigh = priceLow + binSize;
      const priceMid = (priceLow + priceHigh) / 2;
      let totalVolume = 0;
      let buyVolume = 0;
      let sellVolume = 0;
      let touchCount = 0;
      data.forEach((d) => {
        if (d.low <= priceHigh && d.high >= priceLow) {
          touchCount++;
          totalVolume += d.volume;
          if (d.close >= d.open) buyVolume += d.volume;
          else sellVolume += d.volume;
        }
      });
      profile.push({
        priceLow: Math.round(priceLow * 100) / 100,
        priceHigh: Math.round(priceHigh * 100) / 100,
        priceMid: Math.round(priceMid * 100) / 100,
        totalVolume,
        buyVolume,
        sellVolume,
        touchCount,
        buyPct: totalVolume > 0 ? Math.round((buyVolume / totalVolume) * 100) : 50,
      });
    }

    const maxVol = profile.length > 0 ? Math.max(...profile.map((p) => p.totalVolume)) : 0;
    const poc = profile.length > 0 ? profile.reduce((prev, curr) => curr.totalVolume > prev.totalVolume ? curr : prev) : null;
    const valueArea = [...profile].sort((a, b) => b.totalVolume - a.totalVolume).slice(0, Math.ceil(numBins * 0.7));
    const vaHigh = valueArea.length > 0 ? Math.max(...valueArea.map((v) => v.priceHigh)) : 0;
    const vaLow = valueArea.length > 0 ? Math.min(...valueArea.map((v) => v.priceLow)) : 0;

    res.json({
      symbol, period: days, numBins,
      profile: profile.map((p) => ({ ...p, normalized: maxVol > 0 ? Math.round((p.totalVolume / maxVol) * 100) : 0 })),
      poc: poc ? { price: poc.priceMid, volume: poc.totalVolume } : null,
      valueArea: { high: Math.round(vaHigh * 100) / 100, low: Math.round(vaLow * 100) / 100 },
      currentPrice: data[data.length - 1].close,
      summary: {
        totalVolume: data.reduce((s, d) => s + d.volume, 0),
        avgDailyVolume: Math.round(data.reduce((s, d) => s + d.volume, 0) / data.length),
        buyPressure: Math.round(profile.reduce((s, p) => s + p.buyVolume, 0) / Math.max(1, profile.reduce((s, p) => s + p.totalVolume, 0)) * 100),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ MARKET BREADTH INDICATORS ============
app.get("/api/breadth", (req, res) => {
  try {
    const allData = getAllCompanyData();
    const latestDateMap = {};
    for (const { symbol, records } of allData) {
      if (!records || records.length === 0) continue;
      const latest = records[records.length - 1];
      const prev = records.length > 1 ? records[records.length - 2] : null;
      const date = latest.published_date;
      if (!latestDateMap[date]) latestDateMap[date] = [];
      latestDateMap[date].push({
        symbol,
        close: parseFloat(latest.close) || 0,
        prevClose: prev ? parseFloat(prev.close) || 0 : 0,
        volume: parseInt(latest.traded_quantity) || 0,
        change: parseFloat(latest.per_change) || 0,
      });
    }

    const dates = Object.keys(latestDateMap).sort().slice(-60);
    const adLine = [];
    const trinData = [];
    const breadthHistory = [];
    let cumulativeAD = 0;

    for (const date of dates) {
      const dayData = latestDateMap[date];
      const advances = dayData.filter((d) => d.close > d.prevClose).length;
      const declines = dayData.filter((d) => d.close < d.prevClose).length;
      const unchanged = dayData.filter((d) => d.close === d.prevClose).length;
      cumulativeAD += advances - declines;
      const advVolume = dayData.filter((d) => d.close > d.prevClose).reduce((s, d) => s + d.volume, 0);
      const decVolume = dayData.filter((d) => d.close < d.prevClose).reduce((s, d) => s + d.volume, 0);
      const avgAdvVol = advances > 0 ? advVolume / advances : 0;
      const avgDecVol = declines > 0 ? decVolume / declines : 0;
      const trin = avgDecVol > 0 ? (advances / Math.max(declines, 1)) / (avgAdvVol / Math.max(avgDecVol, 1)) : 1;

      adLine.push({ date, value: cumulativeAD, advances, declines, unchanged });
      trinData.push({ date, value: Math.round(trin * 1000) / 1000, signal: trin < 1 ? "bullish" : trin > 1.5 ? "bearish" : "neutral" });
      breadthHistory.push({
        date, advances, declines, unchanged,
        advVolume, decVolume,
        adLine: cumulativeAD,
        trin: Math.round(trin * 1000) / 1000,
        advanceRatio: dayData.length > 0 ? Math.round((advances / dayData.length) * 100) : 0,
      });
    }

    const latestDay = breadthHistory[breadthHistory.length - 1] || {};

    // Calculate real volatility from recent market returns
    const recentReturns = [];
    for (const { records } of allData) {
      if (records.length < 5) continue;
      const closes = records.slice(-5).map((r) => parseFloat(r.close) || 0).filter((c) => c > 0);
      if (closes.length >= 2) {
        for (let i = 1; i < closes.length; i++) {
          recentReturns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
        }
      }
    }
    let vix = 0;
    if (recentReturns.length > 1) {
      const mean = recentReturns.reduce((s, r) => s + r, 0) / recentReturns.length;
      const variance = recentReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / recentReturns.length;
      vix = Math.round(Math.sqrt(variance) * 100 * 100) / 100;
    }

    res.json({
      current: {
        advances: latestDay.advances || 0,
        declines: latestDay.declines || 0,
        unchanged: latestDay.unchanged || 0,
        adLine: latestDay.adLine || 0,
        trin: latestDay.trin || 1,
        vix,
        advanceRatio: latestDay.advanceRatio || 50,
        breadthMomentum: (latestDay.advances || 0) > (latestDay.declines || 0) ? "bullish" : "bearish",
      },
      adLine, trin: trinData, history: breadthHistory,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ MULTI-TIMEFRAME ANALYSIS ============
app.get("/api/timeframes/:symbol", (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const records = readCompanyCSV(symbol);
    if (!records) return res.status(404).json({ error: "Company not found" });
    const allData = parseRecords(records);

    function aggregate(data, period) {
      const result = [];
      for (let i = 0; i < data.length; i += period) {
        const chunk = data.slice(i, i + period);
        if (chunk.length === 0) continue;
        result.push({
          date: chunk[chunk.length - 1].date,
          open: chunk[0].open,
          high: Math.max(...chunk.map((d) => d.high)),
          low: Math.min(...chunk.map((d) => d.low)),
          close: chunk[chunk.length - 1].close,
          volume: chunk.reduce((s, d) => s + d.volume, 0),
        });
      }
      return result;
    }

    function analyzeTimeframe(data, label) {
      if (data.length < 50) return { timeframe: label, error: "Insufficient data" };
      const closes = data.map((d) => d.close);
      const sma20 = SMA(closes, 20);
      const sma50 = SMA(closes, 50);
      const ema12 = EMA(closes, 12);
      const rsi14 = RSI(closes, 14);
      const macdData = MACD(closes, 12, 26, 9);
      const n = closes.length - 1;
      const n5 = Math.max(0, n - 5);
      const trend = sma20[n] > sma50[n] ? "bullish" : "bearish";
      const momentum = rsi14[n] > 70 ? "overbought" : rsi14[n] < 30 ? "oversold" : "neutral";
      const macdSignal = macdData.histogram[n] > 0 ? "bullish" : "bearish";
      const smaCross = sma20[n5] <= sma50[n5] && sma20[n] > sma50[n] ? "golden_cross"
        : sma20[n5] >= sma50[n5] && sma20[n] < sma50[n] ? "death_cross" : "none";

      return {
        timeframe: label,
        price: closes[n],
        sma20: sma20[n] ? Math.round(sma20[n] * 100) / 100 : null,
        sma50: sma50[n] ? Math.round(sma50[n] * 100) / 100 : null,
        ema12: ema12[n] ? Math.round(ema12[n] * 100) / 100 : null,
        rsi: rsi14[n] ? Math.round(rsi14[n] * 100) / 100 : null,
        macd: macdData.macdLine[n] ? Math.round(macdData.macdLine[n] * 100) / 100 : null,
        macdSignal: macdData.signalLine[n] ? Math.round(macdData.signalLine[n] * 100) / 100 : null,
        trend, momentum, macdSignal, smaCross,
        signals: [trend, momentum, macdSignal].filter((s) => s === "bullish" || s === "bearish"),
        bullishCount: [trend, momentum, macdSignal].filter((s) => s === "bullish").length,
        bearishCount: [trend, momentum, macdSignal].filter((s) => s === "bearish").length,
      };
    }

    const daily = analyzeTimeframe(allData.slice(-60), "Daily");
    const weekly = analyzeTimeframe(aggregate(allData, 5), "Weekly");
    const monthly = analyzeTimeframe(aggregate(allData, 20), "Monthly");
    const quarterly = analyzeTimeframe(aggregate(allData, 60), "Quarterly");

    const timeframes = [daily, weekly, monthly, quarterly];
    const overallBullish = timeframes.filter((t) => !t.error && (t.bullishCount || 0) > (t.bearishCount || 0)).length;
    const overall = overallBullish > 2 ? "bullish" : overallBullish < 2 ? "bearish" : "neutral";

    res.json({ symbol, timeframes, overall, alignment: overallBullish + "/4 timeframes bullish" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CHART PATTERNS LIBRARY ============
app.get("/api/patterns/advanced/:symbol", (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const { period } = req.query;
    const records = readCompanyCSV(symbol);
    if (!records) return res.status(404).json({ error: "Company not found" });
    let data = parseRecords(records);
    const days = parseInt(period) || 200;
    data = data.slice(-days);
    if (data.length < 30) return res.json({ symbol, patterns: [] });

    const closes = data.map((r) => r.close);
    const highs = data.map((r) => r.high);
    const lows = data.map((r) => r.low);
    const volumes = data.map((r) => r.volume);
    const patterns = [];

    // Head and Shoulders
    const peaks = [];
    const troughs = [];
    for (let i = 2; i < data.length - 2; i++) {
      if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] && highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
        peaks.push({ idx: i, price: highs[i], date: data[i].date });
      }
      if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] && lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
        troughs.push({ idx: i, price: lows[i], date: data[i].date });
      }
    }

    if (peaks.length >= 3) {
      const last3 = peaks.slice(-3);
      const headIdx = last3[1].price > last3[0].price && last3[1].price > last3[2].price ? 1
        : last3[0].price > last3[1].price && last3[0].price > last3[2].price ? 0 : -1;
      if (headIdx >= 0) {
        const head = last3[headIdx];
        const leftShoulder = last3[headIdx === 1 ? 0 : headIdx === 2 ? 1 : -1];
        const rightShoulder = last3[headIdx === 1 ? 2 : headIdx === 0 ? 1 : -1];
        if (leftShoulder && rightShoulder) {
          const tolerance = head.price * 0.03;
          if (Math.abs(leftShoulder.price - rightShoulder.price) < tolerance && head.price > leftShoulder.price * 1.02) {
            const neckline = troughs.filter((t) => t.idx > leftShoulder.idx && t.idx < rightShoulder.idx);
            if (neckline.length > 0) {
              const neckPrice = neckline.reduce((s, t) => s + t.price, 0) / neckline.length;
              const broken = closes[closes.length - 1] < neckPrice;
              patterns.push({
                type: "head_and_shoulders", name: "Head and Shoulders",
                signal: broken ? "bearish" : "forming", confidence: broken ? 88 : 65,
                price: Math.round(neckPrice * 100) / 100, date: data[data.length - 1].date,
                detail: `Head at Rs ${head.price.toFixed(0)}, neckline Rs ${neckPrice.toFixed(0)}${broken ? " - CONFIRMED" : ""}`,
              });
            }
          }
        }
      }
    }

    // Inverse Head and Shoulders
    if (troughs.length >= 3) {
      const last3 = troughs.slice(-3);
      const headIdx = last3[1].price < last3[0].price && last3[1].price < last3[2].price ? 1
        : last3[0].price < last3[1].price && last3[0].price < last3[2].price ? 0 : -1;
      if (headIdx >= 0) {
        const head = last3[headIdx];
        const leftShoulder = last3[headIdx === 1 ? 0 : headIdx === 2 ? 1 : -1];
        const rightShoulder = last3[headIdx === 1 ? 2 : headIdx === 0 ? 1 : -1];
        if (leftShoulder && rightShoulder) {
          const tolerance = head.price * 0.03;
          if (Math.abs(leftShoulder.price - rightShoulder.price) < tolerance && head.price < leftShoulder.price * 0.98) {
            const neckline = peaks.filter((p) => p.idx > leftShoulder.idx && p.idx < rightShoulder.idx);
            if (neckline.length > 0) {
              const neckPrice = neckline.reduce((s, p) => s + p.price, 0) / neckline.length;
              const broken = closes[closes.length - 1] > neckPrice;
              patterns.push({
                type: "inverse_head_shoulders", name: "Inverse Head & Shoulders",
                signal: broken ? "bullish" : "forming", confidence: broken ? 88 : 65,
                price: Math.round(neckPrice * 100) / 100, date: data[data.length - 1].date,
                detail: `Head at Rs ${head.price.toFixed(0)}, neckline Rs ${neckPrice.toFixed(0)}${broken ? " - CONFIRMED" : ""}`,
              });
            }
          }
        }
      }
    }

    // Cup and Handle
    if (troughs.length >= 3 && peaks.length >= 2) {
      const recentTroughs = troughs.slice(-4);
      if (recentTroughs.length >= 3) {
        const cupLow = Math.min(...recentTroughs.map((t) => t.price));
        const cupStart = recentTroughs[0].price;
        const cupEnd = recentTroughs[recentTroughs.length - 1].price;
        const rimTolerance = cupStart * 0.05;
        if (Math.abs(cupStart - cupEnd) < rimTolerance && cupLow < cupStart * 0.85) {
          const handle = data.slice(-10);
          const handleHigh = Math.max(...handle.map((d) => d.high));
          const handleLow = Math.min(...handle.map((d) => d.low));
          if (handleHigh < cupStart * 1.02 && (handleHigh - handleLow) / handleHigh < 0.05) {
            patterns.push({
              type: "cup_and_handle", name: "Cup and Handle",
              signal: "bullish", confidence: 75,
              price: Math.round(cupStart * 100) / 100, date: data[data.length - 1].date,
              detail: `Cup bottom Rs ${cupLow.toFixed(0)}, rim Rs ${cupStart.toFixed(0)}`,
            });
          }
        }
      }
    }

    // Rounding Bottom
    if (troughs.length >= 4) {
      const recentTroughs = troughs.slice(-5);
      const prices = recentTroughs.map((t) => t.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const range = max - min;
      const isRounded = prices.every((p) => p < min + range * 0.7);
      if (isRounded && range / min > 0.05) {
        patterns.push({
          type: "rounding_bottom", name: "Rounding Bottom",
          signal: "bullish", confidence: 65,
          price: Math.round(max * 100) / 100, date: data[data.length - 1].date,
          detail: `Rounding from Rs ${min.toFixed(0)} to Rs ${max.toFixed(0)}`,
        });
      }
    }

    // Wedges (Rising/Falling)
    if (peaks.length >= 3 && troughs.length >= 3) {
      const recentPeaks = peaks.slice(-3);
      const recentTroughs = troughs.slice(-3);
      const peakSlope = (recentPeaks[2].price - recentPeaks[0].price) / (recentPeaks[2].idx - recentPeaks[0].idx);
      const troughSlope = (recentTroughs[2].price - recentTroughs[0].price) / (recentTroughs[2].idx - recentTroughs[0].idx);
      if (peakSlope > 0 && troughSlope > 0 && peakSlope < troughSlope) {
        patterns.push({
          type: "rising_wedge", name: "Rising Wedge",
          signal: "bearish", confidence: 70,
          price: closes[closes.length - 1], date: data[data.length - 1].date,
          detail: "Converging upward trendlines - bearish reversal pattern",
        });
      }
      if (peakSlope < 0 && troughSlope < 0 && Math.abs(peakSlope) > Math.abs(troughSlope)) {
        patterns.push({
          type: "falling_wedge", name: "Falling Wedge",
          signal: "bullish", confidence: 70,
          price: closes[closes.length - 1], date: data[data.length - 1].date,
          detail: "Converging downward trendlines - bullish reversal pattern",
        });
      }
    }

    // Channel Detection
    if (peaks.length >= 2 && troughs.length >= 2) {
      const recentPeaks = peaks.slice(-2);
      const recentTroughs = troughs.slice(-2);
      const peakDiff = Math.abs(recentPeaks[1].price - recentPeaks[0].price);
      const troughDiff = Math.abs(recentTroughs[1].price - recentTroughs[0].price);
      const tolerance = closes[closes.length - 1] * 0.02;
      if (peakDiff < tolerance && troughDiff < tolerance) {
        const upperChannel = Math.max(recentPeaks[0].price, recentPeaks[1].price);
        const lowerChannel = Math.min(recentTroughs[0].price, recentTroughs[1].price);
        const midChannel = (upperChannel + lowerChannel) / 2;
        const pricePos = (closes[closes.length - 1] - lowerChannel) / (upperChannel - lowerChannel);
        patterns.push({
          type: "channel", name: "Trading Channel",
          signal: pricePos > 0.8 ? "bearish" : pricePos < 0.2 ? "bullish" : "neutral",
          confidence: 60,
          price: Math.round(midChannel * 100) / 100, date: data[data.length - 1].date,
          detail: `Channel Rs ${lowerChannel.toFixed(0)} - Rs ${upperChannel.toFixed(0)}, price at ${(pricePos * 100).toFixed(0)}%`,
        });
      }
    }

    // Flag/Pennant
    if (closes.length >= 20) {
      const recent10 = closes.slice(-10);
      const prev10 = closes.slice(-20, -10);
      const recentRange = Math.max(...recent10) - Math.min(...recent10);
      const prevRange = Math.max(...prev10) - Math.min(...prev10);
      if (recentRange < prevRange * 0.4 && recentRange > 0) {
        const prevTrend = prev10[prev10.length - 1] > prev10[0] ? "up" : "down";
        patterns.push({
          type: prevTrend === "up" ? "bull_flag" : "bear_flag",
          name: prevTrend === "up" ? "Bull Flag" : "Bear Flag",
          signal: prevTrend === "up" ? "bullish" : "bearish",
          confidence: 65,
          price: closes[closes.length - 1], date: data[data.length - 1].date,
          detail: `${prevTrend === "up" ? "Bullish" : "Bearish"} continuation pattern`,
        });
      }
    }

    // Triple Top/Bottom
    if (peaks.length >= 3) {
      const last3 = peaks.slice(-3);
      const tolerance = last3[0].price * 0.02;
      if (Math.abs(last3[0].price - last3[1].price) < tolerance && Math.abs(last3[1].price - last3[2].price) < tolerance) {
        patterns.push({
          type: "triple_top", name: "Triple Top",
          signal: "bearish", confidence: 80,
          price: Math.round(last3[0].price * 100) / 100, date: data[data.length - 1].date,
          detail: `Three peaks at Rs ${last3[0].price.toFixed(0)} - strong resistance`,
        });
      }
    }
    if (troughs.length >= 3) {
      const last3 = troughs.slice(-3);
      const tolerance = last3[0].price * 0.02;
      if (Math.abs(last3[0].price - last3[1].price) < tolerance && Math.abs(last3[1].price - last3[2].price) < tolerance) {
        patterns.push({
          type: "triple_bottom", name: "Triple Bottom",
          signal: "bullish", confidence: 80,
          price: Math.round(last3[0].price * 100) / 100, date: data[data.length - 1].date,
          detail: `Three troughs at Rs ${last3[0].price.toFixed(0)} - strong support`,
        });
      }
    }

    res.json({ symbol, period: days, patternCount: patterns.length, patterns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function scheduleAutoScrape() {
  const { execFile } = require("child_process");
  const now = new Date();
  const nepalTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
  const hours = nepalTime.getHours();
  const minutes = nepalTime.getMinutes();
  const dayOfWeek = nepalTime.getDay();
  const timeMinutes = hours * 60 + minutes;

  if (dayOfWeek !== 0 && dayOfWeek !== 6 && timeMinutes >= 901 && timeMinutes <= 960) {
    const lastScrapeFile = path.join(__dirname, "..", "data", ".last_scrape");
    let lastScrape = "";
    try { lastScrape = fs.readFileSync(lastScrapeFile, "utf-8").trim(); } catch {}
    const todayStr = nepalTime.toISOString().split("T")[0];
    if (lastScrape !== todayStr) {
      console.log(`Auto-scraping daily data at ${nepalTime.toLocaleTimeString()} NPT...`);
      const scriptPath = path.join(__dirname, "..", "src", "scraper.py");
      execFile("python", [scriptPath, "daily"], { timeout: 120000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
        if (err) {
          console.error("Auto-scrape error:", err.message);
        } else {
          try {
            fs.writeFileSync(lastScrapeFile, todayStr);
            invalidateCache();
            console.log("Auto-scrape complete");
          } catch {}
        }
      });
    }
  }

  const msUntilNext = Math.max(0, (961 - timeMinutes) * 60 * 1000);
  const checkInterval = Math.min(msUntilNext || 5 * 60 * 1000, 5 * 60 * 1000);
  setTimeout(scheduleAutoScrape, checkInterval);
}
scheduleAutoScrape();

// ═══════════════════════════════════════════════════════════
// TRADING FEATURES
// ═══════════════════════════════════════════════════════════

// --- Paper Trading Simulator (Supabase-backed) ---
async function getPaperAccount() {
  if (!supabase) return { balance: 1000000, initial_balance: 1000000 };
  const { data } = await supabase.from("paper_account").select("*").limit(1).single();
  return data || { balance: 1000000, initial_balance: 1000000 };
}

function getPaperPrice(symbol) {
  const csvData = readCompanyCSV(symbol);
  if (csvData && csvData.length > 0) {
    const last = csvData[csvData.length - 1];
    const price = parseFloat(last.close);
    return Number.isFinite(price) && price > 0 ? price : null;
  }
  return null;
}

const paperTradeLocks = new Map();
async function withPaperTradeLock(fn) {
  while (paperTradeLocks.get("_global")) await new Promise((r) => setTimeout(r, 5));
  paperTradeLocks.set("_global", true);
  try { return await fn(); } finally { paperTradeLocks.delete("_global"); }
}

app.post("/api/paper-trading/order", async (req, res) => {
  const { symbol, type, quantity } = req.body;
  if (!symbol || !type || !quantity || quantity <= 0) {
    return res.status(400).json({ error: "symbol, type (buy/sell), quantity required" });
  }
  const sym = symbol.toUpperCase();
  const price = getPaperPrice(sym);
  if (price === null || price <= 0) {
    return res.status(400).json({ error: "Price data unavailable for " + sym + ". Cannot execute trade." });
  }
  const totalCost = price * quantity;

  if (!supabase) return res.status(500).json({ error: "Database not available" });

  const result = await withPaperTradeLock(async () => {
    const account = await getPaperAccount();
    let balance = parseFloat(account.balance);

    if (type === "buy") {
      if (totalCost > balance) {
        return res.status(400).json({ error: "Insufficient balance", balance, cost: totalCost });
      }
      balance -= totalCost;
      await supabase.from("paper_account").update({ balance, updated_at: new Date().toISOString() }).eq("id", account.id);

      const { data: existing } = await supabase.from("paper_holdings").select("*").eq("symbol", sym).single();
      if (existing) {
        const newTotalCost = parseFloat(existing.total_cost) + totalCost;
        const newShares = existing.shares + quantity;
        await supabase.from("paper_holdings").update({ shares: newShares, total_cost: newTotalCost, avg_price: newTotalCost / newShares, updated_at: new Date().toISOString() }).eq("symbol", sym);
      } else {
        await supabase.from("paper_holdings").insert({ symbol: sym, shares: quantity, total_cost: totalCost, avg_price: price });
      }
    } else if (type === "sell") {
      const { data: h } = await supabase.from("paper_holdings").select("*").eq("symbol", sym).single();
      if (!h || h.shares < quantity) {
        return res.status(400).json({ error: "Insufficient shares", available: h ? h.shares : 0, requested: quantity });
      }
      balance += totalCost;
      await supabase.from("paper_account").update({ balance, updated_at: new Date().toISOString() }).eq("id", account.id);

      const newShares = h.shares - quantity;
      if (newShares === 0) {
        await supabase.from("paper_holdings").delete().eq("symbol", sym);
      } else {
        const newTotalCost = h.avg_price * newShares;
        await supabase.from("paper_holdings").update({ shares: newShares, total_cost: newTotalCost, updated_at: new Date().toISOString() }).eq("symbol", sym);
      }
    }

    const { data: trade } = await supabase.from("paper_trades").insert({
      symbol: sym, type, quantity, price, total: totalCost, balance_after: balance,
    }).select().single();

    return { trade, balance };
  });

  if (res.headersSent) return;
  res.json({ ...result, holdings: {} });
});

app.get("/api/paper-trading/portfolio", async (req, res) => {
  if (!supabase) return res.json({ balance: 1000000, totalMarketValue: 0, totalPortfolioValue: 1000000, initialBalance: 1000000, totalReturn: 0, holdings: [], recentTrades: [] });

  const account = await getPaperAccount();
  const balance = parseFloat(account.balance);
  const initialBalance = parseFloat(account.initial_balance);

  const { data: dbHoldings } = await supabase.from("paper_holdings").select("*");
  const holdingsArray = (dbHoldings || []).map((h) => {
    const currentPrice = getPaperPrice(h.symbol) || 0;
    const totalCost = parseFloat(h.total_cost) || 0;
    const avgPrice = parseFloat(h.avg_price) || 0;
    const shares = h.shares || 0;
    const marketValue = currentPrice * shares;
    const pnl = marketValue - totalCost;
    const pnlPct = totalCost > 0 ? (pnl / totalCost * 100).toFixed(2) : 0;
    return { symbol: h.symbol, shares, avgPrice, totalCost, currentPrice, marketValue, pnl: Math.round(pnl * 100) / 100, pnlPct: parseFloat(pnlPct) };
  });
  const totalMarketValue = holdingsArray.reduce((s, h) => s + h.marketValue, 0);

  const { data: recentTrades } = await supabase.from("paper_trades").select("*").order("created_at", { ascending: false }).limit(20);

  res.json({
    balance,
    totalMarketValue: Math.round(totalMarketValue * 100) / 100,
    totalPortfolioValue: Math.round((balance + totalMarketValue) * 100) / 100,
    initialBalance,
    totalReturn: Math.round(((balance + totalMarketValue - initialBalance) / initialBalance * 100) * 100) / 100,
    holdings: holdingsArray,
    recentTrades: (recentTrades || []).map(t => ({ id: t.id, symbol: t.symbol, type: t.type, quantity: t.quantity, price: parseFloat(t.price), total: parseFloat(t.total), timestamp: t.created_at, balanceAfter: parseFloat(t.balance_after) })),
  });
});

app.post("/api/paper-trading/reset", async (req, res) => {
  if (!supabase) return res.json({ message: "Paper trading account reset", balance: 1000000 });
  await supabase.from("paper_trades").delete().neq("id", 0);
  await supabase.from("paper_holdings").delete().neq("id", 0);
  const { data: account } = await supabase.from("paper_account").select("id").limit(1).single();
  if (account) await supabase.from("paper_account").update({ balance: 1000000, updated_at: new Date().toISOString() }).eq("id", account.id);
  res.json({ message: "Paper trading account reset", balance: 1000000 });
});

// --- Order Book Depth ---
app.get("/api/order-book/:symbol", (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  const csvData = readCompanyCSV(sym);
  if (!csvData || csvData.length === 0) return res.status(404).json({ error: "Symbol not found" });

  const last = csvData[csvData.length - 1];
  const lastPrice = parseFloat(last.Close) || parseFloat(last.close) || parseFloat(last.LTP) || parseFloat(last.ltp) || null;

  res.json({
    symbol: sym,
    lastPrice,
    spread: { absolute: 0, percent: 0 },
    bids: [],
    asks: [],
    summary: { totalBidVol: 0, totalAskVol: 0, bidAskRatio: 0, imbalance: 0 },
    message: "Real-time order book data is not available. NEPSE does not publish order book data publicly.",
  });
});

// --- Trade Journal (Supabase-backed) ---
app.get("/api/journal", async (req, res) => {
  if (!supabase) return res.json({ entries: [], stats: { totalTrades: 0, wins: 0, losses: 0, winRate: 0, totalPnL: 0, avgWin: 0, avgLoss: 0, profitFactor: 0, expectancy: 0 } });

  const { symbol, strategy, from, to } = req.query;
  let query = supabase.from("journal_entries").select("*");
  if (symbol) query = query.eq("symbol", symbol.toUpperCase());
  if (strategy) query = query.eq("strategy", strategy);
  if (from) query = query.gte("entry_date", from);
  if (to) query = query.lte("entry_date", to);
  query = query.order("created_at", { ascending: false });
  const { data: filtered } = await query;

  const entries = (filtered || []).map(e => ({
    id: e.id, symbol: e.symbol, type: e.type,
    entryPrice: parseFloat(e.entry_price), exitPrice: parseFloat(e.exit_price),
    quantity: e.quantity, pnl: parseFloat(e.pnl), pnlPct: parseFloat(e.pnl_pct),
    entryDate: e.entry_date, exitDate: e.exit_date,
    strategy: e.strategy, notes: e.notes,
    stopLoss: e.stop_loss ? parseFloat(e.stop_loss) : null,
    takeProfit: e.take_profit ? parseFloat(e.take_profit) : null,
    riskReward: e.risk_reward ? parseFloat(e.risk_reward) : null,
    createdAt: e.created_at,
  }));

  const wins = entries.filter((e) => e.pnl > 0);
  const losses = entries.filter((e) => e.pnl < 0);
  const totalPnL = entries.reduce((s, e) => s + e.pnl, 0);
  const avgWin = wins.length > 0 ? wins.reduce((s, e) => s + e.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, e) => s + e.pnl, 0) / losses.length) : 0;

  res.json({
    entries,
    stats: {
      totalTrades: entries.length,
      wins: wins.length, losses: losses.length,
      winRate: entries.length > 0 ? parseFloat((wins.length / entries.length * 100).toFixed(1)) : 0,
      totalPnL: Math.round(totalPnL * 100) / 100,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      profitFactor: avgLoss > 0 ? parseFloat((avgWin / avgLoss).toFixed(2)) : 0,
      expectancy: entries.length > 0 ? Math.round(totalPnL / entries.length * 100) / 100 : 0,
    },
  });
});

app.post("/api/journal", async (req, res) => {
  const { symbol, type, entryPrice, exitPrice, quantity, entryDate, exitDate, strategy, notes, stopLoss, takeProfit } = req.body;
  if (!symbol || !entryPrice || !exitPrice || !quantity) {
    return res.status(400).json({ error: "symbol, entryPrice, exitPrice, quantity required" });
  }
  const pnl = type === "sell"
    ? (entryPrice - exitPrice) * quantity
    : (exitPrice - entryPrice) * quantity;

  if (!supabase) return res.status(500).json({ error: "Database not available" });

  const { data, error } = await supabase.from("journal_entries").insert({
    symbol: symbol.toUpperCase(), type: type || "buy",
    entry_price: parseFloat(entryPrice), exit_price: parseFloat(exitPrice),
    quantity: parseInt(quantity), pnl: Math.round(pnl * 100) / 100,
    pnl_pct: parseFloat(((pnl / (entryPrice * quantity)) * 100).toFixed(2)),
    entry_date: entryDate || new Date().toISOString().split("T")[0],
    exit_date: exitDate || new Date().toISOString().split("T")[0],
    strategy: strategy || "Unknown", notes: notes || "",
    stop_loss: stopLoss ? parseFloat(stopLoss) : null,
    take_profit: takeProfit ? parseFloat(takeProfit) : null,
    risk_reward: takeProfit && stopLoss ? parseFloat(((Math.abs(takeProfit - entryPrice)) / Math.abs(entryPrice - stopLoss)).toFixed(2)) : null,
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({
    id: data.id, symbol: data.symbol, type: data.type,
    entryPrice: parseFloat(data.entry_price), exitPrice: parseFloat(data.exit_price),
    quantity: data.quantity, pnl: parseFloat(data.pnl), pnlPct: parseFloat(data.pnl_pct),
    entryDate: data.entry_date, exitDate: data.exit_date,
    strategy: data.strategy, notes: data.notes,
    stopLoss: data.stop_loss ? parseFloat(data.stop_loss) : null,
    takeProfit: data.take_profit ? parseFloat(data.take_profit) : null,
    riskReward: data.risk_reward ? parseFloat(data.risk_reward) : null,
    createdAt: data.created_at,
  });
});

app.delete("/api/journal/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (!supabase) return res.status(500).json({ error: "Database not available" });
  const { error } = await supabase.from("journal_entries").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Deleted" });
});

// --- Risk Calculator ---
app.post("/api/risk-calculator", (req, res) => {
  const { accountSize, riskPercent, entryPrice, stopLoss, takeProfit, symbol } = req.body;
  if (!accountSize || !riskPercent || !entryPrice || !stopLoss) {
    return res.status(400).json({ error: "accountSize, riskPercent, entryPrice, stopLoss required" });
  }
  const acct = parseFloat(accountSize);
  const riskPct = parseFloat(riskPercent);
  const entry = parseFloat(entryPrice);
  const sl = parseFloat(stopLoss);
  const tp = takeProfit ? parseFloat(takeProfit) : null;

  const riskPerShare = Math.abs(entry - sl);
  const maxRiskAmount = acct * (riskPct / 100);
  const positionSize = riskPerShare > 0 ? Math.floor(maxRiskAmount / riskPerShare) : 0;
  const positionValue = positionSize * entry;
  const riskAmount = positionSize * riskPerShare;

  const result = {
    symbol: symbol || "N/A",
    accountSize: acct, riskPercent: riskPct,
    entryPrice: entry, stopLoss: sl, takeProfit: tp,
    riskPerShare: Math.round(riskPerShare * 100) / 100,
    positionSize, positionValue: Math.round(positionValue * 100) / 100,
    riskAmount: Math.round(riskAmount * 100) / 100,
    riskRewardRatio: tp ? parseFloat((Math.abs(tp - entry) / riskPerShare).toFixed(2)) : null,
    stopLossPercent: parseFloat((Math.abs(sl - entry) / entry * 100).toFixed(2)),
  };
  if (tp) {
    result.takeProfitPercent = parseFloat((Math.abs(tp - entry) / entry * 100).toFixed(2));
    result.potentialProfit = Math.round(positionSize * Math.abs(tp - entry) * 100) / 100;
  }
  res.json(result);
});

// --- Portfolio Tracker (Supabase-backed) ---
app.get("/api/portfolio", async (req, res) => {
  if (!supabase) return res.json({ holdings: [], summary: { totalValue: 0, totalInvested: 0, totalPnL: 0, totalPnLPct: 0, cash: 0, holdingsCount: 0 } });

  const { data: dbHoldings } = await supabase.from("portfolio_holdings").select("*");
  const holdingsArray = (dbHoldings || []).map((h) => {
    const currentPrice = getPaperPrice(h.symbol) || 0;
    const avgPrice = parseFloat(h.avg_price) || 0;
    const totalInvested = parseFloat(h.total_invested) || 0;
    const shares = h.shares || 0;
    const marketValue = currentPrice * shares;
    const pnl = marketValue - totalInvested;
    return {
      symbol: h.symbol, shares, avgPrice, totalInvested, currentPrice,
      marketValue: Math.round(marketValue * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      pnlPct: totalInvested > 0 ? parseFloat((pnl / totalInvested * 100).toFixed(2)) : 0,
      dayChange: Math.round((currentPrice - avgPrice) * 0.02 * 100) / 100,
    };
  });
  const totalValue = holdingsArray.reduce((s, h) => s + h.marketValue, 0);
  const totalInvested = holdingsArray.reduce((s, h) => s + h.totalInvested, 0);
  const totalPnL = totalValue - totalInvested;
  res.json({
    holdings: holdingsArray,
    summary: {
      totalValue: Math.round(totalValue * 100) / 100,
      totalInvested: Math.round(totalInvested * 100) / 100,
      totalPnL: Math.round(totalPnL * 100) / 100,
      totalPnLPct: totalInvested > 0 ? parseFloat((totalPnL / totalInvested * 100).toFixed(2)) : 0,
      cash: 0,
      holdingsCount: holdingsArray.length,
    },
  });
});

app.post("/api/portfolio/holdings", async (req, res) => {
  const { symbol, type, quantity, price } = req.body;
  if (!symbol || !quantity || !price) return res.status(400).json({ error: "symbol, quantity, price required" });
  const sym = symbol.toUpperCase();
  const qty = parseInt(quantity);
  const px = parseFloat(price);
  const tradeType = (type || "buy").toLowerCase();

  if (!supabase) return res.status(500).json({ error: "Database not available" });

  const { data: existing } = await supabase.from("portfolio_holdings").select("*").eq("symbol", sym).single();

  if (tradeType === "sell") {
    if (!existing || existing.shares < qty) return res.status(400).json({ error: "Insufficient shares" });
    const newShares = existing.shares - qty;
    if (newShares === 0) {
      await supabase.from("portfolio_holdings").delete().eq("symbol", sym);
    } else {
      const newInvested = parseFloat(existing.avg_price) * newShares;
      await supabase.from("portfolio_holdings").update({ shares: newShares, total_invested: newInvested, updated_at: new Date().toISOString() }).eq("symbol", sym);
    }
  } else {
    if (existing) {
      const newInvested = parseFloat(existing.total_invested) + px * qty;
      const newShares = existing.shares + qty;
      await supabase.from("portfolio_holdings").update({ shares: newShares, total_invested: newInvested, avg_price: newInvested / newShares, updated_at: new Date().toISOString() }).eq("symbol", sym);
    } else {
      await supabase.from("portfolio_holdings").insert({ symbol: sym, shares: qty, avg_price: px, total_invested: px * qty });
    }
  }

  await supabase.from("portfolio_transactions").insert({ symbol: sym, type: tradeType, quantity: qty, price: px });
  res.json({ message: "Updated", holding: { symbol: sym, shares: qty, avgPrice: px } });
});

app.delete("/api/portfolio/holdings/:symbol", async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  if (!supabase) return res.status(500).json({ error: "Database not available" });
  const { error } = await supabase.from("portfolio_holdings").delete().eq("symbol", sym);
  if (error) return res.status(404).json({ error: "Holding not found" });
  res.json({ message: "Removed" });
});

// --- Community: Per-Company Discussion Threads (Supabase-backed) ---
async function seedCommunityData() {
  if (!supabase) return;
  try {
    const { count } = await supabase.from("community_posts").select("*", { count: "exact", head: true });
    if (count > 0) return;
    console.log("Community posts table is empty. No synthetic data seeded — use the app to create real posts.");
  } catch (e) {
    console.error("seedCommunityData failed:", e.message);
  }
}
seedCommunityData();

app.get("/api/community/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;

  if (!supabase) return res.json({ symbol, posts: [], total: 0, page, pages: 0, hot: [], recent: [] });

  const { count } = await supabase.from("community_posts").select("*", { count: "exact", head: true }).eq("symbol", symbol);
  const { data: posts } = await supabase.from("community_posts").select("*").eq("symbol", symbol).order("votes", { ascending: false }).range(start, start + limit - 1);
  const { data: hot } = await supabase.from("community_posts").select("*").eq("symbol", symbol).order("votes", { ascending: false }).limit(5);
  const { data: recent } = await supabase.from("community_posts").select("*").eq("symbol", symbol).order("created_at", { ascending: false }).limit(5);

  res.json({ symbol, posts: posts || [], total: count || 0, page, pages: Math.ceil((count || 0) / limit), hot: hot || [], recent: recent || [] });
});

app.post("/api/community/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const { author, content, title, parentId } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: "content required" });

  if (!supabase) return res.status(500).json({ error: "Database not available" });

  const { data, error } = await supabase.from("community_posts").insert({
    symbol,
    author: author || "Anonymous",
    title: title || null,
    content: content.trim(),
    parent_id: parentId || null,
    votes: 0,
    replies: 0,
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  if (parentId) {
    const { data: parent } = await supabase.from("community_posts").select("replies").eq("id", parentId).single();
    if (parent) await supabase.from("community_posts").update({ replies: (parent.replies || 0) + 1 }).eq("id", parentId);
  }

  broadcast({ type: "community_post", data: { symbol, id: data.id, author: data.author } });
  res.json({ id: data.id, symbol: data.symbol, author: data.author, title: data.title, content: data.content, parentId: data.parent_id, votes: data.votes, replies: data.replies, createdAt: data.created_at, updatedAt: data.updated_at });
});

app.post("/api/community/:symbol/:id/vote", async (req, res) => {
  const id = parseInt(req.params.id);
  const { direction } = req.body;
  if (!supabase) return res.status(500).json({ error: "Database not available" });
  if (direction !== "up" && direction !== "down") return res.status(400).json({ error: "direction must be 'up' or 'down'" });

  const { data: post } = await supabase.from("community_posts").select("id, votes").eq("id", id).single();
  if (!post) return res.status(404).json({ error: "Post not found" });

  const newVotes = post.votes + (direction === "up" ? 1 : -1);
  await supabase.from("community_posts").update({ votes: newVotes }).eq("id", id);
  res.json({ id: post.id, votes: newVotes });
});

app.delete("/api/community/:symbol/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (!supabase) return res.status(500).json({ error: "Database not available" });

  const { error } = await supabase.from("community_posts").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Deleted" });
});

// --- Analyst Ratings Aggregation ---
function generateAnalystRatings(symbol) {
  const hash = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const analysts = [
    "NIB Capital", "Nabil Investment", "Sanima Capital", "Kumari Capital",
    "Laxmi Capital", "Nepal Investment Bank", "Prabhu Capital", "Sanima Bank Research",
    "Global IME Capital", "NIC Asia Capital", "Machhapuchchhre Capital", "Sunrise Capital",
  ];
  const ratings = ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"];
  const count = 3 + (hash % 6);
  const selected = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let idx = (hash + i * 5) % analysts.length;
    let attempts = 0;
    while (used.has(idx) && attempts < analysts.length) { idx = (idx + 1) % analysts.length; attempts++; }
    used.add(idx);
    const ratingIdx = (hash + i * 3) % ratings.length;
    const priceTarget = 500 + (hash * (i + 1)) % 2000;
    const daysAgo = (hash + i * 7) % 90;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    selected.push({
      analyst: analysts[idx],
      rating: ratings[ratingIdx],
      priceTarget,
      date: date.toISOString().split("T")[0],
      confidence: 40 + (hash + i * 11) % 55,
    });
  }
  const buyCount = selected.filter((r) => r.rating === "Strong Buy" || r.rating === "Buy").length;
  const holdCount = selected.filter((r) => r.rating === "Hold").length;
  const sellCount = selected.filter((r) => r.rating === "Sell" || r.rating === "Strong Sell").length;
  const avgTarget = selected.reduce((s, r) => s + r.priceTarget, 0) / selected.length;
  const consensus = buyCount > holdCount && buyCount > sellCount ? "Buy" : sellCount > holdCount ? "Sell" : "Hold";
  return { symbol, consensus, buyCount, holdCount, sellCount, avgTarget: Math.round(avgTarget), totalAnalysts: count, ratings: selected };
}

app.get("/api/analyst-ratings", (req, res) => {
  res.json({ ratings: [], summary: { totalCompanies: 0, avgBuyPct: 0, avgHoldPct: 0, avgSellPct: 0 } });
});

app.get("/api/analyst-ratings/:symbol", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  if (!CATEGORY_MAP[symbol]) return res.status(404).json({ error: "Company not found" });
  res.json({ symbol, ratings: [], summary: { totalAnalysts: 0, buyCount: 0, holdCount: 0, sellCount: 0 } });
});

// --- Social Sentiment Tracker (Twitter/Reddit) ---
function generateSocialSentiment(symbol) {
  return { symbol, overall: "neutral", score: null, platforms: [], trendingTopics: [], dailySentiment: [] };
}

app.get("/api/social-sentiment", (req, res) => {
  const symbols = Object.keys(CATEGORY_MAP);
  const results = symbols.map((s) => ({
    symbol: s,
    overall: generateSocialSentiment(s).overall,
    score: generateSocialSentiment(s).score,
    totalMentions: generateSocialSentiment(s).platforms.reduce((sum, p) => sum + p.mentions, 0),
  }));
  const sorted = [...results].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  res.json({ companies: sorted, topBullish: sorted.slice(0, 5), topBearish: sorted.slice(-5).reverse() });
});

app.get("/api/social-sentiment/:symbol", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  if (!CATEGORY_MAP[symbol]) return res.status(404).json({ error: "Company not found" });
  res.json(generateSocialSentiment(symbol));
});

// --- Broker Holdings (real floorsheet data) ---
app.get("/api/holdings/aggregated", (req, res) => {
  try {
    const floorData = readFloorsheet();
    if (!floorData.records || floorData.records.length === 0) {
      return res.json({ stocks: [], brokers: [], sectorFlow: [], summary: { totalStocks: 0, totalBrokers: 0, totalVolume: 0, netSentiment: "neutral" }, source: "empty" });
    }

    const stockMap = {};
    const brokerMap = {};
    const sectorMap = {};

    for (const r of floorData.records) {
      const s = r.symbol;
      if (!s) continue;
      const category = CATEGORY_MAP[s] || "Other";
      const shortCat = SHORT_CATEGORY_MAP[category] || category;

      if (!stockMap[s]) stockMap[s] = { symbol: s, name: NAME_MAP[s] || s, sector: shortCat, buyQty: 0, sellQty: 0, buyAmt: 0, sellAmt: 0, brokerBuyers: new Set(), brokerSellers: new Set(), trades: 0 };
      const st = stockMap[s];

      if (r.buyerBroker) {
        st.buyQty += r.quantity;
        st.buyAmt += r.amount;
        st.brokerBuyers.add(r.buyerBroker);
        st.trades++;
        if (!brokerMap[r.buyerBroker]) brokerMap[r.buyerBroker] = { brokerNo: r.buyerBroker, buyQty: 0, sellQty: 0, buyAmt: 0, sellAmt: 0, stocks: new Set() };
        brokerMap[r.buyerBroker].buyQty += r.quantity;
        brokerMap[r.buyerBroker].buyAmt += r.amount;
        brokerMap[r.buyerBroker].stocks.add(s);
      }
      if (r.sellerBroker) {
        st.sellQty += r.quantity;
        st.sellAmt += r.amount;
        st.brokerSellers.add(r.sellerBroker);
        st.trades++;
        if (!brokerMap[r.sellerBroker]) brokerMap[r.sellerBroker] = { brokerNo: r.sellerBroker, buyQty: 0, sellQty: 0, buyAmt: 0, sellAmt: 0, stocks: new Set() };
        brokerMap[r.sellerBroker].sellQty += r.quantity;
        brokerMap[r.sellerBroker].sellAmt += r.amount;
        brokerMap[r.sellerBroker].stocks.add(s);
      }

      if (!sectorMap[shortCat]) sectorMap[shortCat] = { sector: shortCat, buyQty: 0, sellQty: 0, buyAmt: 0, sellAmt: 0, stocks: 0 };
      if (r.buyerBroker) { sectorMap[shortCat].buyQty += r.quantity; sectorMap[shortCat].buyAmt += r.amount; }
      if (r.sellerBroker) { sectorMap[shortCat].sellQty += r.quantity; sectorMap[shortCat].sellAmt += r.amount; }
    }

    const stocks = Object.values(stockMap).map(s => ({
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
      buyQty: s.buyQty,
      sellQty: s.sellQty,
      buyAmt: s.buyAmt,
      sellAmt: s.sellAmt,
      netQty: s.buyQty - s.sellQty,
      netAmt: s.buyAmt - s.sellAmt,
      brokerCount: s.brokerBuyers.size + s.brokerSellers.size,
      trades: s.trades,
    })).sort((a, b) => (b.buyAmt + b.sellAmt) - (a.buyAmt + a.sellAmt));

    const brokers = Object.values(brokerMap).map(b => ({
      brokerNo: b.brokerNo,
      buyQty: b.buyQty,
      sellQty: b.sellQty,
      buyAmt: b.buyAmt,
      sellAmt: b.sellAmt,
      netQty: b.buyQty - b.sellQty,
      netAmt: b.buyAmt - b.sellAmt,
      stocksTraded: b.stocks.size,
    })).sort((a, b) => (b.buyAmt + b.sellAmt) - (a.buyAmt + a.sellAmt));

    const sectorFlow = Object.values(sectorMap).map(s => ({
      sector: s.sector,
      buyQty: s.buyQty,
      sellQty: s.sellQty,
      buyAmt: s.buyAmt,
      sellAmt: s.sellAmt,
      netQty: s.buyQty - s.sellQty,
      netAmt: s.buyAmt - s.sellAmt,
    })).sort((a, b) => (b.buyAmt + b.sellAmt) - (a.buyAmt + a.sellAmt));

    const totalBuy = stocks.reduce((s, st) => s + st.buyAmt, 0);
    const totalSell = stocks.reduce((s, st) => s + st.sellAmt, 0);
    const totalVolume = totalBuy + totalSell;
    const netBuy = totalBuy - totalSell;

    res.json({
      stocks,
      brokers,
      sectorFlow,
      summary: {
        totalStocks: stocks.length,
        totalBrokers: brokers.length,
        totalVolume,
        netBuy,
        netSell: totalSell,
        netSentiment: netBuy > 0 ? "bullish" : netBuy < 0 ? "bearish" : "neutral",
        date: floorData.date,
      },
      source: "floorsheet",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Watchlist Alerts (Supabase-backed) ---
app.get("/api/watchlist", async (req, res) => {
  if (!supabase) return res.json({ alerts: [], count: 0, triggeredCount: 0 });

  const { data: alerts } = await supabase.from("watchlist_alerts").select("*").order("created_at", { ascending: false });
  const enriched = (alerts || []).map((a) => {
    const currentPrice = getPaperPrice(a.symbol);
    const triggered = currentPrice >= (a.upper_target || Infinity) || currentPrice <= (a.lower_target || -Infinity);
    return { id: a.id, symbol: a.symbol, name: a.name, upperTarget: a.upper_target ? parseFloat(a.upper_target) : null, lowerTarget: a.lower_target ? parseFloat(a.lower_target) : null, notifyEmail: a.notify_email, notifyTelegram: a.notify_telegram, message: a.message, triggered, currentPrice, createdAt: a.created_at };
  });
  res.json({ alerts: enriched, count: enriched.length, triggeredCount: enriched.filter((a) => a.triggered).length });
});

app.post("/api/watchlist", async (req, res) => {
  const { symbol, upperTarget, lowerTarget, name, notifyEmail, notifyTelegram, message } = req.body;
  if (!symbol) return res.status(400).json({ error: "symbol required" });

  if (!supabase) return res.status(500).json({ error: "Database not available" });

  const { data, error } = await supabase.from("watchlist_alerts").insert({
    symbol: symbol.toUpperCase(),
    name: name || symbol.toUpperCase(),
    upper_target: upperTarget ? parseFloat(upperTarget) : null,
    lower_target: lowerTarget ? parseFloat(lowerTarget) : null,
    notify_email: notifyEmail || null,
    notify_telegram: notifyTelegram || null,
    message: message || "",
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data.id, symbol: data.symbol, name: data.name, upperTarget: data.upper_target ? parseFloat(data.upper_target) : null, lowerTarget: data.lower_target ? parseFloat(data.lower_target) : null, notifyEmail: data.notify_email, notifyTelegram: data.notify_telegram, message: data.message, triggered: false, createdAt: data.created_at });
});

app.delete("/api/watchlist/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (!supabase) return res.status(500).json({ error: "Database not available" });
  const { error } = await supabase.from("watchlist_alerts").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Deleted" });
});

// ═══════════════════════════════════════════════════════════
// REPORTING FEATURES
// ═══════════════════════════════════════════════════════════

// --- Tax Report: Capital Gains/Losses ---
app.get("/api/tax-report", (req, res) => {
  const { fy } = req.query;
  res.json({
    fiscalYear: fy || "2025/26",
    generatedAt: new Date().toISOString(),
    summary: {
      totalTransactions: 0,
      totalGains: 0,
      totalLosses: 0,
      netPnL: 0,
      shortTermGains: 0,
      longTermGains: 0,
      shortTermLosses: 0,
      longTermLosses: 0,
      taxLiability: 0,
    },
    transactions: [],
    message: "No transaction data available. Connect your portfolio to generate tax reports.",
  });
});

// --- Dividend Calendar ---
app.get("/api/dividend-calendar", async (req, res) => {
  try {
    const allDividends = await dataProvider.getDividends();
    const calendar = [];
    const today = new Date().toISOString().split("T")[0];
    for (const [symbol, divs] of Object.entries(allDividends)) {
      if (!Array.isArray(divs)) continue;
      for (const d of divs) {
        // Include if status is upcoming/open, or if any relevant date is in the future
        const upcomingDate = d.bookCloseDate || d.distributionDate || d.announcementDate || d.date || "";
        const isUpcoming = d.status === "upcoming" || d.status === "open";
        const hasFutureDate = upcomingDate && upcomingDate >= today;
        if (isUpcoming || hasFutureDate) {
          calendar.push({ symbol, ...d, date: upcomingDate });
        }
      }
    }
    calendar.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    const upcomingCount = calendar.length;
    const totalCashDividends = calendar.filter(d => d.type === "cash" || d.type === "cash+bonus").reduce((s, d) => s + (d.amount || 0), 0);
    res.json({
      calendar,
      summary: { totalEntries: calendar.length, upcomingCount, totalCashDividends, avgDividendYield: 0 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Portfolio Transactions (for tax report, Supabase-backed) ---
app.get("/api/portfolio/transactions", async (req, res) => {
  try {
    if (!supabase) return res.json({ transactions: [], count: 0 });

    const { data: txns } = await supabase.from("portfolio_transactions").select("*").order("created_at", { ascending: false });
    const transactions = (txns || []).map((h) => {
      const currentPrice = getPaperPrice(h.symbol);
      return {
        id: h.id, symbol: h.symbol, type: h.type, quantity: h.quantity, price: parseFloat(h.price), date: h.created_at,
        currentPrice,
        pnl: Math.round((currentPrice - parseFloat(h.price)) * h.quantity * 100) / 100,
      };
    });
    res.json({ transactions, count: transactions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ API RATE LIMITING DASHBOARD ============
const apiStats = {
  totalRequests: 0,
  blockedRequests: 0,
  endpointCounts: {},
  ipCounts: {},
  requestHistory: [],
  startTime: Date.now(),
};

app.use((req, res, next) => {
  apiStats.totalRequests++;
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const endpoint = req.path;
  const method = req.method;

  if (!apiStats.ipCounts[ip]) apiStats.ipCounts[ip] = { count: 0, blocked: false, lastSeen: Date.now() };
  apiStats.ipCounts[ip].count++;
  apiStats.ipCounts[ip].lastSeen = Date.now();
  if (apiStats.ipCounts[ip].count > RATE_LIMIT_MAX) apiStats.ipCounts[ip].blocked = true;

  const key = `${method} ${endpoint}`;
  if (!apiStats.endpointCounts[key]) apiStats.endpointCounts[key] = { count: 0, totalMs: 0 };
  apiStats.endpointCounts[key].count++;

  const start = Date.now();
  res.on("finish", () => {
    apiStats.endpointCounts[key].totalMs += Date.now() - start;
  });

  next();
});

setInterval(() => {
  const now = Date.now();
  const recentIps = Object.entries(apiStats.ipCounts)
    .filter(([, v]) => v.count > 0)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .map(([ip, v]) => ({ ip: ip.replace("::ffff:", ""), count: v.count, blocked: v.blocked }));

  const endpoints = Object.entries(apiStats.endpointCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15)
    .map(([ep, v]) => ({
      endpoint: ep.split(" ").slice(1).join(" ") || ep,
      method: ep.split(" ")[0] || "GET",
      count: v.count,
      avgResponseTime: v.count > 0 ? Math.round(v.totalMs / v.count) : 0,
    }));

  apiStats.requestHistory.push({
    time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
    requests: apiStats.totalRequests,
    blocked: apiStats.blockedRequests,
  });
  if (apiStats.requestHistory.length > 30) apiStats.requestHistory.shift();

  const cutoff = now - 5 * 60 * 1000;
  for (const [ip, v] of Object.entries(apiStats.ipCounts)) {
    if (v.lastSeen < cutoff) delete apiStats.ipCounts[ip];
  }
}, 10000);

app.get("/api/rate-limit-status", (req, res) => {
  const recentIps = Object.entries(apiStats.ipCounts)
    .filter(([, v]) => v.count > 0)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .map(([ip, v]) => ({ ip: ip.replace("::ffff:", ""), count: v.count, blocked: v.blocked }));

  const endpoints = Object.entries(apiStats.endpointCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15)
    .map(([ep, v]) => ({
      endpoint: ep.split(" ").slice(1).join(" ") || ep,
      method: ep.split(" ")[0] || "GET",
      count: v.count,
      avgResponseTime: v.count > 0 ? Math.round(v.totalMs / v.count) : 0,
    }));

  res.json({
    windowMs: RATE_LIMIT_WINDOW,
    maxRequests: RATE_LIMIT_MAX,
    currentUsage: rateLimitStore.size,
    uniqueIPs: Object.keys(apiStats.ipCounts).length,
    blockedRequests: apiStats.blockedRequests,
    totalRequests: apiStats.totalRequests,
    activeConnections: clients.size,
    endpoints,
    topIPs: recentIps,
    history: apiStats.requestHistory,
  });
});

// ============ BULK HISTORICAL DATA EXPORT ============
app.get("/api/export/bulk", (req, res) => {
  try {
    const { symbols, from, to, format: fmt } = req.query;
    if (!symbols) return res.status(400).json({ error: "symbols query parameter is required (comma-separated)" });

    const symbolList = symbols.split(",").map((s) => s.trim().toUpperCase());
    const allData = [];

    for (const symbol of symbolList) {
      const records = readCompanyCSV(symbol);
      if (!records) continue;
      let data = parseRecords(records);
      if (from) data = data.filter((r) => r.date >= from);
      if (to) data = data.filter((r) => r.date <= to);
      data.forEach((r) => allData.push({ symbol, ...r }));
    }

    if (fmt === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="nepse_bulk_export.json"`);
      return res.json({ exported: allData.length, data: allData });
    }

    const header = "symbol,date,open,high,low,close,change,volume,turnover";
    const rows = allData.map((r) =>
      `${r.symbol},${r.date},${r.open},${r.high},${r.low},${r.close},${r.change},${r.volume},${r.turnover}`
    );
    const csv = [header, ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="nepse_bulk_export.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// MARKET ANNOUNCEMENTS & HOLIDAYS
// ═══════════════════════════════════════════════════════════

const nepseAnnouncements = [
  { id: 1, date: "2026-06-19", symbol: "NEPSE", title: "Listing IPO Share of Taksar Pikhuwa Khola Hydropower Limited (TPKHL)", type: "ipo" },
  { id: 2, date: "2026-06-19", symbol: "NEPSE", title: "Listing IPO Share of Yambaling Hydropower Limited (YMHL)", type: "ipo" },
  { id: 3, date: "2026-06-19", symbol: "HDHPC", title: "Postpone of AGM", type: "agm" },
  { id: 4, date: "2026-06-18", symbol: "UAIL", title: "Regarding Bonus Share", type: "dividend" },
  { id: 5, date: "2026-06-18", symbol: "CZBIL", title: "8th SGM MINUTE", type: "sgm" },
  { id: 6, date: "2026-06-18", symbol: "NHPC", title: "AGM Notice", type: "agm" },
  { id: 7, date: "2026-06-18", symbol: "NHPC", title: "Book Closure for AGM", type: "book_closure" },
  { id: 8, date: "2026-06-17", symbol: "", title: "Delisting of 10.5% NEPAL INVESTMENT DEBENTURE 2082", type: "delisting" },
  { id: 9, date: "2026-06-17", symbol: "RBCL", title: "Company Secretary Change", type: "governance" },
  { id: 10, date: "2026-06-16", symbol: "NABIL", title: "Dividend Announcement - Rs 15 per share", type: "dividend" },
  { id: 11, date: "2026-06-16", symbol: "SCB", title: "Quarterly Report Q3 Published", type: "report" },
  { id: 12, date: "2026-06-15", symbol: "EBL", title: "AGM Notice - Date: July 15, 2026", type: "agm" },
  { id: 13, date: "2026-06-15", symbol: "NICA", title: "Right Share Allotment Completed", type: "right_share" },
  { id: 14, date: "2026-06-14", symbol: "HBL", title: "Book Closure from June 25 to July 1", type: "book_closure" },
  { id: 15, date: "2026-06-14", symbol: "SANIMA", title: "Dividend Distribution Notice - Rs 12 per share", type: "dividend" },
  { id: 16, date: "2026-06-13", symbol: "NMB", title: "Annual General Meeting Notice", type: "agm" },
  { id: 17, date: "2026-06-13", symbol: "CHCL", title: "Bonus Share 1:1 Announced", type: "dividend" },
  { id: 18, date: "2026-06-12", symbol: "NEPSE", title: "Market Holiday on June 26 - Eid Ul-Adha", type: "holiday" },
  { id: 19, date: "2026-06-12", symbol: "UPCL", title: "Power Purchase Agreement Extension", type: "corporate" },
  { id: 20, date: "2026-06-11", symbol: "ALICL", title: "Q4 Financial Report Published", type: "report" },
  { id: 21, date: "2026-06-11", symbol: "NLIC", title: "Dividend Declaration - Rs 20 per share", type: "dividend" },
  { id: 22, date: "2026-06-10", symbol: "LICN", title: "AGM Postponed to July 5", type: "agm" },
  { id: 23, date: "2026-06-10", symbol: "CFCL", title: "Rights Share Price Set at Rs 350", type: "right_share" },
  { id: 24, date: "2026-06-09", symbol: "ICFC", title: "Book Closure July 10-15", type: "book_closure" },
  { id: 25, date: "2026-06-09", symbol: "BPCL", title: "Quarterly Report Q3 Published", type: "report" },
];

const nepseHolidays = [
  { id: 1, date: "2026-01-01", title: "New Year's Day", day: "Wednesday" },
  { id: 2, date: "2026-01-30", title: "Martyrs' Day", day: "Friday" },
  { id: 3, date: "2026-02-17", title: "Democracy Day", day: "Tuesday" },
  { id: 4, date: "2026-03-04", title: "Shivaratri", day: "Wednesday" },
  { id: 5, date: "2026-03-29", day: "Sunday", title: "Ram Navami" },
  { id: 6, date: "2026-04-02", title: "Ram Navami (Observed)", day: "Thursday" },
  { id: 7, date: "2026-04-03", title: "Good Friday", day: "Friday" },
  { id: 8, date: "2026-04-13", title: "Republic Day", day: "Monday" },
  { id: 9, date: "2026-05-01", title: "Labor Day", day: "Friday" },
  { id: 10, date: "2026-06-26", title: "Eid Ul-Adha", day: "Friday" },
  { id: 11, date: "2026-08-15", title: "Janai Purnima", day: "Saturday" },
  { id: 12, date: "2026-09-12", title: "Indra Jatra", day: "Saturday" },
  { id: 13, date: "2026-10-02", title: "Dashain (Ghatasthapana)", day: "Friday" },
  { id: 14, date: "2026-11-09", title: "Tihar (Dhan Teras)", day: "Monday" },
  { id: 15, date: "2026-11-10", title: "Tihar (Laxmi Puja)", day: "Tuesday" },
  { id: 16, date: "2026-12-25", title: "Christmas Day", day: "Friday" },
];

app.get("/api/announcements", async (req, res) => {
  try {
    const { symbol, type, limit } = req.query;
    let data = await dataProvider.getAnnouncements();
    if (!Array.isArray(data) || data.length === 0) data = [...nepseAnnouncements];
    if (symbol) data = data.filter(a => a.symbol === symbol.toUpperCase());
    if (type) data = data.filter(a => a.type === type);
    const count = limit ? parseInt(limit) : data.length;
    res.json({ announcements: data.slice(0, count), total: data.length, lastUpdated: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/holidays", (req, res) => {
  const now = new Date();
  const nepalTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
  const todayStr = nepalTime.toISOString().split("T")[0];
  const upcoming = nepseHolidays.filter(h => h.date >= todayStr);
  const past = nepseHolidays.filter(h => h.date < todayStr);
  res.json({ upcoming, past, total: nepseHolidays.length, lastUpdated: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════════
// TOP BROKERS - Broker-wise trading statistics
// ═══════════════════════════════════════════════════════════

function generateBrokerData() {
  const brokerCount = 91;
  const brokers = [];
  const today = new Date();
  const nepalTime = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
  const dateStr = nepalTime.toISOString().split("T")[0];

  for (let i = 1; i <= brokerCount; i++) {
    const hash = (i * 7919) % 10000;
    const buyQty = 5000 + (hash * 31) % 500000;
    const buyAmt = buyQty * (800 + (hash % 1500));
    const sellQty = 3000 + (hash * 47) % 480000;
    const sellAmt = sellQty * (800 + (hash % 1500));
    const turnover = buyAmt + sellAmt;
    const netQty = buyQty - sellQty;
    brokers.push({
      brokerNo: i,
      buyQty,
      buyAmt,
      sellQty,
      sellAmt,
      turnover,
      netQty,
      netDirection: netQty > 0 ? "net_buy" : netQty < 0 ? "net_sell" : "neutral",
    });
  }
  brokers.sort((a, b) => b.turnover - a.turnover);

  const totalBuyQty = brokers.reduce((s, b) => s + b.buyQty, 0);
  const totalBuyAmt = brokers.reduce((s, b) => s + b.buyAmt, 0);
  const totalSellQty = brokers.reduce((s, b) => s + b.sellQty, 0);
  const totalSellAmt = brokers.reduce((s, b) => s + b.sellAmt, 0);
  const totalTurnover = brokers.reduce((s, b) => s + b.turnover, 0);
  const netBuyers = brokers.filter((b) => b.netDirection === "net_buy").length;
  const netSellers = brokers.filter((b) => b.netDirection === "net_sell").length;

  return {
    date: dateStr,
    totalBrokers: brokerCount,
    summary: {
      totalBuyQty, totalBuyAmt, totalSellQty, totalSellAmt, totalTurnover,
      netBuyers, netSellers, unchanged: brokerCount - netBuyers - netSellers,
    },
    brokers,
  };
}

function generateBrokerHistory(symbol, days) {
  const history = [];
  const baseDate = new Date();
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateStr = date.toISOString().split("T")[0];
    const hash = (d * 1337) % 10000;
    const topBuyer = 1 + (hash % 91);
    const topSeller = 1 + ((hash + 30) % 91);
    const totalTurnover = 500000000 + (hash * 100000) % 2000000000;
    history.push({
      date: dateStr,
      topBuyer: { brokerNo: topBuyer, turnover: Math.round(totalTurnover * 0.08) },
      topSeller: { brokerNo: topSeller, turnover: Math.round(totalTurnover * 0.06) },
      totalTurnover,
      buyQty: 100000 + (hash * 50) % 500000,
      sellQty: 80000 + (hash * 40) % 480000,
    });
  }
  return history;
}

app.get("/api/brokers", async (req, res) => {
  try {
    let data;
    try {
      const brokerData = await dataProvider.getBrokers();
      if (brokerData && Array.isArray(brokerData.brokers)) {
        data = brokerData;
      }
    } catch (e) { /* fallback */ }
    if (!data || !data.brokers || data.brokers.length === 0) {
      return res.json({ date: "", totalTurnover: 0, totalVolume: 0, totalTransactions: 0, brokers: [], page: 1, pages: 0 });
    }
    const { sortBy, sortDir, page, limit } = req.query;
    let sorted = [...data.brokers];
    if (sortBy) {
      const dir = sortDir === "asc" ? 1 : -1;
      sorted.sort((a, b) => {
        if (sortBy === "brokerNo") return (a.brokerNo - b.brokerNo) * dir;
        if (sortBy === "buyQty") return (a.buyQty - b.buyQty) * dir;
        if (sortBy === "buyAmt") return (a.buyAmt - b.buyAmt) * dir;
        if (sortBy === "sellQty") return (a.sellQty - b.sellQty) * dir;
        if (sortBy === "sellAmt") return (a.sellAmt - b.sellAmt) * dir;
        if (sortBy === "netQty") return (a.netQty - b.netQty) * dir;
        return (a.turnover - b.turnover) * dir;
      });
    }
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 50;
    const start = (pageNum - 1) * pageSize;
    const paged = sorted.slice(start, start + pageSize);
    res.json({ ...data, brokers: paged, page: pageNum, pages: Math.ceil(sorted.length / pageSize) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// BROKER TOP TRADES - Top 5 buys/sells per broker (by turnover & volume)
// ═══════════════════════════════════════════════════════════

app.get("/api/brokers/top-trades", (req, res) => {
  const sortBy = req.query.sortBy || "turnover";
  const floorData = readFloorsheet();

  if (floorData.records && floorData.records.length > 0) {
    const brokerMap = {};
    for (const r of floorData.records) {
      const s = r.symbol;
      if (!s) continue;

      if (r.buyerBroker) {
        const bNo = r.buyerBroker;
        if (!brokerMap[bNo]) brokerMap[bNo] = { brokerNo: bNo, buyStocks: {}, sellStocks: {} };
        if (!brokerMap[bNo].buyStocks[s]) brokerMap[bNo].buyStocks[s] = { symbol: s, qty: 0, amt: 0, rate: 0, rateCount: 0 };
        const st = brokerMap[bNo].buyStocks[s];
        st.qty += r.quantity;
        st.amt += r.amount;
        st.rate += r.rate;
        st.rateCount++;
      }
      if (r.sellerBroker) {
        const bNo = r.sellerBroker;
        if (!brokerMap[bNo]) brokerMap[bNo] = { brokerNo: bNo, buyStocks: {}, sellStocks: {} };
        if (!brokerMap[bNo].sellStocks[s]) brokerMap[bNo].sellStocks[s] = { symbol: s, qty: 0, amt: 0, rate: 0, rateCount: 0 };
        const st = brokerMap[bNo].sellStocks[s];
        st.qty += r.quantity;
        st.amt += r.amount;
        st.rate += r.rate;
        st.rateCount++;
      }
    }

    const brokers = Object.values(brokerMap).map(b => {
      const topBuys = Object.values(b.buyStocks).sort((a, b) => b.amt - a.amt).slice(0, 5).map(x => ({
        symbol: x.symbol, qty: x.qty, amt: x.amt, rate: x.rateCount > 0 ? Math.round(x.rate / x.rateCount) : 0,
      }));
      const topSells = Object.values(b.sellStocks).sort((a, b) => b.amt - a.amt).slice(0, 5).map(x => ({
        symbol: x.symbol, qty: x.qty, amt: x.amt, rate: x.rateCount > 0 ? Math.round(x.rate / x.rateCount) : 0,
      }));
      const turnover = topBuys.reduce((s, x) => s + x.amt, 0) + topSells.reduce((s, x) => s + x.amt, 0);
      const volume = topBuys.reduce((s, x) => s + x.qty, 0) + topSells.reduce((s, x) => s + x.qty, 0);
      return { brokerNo: b.brokerNo, turnover, volume, topBuys, topSells };
    });

    brokers.sort((a, b) => sortBy === "volume" ? b.volume - a.volume : b.turnover - a.turnover);
    res.json({ date: floorData.date, source: "floorsheet", sortBy, brokers });
  } else {
    res.json({ date: null, source: "empty", sortBy, brokers: [], message: "No floorsheet data available. Run the scraper first." });
  }
});

app.get("/api/brokers/:brokerNo", (req, res) => {
  const brokerNo = parseInt(req.params.brokerNo);
  if (brokerNo < 1 || brokerNo > 91) return res.status(400).json({ error: "Broker number must be 1-91" });
  const floorData = readFloorsheet();
  if (!floorData.records || floorData.records.length === 0) {
    return res.json({ broker: { brokerNo, name: `Broker ${brokerNo}`, turnover: 0, volume: 0, netBuy: 0, netSell: 0, buyCount: 0, sellCount: 0, stocks: [] }, history: [], date: null, source: "empty", message: "No floorsheet data available." });
  }
  const brokerMap = {};
  for (const r of floorData.records) {
    if (r.buyerBroker === brokerNo) {
      if (!brokerMap[r.symbol]) brokerMap[r.symbol] = { symbol: r.symbol, buyQty: 0, sellQty: 0, buyAmt: 0, sellAmt: 0 };
      brokerMap[r.symbol].buyQty += r.quantity;
      brokerMap[r.symbol].buyAmt += r.amount;
    }
    if (r.sellerBroker === brokerNo) {
      if (!brokerMap[r.symbol]) brokerMap[r.symbol] = { symbol: r.symbol, buyQty: 0, sellQty: 0, buyAmt: 0, sellAmt: 0 };
      brokerMap[r.symbol].sellQty += r.quantity;
      brokerMap[r.symbol].sellAmt += r.amount;
    }
  }
  const stocks = Object.values(brokerMap).sort((a, b) => (b.buyAmt + b.sellAmt) - (a.buyAmt + a.sellAmt));
  const turnover = stocks.reduce((s, st) => s + st.buyAmt + st.sellAmt, 0);
  const volume = stocks.reduce((s, st) => s + st.buyQty + st.sellQty, 0);
  const netBuy = stocks.reduce((s, st) => s + st.buyAmt, 0);
  const netSell = stocks.reduce((s, st) => s + st.sellAmt, 0);
  res.json({ broker: { brokerNo, name: `Broker ${brokerNo}`, turnover, volume, netBuy, netSell, buyCount: stocks.filter(s => s.buyQty > 0).length, sellCount: stocks.filter(s => s.sellQty > 0).length, stocks }, history: [], date: floorData.date, source: "floorsheet" });
});

// ═══════════════════════════════════════════════════════════
// BROKER HOLDINGS - Which stocks did each broker trade most
// ═══════════════════════════════════════════════════════════

const BROKER_STOCKS = [
  "NABIL","EBL","SBI","NICA","GBIME","HBL","KBL","NMB","SCB","SANIMA",
  "ADBL","BPCL","CHCL","CBL","MBL","NBL","PCBL","PRVU","SHINE","KSBBL",
  "NLIC","LICN","CFCL","NIFRA","JFL","OHL","HIDCL","NHPC","UMHL","UPCL",
  "AKPL","GHL","KKHC","HURJA","GMFIL","PFL","GLICL","SBL","NCCB","CCBL",
];

function generateBrokerHoldings(brokerNo) {
  const today = new Date();
  const nepalTime = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
  const dateStr = nepalTime.toISOString().split("T")[0];
  const numStocks = 8 + (brokerNo % 7);
  const stocks = [];
  for (let i = 0; i < numStocks; i++) {
    const stockIdx = (brokerNo * 13 + i * 37) % BROKER_STOCKS.length;
    const symbol = BROKER_STOCKS[stockIdx];
    const hash = (brokerNo * 7919 + i * 1337) % 10000;
    const buyQty = 100 + (hash * 31) % 50000;
    const sellQty = 50 + (hash * 47) % 45000;
    const avgRate = 500 + (hash % 2000);
    const buyAmt = buyQty * avgRate;
    const sellAmt = sellQty * avgRate;
    const netQty = buyQty - sellQty;
    const netAmt = buyAmt - sellAmt;
    stocks.push({
      symbol,
      buyQty,
      sellQty,
      buyAmt,
      sellAmt,
      netQty,
      netAmt,
      avgRate,
      trades: 5 + (hash % 30),
    });
  }
  stocks.sort((a, b) => Math.abs(b.buyAmt + b.sellAmt) - Math.abs(a.buyAmt + a.sellAmt));
  return { brokerNo, date: dateStr, holdings: stocks };
}

function generateTopStocksByBroker() {
  const today = new Date();
  const nepalTime = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
  const dateStr = nepalTime.toISOString().split("T")[0];
  const stockMap = {};

  for (let brokerNo = 1; brokerNo <= 91; brokerNo++) {
    const numStocks = 4 + (brokerNo % 5);
    for (let i = 0; i < numStocks; i++) {
      const stockIdx = (brokerNo * 13 + i * 37) % BROKER_STOCKS.length;
      const symbol = BROKER_STOCKS[stockIdx];
      const hash = (brokerNo * 7919 + i * 1337) % 10000;
      const buyQty = 100 + (hash * 31) % 50000;
      const sellQty = 50 + (hash * 47) % 45000;
      const avgRate = 500 + (hash % 2000);
      const buyAmt = buyQty * avgRate;
      const sellAmt = sellQty * avgRate;
      const netQty = buyQty - sellQty;

      if (!stockMap[symbol]) {
        stockMap[symbol] = { symbol, totalBuyQty: 0, totalSellQty: 0, totalBuyAmt: 0, totalSellAmt: 0, topBuyer: { brokerNo: 0, amount: 0 }, topSeller: { brokerNo: 0, amount: 0 }, brokerCount: 0 };
      }
      const s = stockMap[symbol];
      s.totalBuyQty += buyQty;
      s.totalSellQty += sellQty;
      s.totalBuyAmt += buyAmt;
      s.totalSellAmt += sellAmt;
      s.brokerCount++;
      if (buyAmt > s.topBuyer.amount) s.topBuyer = { brokerNo, amount: buyAmt };
      if (sellAmt > s.topSeller.amount) s.topSeller = { brokerNo, amount: sellAmt };
    }
  }

  const stocks = Object.values(stockMap);
  stocks.sort((a, b) => (b.totalBuyAmt + b.totalSellAmt) - (a.totalBuyAmt + a.totalSellAmt));
  return { date: dateStr, stocks: stocks.slice(0, 30) };
}

app.get("/api/brokers/:brokerNo/holdings", (req, res) => {
  const brokerNo = parseInt(req.params.brokerNo);
  if (brokerNo < 1 || brokerNo > 91) return res.status(400).json({ error: "Broker number must be 1-91" });

  const floorData = readFloorsheet();
  let holdings = [];

  if (floorData.records && floorData.records.length > 0) {
    const stockMap = {};
    for (const r of floorData.records) {
      const s = r.symbol;
      if (!s) continue;

      if (r.buyerBroker === brokerNo) {
        if (!stockMap[s]) stockMap[s] = { symbol: s, buyQty: 0, sellQty: 0, buyAmt: 0, sellAmt: 0, avgRate: 0, rateSum: 0, rateCount: 0, trades: 0 };
        stockMap[s].buyQty += r.quantity;
        stockMap[s].buyAmt += r.amount;
        stockMap[s].rateSum += r.rate;
        stockMap[s].rateCount++;
        stockMap[s].trades++;
      }
      if (r.sellerBroker === brokerNo) {
        if (!stockMap[s]) stockMap[s] = { symbol: s, buyQty: 0, sellQty: 0, buyAmt: 0, sellAmt: 0, avgRate: 0, rateSum: 0, rateCount: 0, trades: 0 };
        stockMap[s].sellQty += r.quantity;
        stockMap[s].sellAmt += r.amount;
        stockMap[s].rateSum += r.rate;
        stockMap[s].rateCount++;
        stockMap[s].trades++;
      }
    }
    holdings = Object.values(stockMap).map(h => ({
      symbol: h.symbol,
      buyQty: h.buyQty,
      sellQty: h.sellQty,
      buyAmt: h.buyAmt,
      sellAmt: h.sellAmt,
      netQty: h.buyQty - h.sellQty,
      netAmt: h.buyAmt - h.sellAmt,
      avgRate: h.rateCount > 0 ? Math.round(h.rateSum / h.rateCount) : 0,
      trades: h.trades,
    }));
    holdings.sort((a, b) => Math.abs(b.buyAmt + b.sellAmt) - Math.abs(a.buyAmt + a.sellAmt));
    res.json({ brokerNo, date: floorData.date, source: "floorsheet", holdings });
  } else {
    res.json({ brokerNo, date: null, source: "empty", holdings: [], message: "No floorsheet data available." });
  }
});

app.get("/api/brokers/holdings/top-stocks", (req, res) => {
  const floorData = readFloorsheet();

  if (floorData.records && floorData.records.length > 0) {
    const stockMap = {};
    for (const r of floorData.records) {
      const s = r.symbol;
      if (!s) continue;
      if (!stockMap[s]) stockMap[s] = { symbol: s, totalBuyQty: 0, totalSellQty: 0, totalBuyAmt: 0, totalSellAmt: 0, topBuyer: { brokerNo: 0, amount: 0 }, topSeller: { brokerNo: 0, amount: 0 }, brokerCount: new Set(), totalTrades: 0 };
      const st = stockMap[s];

      if (r.buyerBroker) {
        st.totalBuyQty += r.quantity;
        st.totalBuyAmt += r.amount;
        st.brokerCount.add(r.buyerBroker);
        st.totalTrades++;
        if (r.amount > st.topBuyer.amount) st.topBuyer = { brokerNo: r.buyerBroker, amount: r.amount };
      }
      if (r.sellerBroker) {
        st.totalSellQty += r.quantity;
        st.totalSellAmt += r.amount;
        st.brokerCount.add(r.sellerBroker);
        st.totalTrades++;
        if (r.amount > st.topSeller.amount) st.topSeller = { brokerNo: r.sellerBroker, amount: r.amount };
      }
    }
    const stocks = Object.values(stockMap).map(s => ({
      ...s,
      brokerCount: s.brokerCount.size,
      netQty: s.totalBuyQty - s.totalSellQty,
      netAmt: s.totalBuyAmt - s.totalSellAmt,
    }));
    stocks.sort((a, b) => (b.totalBuyAmt + b.totalSellAmt) - (a.totalBuyAmt + a.totalSellAmt));
    res.json({ date: floorData.date, source: "floorsheet", stocks: stocks.slice(0, 30) });
  } else {
    res.json({ date: null, source: "empty", stocks: [], message: "No floorsheet data available." });
  }
});

// ═══════════════════════════════════════════════════════════
// BROKER TOP TRADES - Top 5 buys/sells per broker (by turnover & volume)
// ═══════════════════════════════════════════════════════════

function generateBrokerTopTrades() {
  const today = new Date();
  const nepalTime = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
  const dateStr = nepalTime.toISOString().split("T")[0];
  const brokerCount = 91;
  const brokers = [];

  for (let i = 1; i <= brokerCount; i++) {
    const numStocks = 10 + (i % 8);
    const buyStocks = [];
    const sellStocks = [];
    for (let j = 0; j < numStocks; j++) {
      const stockIdx = (i * 13 + j * 37) % BROKER_STOCKS.length;
      const symbol = BROKER_STOCKS[stockIdx];
      const hash = (i * 7919 + j * 1337) % 10000;
      const buyQty = 100 + (hash * 31) % 50000;
      const sellQty = 50 + (hash * 47) % 45000;
      const avgRate = 500 + (hash % 2000);
      const buyAmt = buyQty * avgRate;
      const sellAmt = sellQty * avgRate;
      buyStocks.push({ symbol, qty: buyQty, amt: buyAmt, rate: avgRate });
      sellStocks.push({ symbol, qty: sellQty, amt: sellAmt, rate: avgRate });
    }
    buyStocks.sort((a, b) => b.amt - a.amt);
    sellStocks.sort((a, b) => b.amt - a.amt);
    const turnover = buyStocks.slice(0, 5).reduce((s, x) => s + x.amt, 0) + sellStocks.slice(0, 5).reduce((s, x) => s + x.amt, 0);
    const volume = buyStocks.slice(0, 5).reduce((s, x) => s + x.qty, 0) + sellStocks.slice(0, 5).reduce((s, x) => s + x.qty, 0);
    brokers.push({
      brokerNo: i,
      turnover,
      volume,
      topBuys: buyStocks.slice(0, 5),
      topSells: sellStocks.slice(0, 5),
    });
  }

  return { date: dateStr, brokers };
}

app.get("/api/brokers/history/overview", (req, res) => {
  const days = parseInt(req.query.days) || 30;
  res.json({ history: [], topBuyers: [], topSellers: [], days, message: "Historical broker data requires historical floorsheet data." });
});

// ============ FLOORSHEET ============
const FLOORSHEET_FILE = path.join(__dirname, "..", "data", "floorsheet.json");

function readFloorsheet() {
  try {
    if (fs.existsSync(FLOORSHEET_FILE)) {
      return JSON.parse(fs.readFileSync(FLOORSHEET_FILE, "utf8"));
    }
  } catch {}
  return { date: null, records: [], totalRecords: 0 };
}

app.get("/api/floorsheet", (req, res) => {
  const { symbol, page, limit, sortBy, sortDir } = req.query;
  const data = readFloorsheet();
  let records = [...data.records];

  if (symbol) {
    const s = symbol.toUpperCase();
    records = records.filter((r) => r.symbol === s);
  }

  if (sortBy) {
    const dir = sortDir === "asc" ? 1 : -1;
    records.sort((a, b) => {
      if (sortBy === "amount") return ((a.amount || 0) - (b.amount || 0)) * dir;
      if (sortBy === "quantity") return ((a.quantity || 0) - (b.quantity || 0)) * dir;
      if (sortBy === "rate") return ((a.rate || 0) - (b.rate || 0)) * dir;
      if (sortBy === "symbol") return a.symbol.localeCompare(b.symbol) * dir;
      if (sortBy === "contractNo") return a.contractNo.localeCompare(b.contractNo) * dir;
      return ((a.sn || 0) - (b.sn || 0)) * dir;
    });
  }

  const total = records.length;
  const pageNum = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 50;
  const start = (pageNum - 1) * pageSize;
  const paged = records.slice(start, start + pageSize);

  // Summary stats
  const symbols = [...new Set(records.map((r) => r.symbol))];
  const totalAmount = records.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalQty = records.reduce((sum, r) => sum + (r.quantity || 0), 0);

  res.json({
    date: data.date,
    totalRecords: total,
    page: pageNum,
    pages: Math.ceil(total / pageSize),
    summary: {
      uniqueSymbols: symbols.length,
      totalAmount,
      totalQuantity: totalQty,
    },
    records: paged,
  });
});

app.get("/api/floorsheet/scrape", rateLimit, async (req, res) => {
  const timestamp = new Date().toISOString();
  broadcast({ type: "floorsheet_scrape_started", timestamp });

  try {
    const today = new Date().toISOString().slice(0, 10);
    const NEPSE_FLOOR_URL = "https://www.nepalstock.com.np/api/nots/nepse-data/floorsheet";

    let records = [];
    let fetchDate = today;

    const fetchPage = async (pageNo = 1) => {
      const url = `${NEPSE_FLOOR_URL}?page=${pageNo}&size=500`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      try {
        const resp = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json",
          },
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return await resp.json();
      } finally {
        clearTimeout(timer);
      }
    };

    const firstPage = await fetchPage(1);
    const dataKey = Object.keys(firstPage).find((k) => Array.isArray(firstPage[k]));
    const firstData = dataKey ? firstPage[dataKey] : firstPage.data || firstPage.content || firstPage.records || [];
    const totalRecords = firstPage.totalRecords || firstPage.total || firstPage.totalElements || firstData.length;

    for (const r of firstData) {
      records.push({
        sn: r.sn || r.SN || r.id || records.length + 1,
        contractNo: r.contractNo || r.ContractNo || r.contract_no || "",
        symbol: (r.symbol || r.Symbol || r.stockSymbol || "").toString().trim(),
        buyerBroker: parseInt(r.buyerBroker || r.BuyerBroker || r.buyer_broker || 0),
        sellerBroker: parseInt(r.sellerBroker || r.SellerBroker || r.seller_broker || 0),
        quantity: parseInt(r.quantity || r.Quantity || r.totalQuantity || 0),
        rate: parseFloat(r.rate || r.Rate || r.lastTradedPrice || 0),
        amount: parseFloat(r.amount || r.Amount || r.totalAmount || 0),
      });
    }

    if (firstData.length > 0 && firstData[0].businessDate) {
      fetchDate = firstData[0].businessDate.slice(0, 10);
    }

    const totalPages = Math.ceil((totalRecords || 0) / 500);
    for (let p = 2; p <= totalPages && p <= 20; p++) {
      try {
        const pageData = await fetchPage(p);
        const rows = pageData[dataKey] || pageData.data || pageData.content || pageData.records || [];
        for (const r of rows) {
          records.push({
            sn: r.sn || r.SN || r.id || records.length + 1,
            contractNo: r.contractNo || r.ContractNo || r.contract_no || "",
            symbol: (r.symbol || r.Symbol || r.stockSymbol || "").toString().trim(),
            buyerBroker: parseInt(r.buyerBroker || r.BuyerBroker || r.buyer_broker || 0),
            sellerBroker: parseInt(r.sellerBroker || r.SellerBroker || r.seller_broker || 0),
            quantity: parseInt(r.quantity || r.Quantity || r.totalQuantity || 0),
            rate: parseFloat(r.rate || r.Rate || r.lastTradedPrice || 0),
            amount: parseFloat(r.amount || r.Amount || r.totalAmount || 0),
          });
        }
        if (rows.length > 0 && rows[0].businessDate) {
          fetchDate = rows[0].businessDate.slice(0, 10);
        }
      } catch {
        break;
      }
    }

    records = records.filter((r) => r.symbol);

    const output = { date: fetchDate, records, totalRecords: records.length };
    const dir = path.dirname(FLOORSHEET_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FLOORSHEET_FILE, JSON.stringify(output, null, 2));

    broadcast({ type: "floorsheet_scrape_complete", timestamp: new Date().toISOString(), result: { date: fetchDate, totalRecords: records.length } });
    res.json({ message: "Floorsheet scrape completed", timestamp, result: { date: fetchDate, totalRecords: records.length } });
  } catch (err) {
    console.error("Floorsheet scrape error:", err.message);
    broadcast({ type: "floorsheet_scrape_error", timestamp: new Date().toISOString(), error: err.message });
    res.status(500).json({ error: "Floorsheet scrape failed", details: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// BROKER ANALYSIS - Advanced broker analytics endpoints
// ═══════════════════════════════════════════════════════════

function generateBrokerTrendData(days) {
  const history = [];
  const baseDate = new Date();
  const brokerCount = 91;
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateStr = date.toISOString().split("T")[0];
    const dayHash = (d * 1337 + 42) % 10000;
    const brokers = [];
    for (let i = 1; i <= brokerCount; i++) {
      const hash = ((i * 7919 + d * 31) % 10000);
      const buyQty = 5000 + (hash * 31) % 500000;
      const buyAmt = buyQty * (800 + (hash % 1500));
      const sellQty = 3000 + (hash * 47) % 480000;
      const sellAmt = sellQty * (800 + (hash % 1500));
      const turnover = buyAmt + sellAmt;
      const netQty = buyQty - sellQty;
      brokers.push({ brokerNo: i, buyQty, buyAmt, sellQty, sellAmt, turnover, netQty });
    }
    const totalBuyAmt = brokers.reduce((s, b) => s + b.buyAmt, 0);
    const totalSellAmt = brokers.reduce((s, b) => s + b.sellAmt, 0);
    const totalBuyQty = brokers.reduce((s, b) => s + b.buyQty, 0);
    const totalSellQty = brokers.reduce((s, b) => s + b.sellQty, 0);
    const netBuyers = brokers.filter(b => b.netQty > 0).length;
    const netSellers = brokers.filter(b => b.netQty < 0).length;
    history.push({
      date: dateStr, totalBuyAmt, totalSellAmt, totalBuyQty, totalSellQty,
      netBuyers, netSellers, turnover: totalBuyAmt + totalSellAmt,
      topBuyers: brokers.sort((a, b) => b.buyAmt - a.buyAmt).slice(0, 5).map(b => ({ brokerNo: b.brokerNo, buyAmt: b.buyAmt, turnover: b.turnover })),
      topSellers: brokers.sort((a, b) => b.sellAmt - a.sellAmt).slice(0, 5).map(b => ({ brokerNo: b.brokerNo, sellAmt: b.sellAmt, turnover: b.turnover })),
      brokerDetail: brokers,
    });
  }
  return history;
}

app.get("/api/brokers/analysis/trends", (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 90);
  const brokerNos = req.query.brokers ? req.query.brokers.split(",").map(Number).filter(n => n >= 1 && n <= 91) : [];
  res.json({ marketTrend: [], brokerTrends: {}, days, brokerNos, message: "Historical broker trend data requires historical floorsheet data." });
});

app.get("/api/brokers/analysis/ranking", (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 90);
  const sortBy = req.query.sortBy || "score";
  res.json({ rankings: [], days, sortBy, totalBrokers: 0, message: "Broker ranking data requires historical floorsheet data." });
});

app.get("/api/brokers/analysis/compare", (req, res) => {
  const brokerNos = req.query.brokers ? req.query.brokers.split(",").map(Number).filter(n => n >= 1 && n <= 91) : [1, 2, 3];
  const days = Math.min(parseInt(req.query.days) || 30, 90);
  res.json({ comparisons: [], days, brokerNos, message: "Broker comparison data requires historical floorsheet data." });
});

app.get("/api/brokers/analysis/participation", (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 90);
  res.json({ participation: [], summary: { avgNetBuyers: 0, avgNetSellers: 0, avgBuySellRatio: 0, avgTurnover: 0, trendDirection: "neutral", totalDays: 0, bullishDays: 0, bearishDays: 0 }, topTurnoverDays: [], strongestBuyerDays: [], message: "Participation data requires historical floorsheet data." });
});

// ═══════════════════════════════════════════════════════════
// SCRAPER STATUS ENDPOINT
// ═══════════════════════════════════════════════════════════
app.get("/api/scraper-status", (req, res) => {
  try {
    res.json(dataProvider.scraperStatus);
  } catch (err) {
    res.json({ scrapers: {}, error: err.message });
  }
});

const VALID_SCRAPERS = ["fundamentals", "ipo", "dividends", "mutual_funds", "debentures", "insider_trading", "earnings", "brokers", "holdings", "nepse_index", "announcements"];
app.post("/api/scrapers/run/:name", rateLimit, async (req, res) => {
  const { name } = req.params;
  if (!VALID_SCRAPERS.includes(name)) {
    return res.status(400).json({ error: `Invalid scraper. Valid: ${VALID_SCRAPERS.join(", ")}` });
  }
  try {
    const fnMap = {
      fundamentals: () => dataProvider.getFundamentals(null, true),
      ipo: () => dataProvider.getIPO(true),
      dividends: () => dataProvider.getDividends(null, true),
      mutual_funds: () => dataProvider.getMutualFunds(true),
      debentures: () => dataProvider.getDebentures(true),
      insider_trading: () => dataProvider.getInsiderTrading(true),
      earnings: () => dataProvider.getEarningsCalendar(true),
      brokers: () => dataProvider.getBrokers(true),
      holdings: () => dataProvider.getHoldings(null, true),
      nepse_index: () => dataProvider.getNepseIndex(true),
      announcements: () => dataProvider.getAnnouncements(true),
    };
    const result = await fnMap[name]();
    res.json({ status: "ok", scraper: name, count: Array.isArray(result) ? result.length : Object.keys(result || {}).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// INSTITUTIONAL FLOW ENDPOINT
// ═══════════════════════════════════════════════════════════
app.get("/api/institutional-flow", rateLimit, (req, res) => {
  res.json([]);
});

// ═══════════════════════════════════════════════════════════
// EARNINGS ENDPOINT
// ═══════════════════════════════════════════════════════════
app.get("/api/earnings", rateLimit, async (req, res) => {
  try {
    const data = await dataProvider.getEarningsCalendar();
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Earnings endpoint error:", err.message);
    res.json([]);
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
  console.log(`WebSocket running on ws://localhost:${PORT}/ws`);
  scrapeLatestPrices()
    .catch((err) => console.error("[SCRAPE] Startup scrape failed:", err.message))
    .then(() => preloadAllCompanyData())
    .then(() => {
      console.log("Data preload complete");
    })
    .catch((err) => {
      console.error("Failed to preload data from Supabase:", err.message);
      console.log("Running with empty data cache");
    });
  try {
    const { startScheduler } = require("./cron-scheduler");
    startScheduler(scrapeLatestPrices);
  } catch (e) {
    console.error("Cron scheduler failed to start:", e.message);
  }
});
