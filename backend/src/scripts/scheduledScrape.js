const HistoryService = require('../services/historyService');
const ScraperService = require('../services/scraperService');

async function runScheduledScrape() {
    const startedAt = Date.now();

    console.log('');
    console.log('======================================================');
    console.log('        INE PRICE TRACKER - SCHEDULED SCRAPE');
    console.log('======================================================');
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('');

    try {
        // =========================================================
        // 1. GET ALL MONITORED PRODUCTS
        // =========================================================

        const products =
            await HistoryService.getTrackedProducts();

        console.log(
            `[ScheduledScrape] Found ${products.length} tracked product(s).`
        );

        if (products.length === 0) {
            console.log(
                '[ScheduledScrape] No tracked products found.'
            );

            return;
        }

        // =========================================================
        // 2. SCRAPE ALL PRODUCTS
        // =========================================================

        const results =
            await ScraperService.scrapeAllTrackedProducts(
                products,
                {
                    headed: false,
                    forceBrowser: true,
                    maxRetries: 3
                }
            );

        // =========================================================
        // 3. CALCULATE SUMMARY
        // =========================================================

        const successful =
            results.filter(
                result => result.success
            ).length;

        const failed =
            results.length - successful;

        // =========================================================
        // 4. PRINT SUMMARY
        // =========================================================

        console.log('');
        console.log('======================================================');
        console.log('                 SCRAPE SUMMARY');
        console.log('======================================================');

        console.log(`Total products : ${results.length}`);
        console.log(`Successful     : ${successful}`);
        console.log(`Failed         : ${failed}`);

        console.log('');
        console.log('Product Results:');

        for (const result of results) {

            if (result.success) {

                console.log(
                    `✅ ${result.productName} | ₹${result.price}`
                );

            } else {

                console.log(
                    `❌ ${result.productName} | ${result.error || 'Unknown error'}`
                );

            }
        }

        console.log('');
        console.log(
            `Duration      : ${Date.now() - startedAt} ms`
        );

        console.log('======================================================');
        console.log(
            `Completed at: ${new Date().toISOString()}`
        );
        console.log('======================================================');
        console.log('');

    } catch (error) {

        console.error('');
        console.error('======================================================');
        console.error('❌ SCHEDULED SCRAPE FAILED');
        console.error('======================================================');

        console.error(error);

        console.error('');

        process.exitCode = 1;
    }
}

runScheduledScrape();