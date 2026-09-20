const axios = require('axios');
const cheerio = require('cheerio');
const env = require('../config/env');

class HttpScraper {
  /**
   * Attempts lightweight HTTP fetching and HTML parsing
   * Note: The mock storefront is an interactive React SPA. If the page
   * contains client-rendered or obscured pricing, this method signals that
   * headless browser rendering is required.
   */
  static async scrapeProduct(productUrl, productId) {
    const startTime = Date.now();

    try {
      const response = await axios.get(productUrl, {
        headers: {
          'User-Agent': env.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 8000,
        validateStatus: status => status < 500
      });

      const durationMs = Date.now() - startTime;
      const html = response.data;
      const $ = cheerio.load(html);

      // Check if this is an unrendered SPA skeleton
      const isSpaRoot = $('#root').length > 0 && $('.price-block').length === 0;

      if (isSpaRoot) {
        // SPA detected: Static HTML does not contain live rendered price/stock
        return {
          success: false,
          requiresBrowser: true,
          httpStatus: response.status,
          durationMs,
          error: 'Page requires JavaScript rendering (React SPA skeleton detected).'
        };
      }

      // If page is server-rendered or static content exists, extract visible price
      // Avoid honeypot elements with display:none or aria-hidden=true
      const priceText = $('.price-main')
        .find('*:not([style*="display:none"]):not([aria-hidden="true"])')
        .text();

      const price = this.parsePrice(priceText);
      const stock = this.parseStock($('.stock-badge').text());

      if (price !== null) {
        return {
          success: true,
          requiresBrowser: false,
          price,
          currency: 'INR',
          stock,
          stockStatus: stock > 0 ? (stock < 5 ? 'LOW_STOCK' : 'IN_STOCK') : 'OUT_OF_STOCK',
          httpStatus: response.status,
          durationMs
        };
      }

      return {
        success: false,
        requiresBrowser: true,
        httpStatus: response.status,
        durationMs,
        error: 'Price element not resolved in static HTML.'
      };
    } catch (err) {
      return {
        success: false,
        requiresBrowser: true,
        httpStatus: err.response?.status || 500,
        durationMs: Date.now() - startTime,
        error: `HTTP Fetch Error: ${err.message}`
      };
    }
  }

  static parsePrice(text) {
    if (!text) return null;
    // Extract currency formatted numbers (e.g., ₹ 1,499 or 1,499.00)
    const match = text.match(/(?:₹|Rs\.?|INR)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)/i);
    if (match && match[1]) {
      const clean = match[1].replace(/,/g, '');
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  static parseStock(text) {
    if (!text) return 0;
    const clean = text.toLowerCase();
    if (clean.includes('out of stock')) return 0;
    const match = clean.match(/(\d+)\s*(?:left|in stock)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    if (clean.includes('in stock')) return 10;
    return 0;
  }
}

module.exports = HttpScraper;
