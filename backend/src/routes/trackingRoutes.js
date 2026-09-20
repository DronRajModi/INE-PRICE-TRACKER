const express = require('express');
const router = express.Router();
const TrackingController = require('../controllers/trackingController');
const ScrapeController = require('../controllers/scrapeController');

// GET /api/tracked-products - list all tracked items
router.get('/', TrackingController.getTrackedProducts);

// POST /api/tracked-products - add a product to track
router.post('/', TrackingController.addTrackedProduct);

// DELETE /api/tracked-products/:id - stop tracking a product
router.delete('/:id', TrackingController.deleteTrackedProduct);

// GET /api/tracked-products/:id/history - price & stock history
router.get('/:id/history', TrackingController.getProductHistory);

// GET /api/tracked-products/:id/logs - per-product scrape attempt logs
router.get('/:id/logs', TrackingController.getProductLogs);

// POST /api/tracked-products/:id/scrape - trigger immediate on-demand scrape
router.post('/:id/scrape', ScrapeController.scrapeSingleProduct);

module.exports = router;
