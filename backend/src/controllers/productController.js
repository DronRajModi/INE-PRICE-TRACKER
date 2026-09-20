const ProductService = require('../services/productService');

class ProductController {
  /**
   * Search mock store catalog
   * GET /api/products/search?q=query
   */
  static async searchProducts(req, res) {
    try {
      const query = req.query.q || '';
      const results = await ProductService.searchProducts(query);
      return res.json({
        success: true,
        count: results.length,
        query,
        products: results
      });
    } catch (err) {
      console.error('[ProductController] Search error:', err.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to search products from store.'
      });
    }
  }
}

module.exports = ProductController;
