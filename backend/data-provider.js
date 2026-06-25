/**
 * Data Provider - Wraps Python scrapers with caching and fallback.
 * Falls back to synthetic data if real scraping fails.
 */
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "..", "data", "cache");
const PROJECT_ROOT = path.join(__dirname, "..");
const SCRAPER_TIMEOUT = 60000;

// Ensure cache dir exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const scraperStatus = {};

/**
 * Run a Python scraper and return parsed JSON output.
 */
function runScraper(scraperName, args = [], timeout = SCRAPER_TIMEOUT) {
  return new Promise((resolve) => {
    // Use standalone script to avoid python -m module issues
    const scriptPath = path.join(PROJECT_ROOT, "src", "scrapers", "run_scraper.py");
    const pythonArgs = [scriptPath, scraperName, ...args];

    execFile("python", pythonArgs, { cwd: PROJECT_ROOT, timeout, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        console.error(`Scraper ${scraperName} failed:`, err.message);
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
        console.error(`Scraper ${scraperName} parse error:`, e.message);
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

async function getFundamentals(symbols, force = false) {
  const cacheKey = "fundamentals";
  if (!force) {
    let data = readCache(cacheKey, 48);
    if (data) {
      updateStatus(cacheKey, true, Object.keys(data).length);
      return data;
    }
  }

  try {
    const result = await runScraper("fundamentals", symbols || [], 300000);
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

async function getIPO(force = false) {
  const cacheKey = "ipo";
  if (!force) {
    let data = readCache(cacheKey, 24);
    if (data) {
      updateStatus(cacheKey, true, data.length);
      return data;
    }
  }

  try {
    const result = await runScraper("ipo");
    if (Array.isArray(result) && result.length > 0 && !result[0]?.error) {
      const transformed = result.map(item => ({
        symbol: item.symbol || "",
        name: item.name || item.symbol || "",
        sector: item.sector || "Other",
        type: item.type || "IPO",
        issuePrice: item.issuePrice || 0,
        totalUnits: item.totalUnits || 0,
        amount: item.amount || 0,
        ratio: item.ratio,
        openDate: item.openDate || "",
        closeDate: item.closeDate || "",
        applicationDate: item.applicationDate || "",
        priceRange: item.amount && item.totalUnits
          ? `Rs ${(item.amount / item.totalUnits).toFixed(2)}`
          : item.issuePrice ? `Rs ${item.issuePrice}` : "TBA",
        status: item.status || "Upcoming",
        issueManager: item.issueManager || "",
      }));
      writeCache(cacheKey, transformed);
      updateStatus(cacheKey, true, transformed.length);
      return transformed;
    }
  } catch (e) {
    console.error("IPO scraper failed:", e.message);
  }

  updateStatus(cacheKey, false, 0);
  return [];
}

async function getDividends(symbols, force = false) {
  const cacheKey = "dividends";
  if (!force) {
    let data = readCache(cacheKey, 48);
    if (data) {
      updateStatus(cacheKey, true, Object.keys(data).length);
      return data;
    }
  }

  try {
    const result = await runScraper("dividends");
    if (result && !result.error) {
      // Transform to include fields needed by dividend-calendar endpoint and EventsWidget
      const transformed = {};
      for (const [sym, divs] of Object.entries(result)) {
        if (!Array.isArray(divs)) continue;
        transformed[sym] = divs.map(d => ({
          ...d,
          // Fields for dividend-calendar endpoint filter
          date: d.announcementDate || d.bookCloseDate || "",
          type: (d.cashDividend > 0 && d.bonusDividend > 0) ? "cash" :
                d.bonusDividend > 0 ? "bonus" :
                d.rightsDividend > 0 ? "rights" : "cash",
          amount: d.totalDividend || d.cashDividend || 0,
          // Fields for EventsWidget display
          exDate: d.bookCloseDate || d.announcementDate || "",
          dividendYield: d.ltp ? ((d.totalDividend || 0) / d.ltp * 100).toFixed(2) : "0",
          status: d.status || "upcoming",
        }));
      }
      writeCache(cacheKey, transformed);
      updateStatus(cacheKey, true, Object.keys(transformed).length);
      return transformed;
    }
  } catch (e) {
    console.error("Dividends scraper failed:", e.message);
  }

  updateStatus(cacheKey, false, 0);
  return {};
}

async function getMutualFunds(force = false) {
  const cacheKey = "mutual_funds";
  if (!force) {
    let data = readCache(cacheKey, 24);
    if (data) {
      updateStatus(cacheKey, true, data.length);
      return data;
    }
  }

  try {
    const result = await runScraper("mutual_funds");
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

async function getDebentures(force = false) {
  const cacheKey = "debentures";
  if (!force) {
    let data = readCache(cacheKey, 24);
    if (data) {
      updateStatus(cacheKey, true, data.length);
      return data;
    }
  }

  try {
    const result = await runScraper("debentures");
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

async function getInsiderTrading(force = false) {
  const cacheKey = "insider_trading";
  if (!force) {
    let data = readCache(cacheKey, 12);
    if (data) {
      updateStatus(cacheKey, true, data.length);
      return data;
    }
  }

  try {
    const result = await runScraper("insider_trading");
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

async function getEarningsCalendar(force = false) {
  const cacheKey = "earnings_calendar";
  if (!force) {
    let data = readCache(cacheKey, 24);
    if (data) {
      updateStatus(cacheKey, true, data.length);
      return data;
    }
  }

  try {
    const result = await runScraper("earnings");
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

async function getBrokers(force = false) {
  const cacheKey = "brokers";
  if (!force) {
    let data = readCache(cacheKey, 12);
    if (data) {
      updateStatus(cacheKey, true, data.brokers ? data.brokers.length : 0);
      return data;
    }
  }

  try {
    const result = await runScraper("brokers");
    if (result && result.brokers && Array.isArray(result.brokers) && result.brokers.length > 0) {
      // Transform to match the expected format in server.js
      const transformed = {
        date: result.date || new Date().toISOString().split("T")[0],
        totalTurnover: result.totalTurnover || 0,
        totalVolume: result.totalVolume || 0,
        totalTransactions: result.totalTransactions || 0,
        brokers: result.brokers.map(b => ({
          brokerNo: b.brokerNo || 0,
          name: b.name || `Broker ${b.brokerNo}`,
          buyAmt: b.buyAmount || 0,
          sellAmt: b.sellAmount || 0,
          buyQty: b.volume || 0,
          sellQty: 0,
          netQty: (b.buyAmount || 0) - (b.sellAmount || 0),
          turnover: b.totalAmount || b.turnover || 0,
          transactions: b.transactions || 0,
          netDirection: (b.buyAmount || 0) > (b.sellAmount || 0) ? "buy" : "sell",
        })),
      };
      writeCache(cacheKey, transformed);
      updateStatus(cacheKey, true, transformed.brokers.length);
      return transformed;
    }
  } catch (e) {
    console.error("Brokers scraper failed:", e.message);
  }

  updateStatus(cacheKey, false, 0);
  return { date: "", totalTurnover: 0, totalVolume: 0, totalTransactions: 0, brokers: [] };
}

async function getHoldings(symbols, force = false) {
  const cacheKey = "holdings";
  if (!force) {
    let data = readCache(cacheKey, 48);
    if (data) {
      updateStatus(cacheKey, true, Object.keys(data).length);
      return data;
    }
  }

  try {
    const result = await runScraper("holdings", symbols || []);
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

async function getNepseIndex(force = false) {
  const cacheKey = "nepse_index";
  if (!force) {
    let data = readCache(cacheKey, 12);
    if (data) {
      updateStatus(cacheKey, true, 1);
      return data;
    }
  }

  try {
    const result = await runScraper("nepse_index", [], 60000);
    if (result && !result.error) {
      writeCache(cacheKey, result);
      updateStatus(cacheKey, true, 1);
      return result;
    }
  } catch (e) {
    console.error("NEPSE index scraper failed:", e.message);
  }

  updateStatus(cacheKey, false, 0);
  return { nepseIndex: null, subIndices: [], history: [], _simulated: true };
}

async function getAnnouncements(force = false) {
  const cacheKey = "announcements";
  if (!force) {
    let data = readCache(cacheKey, 6);
    if (data) {
      updateStatus(cacheKey, true, data.length);
      return data;
    }
  }

  try {
    const result = await runScraper("announcements");
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
  return {};
}

function generateSyntheticIPO() {
  return [];
}

function generateSyntheticMutualFunds() {
  return [];
}

function generateSyntheticDebentures() {
  return [];
}

function generateSyntheticInsiderTrading() {
  return [];
}

function generateSyntheticEarnings() {
  const symbols = [
    "NABIL", "EBL", "NICA", "GBIME", "SANIMA", "NIB", "PCBL", "SRBL", "ADBL",
    "MEGA", "CBL", "PRVU", "BOKL", "NMB", "SBL", "NCCB", "KBL", "LBL",
    "HBL", "SCB", "NBB", "SBI", "CZBIL",
  ];
  const now = new Date();
  const currentYear = now.getFullYear();
  const earnings = [];

  const quarters = [
    { month: 1, label: "Q3 FY" + (currentYear - 1).toString().slice(-2) + "/" + currentYear.toString().slice(-2) },
    { month: 4, label: "Q4 FY" + (currentYear - 1).toString().slice(-2) + "/" + currentYear.toString().slice(-2) },
    { month: 9, label: "Q1 FY" + currentYear.toString().slice(-2) + "/" + (currentYear + 1).toString().slice(-2) },
    { month: 12, label: "Q2 FY" + currentYear.toString().slice(-2) + "/" + (currentYear + 1).toString().slice(-2) },
  ];

  for (const sym of symbols) {
    for (const q of quarters) {
      const seed = (sym.charCodeAt(0) * 13 + q.month * 7) % 28;
      const day = Math.max(1, Math.min(28, seed + 1));
      const d = new Date(currentYear, q.month - 1, day);
      if (d < new Date(now.getFullYear(), now.getMonth() - 1, 1)) continue;

      const eps = Math.round((5 + ((sym.charCodeAt(0) * 31 + q.month * 17) % 40)) * 100) / 100;
      const dateStr = d.toISOString().split("T")[0];
      earnings.push({
        symbol: sym,
        announcementDate: dateStr,
        date: dateStr,
        event: q.label + " Results",
        quarter: q.label,
        estimatedEPS: eps,
        actualEPS: null,
        previousEPS: Math.round((eps * (0.7 + ((sym.charCodeAt(1) || 65) % 60) / 100)) * 100) / 100,
        sector: "Banking",
        _synthetic: true,
      });
    }
  }

  earnings.sort((a, b) => (a.announcementDate || "").localeCompare(b.announcementDate || ""));
  return earnings;
}

function generateSyntheticBrokers() {
  return [];
}

function generateSyntheticHoldings() {
  return {};
}

function generateSyntheticAnnouncements() {
  return [];
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
  getNepseIndex,
  scraperStatus,
  runScraper,
};
