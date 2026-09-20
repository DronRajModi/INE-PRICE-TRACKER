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
   * External cron job triggering all tracked products
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
        return res.status(200).json({
          success: true,
          message: 'No tracked products found',
          timestamp: new Date().toISOString(),
          productsQueued: 0
        });
      }

      /*
       * Start the batch scraper in the background.
       *
       * IMPORTANT:
       * Do NOT use "await" here.
       *
       * The complete batch can take several minutes,
       * while cron-job.org expects the HTTP request to
       * finish quickly.
       */
      ScraperService.scrapeAllTrackedProducts(
        products,
        {
          headed: false,
          forceBrowser: true,
          maxRetries: 3
        }
      )
        .then(results => {
          const successful =
            results.filter(result => result.success).length;

          const failed =
            results.length - successful;

          console.log(
            `[ScrapeController] Background batch completed: ${successful} successful, ${failed} failed`
          );
        })
        .catch(error => {
          console.error(
            '[ScrapeController] Background batch scrape error:',
            error.message
          );
        });

      /*
       * Respond immediately to cron-job.org.
       */
      return res.status(202).json({
        success: true,
        message: 'Batch scrape started in background',
        productsQueued: products.length,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error(
        '[ScrapeController] Batch scrape trigger error:',
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