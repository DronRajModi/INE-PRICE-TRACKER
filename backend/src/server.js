const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./config/env');

const productRoutes = require('./routes/productRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const scrapeRoutes = require('./routes/scrapeRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allows Render backend to serve Vercel frontend without CORS blocks
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint (also keeps Render free tier awake)
app.get('/', (req, res) => {
  res.json({
    name: 'INE Product Price Tracker API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api',
    time: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Mount Routes
app.use('/api/products', productRoutes);
app.use('/api/tracked-products', trackingRoutes);
app.use('/api/jobs', scrapeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
const server = app.listen(env.port, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Backend running at: http://localhost:${env.port}`);
  console.log(`🛒 Target Mock Store:  ${env.mockStoreUrl}`);
  console.log(`🛡️  Cron Auth Endpoint: http://localhost:${env.port}/api/jobs/scrape-all`);
  console.log(`==================================================\n`);
});

module.exports = { app, server };
