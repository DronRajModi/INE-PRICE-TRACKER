const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');

// GET /api/products/search?q=...
router.get('/search', ProductController.searchProducts);

module.exports = router;
