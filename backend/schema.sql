-- NEPSE Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Companies table (metadata)
CREATE TABLE IF NOT EXISTS companies (
  symbol VARCHAR(10) PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock prices (OHLCV data from CSVs)
CREATE TABLE IF NOT EXISTS stock_prices (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL REFERENCES companies(symbol),
  published_date DATE NOT NULL,
  open NUMERIC(10,2),
  high NUMERIC(10,2),
  low NUMERIC(10,2),
  close NUMERIC(10,2),
  per_change NUMERIC(8,2),
  traded_quantity BIGINT,
  traded_amount NUMERIC(14,2),
  status SMALLINT,
  UNIQUE(symbol, published_date)
);

CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol ON stock_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol_date ON stock_prices(symbol, published_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_prices_date ON stock_prices(published_date DESC);

-- Floor sheet
CREATE TABLE IF NOT EXISTS floorsheet (
  id BIGSERIAL PRIMARY KEY,
  sn INTEGER,
  contract_no VARCHAR(50),
  symbol VARCHAR(10) NOT NULL,
  buyer_broker INTEGER,
  seller_broker INTEGER,
  quantity BIGINT,
  rate NUMERIC(10,2),
  amount NUMERIC(14,2),
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_floorsheet_symbol ON floorsheet(symbol);
CREATE INDEX IF NOT EXISTS idx_floorsheet_date ON floorsheet(scraped_at DESC);

-- IPOs
CREATE TABLE IF NOT EXISTS ipos (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10),
  name VARCHAR(200),
  sector VARCHAR(50),
  issue_price NUMERIC(10,2),
  issue_date DATE,
  status VARCHAR(20),
  lots INTEGER,
  price NUMERIC(10,2),
  change NUMERIC(8,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dividends
CREATE TABLE IF NOT EXISTS dividends (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  year INTEGER,
  amount NUMERIC(10,2),
  type VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dividends_symbol ON dividends(symbol);

-- Brokers
CREATE TABLE IF NOT EXISTS brokers (
  id BIGSERIAL PRIMARY KEY,
  broker_no INTEGER UNIQUE,
  buy_qty BIGINT,
  buy_amt NUMERIC(14,2),
  sell_qty BIGINT,
  sell_amt NUMERIC(14,2),
  net_qty BIGINT,
  turnover NUMERIC(14,2),
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) but allow all for now
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE floorsheet ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Public read stock_prices" ON stock_prices FOR SELECT USING (true);
CREATE POLICY "Public read floorsheet" ON floorsheet FOR SELECT USING (true);
CREATE POLICY "Public read ipos" ON ipos FOR SELECT USING (true);
CREATE POLICY "Public read dividends" ON dividends FOR SELECT USING (true);
CREATE POLICY "Public read brokers" ON brokers FOR SELECT USING (true);
CREATE POLICY "Public read announcements" ON announcements FOR SELECT USING (true);

-- Service role full access policies
CREATE POLICY "Service role all companies" ON companies FOR ALL USING (true);
CREATE POLICY "Service role all stock_prices" ON stock_prices FOR ALL USING (true);
CREATE POLICY "Service role all floorsheet" ON floorsheet FOR ALL USING (true);
CREATE POLICY "Service role all ipos" ON ipos FOR ALL USING (true);
CREATE POLICY "Service role all dividends" ON dividends FOR ALL USING (true);
CREATE POLICY "Service role all brokers" ON brokers FOR ALL USING (true);
CREATE POLICY "Service role all announcements" ON announcements FOR ALL USING (true);

-- Insert all 124 companies
INSERT INTO companies (symbol, category) VALUES
('ADBL', 'Commercial Bank'), ('NMB', 'Commercial Bank'), ('SBL', 'Commercial Bank'),
('NCCB', 'Commercial Bank'), ('KBL', 'Commercial Bank'), ('LBL', 'Commercial Bank'),
('MBL', 'Commercial Bank'), ('EBL', 'Commercial Bank'), ('NBB', 'Commercial Bank'),
('SBI', 'Commercial Bank'), ('HBL', 'Commercial Bank'), ('SCB', 'Commercial Bank'),
('NIB', 'Commercial Bank'), ('NABIL', 'Commercial Bank'), ('CZBIL', 'Commercial Bank'),
('PCBL', 'Commercial Bank'), ('SRBL', 'Commercial Bank'), ('SANIMA', 'Commercial Bank'),
('MEGA', 'Commercial Bank'), ('CBL', 'Commercial Bank'), ('CCBL', 'Commercial Bank'),
('NBL', 'Commercial Bank'), ('GBIME', 'Commercial Bank'), ('NICA', 'Commercial Bank'),
('PRVU', 'Commercial Bank'), ('BOKL', 'Commercial Bank'),
('CORBL', 'Development Bank'), ('EDBL', 'Development Bank'), ('GBBL', 'Development Bank'),
('GRDBL', 'Development Bank'), ('JBBL', 'Development Bank'), ('KRBL', 'Development Bank'),
('KSBBL', 'Development Bank'), ('LBBL', 'Development Bank'), ('MDB', 'Development Bank'),
('MLBL', 'Development Bank'), ('MNBBL', 'Development Bank'), ('NABBC', 'Development Bank'),
('SADBL', 'Development Bank'), ('SAPDBL', 'Development Bank'), ('SHBL', 'Development Bank'),
('SHINE', 'Development Bank'), ('SINDU', 'Development Bank'),
('BFC', 'Finance'), ('CFCL', 'Finance'), ('GFCL', 'Finance'), ('GMFIL', 'Finance'),
('GUFL', 'Finance'), ('ICFC', 'Finance'), ('JFL', 'Finance'), ('MFIL', 'Finance'),
('MPFL', 'Finance'), ('NFS', 'Finance'), ('PFL', 'Finance'), ('PROFL', 'Finance'),
('RLFL', 'Finance'), ('SFCL', 'Finance'), ('SIFC', 'Finance'),
('CGH', 'Tourism/Hospitality'), ('OHL', 'Tourism/Hospitality'),
('SHL', 'Tourism/Hospitality'), ('TRH', 'Tourism/Hospitality'),
('AHPC', 'Hydropower'), ('AKJCL', 'Hydropower'), ('AKPL', 'Hydropower'),
('API', 'Hydropower'), ('BARUN', 'Hydropower'), ('BPCL', 'Hydropower'),
('CHCL', 'Hydropower'), ('CHL', 'Hydropower'), ('DHPL', 'Hydropower'),
('GHL', 'Hydropower'), ('GLH', 'Hydropower'), ('HDHPC', 'Hydropower'),
('HPPL', 'Hydropower'), ('HURJA', 'Hydropower'), ('JOSHI', 'Hydropower'),
('KKHC', 'Hydropower'), ('KPCL', 'Hydropower'), ('LEC', 'Hydropower'),
('MEN', 'Hydropower'), ('MHNL', 'Hydropower'), ('MKJC', 'Hydropower'),
('NGPL', 'Hydropower'), ('NHDL', 'Hydropower'), ('NHPC', 'Hydropower'),
('NYADI', 'Hydropower'), ('PMHPL', 'Hydropower'), ('PPCL', 'Hydropower'),
('RADHI', 'Hydropower'), ('RHPC', 'Hydropower'), ('RHPL', 'Hydropower'),
('RRHP', 'Hydropower'), ('RURU', 'Hydropower'), ('SAHAS', 'Hydropower'),
('SHEL', 'Hydropower'), ('SHPC', 'Hydropower'), ('SJCL', 'Hydropower'),
('SPC', 'Hydropower'), ('SPDL', 'Hydropower'), ('SSHL', 'Hydropower'),
('TPC', 'Hydropower'), ('UMHL', 'Hydropower'), ('UMRH', 'Hydropower'),
('UNHPL', 'Hydropower'), ('UPCL', 'Hydropower'), ('UPPER', 'Hydropower'),
('CHDC', 'Investment'), ('CIT', 'Investment'), ('HIDCL', 'Investment'),
('NIFRA', 'Investment'), ('NRN', 'Investment'),
('ALICL', 'Life Insurance'), ('GLICL', 'Life Insurance'), ('JLI', 'Life Insurance'),
('LICN', 'Life Insurance'), ('NLIC', 'Life Insurance'), ('NLICL', 'Life Insurance'),
('PLI', 'Life Insurance'), ('PLIC', 'Life Insurance'), ('RLI', 'Life Insurance'),
('SLI', 'Life Insurance'), ('SLICL', 'Life Insurance'), ('ULI', 'Life Insurance')
ON CONFLICT (symbol) DO NOTHING;
