const cron = require("node-cron");

let dataProvider;
try {
  dataProvider = require("./data-provider");
} catch (e) {
  console.error("Cron: data-provider load failed:", e.message);
  // Return a no-op scheduler that logs but doesn't crash
  module.exports = {
    startScheduler: () => {
      console.error("Cron scheduler disabled: data-provider unavailable");
    },
  };
  return;
}

const log = (msg) => console.log(`[CRON ${new Date().toISOString()}] ${msg}`);

function runScraperSafe(name, fn, timeout = 60000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      log(`${name}: timed out after ${timeout / 1000}s`);
      resolve(false);
    }, timeout);

    fn()
      .then((result) => {
        clearTimeout(timer);
        if (result && !result.error) {
          log(`${name}: OK`);
          resolve(true);
        } else {
          log(`${name}: returned error or empty`);
          resolve(false);
        }
      })
      .catch((err) => {
        clearTimeout(timer);
        log(`${name}: ${err.message}`);
        resolve(false);
      });
  });
}

function isTradingHours() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMin = now.getUTCMinutes();
  const utcTotal = utcHour * 60 + utcMin;
  const nepseTotal = utcTotal + (5 * 60 + 45);
  const hour = Math.floor(nepseTotal / 60) % 24;
  const min = nepseTotal % 60;
  const day = now.getUTCDay();
  const t = hour * 60 + min;
  return day >= 1 && day <= 5 && t >= 660 && t <= 900;
}

function isWeekday() {
  const day = new Date().getUTCDay();
  return day >= 1 && day <= 5;
}

function startScheduler(onLivePricesRefresh) {
  log("Starting scheduler...");

  // Refresh live stock prices from NEPSE API every 15 minutes during trading hours
  cron.schedule("*/15 11-15 * * 1-5", () => {
    if (!isTradingHours()) return;
    log("Running trading-hours refresh...");
    if (onLivePricesRefresh) runScraperSafe("live_prices", onLivePricesRefresh);
    runScraperSafe("nepse_index", () => dataProvider.getNepseIndex(true));
    runScraperSafe("announcements", () => dataProvider.getAnnouncements(true));
    runScraperSafe("brokers", () => dataProvider.getBrokers(true));
  }, { timezone: "Asia/Kathmandu" });

  cron.schedule("0 6 * * 1-5", () => {
    log("Running morning refresh...");
    if (onLivePricesRefresh) runScraperSafe("live_prices", onLivePricesRefresh);
    runScraperSafe("nepse_index", () => dataProvider.getNepseIndex(true));
    runScraperSafe("announcements", () => dataProvider.getAnnouncements(true));
    runScraperSafe("earnings", () => dataProvider.getEarningsCalendar(true));
  }, { timezone: "Asia/Kathmandu" });

  cron.schedule("0 20 * * *", () => {
    log("Running daily end-of-day refresh...");
    if (onLivePricesRefresh) runScraperSafe("live_prices", onLivePricesRefresh);
    runScraperSafe("nepse_index", () => dataProvider.getNepseIndex(true));
    runScraperSafe("announcements", () => dataProvider.getAnnouncements(true));
    runScraperSafe("fundamentals", () => dataProvider.getFundamentals(null, true), 300000);
    runScraperSafe("brokers", () => dataProvider.getBrokers(true));
    runScraperSafe("ipo", () => dataProvider.getIPO(true));
    runScraperSafe("dividends", () => dataProvider.getDividends(null, true));
    runScraperSafe("earnings", () => dataProvider.getEarningsCalendar(true));
  }, { timezone: "Asia/Kathmandu" });

  cron.schedule("0 3 * * 6", () => {
    log("Running weekly fundamentals refresh...");
    runScraperSafe("fundamentals", () => dataProvider.getFundamentals(null, true), 300000);
  }, { timezone: "Asia/Kathmandu" });

  log("Scheduler started (live-prices + trading-hours: */15 11-15 NPT, morning: 06:00, daily: 20:00, weekly: Sat 03:00)");
}

module.exports = { startScheduler };
