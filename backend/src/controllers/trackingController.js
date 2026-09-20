const HistoryService = require('../services/historyService');
const ProductService = require('../services/productService');
const ScraperService = require('../services/scraperService');

class TrackingController {
  /**
   * List all tracked products
   * GET /api/tracked-products
   */
  static async getTrackedProducts(req, res) {
    try {
      const products = await HistoryService.getTrackedProducts();
      return res.json({
        success: true,
        count: products.length,
        data: products
      });
    } catch (err) {
      console.error('[TrackingController] Error listing tracked products:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Track a new product
   * POST /api/tracked-products
   */
  static async addTrackedProduct(req, res) {
    try {
      const { store_product_id, name, url, brand, category, sku } = req.body;

      if (!store_product_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: store_product_id'
        });
      }

      // Check if product details need to be looked up from mock store catalog
      let productDetails = null;
      if (!name || !url) {
        productDetails = await ProductService.getProductDetails(store_product_id);
      }

      const productToSave = {
        store_product_id: String(store_product_id),
        name: name || productDetails?.name || `Product #${store_product_id}`,
        brand: brand || productDetails?.brand || 'Generic',
        category: category || productDetails?.category || 'General',
        sku: sku || productDetails?.sku || `SKU-${store_product_id}`,
        url: url || productDetails?.url || `https://demo.inelabteamdev.com/product/${store_product_id}`,
        last_scrape_status: 'PENDING'
      };

      const saved = await HistoryService.saveTrackedProduct(productToSave);

      // Trigger an immediate initial baseline scrape in background
      ScraperService.scrapeProduct(saved, { headed: false }).catch(err => {
        console.error(`[TrackingController] Background initial scrape error for ${saved.id}:`, err.message);
      });

      return res.status(201).json({
        success: true,
        message: 'Product added to tracking. Initial scrape scheduled.',
        data: saved
      });
    } catch (err) {
      console.error('[TrackingController] Error tracking product:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Stop tracking product
   * DELETE /api/tracked-products/:id
   */
  static async deleteTrackedProduct(req, res) {
    try {
      const { id } = req.params;
      const success = await HistoryService.deleteTrackedProduct(id);

      if (!success) {
        return res.status(404).json({ success: false, error: 'Product not found.' });
      }

      return res.json({
        success: true,
        message: 'Product removed from tracking.'
      });
    } catch (err) {
      console.error('[TrackingController] Error deleting product:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get price history for product
   * GET /api/tracked-products/:id/history
   */
  static async getProductHistory(req, res) {
    try {
      const { id } = req.params;
      const history = await HistoryService.getPriceHistory(id);

      return res.json({
        success: true,
        count: history.length,
        productId: id,
        data: history
      });
    } catch (err) {
      console.error('[TrackingController] Error getting price history:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get scrape logs for product
   * GET /api/tracked-products/:id/logs
   */
  static async getProductLogs(req, res) {
    try {
      const { id } = req.params;
      const logs = await HistoryService.getScrapeLogs(id);

      return res.json({
        success: true,
        count: logs.length,
        productId: id,
        data: logs
      });
    } catch (err) {
      console.error('[TrackingController] Error getting scrape logs:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = TrackingController;
