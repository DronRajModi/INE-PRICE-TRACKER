const { createClient } = require('@supabase/supabase-js');
const env = require('../config/env');

let supabase = null;

if (env.isConfigured()) {
  try {
    supabase = createClient(env.supabaseUrl, env.supabaseKey, {
      auth: { persistSession: false }
    });
    console.log('✅ Supabase client initialized successfully.');
  } catch (err) {
    console.error('⚠️ Failed to initialize Supabase client:', err.message);
  }
} else {
  console.warn('⚠️ Supabase credentials not configured or placeholder detected in .env.');
  console.warn('⚠️ Operating in fallback mode. Please update SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.');
}

// In-memory mock store for local development before Supabase is connected
const memoryStore = {
  tracked_products: new Map(),
  price_history: [],
  scrape_logs: []
};

module.exports = {
  supabase,
  memoryStore,
  isConfigured: () => env.isConfigured() && supabase !== null
};
