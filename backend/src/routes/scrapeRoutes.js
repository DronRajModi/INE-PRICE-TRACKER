const express = require('express');
const router = express.Router();
const ScrapeController = require('../controllers/scrapeController');
const cronAuth = require('../middleware/cronAuth');

// POST /api/jobs/scrape-all - batch scrape for all products, protected by cronAuth
router.post('/scrape-all', cronAuth, ScrapeController.scrapeAllJobs);

module.exports = router;
