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
    const pythonArgs = ["-m", "src.scrapers", scraperName, ...args];

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

async function getFundamentals(symbols) {
  const cacheKey = "fundamentals";
  let data = readCache(cacheKey, 48);
  if (data) {
    updateStatus(cacheKey, true, Object.keys(data).length);
    return data;
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

async function getIPO() {
  const cacheKey = "ipo";
  let data = readCache(cacheKey, 24);
  if (data) {
    updateStatus(cacheKey, true, data.length);
    return data;
  }

  try {
    const result = await runScraper("ipo");
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
    const result = await runScraper("dividends");
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

async function getDebentures() {
  const cacheKey = "debentures";
  let data = readCache(cacheKey, 24);
  if (data) {
    updateStatus(cacheKey, true, data.length);
    return data;
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

async function getInsiderTrading() {
  const cacheKey = "insider_trading";
  let data = readCache(cacheKey, 12);
  if (data) {
    updateStatus(cacheKey, true, data.length);
    return data;
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

async function getEarningsCalendar() {
  const cacheKey = "earnings_calendar";
  let data = readCache(cacheKey, 24);
  if (data) {
    updateStatus(cacheKey, true, data.length);
    return data;
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
  return [];
}

async function getBrokers() {
  const cacheKey = "brokers";
  let data = readCache(cacheKey, 12);
  if (data) {
    updateStatus(cacheKey, true, data.length);
    return data;
  }

  try {
    const result = await runScraper("brokers");
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

async function getNepseIndex() {
  const cacheKey = "nepse_index";
  let data = readCache(cacheKey, 12);
  if (data) {
    updateStatus(cacheKey, true, 1);
    return data;
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

async function getAnnouncements() {
  const cacheKey = "announcements";
  let data = readCache(cacheKey, 6);
  if (data) {
    updateStatus(cacheKey, true, data.length);
    return data;
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
  return [];
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
