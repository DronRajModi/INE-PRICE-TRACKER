-- INE Product Price Tracker - Supabase PostgreSQL Schema
-- Execute this script inside your Supabase project's SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TRACKED PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS tracked_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_product_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(150),
    category VARCHAR(150),
    sku VARCHAR(100),
    url TEXT NOT NULL,
    current_price NUMERIC(12, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    current_stock INTEGER,
    stock_status VARCHAR(50) DEFAULT 'UNKNOWN',
    last_scraped_at TIMESTAMPTZ,
    last_scrape_status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by store ID and status
CREATE INDEX IF NOT EXISTS idx_tracked_products_store_id ON tracked_products(store_product_id);
CREATE INDEX IF NOT EXISTS idx_tracked_products_last_scraped ON tracked_products(last_scraped_at);

-- 2. PRICE & STOCK HISTORY TABLE
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES tracked_products(id) ON DELETE CASCADE,
    price NUMERIC(12, 2) NOT NULL,
    stock INTEGER,
    currency VARCHAR(10) DEFAULT 'INR',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying history for a product chronologically
CREATE INDEX IF NOT EXISTS idx_price_history_product_date ON price_history(product_id, recorded_at DESC);

-- 3. PER-PRODUCT SCRAPE AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS scrape_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES tracked_products(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- 'SUCCESS', 'RETRIED', 'FAILED'
    http_status INTEGER,
    error_message TEXT,
    attempt_number INTEGER DEFAULT 1,
    duration_ms INTEGER,
    scraper_type VARCHAR(50) DEFAULT 'HTTP', -- 'HTTP' or 'BROWSER'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying logs for a specific product
CREATE INDEX IF NOT EXISTS idx_scrape_logs_product_date ON scrape_logs(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_status ON scrape_logs(status);

-- Automatic updated_at trigger for tracked_products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_update_tracked_products_timestamp ON tracked_products;
CREATE TRIGGER trg_update_tracked_products_timestamp
    BEFORE UPDATE ON tracked_products
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
