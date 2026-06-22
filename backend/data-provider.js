/**
 * Data Provider - Wraps Python scrapers with caching and fallback.
 * Falls back to synthetic data if real scraping fails.
 */
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "..", "..", "data", "cache");
const SCRAPER_DIR = path.join(__dirname, "..", "scrapers");
const SCRAPER_TIMEOUT = 60000;

// Ensure cache dir exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const scraperStatus = {};

/**
 * Run a Python scraper and return parsed JSON output.
 */
function runScraper(scriptName, args = [], timeout = SCRAPER_TIMEOUT) {
  return new Promise((resolve) => {
    const scriptPath = path.join(SCRAPER_DIR, scriptName);
    const pythonArgs = [scriptPath, ...args];

    execFile("python", pythonArgs, { timeout, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        console.error(`Scraper ${scriptName} failed:`, err.message);
        resolve({ error: err.message });
        return;
      }
      try {
        // Find JSON in output (scrapers print JSON to stdout)
        const lines = stdout.trim().split("\n");
        const jsonLine = lines.find((l) => l.startsWith("{") || l.startsWith("["));
        if (jsonLine) {
          resolve(JSON.parse(jsonLine));
        } else {
          // Try parsing entire output
          resolve(JSON.parse(stdout));
        }
      } catch (e) {
        console.error(`Scraper ${scriptName} parse error:`, e.message);
        resolve({ error: "Failed to parse scraper output" });
      }
    });
  });
}

/**
 * Read cached data from file.
 */
function readCache(key, maxAgeHours = 24) {
  const cacheFile = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(cacheFile)) return null;
  try {
    const cached = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    const age = (Date.now() - new Date(cached.timestamp).getTime()) / (1000 * 60 * 60);
    if (age < maxAgeHours) return cached.data;
  } catch {}
  return null;
}

/**
 * Write data to cache file.
 */
function writeCache(key, data) {
  const cacheFile = path.join(CACHE_DIR, `${key}.json`);
  fs.writeFileSync(cacheFile, JSON.stringify({ timestamp: new Date().toISOString(), data }));
}

/**
 * Track scraper status for health monitoring.
 */
function updateStatus(key, success, recordCount = 0) {
  scraperStatus[key] = {
    lastRun: new Date().toISOString(),
    success,
    recordCount,
    cached: !!readCache(key, 999),
  };
}

// ═══════════════════════════════════════════════════════════
// DATA PROVIDERS - Each returns real data or falls back to synthetic
// ═══════════════════════════════════════════════════════════

async function getFundamentals(symbols) {
  const cacheKey = "fundamentals";
  let data = readCache(cacheKey, 48);
  if (data) {
    updateStatus(cacheKey, true, Object.keys(data).length);
    return data;
  }

  try {
    const result = await runScraper("__main__.py", ["fundamentals", ...([])], 120000);
    if (result && !result.error) {
      writeCache(cacheKey, result);
      updateStatus(cacheKey, true, Object.keys(result).length);
      return result;
    }
  } catch (e) {
    console.error("Fundamentals scraper failed:", e.message);
  }

  updateStatus(cacheKey, false, 0);
  return generateSyntheticFundamentals(symbols);
}

async function getIPO() {
  const cacheKey = "ipo";
  let data = readCache(cacheKey, 24);
  if (data) {
    updateStatus(cacheKey, true, data.length);
    return data;
  }

  try {
    const result = await runScraper("__main__.py", ["ipo"]);
    if (Array.isArray(result) && result.length > 0 && !result[0]?.error) {
      writeCache(cacheKey, result);
      updateStatus(cacheKey, true, result.length);
      return result;
    }
  } catch (e) {
    console.error("IPO scraper failed:", e.message);
  }

  updateStatus(cacheKey, false, 0);
  return generateSyntheticIPO();
}

async function getDividends(symbols) {
  const cacheKey = "dividends";
  let data = readCache(cacheKey, 48);
  if (data) {
    updateStatus(cacheKey, true, Object.keys(data).length);
    return data;
  }

  try {
    const result = await runScraper("__main__.py", ["dividends"]);
    if (result && !result.error) {
      writeCache(cacheKey, result);
      updateStatus(cacheKey, true, Object.keys(result).length);
      return result;
    }
  } catch (e) {
    console.error("Dividends scraper failed:", e.message);
  }

  updateStatus(cacheKey, false, 0);
  return {};
}

async function getMutualFunds() {
  const cacheKey = "mutual_funds";
  let data = readCache(cacheKey, 24);
  if (data) {
    updateStatus(cacheKey, true, data.length);
    return data;
  }

  try {
    const result = await runScraper("__main__.py", ["mutual_funds"]);
    if (Array.isArray(result) && result.length > 0 && !result[0]?.error) {
      writeCache(cacheKey, result);
      updateStatus(cacheKey, true, result.length);
      return result;
    }
  } catch (e) {
    console.error("Mutual funds scraper failed:", e.message);
  }

  updateStatus(cacheKey, false, 0);
  return generateSyntheticMutualFunds();
}

async function getDebentures() {
  const cacheKey = "debentures";
  let data = readCache(cacheKey, 24);
  if (data) {
    updateStatus(cacheKey, true, data.length);
    return data;
  }

  try {
    const result = await runScraper("__main__.py", ["debentures"]);
    if (Array.isArray(result) && result.length > 0 && !result[0]?.error) {
      writeCache(cacheKey, result);
      updateStatus(cacheKey, true, result.length);
      return result;
    }
  } catch (e) {
    console.error("Debentures scraper failed:", e.message);
  }

  updateStatus(cacheKey, false, 0);
  return generateSyntheticDebentures();
}

async function getInsiderTrading() {
  const cacheKey = "insider_trading";
  let data = readCache(cacheKey, 12);
  if (data) {
    updateStatus(cacheKey, true, data.length);
    return data;
  }

  try {
    const result = await runScraper("__main__.py", ["insider_trading"]);
    if (Array.isArray(result) && result.length > 0 && !result[0]?.error) {
      writeCache(cacheKey, result);
      updateStatus(cacheKey, true, result.length);
      return result;
    }
  } catch (e) {
    console.error("Insider trading scraper failed:", e.message);
  }

  updateStatus(cacheKey, false, 0);
  return generateSyntheticInsiderTrading();
}

async function getEarningsCalendar() {
  const cacheKey = "earnings_calendar";
  let data = readCache(cacheKey, 24);
  if (data) {
    updateStatus(cacheKey, true, data.length);
    return data;
  }

  try {
    const result = await runScraper("__main__.py", ["earnings"]);
    if (Array.isArray(result) && result.length > 0 && !result[0]?.error) {
      writeCache(cacheKey, result);
      updateStatus(cacheKey, true, result.length);
      return result;
    }
  } catch (e) {
    console.error("Earnings scraper failed:", e.message);
  }

  updateStatus(cacheKey, false, 0);
  return generateSyntheticEarnings();
}

async function getBrokers() {
  const cacheKey = "brokers";
  let data = readCache(cacheKey, 12);
  if (data) {
    updateStatus(cacheKey, true, data.length);
    return data;
  }

  try {
    const result = await runScraper("__main__.py", ["brokers"]);
    if (Array.isArray(result) && result.length > 0 && !result[0]?.error) {
      writeCache(cacheKey, result);
      updateStatus(cacheKey, true, result.length);
      return result;
    }
  } catch (e) {
    console.error("Brokers scraper failed:", e.message);
  }

  updateStatus(cacheKey, false, 0);
  return generateSyntheticBrokers();
}

async function getHoldings(symbols) {
  const cacheKey = "holdings";
  let data = readCache(cacheKey, 48);
  if (data) {
    updateStatus(cacheKey, true, Object.keys(data).length);
    return data;
  }

  try {
    const result = await runScraper("__main__.py", ["holdings"]);
    if (result && !result.error) {
      writeCache(cacheKey, result);
      updateStatus(cacheKey, true, Object.keys(result).length);
      return result;
    }
  } catch (e) {
    console.error("Holdings scraper failed:", e.message);
  }

  updateStatus(cacheKey, false, 0);
  return generateSyntheticHoldings();
}

async function getAnnouncements() {
  const cacheKey = "announcements";
  let data = readCache(cacheKey, 6);
  if (data) {
    updateStatus(cacheKey, true, data.length);
    return data;
  }

  try {
    const result = await runScraper("__main__.py", ["announcements"]);
    if (Array.isArray(result) && result.length > 0 && !result[0]?.error) {
      writeCache(cacheKey, result);
      updateStatus(cacheKey, true, result.length);
      return result;
    }
  } catch (e) {
    console.error("Announcements scraper failed:", e.message);
  }

  updateStatus(cacheKey, false, 0);
  return generateSyntheticAnnouncements();
}

// ═══════════════════════════════════════════════════════════
// SYNTHETIC DATA GENERATORS (Fallback when scraping fails)
// ═══════════════════════════════════════════════════════════

function generateSyntheticFundamentals(symbols) {
  const CATEGORY_MAP = {
    ADBL: "Commercial Bank", NMB: "Commercial Bank", SBL: "Commercial Bank",
    NCCB: "Commercial Bank", KBL: "Commercial Bank", LBL: "Commercial Bank",
    MBL: "Commercial Bank", EBL: "Commercial Bank", NBB: "Commercial Bank",
    SBI: "Commercial Bank", HBL: "Commercial Bank", SCB: "Commercial Bank",
    NIB: "Commercial Bank", NABIL: "Commercial Bank", CZBIL: "Commercial Bank",
    PCBL: "Commercial Bank", SRBL: "Commercial Bank", SANIMA: "Commercial Bank",
    MEGA: "Commercial Bank", CBL: "Commercial Bank", CCBL: "Commercial Bank",
    NBL: "Commercial Bank", GBIME: "Commercial Bank", NICA: "Commercial Bank",
    PRVU: "Commercial Bank", BOKL: "Commercial Bank",
  };
  const sectorMultiples = {
    "Commercial Bank": { pe: [8, 15], pb: [1.0, 2.5], eps: [15, 45], roe: [12, 22], dividendYield: [2, 8] },
    "Development Bank": { pe: [10, 18], pb: [1.2, 3.0], eps: [20, 50], roe: [10, 18], dividendYield: [1, 6] },
    "Finance": { pe: [8, 14], pb: [0.8, 2.0], eps: [25, 60], roe: [8, 15], dividendYield: [0, 5] },
    "Hydropower": { pe: [15, 35], pb: [1.5, 4.0], eps: [5, 25], roe: [8, 20], dividendYield: [0, 4] },
    "Life Insurance": { pe: [10, 20], pb: [1.5, 3.5], eps: [30, 70], roe: [15, 25], dividendYield: [2, 7] },
    "Other": { pe: [8, 18], pb: [1.0, 2.5], eps: [10, 35], roe: [8, 16], dividendYield: [1, 5] },
  };
  const targetSyms = symbols || Object.keys(CATEGORY_MAP);
  const result = {};
  for (const sym of targetSyms) {
    const category = CATEGORY_MAP[sym] || "Other";
    const m = sectorMultiples[category] || sectorMultiples["Other"];
    const hash = sym.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const eps = m.eps[0] + ((hash * 7) % (m.eps[1] - m.eps[0]));
    const pe = 100 / eps;
    const pb = m.pb[0] + ((hash * 3) % ((m.pb[1] - m.pb[0]) * 10)) / 10;
    const roe = m.roe[0] + ((hash * 11) % (m.roe[1] - m.roe[0]));
    const dy = m.dividendYield[0] + ((hash * 5) % (m.dividendYield[1] - m.dividendYield[0]));
    result[sym] = {
      symbol: sym, category, pe: Math.round(pe * 100) / 100, eps: Math.round(eps * 100) / 100,
      pb: Math.round(pb * 100) / 100, roe: Math.round(roe * 100) / 100,
      roce: Math.round((roe + 2 + ((hash * 29) % 5)) * 100) / 100,
      dividendYield: Math.round(dy * 100) / 100,
      debtToEquity: Math.round((0.5 + ((hash * 13) % 200) / 100) * 100) / 100,
      bookValue: Math.round((100 / pb) * 100) / 100,
      marketCap: Math.round(100 * (5000000 + ((hash * 17) % 50000000))),
      beta: Math.round((0.6 + ((hash * 43) % 10) / 10) * 100) / 100,
      fiftyTwoWeekHigh: Math.round(100 * (1.1 + ((hash * 19) % 30) / 100) * 100) / 100,
      fiftyTwoWeekLow: Math.round(100 * (0.6 + ((hash * 23) % 30) / 100) * 100) / 100,
    };
  }
  return result;
}

function generateSyntheticIPO() {
  const names = [
    { symbol: "HRL", name: "Himalaya Rice Ltd", sector: "Agro/Food", issuePrice: 100 },
    { symbol: "SKBBL", name: "Sunrise Kupondole Bank", sector: "Commercial Bank", issuePrice: 100 },
    { symbol: "UPCL", name: "Upper Power Company", sector: "Hydropower", issuePrice: 100 },
    { symbol: "KMCDB", name: "Kathmandu Metropolitan Commercial", sector: "Commercial Bank", issuePrice: 100 },
    { symbol: "NBIL", name: "Nepal Bilash Industries", sector: "Manufacturing", issuePrice: 100 },
    { symbol: "TPC", name: "Trishuli Power Corporation", sector: "Hydropower", issuePrice: 100 },
    { symbol: "MHL", name: "Mountain Helpline Services", sector: "Tourism/Hospitality", issuePrice: 100 },
    { symbol: "GBPBL", name: "Gautam Buddha Power Bank", sector: "Development Bank", issuePrice: 100 },
    { symbol: "NLGL", name: "Nepal Life General Insurance", sector: "Non-Life Insurance", issuePrice: 100 },
    { symbol: "AKPL", name: "Arun Kabeli Power", sector: "Hydropower", issuePrice: 100 },
    { symbol: "BNLICL", name: "Buddha Nepal Life Insurance", sector: "Life Insurance", issuePrice: 100 },
    { symbol: "SMFCL", name: "Sagarmatha Microfinance", sector: "Finance", issuePrice: 100 },
  ];
  return names.map((n, i) => ({
    ...n,
    issueDate: `2025-${String((i % 12) + 1).padStart(2, "0")}-${String(10 + (i * 3) % 20).padStart(2, "0")}`,
    status: i < 8 ? "Listed" : "Upcoming",
    lots: 10 + (i * 5),
    price: 100 + Math.round((Math.random() - 0.3) * 50),
    change: Math.round((Math.random() - 0.5) * 10 * 100) / 100,
  }));
}

function generateSyntheticMutualFunds() {
  return [
    { symbol: "MMF1", name: "Mega Mutual Fund-1", category: "Open End", nav: 125.5, aum: 2500000000, expenseRatio: 1.5, manager: "Nepal Investment Bank" },
    { symbol: "NIMB1", name: "NIMB Equity Fund", category: "Open End", nav: 145.8, aum: 3200000000, expenseRatio: 1.8, manager: "NIMB Bank" },
    { symbol: "SBL1", name: "SBL Balance Fund", category: "Open End", nav: 112.3, aum: 1800000000, expenseRatio: 1.2, manager: "Siddhartha Bank" },
    { symbol: "NABIL1", name: "NABIL Growth Fund", category: "Open End", nav: 168.9, aum: 4500000000, expenseRatio: 2.0, manager: "Nabil Bank" },
    { symbol: "SANIMA1", name: "Sanima Equity Fund", category: "Open End", nav: 132.4, aum: 2100000000, expenseRatio: 1.6, manager: "Sanima Bank" },
    { symbol: "HBL1", name: "HBL Balanced Fund", category: "Open End", nav: 98.7, aum: 1200000000, expenseRatio: 1.3, manager: "Himalayan Bank" },
    { symbol: "KBL1", name: "Kumari Growth Fund", category: "Open End", nav: 156.2, aum: 2800000000, expenseRatio: 1.7, manager: "Kumari Bank" },
    { symbol: "MBL1", name: "Machhapuchhre Fund", category: "Open End", nav: 108.5, aum: 1500000000, expenseRatio: 1.4, manager: "Machhapuchhre Bank" },
  ];
}

function generateSyntheticDebentures() {
  return [
    { symbol: "DEB001", name: "Nepal Electricity Authority Debenture", issuer: "NEA", couponRate: 8.5, maturityDate: "2030-12-31", faceValue: 1000, creditRating: "AA+" },
    { symbol: "DEB002", name: "Himalayan Power Debenture", issuer: "HPL", couponRate: 9.0, maturityDate: "2032-06-30", faceValue: 1000, creditRating: "AA" },
    { symbol: "DEB003", name: "Nepal Telecom Bond", issuer: "NTC", couponRate: 7.5, maturityDate: "2028-12-31", faceValue: 1000, creditRating: "AAA" },
    { symbol: "DEB004", name: "Banking Sector Debenture", issuer: "NRAA", couponRate: 8.0, maturityDate: "2029-09-30", faceValue: 1000, creditRating: "AA+" },
    { symbol: "DEB005", name: "Infrastructure Bond 2025", issuer: "Govt", couponRate: 9.5, maturityDate: "2035-12-31", faceValue: 1000, creditRating: "AAA" },
  ];
}

function generateSyntheticInsiderTrading() {
  return [
    { id: 1, symbol: "NMB", insiderName: "Ram Kumar Shrestha", designation: "Managing Director", transactionType: "Buy", quantity: 5000, price: 242.5, totalValue: 1212500, date: "2026-06-18" },
    { id: 2, symbol: "NABIL", insiderName: "Sita Gurung", designation: "CFO", transactionType: "Sell", quantity: 2000, price: 530.0, totalValue: 1060000, date: "2026-06-17" },
    { id: 3, symbol: "EBL", insiderName: "Hari Prasad Adhikari", designation: "Board Member", transactionType: "Buy", quantity: 10000, price: 695.0, totalValue: 6950000, date: "2026-06-16" },
    { id: 4, symbol: "SCB", insiderName: "Anita Thapa", designation: "CEO", transactionType: "Sell", quantity: 3000, price: 648.0, totalValue: 1944000, date: "2026-06-15" },
    { id: 5, symbol: "SANIMA", insiderName: "Prakash Chand", designation: "Director", transactionType: "Buy", quantity: 8000, price: 359.0, totalValue: 2872000, date: "2026-06-14" },
  ];
}

function generateSyntheticEarnings() {
  return [
    { symbol: "NMB", companyName: "Nepal Bangladesh Bank", sector: "Commercial Bank", reportType: "Q4 FY2025/26", announcementDate: "2026-07-15", fiscalYear: "2025/26", estimatedEPS: 28.5, previousEPS: 25.2 },
    { symbol: "NABIL", companyName: "Nabil Bank", sector: "Commercial Bank", reportType: "Q4 FY2025/26", announcementDate: "2026-07-14", fiscalYear: "2025/26", estimatedEPS: 42.8, previousEPS: 38.5 },
    { symbol: "EBL", companyName: "Everest Bank", sector: "Commercial Bank", reportType: "Q4 FY2025/26", announcementDate: "2026-07-13", fiscalYear: "2025/26", estimatedEPS: 55.2, previousEPS: 50.1 },
    { symbol: "SCB", companyName: "Standard Chartered Bank", sector: "Commercial Bank", reportType: "Q4 FY2025/26", announcementDate: "2026-07-12", fiscalYear: "2025/26", estimatedEPS: 68.5, previousEPS: 62.3 },
    { symbol: "SANIMA", companyName: "Sanima Bank", sector: "Commercial Bank", reportType: "Q4 FY2025/26", announcementDate: "2026-07-11", fiscalYear: "2025/26", estimatedEPS: 35.2, previousEPS: 31.8 },
  ];
}

function generateSyntheticBrokers() {
  return Array.from({ length: 50 }, (_, i) => ({
    brokerNo: i + 1,
    name: `Broker ${i + 1}`,
    buyAmount: Math.round(Math.random() * 100000000),
    sellAmount: Math.round(Math.random() * 100000000),
    totalAmount: Math.round(Math.random() * 200000000),
    transactions: Math.floor(Math.random() * 5000),
    volume: Math.floor(Math.random() * 500000),
  }));
}

function generateSyntheticHoldings() {
  return {};
}

function generateSyntheticAnnouncements() {
  return [
    { title: "NEPSE Trading Holiday Notice", date: "2026-06-20", type: "Notice", source: "NEPSE" },
    { title: "New IPO Application Window", date: "2026-06-19", type: "IPO", source: "NEPSE" },
    { title: "Dividend Distribution Schedule", date: "2026-06-18", type: "Dividend", source: "NEPSE" },
  ];
}

module.exports = {
  getFundamentals,
  getIPO,
  getDividends,
  getMutualFunds,
  getDebentures,
  getInsiderTrading,
  getEarningsCalendar,
  getBrokers,
  getHoldings,
  getAnnouncements,
  scraperStatus,
  runScraper,
};
