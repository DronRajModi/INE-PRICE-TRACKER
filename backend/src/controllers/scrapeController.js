// const HistoryService = require('../services/historyService');
// const ScraperService = require('../services/scraperService');

// class ScrapeController {
//   /**
//    * Immediate on-demand scrape for a single product
//    * POST /api/tracked-products/:id/scrape
//    */
//   static async scrapeSingleProduct(req, res) {
//     try {
//       const { id } = req.params;
//       const product = await HistoryService.getTrackedProduct(id);

//       if (!product) {
//         return res.status(404).json({ success: false, error: 'Product not found' });
//       }

//       console.log(`[ScrapeController] Immediate scrape requested for: ${product.name}`);
//       const result = await ScraperService.scrapeProduct(product, { headed: false });

//       return res.json({
//         success: result.success,
//         data: result
//       });
//     } catch (err) {
//       console.error('[ScrapeController] Immediate scrape error:', err.message);
//       return res.status(500).json({ success: false, error: err.message });
//     }
//   }

//   /**
//    * Scheduled cron job triggering all tracked products
//    * POST /api/jobs/scrape-all
//    */
//   static async scrapeAllJobs(req, res) {
//     try {
//       console.log('[ScrapeController] External cron trigger received for /api/jobs/scrape-all');

//       // Run batch scrape
//       const summary = await ScraperService.scrapeAllTrackedProducts();

//       return res.json({
//         success: true,
//         timestamp: new Date().toISOString(),
//         summary
//       });
//     } catch (err) {
//       console.error('[ScrapeController] Batch scrape error:', err.message);
//       return res.status(500).json({ success: false, error: err.message });
//     }
//   }
// }

// module.exports = ScrapeController;



const HistoryService = require('../services/historyService');
const ScraperService = require('../services/scraperService');

class ScrapeController {
  /**
   * Immediate on-demand scrape for a single product
   * POST /api/tracked-products/:id/scrape
   */
  static async scrapeSingleProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await HistoryService.getTrackedProduct(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      console.log(
        `[ScrapeController] Immediate scrape requested for: ${product.name}`
      );

      const result = await ScraperService.scrapeProduct(
        product,
        {
          headed: false,
          forceBrowser: true,
          maxRetries: 3
        }
      );

      return res.json({
        success: result.success,
        data: result
      });

    } catch (err) {
      console.error(
        '[ScrapeController] Immediate scrape error:',
        err.message
      );

      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  /**
   * Scheduled cron job triggering all tracked products
   * POST /api/jobs/scrape-all
   */
  static async scrapeAllJobs(req, res) {
    try {
      console.log(
        '[ScrapeController] External cron trigger received for /api/jobs/scrape-all'
      );

      // Get all tracked products
      const products = await HistoryService.getTrackedProducts();

      console.log(
        `[ScrapeController] Found ${products.length} tracked product(s)`
      );

      if (products.length === 0) {
        return res.json({
          success: true,
          timestamp: new Date().toISOString(),
          summary: {
            total: 0,
            successful: 0,
            failed: 0,
            results: []
          }
        });
      }

      // Run batch scrape
      const results =
        await ScraperService.scrapeAllTrackedProducts(
          products,
          {
            headed: false,
            forceBrowser: true,
            maxRetries: 3
          }
        );

      const successful =
        results.filter(result => result.success).length;

      const failed =
        results.length - successful;

      const summary = {
        total: results.length,
        successful,
        failed,
        results
      };

      console.log(
        `[ScrapeController] Batch scrape completed: ${successful} successful, ${failed} failed`
      );

      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        summary
      });

    } catch (err) {
      console.error(
        '[ScrapeController] Batch scrape error:',
        err.message
      );

      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
}

module.exports = ScrapeController;