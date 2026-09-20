  const { supabase, memoryStore, isConfigured } = require('../db/supabase');
  const crypto = require('crypto');

  class HistoryService {
    /**
     * Retrieves all tracked products
     */
    static async getTrackedProducts() {
      if (isConfigured()) {
        const { data, error } = await supabase
          .from('tracked_products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw new Error(`Supabase Error: ${error.message}`);
        return data || [];
      }

      return Array.from(memoryStore.tracked_products.values());
    }

    /**
     * Gets a single tracked product by internal UUID or store ID
     */
    static async getTrackedProduct(id) {
      if (isConfigured()) {
        const { data, error } = await supabase
          .from('tracked_products')
          .select('*')
          .or(`id.eq.${id},store_product_id.eq.${id}`)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw new Error(`Supabase Error: ${error.message}`);
        }
        return data || null;
      }

      const found = memoryStore.tracked_products.get(id);
      if (found) return found;

      for (const item of memoryStore.tracked_products.values()) {
        if (String(item.id) === String(id) || String(item.store_product_id) === String(id)) {
          return item;
        }
      }
      return null;
    }

    /**
     * Creates or updates a tracked product
     */
    static async saveTrackedProduct(product) {
      const now = new Date().toISOString();

      if (isConfigured()) {
        const { data, error } = await supabase
          .from('tracked_products')
          .upsert({
            store_product_id: String(product.store_product_id),
            name: product.name,
            brand: product.brand,
            category: product.category,
            sku: product.sku,
            url: product.url,
            current_price: product.current_price || null,
            currency: product.currency || 'INR',
            current_stock: product.current_stock || null,
            stock_status: product.stock_status || 'UNKNOWN',
            last_scraped_at: product.last_scraped_at || null,
            last_scrape_status: product.last_scrape_status || 'PENDING'
          }, { onConflict: 'store_product_id' })
          .select()
          .single();

        if (error) throw new Error(`Supabase Error: ${error.message}`);
        return data;
      }

      const id = product.id || crypto.randomUUID();
      const stored = {
        id,
        store_product_id: String(product.store_product_id),
        name: product.name,
        brand: product.brand,
        category: product.category,
        sku: product.sku,
        url: product.url,
        current_price: product.current_price || null,
        currency: product.currency || 'INR',
        current_stock: product.current_stock || null,
        stock_status: product.stock_status || 'UNKNOWN',
        last_scraped_at: product.last_scraped_at || null,
        last_scrape_status: product.last_scrape_status || 'PENDING',
        created_at: product.created_at || now,
        updated_at: now
      };

      memoryStore.tracked_products.set(id, stored);
      return stored;
    }

    /**
     * Deletes a tracked product and cascades to history and logs
     */
    static async deleteTrackedProduct(id) {
      if (isConfigured()) {
        const { error } = await supabase
          .from('tracked_products')
          .delete()
          .or(`id.eq.${id},store_product_id.eq.${id}`);

        if (error) throw new Error(`Supabase Error: ${error.message}`);
        return true;
      }

      const item = await this.getTrackedProduct(id);
      if (item) {
        memoryStore.tracked_products.delete(item.id);
        memoryStore.price_history = memoryStore.price_history.filter(h => h.product_id !== item.id);
        memoryStore.scrape_logs = memoryStore.scrape_logs.filter(l => l.product_id !== item.id);
        return true;
      }
      return false;
    }

    /**
     * Records a valid price and stock reading in price_history
     */
    static async recordPriceHistory(productId, price, stock, currency = 'INR') {
      if (price === null || price === undefined || isNaN(price)) {
        console.warn('[HistoryService] Refusing to write invalid/empty price to history.');
        return null;
      }

      const entry = {
        product_id: productId,
        price: Number(price),
        stock: stock !== null && stock !== undefined ? Number(stock) : null,
        currency,
        recorded_at: new Date().toISOString()
      };

      if (isConfigured()) {
        const { data, error } = await supabase
          .from('price_history')
          .insert(entry)
          .select()
          .single();

        if (error) console.error('[HistoryService] Error recording price history:', error.message);
        return data;
      }

      entry.id = crypto.randomUUID();
      memoryStore.price_history.push(entry);
      return entry;
    }

    /**
     * Retrieves price history time series for a product
     */
    static async getPriceHistory(productId) {
      if (isConfigured()) {
        const { data, error } = await supabase
          .from('price_history')
          .select('*')
          .eq('product_id', productId)
          .order('recorded_at', { ascending: true });

        if (error) throw new Error(`Supabase Error: ${error.message}`);
        return data || [];
      }

      return memoryStore.price_history
        .filter(h => String(h.product_id) === String(productId))
        .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
    }

    /**
     * Honest scrape audit logging: Records every attempt (SUCCESS, RETRIED, FAILED)
     */
    static async recordScrapeLog({
      productId,
      status,
      httpStatus = null,
      errorMessage = null,
      attemptNumber = 1,
      durationMs = 0,
      scraperType = 'HTTP'
    }) {
      const logEntry = {
        product_id: productId,
        status, // 'SUCCESS', 'RETRIED', 'FAILED'
        http_status: httpStatus,
        error_message: errorMessage ? String(errorMessage).substring(0, 500) : null,
        attempt_number: attemptNumber,
        duration_ms: durationMs,
        scraper_type: scraperType,
        created_at: new Date().toISOString()
      };

      if (isConfigured()) {
        const { data, error } = await supabase
          .from('scrape_logs')
          .insert(logEntry)
          .select()
          .single();

        if (error) console.error('[HistoryService] Error writing scrape log:', error.message);
        return data;
      }

      logEntry.id = crypto.randomUUID();
      memoryStore.scrape_logs.push(logEntry);
      return logEntry;
    }

    /**
     * Retrieves per-product scrape logs
     */
    static async getScrapeLogs(productId) {
      if (isConfigured()) {
        const { data, error } = await supabase
          .from('scrape_logs')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw new Error(`Supabase Error: ${error.message}`);
        return data || [];
      }

      return memoryStore.scrape_logs
        .filter(l => String(l.product_id) === String(productId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    /**
     * Updates latest product status on successful or failed scrape
     */
    static async updateProductScrapeSummary(productId, {
      price,
      stock,
      stockStatus,
      lastScrapedAt,
      lastScrapeStatus
    }) {
      const updates = {
        last_scraped_at: lastScrapedAt || new Date().toISOString(),
        last_scrape_status: lastScrapeStatus
      };

      // Only update price and stock if valid (never overwrite with empty/bogus data on failure)
      if (price !== null && price !== undefined) {
        updates.current_price = Number(price);
      }
      if (stock !== null && stock !== undefined) {
        updates.current_stock = Number(stock);
      }
      if (stockStatus) {
        updates.stock_status = stockStatus;
      }

      if (isConfigured()) {
        const { data, error } = await supabase
          .from('tracked_products')
          .update(updates)
          .eq('id', productId)
          .select()
          .single();

        if (error) console.error('[HistoryService] Error updating product summary:', error.message);
        return data;
      }

      const product = memoryStore.tracked_products.get(productId);
      if (product) {
        Object.assign(product, updates, { updated_at: new Date().toISOString() });
        return product;
      }
      return null;
    }
  }

  module.exports = HistoryService;
