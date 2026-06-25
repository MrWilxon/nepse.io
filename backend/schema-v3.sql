-- NEPSE Database Schema v3 - Persistent Cache for Scraped Data
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS scraped_data_cache (
  key VARCHAR(100) PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE scraped_data_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read scraped_data_cache" ON scraped_data_cache
  FOR SELECT USING (true);

-- Allow all operations for service role (authenticated backend)
CREATE POLICY "All scraped_data_cache" ON scraped_data_cache
  FOR ALL USING (true);
