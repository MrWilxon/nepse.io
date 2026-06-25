/**
 * Market data routes - companies, sectors, top-movers, market summary, NEPSE index.
 */
module.exports = function setupMarketRoutes(app, deps) {
  const {
    readCompanyCSV, parseRecords, getAllCompanyData,
    CATEGORY_MAP, SMA, EMA, RSI, MACD, BollingerBands,
    getCachedIndicators, setCachedIndicators, dataProvider,
    companyDataCache,
  } = deps;

  app.get("/api/companies", (req, res) => {
    try {
      const companies = [];
      for (const [symbol, records] of companyDataCache) {
        if (!records || records.length === 0) continue;
        const latest = records[records.length - 1];
        companies.push({
          symbol,
          category: CATEGORY_MAP[symbol] || "Other",
          records: records.length,
          latestClose: parseFloat(latest.close) || null,
          latestDate: latest.published_date,
        });
      }
      res.json(companies);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/companies/:symbol", (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const { from, to, limit } = req.query;
    const records = readCompanyCSV(symbol);
    if (!records) return res.status(404).json({ error: "Company not found" });
    let filtered = parseRecords(records);
    if (from) filtered = filtered.filter((r) => r.date >= from);
    if (to) filtered = filtered.filter((r) => r.date <= to);
    if (limit) filtered = filtered.slice(-parseInt(limit));
    res.json({ symbol, category: CATEGORY_MAP[symbol] || "Other", data: filtered });
  });

  app.get("/api/companies/:symbol/stats", (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const records = readCompanyCSV(symbol);
    if (!records) return res.status(404).json({ error: "Company not found" });
    const closes = records.map((r) => parseFloat(r.close)).filter((v) => !isNaN(v));
    const volumes = records.map((r) => parseInt(r.traded_quantity)).filter((v) => !isNaN(v));
    const latest = records[records.length - 1];
    res.json({
      symbol,
      category: CATEGORY_MAP[symbol] || "Other",
      totalRecords: records.length,
      firstDate: records[0].published_date,
      lastDate: latest.published_date,
      latestClose: parseFloat(latest.close) || 0,
      allTimeHigh: Math.max(...closes),
      allTimeLow: Math.min(...closes),
      avgVolume: Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length),
    });
  });

  app.get("/api/companies/:symbol/indicators", (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const { from, to, limit } = req.query;
    const cacheKey = `${symbol}_${from || ""}_${to || ""}_${limit || ""}`;
    const cached = getCachedIndicators(cacheKey);
    if (cached) return res.json(cached);
    const records = readCompanyCSV(symbol);
    if (!records) return res.status(404).json({ error: "Company not found" });
    let data = parseRecords(records);
    if (from) data = data.filter((r) => r.date >= from);
    if (to) data = data.filter((r) => r.date <= to);
    if (limit) data = data.slice(-parseInt(limit));
    const closes = data.map((r) => r.close);
    const sma20 = SMA(closes, 20);
    const sma50 = SMA(closes, 50);
    const ema12 = EMA(closes, 12);
    const ema26 = EMA(closes, 26);
    const rsi14 = RSI(closes, 14);
    const macd = MACD(closes, 12, 26, 9);
    const bb = BollingerBands(closes, 20, 2);
    const indicators = data.map((d, i) => ({
      date: d.date,
      close: d.close,
      open: d.open,
      high: d.high,
      low: d.low,
      volume: d.volume,
      sma20: sma20[i] !== null ? Math.round(sma20[i] * 100) / 100 : null,
      sma50: sma50[i] !== null ? Math.round(sma50[i] * 100) / 100 : null,
      ema12: ema12[i] !== null ? Math.round(ema12[i] * 100) / 100 : null,
      ema26: ema26[i] !== null ? Math.round(ema26[i] * 100) / 100 : null,
      rsi: rsi14[i] !== null ? Math.round(rsi14[i] * 100) / 100 : null,
      macd: macd.macdLine[i] !== null ? Math.round(macd.macdLine[i] * 100) / 100 : null,
      macdSignal: macd.signalLine[i] !== null ? Math.round(macd.signalLine[i] * 100) / 100 : null,
      macdHist: macd.histogram[i] !== null ? Math.round(macd.histogram[i] * 100) / 100 : null,
      bbUpper: bb.upper[i] !== null ? Math.round(bb.upper[i] * 100) / 100 : null,
      bbMiddle: bb.middle[i] !== null ? Math.round(bb.middle[i] * 100) / 100 : null,
      bbLower: bb.lower[i] !== null ? Math.round(bb.lower[i] * 100) / 100 : null,
    }));
    const result = { symbol, category: CATEGORY_MAP[symbol] || "Other", data: indicators };
    setCachedIndicators(cacheKey, result);
    res.json(result);
  });

  app.get("/api/top-movers", (req, res) => {
    try {
      const all = getAllCompanyData();

      let latestDate = null;
      for (const { records } of all) {
        if (!records || records.length === 0) continue;
        const d = records[records.length - 1].published_date;
        if (!latestDate || d > latestDate) latestDate = d;
      }
      if (!latestDate) {
        res.json({ gainers: [], losers: [], mostActive: [] });
        return;
      }

      const dayData = [];
      for (const { symbol, records } of all) {
        if (!records || records.length === 0) continue;
        const latest = records[records.length - 1];
        if (latest.published_date !== latestDate) continue;

        const close = parseFloat(latest.close) || 0;
        const volume = parseInt(latest.traded_quantity) || 0;
        const category = CATEGORY_MAP[symbol] || "Other";

        let changePct = parseFloat(latest.per_change);
        if (!Number.isFinite(changePct)) changePct = 0;
        const change = close * changePct / 100;

        dayData.push({ symbol, category, close, change: Math.round(change * 100) / 100, changePct: Math.round(changePct * 100) / 100, volume });
      }

      const sorted = [...dayData].sort((a, b) => b.changePct - a.changePct);
      const gainers = sorted.filter((d) => d.changePct > 0).slice(0, 10);
      const losers = sorted.filter((d) => d.changePct < 0).reverse().slice(0, 10);
      const mostActive = [...dayData].sort((a, b) => b.volume - a.volume).slice(0, 10);
      res.json({ gainers, losers, mostActive });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/sectors", (req, res) => {
    try {
      const all = getAllCompanyData();
      const sectorMap = {};
      const { CATEGORY_MAP: CM } = deps;
      for (const { symbol, records } of all) {
        if (!records || records.length === 0) continue;
        const category = CM[symbol] || "Other";
        const latest = records[records.length - 1];
        const close = parseFloat(latest.close) || 0;
        const change = parseFloat(latest.per_change) || 0;
        const volume = parseInt(latest.traded_quantity) || 0;
        const turnover = parseFloat(latest.traded_amount) || 0;
        if (!sectorMap[category]) sectorMap[category] = { companies: [], totalChange: 0, totalVolume: 0, totalTurnover: 0, count: 0 };
        sectorMap[category].companies.push({ symbol, latestClose: close, change });
        sectorMap[category].totalChange += change;
        sectorMap[category].totalVolume += volume;
        sectorMap[category].totalTurnover += turnover;
        sectorMap[category].count++;
      }
      const sectors = Object.entries(sectorMap).map(([sector, d]) => ({
        sector,
        avgChange: Math.round((d.totalChange / d.count) * 100) / 100,
        totalVolume: d.totalVolume,
        totalTurnover: d.totalTurnover,
        companyCount: d.count,
        companies: d.companies,
      }));
      sectors.sort((a, b) => b.avgChange - a.avgChange);
      res.json(sectors);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/sectors/heatmap", (req, res) => {
    try {
      const all = getAllCompanyData();
      let totalMarketCap = 0;
      const sectorData = {};
      for (const { symbol, records } of all) {
        if (!records || records.length === 0) continue;
        const category = CATEGORY_MAP[symbol] || "Other";
        const latest = records[records.length - 1];
        const close = parseFloat(latest.close) || 0;
        const volume = parseInt(latest.traded_quantity) || 0;
        const marketProxy = close * volume;
        totalMarketCap += marketProxy;
        if (!sectorData[category]) sectorData[category] = { change: 0, count: 0, marketShare: 0 };
        sectorData[category].change += parseFloat(latest.per_change) || 0;
        sectorData[category].count++;
        sectorData[category].marketShare += marketProxy;
      }
      const heatmap = Object.entries(sectorData).map(([sector, d]) => ({
        sector,
        change: Math.round((d.change / d.count) * 100) / 100,
        marketShare: totalMarketCap > 0 ? Math.round((d.marketShare / totalMarketCap) * 10000) / 100 : 0,
      }));
      heatmap.sort((a, b) => b.marketShare - a.marketShare);
      res.json(heatmap);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/market-summary", (req, res) => {
    try {
      const all = getAllCompanyData();

      let latestDate = null;
      for (const { records } of all) {
        if (!records || records.length === 0) continue;
        const d = records[records.length - 1].published_date;
        if (!latestDate || d > latestDate) latestDate = d;
      }
      if (!latestDate) {
        res.json({ totalCompanies: 0, totalVolume: 0, totalTurnover: 0, advance: 0, decline: 0, unchanged: 0, upperCircuit: 0, lowerCircuit: 0, latestDate: null });
        return;
      }

      let totalVolume = 0;
      let totalTurnover = 0;
      let advance = 0;
      let decline = 0;
      let unchanged = 0;
      let upperCircuit = 0;
      let lowerCircuit = 0;
      let counted = 0;

      for (const { symbol, records } of all) {
        if (!records || records.length === 0) continue;
        const latest = records[records.length - 1];
        if (latest.published_date !== latestDate) continue;

        const close = parseFloat(latest.close) || 0;
        const open = parseFloat(latest.open) || 0;
        const volume = parseInt(latest.traded_quantity) || 0;
        const turnover = parseFloat(latest.traded_amount) || 0;

        if (close <= 0 || open <= 0) continue;

        let pctChange = parseFloat(latest.per_change);
        if (!Number.isFinite(pctChange)) {
          const prev = records.length > 1 ? records[records.length - 2] : null;
          if (prev && prev.published_date < latestDate) {
            const prevClose = parseFloat(prev.close) || close;
            pctChange = prevClose !== 0 ? ((close - prevClose) / prevClose) * 100 : 0;
          } else {
            pctChange = 0;
          }
        }
        if (Math.abs(pctChange) > 25) continue;

        totalVolume += volume;
        totalTurnover += turnover;
        counted++;

        if (pctChange > 0) advance++;
        else if (pctChange < 0) decline++;
        else unchanged++;

        if (pctChange >= 9.9) upperCircuit++;
        else if (pctChange <= -9.9) lowerCircuit++;
      }

      res.json({ totalCompanies: counted, totalVolume, totalTurnover, advance, decline, unchanged, upperCircuit, lowerCircuit, latestDate });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/market-summary/stocks", (req, res) => {
    try {
      const { category } = req.query;
      const validCategories = ["advance", "decline", "unchanged", "upperCircuit", "lowerCircuit"];
      if (!category || !validCategories.includes(category)) {
        return res.status(400).json({ error: `Invalid category. Valid: ${validCategories.join(", ")}` });
      }

      const all = getAllCompanyData();
      let latestDate = null;
      for (const { records } of all) {
        if (!records || records.length === 0) continue;
        const d = records[records.length - 1].published_date;
        if (!latestDate || d > latestDate) latestDate = d;
      }
      if (!latestDate) return res.json({ stocks: [], category, date: null });

      const stocks = [];
      for (const { symbol, records } of all) {
        if (!records || records.length === 0) continue;
        const latest = records[records.length - 1];
        if (latest.published_date !== latestDate) continue;

        const close = parseFloat(latest.close) || 0;
        const prev = records.length > 1 ? records[records.length - 2] : null;
        let pctChange = parseFloat(latest.per_change);
        if (!Number.isFinite(pctChange)) {
          if (prev && prev.published_date < latestDate) {
            const prevClose = parseFloat(prev.close) || close;
            pctChange = prevClose !== 0 ? ((close - prevClose) / prevClose) * 100 : 0;
          } else {
            pctChange = 0;
          }
        }

        let match = false;
        if (category === "advance" && pctChange > 0) match = true;
        else if (category === "decline" && pctChange < 0) match = true;
        else if (category === "unchanged" && pctChange === 0) match = true;
        else if (category === "upperCircuit" && pctChange >= 9.9) match = true;
        else if (category === "lowerCircuit" && pctChange <= -9.9) match = true;

        if (match) {
          stocks.push({
            symbol,
            name: symbol,
            category: CATEGORY_MAP[symbol] || "Other",
            close,
            change: Math.round(pctChange * 100) / 100,
            volume: parseInt(latest.traded_quantity) || 0,
          });
        }
      }

      stocks.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
      res.json({ stocks, category, date: latestDate, count: stocks.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/nepse-index", async (req, res) => {
    try {
      const data = await dataProvider.getNepseIndex();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/ipo", async (req, res) => {
    try {
      const data = await dataProvider.getIPO();
      res.json(Array.isArray(data) ? data : []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};
