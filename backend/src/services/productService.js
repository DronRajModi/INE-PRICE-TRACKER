const axios = require('axios');
const env = require('../config/env');

let cachedCatalog = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class ProductService {
  /**
   * Fetches full or paginated catalog from the mock storefront API
   */
  static async fetchCatalog(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedCatalog && now < cacheExpiry) {
      return cachedCatalog;
    }

    try {
      // The store has 1000 items, let's fetch first few pages or page size 100
      const response = await axios.get(`${env.mockStoreUrl}/api/catalog`, {
        params: { page: 1, pageSize: 100 },
        headers: {
          'User-Agent': env.userAgent,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && Array.isArray(response.data.items)) {
        cachedCatalog = response.data.items;
        cacheExpiry = now + CACHE_TTL_MS;
        return cachedCatalog;
      }

      return cachedCatalog || [];
    } catch (err) {
      console.error('Error fetching catalog from mock store:', err.message);
      return cachedCatalog || [];
    }
  }

  /**
   * Searches the store catalog by query string (matching name, brand, category, SKU)
   */
  static async searchProducts(query = '') {
    const catalog = await this.fetchCatalog();
    const cleanQuery = (query || '').trim().toLowerCase();

    if (!cleanQuery) {
      // Return top 20 items if no query
      return catalog.slice(0, 20).map(this.normalizeProduct);
    }

    const filtered = catalog.filter(p => {
      const name = (p.name || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();

      return name.includes(cleanQuery) ||
             brand.includes(cleanQuery) ||
             category.includes(cleanQuery) ||
             sku.includes(cleanQuery) ||
             desc.includes(cleanQuery);
    });

    return filtered.map(this.normalizeProduct);
  }

  /**
   * Retrieves single product specification from the store API
   */
  static async getProductDetails(productId) {
    try {
      const response = await axios.get(`${env.mockStoreUrl}/api/product/${productId}`, {
        headers: { 'User-Agent': env.userAgent },
        timeout: 8000
      });

      if (response.data) {
        return this.normalizeProduct(response.data);
      }
      return null;
    } catch (err) {
      // Fallback: check cached catalog
      const catalog = await this.fetchCatalog();
      const found = catalog.find(p => String(p.id) === String(productId));
      return found ? this.normalizeProduct(found) : null;
    }
  }

  /**
   * Normalizes product representation
   */
  static normalizeProduct(item) {
    const storeUrl = `${env.mockStoreUrl}/product/${item.id}`;
    return {
      store_product_id: String(item.id),
      name: item.name || 'Unnamed Product',
      brand: item.brand || 'Generic',
      category: item.category || 'General',
      sku: item.sku || `SKU-${item.id}`,
      description: item.description || '',
      url: storeUrl
    };
  }
}

module.exports = ProductService;
