-- NEPSE Database Schema v2 - Persistent user data tables
-- Run this in the Supabase SQL Editor AFTER schema.sql

-- Community discussion threads
CREATE TABLE IF NOT EXISTS community_posts (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  author VARCHAR(100) NOT NULL DEFAULT 'Anonymous',
  title TEXT,
  content TEXT NOT NULL,
  parent_id BIGINT REFERENCES community_posts(id) ON DELETE CASCADE,
  votes INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_symbol ON community_posts(symbol);
CREATE INDEX IF NOT EXISTS idx_community_posts_parent ON community_posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_votes ON community_posts(votes DESC);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read community_posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Insert community_posts" ON community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Update community_posts" ON community_posts FOR UPDATE USING (true);
CREATE POLICY "Delete community_posts" ON community_posts FOR DELETE USING (true);

-- Paper trading
CREATE TABLE IF NOT EXISTS paper_trades (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  type VARCHAR(4) NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  total NUMERIC(14,2) NOT NULL,
  balance_after NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paper_holdings (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL UNIQUE,
  shares INTEGER NOT NULL DEFAULT 0,
  avg_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paper_account (
  id BIGSERIAL PRIMARY KEY,
  balance NUMERIC(14,2) NOT NULL DEFAULT 1000000,
  initial_balance NUMERIC(14,2) NOT NULL DEFAULT 1000000,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default account if empty
INSERT INTO paper_account (balance, initial_balance)
SELECT 1000000, 1000000
WHERE NOT EXISTS (SELECT 1 FROM paper_account);

CREATE INDEX IF NOT EXISTS idx_paper_trades_symbol ON paper_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_paper_trades_created ON paper_trades(created_at DESC);

ALTER TABLE paper_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_account ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read paper_trades" ON paper_trades FOR SELECT USING (true);
CREATE POLICY "Insert paper_trades" ON paper_trades FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read paper_holdings" ON paper_holdings FOR SELECT USING (true);
CREATE POLICY "All paper_holdings" ON paper_holdings FOR ALL USING (true);
CREATE POLICY "All paper_account" ON paper_account FOR ALL USING (true);

-- Trade journal
CREATE TABLE IF NOT EXISTS journal_entries (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  type VARCHAR(4) DEFAULT 'buy',
  entry_price NUMERIC(10,2) NOT NULL,
  exit_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  pnl NUMERIC(14,2) NOT NULL,
  pnl_pct NUMERIC(8,2) NOT NULL,
  entry_date DATE,
  exit_date DATE,
  strategy VARCHAR(100) DEFAULT 'Unknown',
  notes TEXT,
  stop_loss NUMERIC(10,2),
  take_profit NUMERIC(10,2),
  risk_reward NUMERIC(6,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_symbol ON journal_entries(symbol);
CREATE INDEX IF NOT EXISTS idx_journal_strategy ON journal_entries(strategy);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read journal_entries" ON journal_entries FOR SELECT USING (true);
CREATE POLICY "All journal_entries" ON journal_entries FOR ALL USING (true);

-- Portfolio tracker
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL UNIQUE,
  shares INTEGER NOT NULL DEFAULT 0,
  avg_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_invested NUMERIC(14,2) NOT NULL DEFAULT 0,
  cash NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio_transactions (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  type VARCHAR(10) DEFAULT 'buy',
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_trans_symbol ON portfolio_transactions(symbol);

ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All portfolio_holdings" ON portfolio_holdings FOR ALL USING (true);
CREATE POLICY "Public read portfolio_transactions" ON portfolio_transactions FOR SELECT USING (true);
CREATE POLICY "Insert portfolio_transactions" ON portfolio_transactions FOR INSERT WITH CHECK (true);

-- Watchlist alerts
CREATE TABLE IF NOT EXISTS watchlist_alerts (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  name VARCHAR(100),
  upper_target NUMERIC(10,2),
  lower_target NUMERIC(10,2),
  notify_email VARCHAR(200),
  notify_telegram VARCHAR(100),
  message TEXT,
  triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE watchlist_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All watchlist_alerts" ON watchlist_alerts FOR ALL USING (true);
