const dotenv = require('dotenv');
dotenv.config();

const env = {
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  cronSecret: process.env.CRON_SECRET || 'supersecret_cron_token_change_me',
  mockStoreUrl: (process.env.MOCK_STORE_URL || 'https://demo.inelabteamdev.com').replace(/\/$/, ''),
  userAgent: process.env.DEFAULT_USER_AGENT ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  isConfigured() {
    return Boolean(this.supabaseUrl && this.supabaseKey && !this.supabaseUrl.includes('placeholder'));
  }
};

module.exports = env;
