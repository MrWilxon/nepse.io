/**
 * NEPSE CSV → Supabase Migration Script
 * Reads all 124 CSV files and bulk-inserts into stock_prices table.
 *
 * Usage: node migrate.js
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DATA_DIR = path.join(__dirname, "..", "data", "company-wise");
const BATCH_SIZE = 500;

function readCSV(symbol) {
  const filePath = path.join(DATA_DIR, `${symbol}.csv`);
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records.map((r) => ({
    symbol,
    published_date: r.published_date || null,
    open: parseFloat(r.open) || null,
    high: parseFloat(r.high) || null,
    low: parseFloat(r.low) || null,
    close: parseFloat(r.close) || null,
    per_change: r.per_change === "nan" || r.per_change === "NaN" ? null : parseFloat(r.per_change) || null,
    traded_quantity: Math.round(parseFloat(r.traded_quantity) || 0),
    traded_amount: parseFloat(r.traded_amount) || null,
    status: parseInt(r.status) || 0,
  }));
}

async function migrate() {
  console.log("Starting migration...");
  const csvFiles = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".csv"));
  console.log(`Found ${csvFiles.length} CSV files`);

  let totalInserted = 0;
  let totalErrors = 0;

  for (const file of csvFiles) {
    const symbol = path.basename(file, ".csv");
    const records = readCSV(symbol);

    if (records.length === 0) {
      console.log(`  ${symbol}: no records, skipping`);
      continue;
    }

    const deduped = [];
    const seen = new Set();
    for (const r of records) {
      const key = r.symbol + "|" + r.published_date;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(r);
      }
    }

    for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
      const batch = deduped.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("stock_prices")
        .upsert(batch, { onConflict: "symbol,published_date", ignoreDuplicates: true });

      if (error) {
        console.error(`  ${symbol} batch ${Math.floor(i / BATCH_SIZE)}: ${error.message}`);
        totalErrors++;
      } else {
        totalInserted += batch.length;
      }
    }

    console.log(`  ${symbol}: ${records.length} records (${deduped.length} deduped), skipped ${records.length - deduped.length} dupes`);
  }

  console.log(`\nMigration complete!`);
  console.log(`  Total inserted: ${totalInserted}`);
  console.log(`  Total errors: ${totalErrors}`);
}

migrate().catch(console.error);
