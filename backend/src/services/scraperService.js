// const HttpScraper = require('./httpScraper');
// const BrowserScraper = require('./browserScraper');
// const RetryService = require('./retryService');
// const HistoryService = require('./historyService');

// class ScraperService {

//     // ============================================================
//     // SCRAPE ONE PRODUCT
//     // ============================================================

//     static async scrapeProduct(
//         product,
//         options = {}
//     ) {

//         const productId = product.id;
//         const productUrl = product.url;

//         // Keep headed false by default.
//         // For debugging you can pass { headed: true }.
//         const isHeaded = true;

//         console.log('');
//         console.log(
//             '======================================================'
//         );

//         console.log(
//             `[ScraperService] Initiating scrape for: "${product.name}"`
//         );

//         console.log(
//             `[ScraperService] URL: ${productUrl}`
//         );

//         console.log(
//             `[ScraperService] Headed: ${isHeaded}`
//         );

//         console.log(
//             '======================================================'
//         );

//         // ========================================================
//         // SCRAPE TASK
//         // ========================================================

//         const scrapeTask =
//             async (attemptNumber) => {

//                 console.log('');
//                 console.log(
//                     `[ScraperService] Attempt ${attemptNumber}: Trying lightweight HTTP scraper...`
//                 );

//                 // ------------------------------------------------
//                 // HTTP scraper first
//                 // ------------------------------------------------

//                 if (
//                     !options.forceBrowser &&
//                     !isHeaded
//                 ) {

//                     const httpResult =
//                         await HttpScraper.scrapeProduct(
//                             productUrl,
//                             product.store_product_id
//                         );

//                     if (
//                         httpResult.success &&
//                         httpResult.price
//                     ) {

//                         console.log(
//                             '[ScraperService] HTTP scraper succeeded.'
//                         );

//                         return {
//                             ...httpResult,
//                             scraperType: 'HTTP'
//                         };
//                     }

//                     console.log(
//                         `[ScraperService] HTTP Scraper indicated browser rendering needed: ${httpResult.error}`
//                     );
//                 }

//                 // ------------------------------------------------
//                 // Browser scraper
//                 // ------------------------------------------------

//                 console.log(
//                     `[ScraperService] Attempt ${attemptNumber}: Launching Playwright browser engine...`
//                 );

//                 const browserResult =
//                     await BrowserScraper.scrapeProduct(
//                         productUrl,
//                         {
//                             headed: isHeaded,
//                             slowMo:
//                                 isHeaded
//                                     ? 600
//                                     : 0,
//                             timeout: 25000
//                         }
//                     );

//                 return {
//                     ...browserResult,
//                     scraperType: 'BROWSER'
//                 };
//             };


//         // ========================================================
//         // RETRY SYSTEM
//         // ========================================================

//         const finalResult =
//             await RetryService.executeWithRetry(
//                 scrapeTask,
//                 {
//                     maxRetries:
//                         options.maxRetries || 3,

//                     baseDelayMs: 2000,

//                     onAttempt:
//                         async ({
//                             attempt,
//                             status,
//                             result,
//                             error
//                         }) => {

//                             await HistoryService.recordScrapeLog({
//                                 productId,

//                                 status,

//                                 httpStatus:
//                                     result?.httpStatus ||
//                                     (
//                                         status === 'SUCCESS'
//                                             ? 200
//                                             : 500
//                                     ),

//                                 errorMessage:
//                                     error ||
//                                     (
//                                         status === 'FAILED'
//                                             ? result?.error
//                                             : null
//                                     ),

//                                 attemptNumber:
//                                     attempt,

//                                 durationMs:
//                                     result?.durationMs ||
//                                     0,

//                                 scraperType:
//                                     result?.scraperType ||
//                                     'BROWSER'
//                             });
//                         }
//                 }
//             );


//         // ========================================================
//         // SUCCESS
//         // ========================================================

//         if (
//             finalResult &&
//             finalResult.success &&
//             finalResult.price > 0
//         ) {

//             console.log('');
//             console.log(
//                 '======================================================'
//             );

//             console.log(
//                 `✅ [ScraperService] Successful scrape for "${product.name}"`
//             );

//             console.log(
//                 `💰 Price: ₹${finalResult.price}`
//             );

//             console.log(
//                 `📦 Stock: ${finalResult.stock}`
//             );

//             console.log(
//                 '======================================================'
//             );

//             // ----------------------------------------------------
//             // Record price history
//             // ----------------------------------------------------

//             await HistoryService.recordPriceHistory({
//                 productId,

//                 price:
//                     finalResult.price,

//                 stock:
//                     finalResult.stock,

//                 stockStatus:
//                     finalResult.stockStatus,

//                 scrapedAt:
//                     new Date().toISOString()
//             });

//             // ----------------------------------------------------
//             // Update product summary
//             // ----------------------------------------------------

//             await HistoryService.updateProductScrapeSummary(
//                 productId,
//                 {
//                     price:
//                         finalResult.price,

//                     stock:
//                         finalResult.stock,

//                     stockStatus:
//                         finalResult.stockStatus,

//                     lastScrapedAt:
//                         new Date().toISOString(),

//                     // IMPORTANT:
//                     // Correct spelling
//                     lastScrapeStatus:
//                         'SUCCESS'
//                 }
//             );

//             return {
//                 success: true,

//                 price:
//                     finalResult.price,

//                 stock:
//                     finalResult.stock,

//                 stockStatus:
//                     finalResult.stockStatus,

//                 scraperType:
//                     finalResult.scraperType,

//                 durationMs:
//                     finalResult.durationMs
//             };
//         }


//         // ========================================================
//         // FAILURE
//         // ========================================================

//         console.log('');
//         console.log(
//             `[ScraperService] ❌ Scrape completely failed for "${product.name}". Never writing empty data to history.`
//         );

//         await HistoryService.updateProductScrapeSummary(
//             productId,
//             {
//                 price: null,

//                 stock: null,

//                 lastScrapedAt:
//                     new Date().toISOString(),

//                 lastScrapeStatus:
//                     'FAILED'
//             }
//         );

//         return {
//             success: false,

//             error:
//                 finalResult?.error ||
//                 'Scraping failed.',

//             scraperType:
//                 finalResult?.scraperType ||
//                 'BROWSER',

//             durationMs:
//                 finalResult?.durationMs ||
//                 0
//         };
//     }


//     // ============================================================
//     // SCRAPE ALL TRACKED PRODUCTS
//     // ============================================================

//     static async scrapeAllTrackedProducts(
//         products,
//         options = {}
//     ) {

//         const results = [];

//         for (
//             const product
//             of products
//         ) {

//             try {

//                 const result =
//                     await this.scrapeProduct(
//                         product,
//                         options
//                     );

//                 results.push({
//                     productId:
//                         product.id,

//                     productName:
//                         product.name,

//                     ...result
//                 });

//             } catch (error) {

//                 results.push({
//                     productId:
//                         product.id,

//                     productName:
//                         product.name,

//                     success: false,

//                     error:
//                         error.message
//                 });
//             }
//         }

//         return results;
//     }
// }

// module.exports = ScraperService;




const HttpScraper = require('./httpScraper');
const BrowserScraper = require('./browserScraper');
const RetryService = require('./retryService');
const HistoryService = require('./historyService');

class ScraperService {

    // ============================================================
    // SCRAPE ONE PRODUCT
    // ============================================================

    static async scrapeProduct(
        product,
        options = {}
    ) {

        const productId = product.id;
        const productUrl = product.url;

        // Keep headed false by default.
        // For debugging you can pass { headed: true }.
        const isHeaded = options.headed === true;

        console.log('');
        console.log(
            '======================================================'
        );

        console.log(
            `[ScraperService] Initiating scrape for: "${product.name}"`
        );

        console.log(
            `[ScraperService] URL: ${productUrl}`
        );

        console.log(
            `[ScraperService] Headed: ${isHeaded}`
        );

        console.log(
            '======================================================'
        );

        // ========================================================
        // SCRAPE TASK
        // ========================================================

        const scrapeTask =
            async (attemptNumber) => {

                console.log('');
                console.log(
                    `[ScraperService] Attempt ${attemptNumber}: Trying lightweight HTTP scraper...`
                );

                // ------------------------------------------------
                // HTTP scraper first
                // ------------------------------------------------

                if (
                    !options.forceBrowser &&
                    !isHeaded
                ) {

                    const httpResult =
                        await HttpScraper.scrapeProduct(
                            productUrl,
                            product.store_product_id
                        );

                    if (
                        httpResult.success &&
                        httpResult.price
                    ) {

                        console.log(
                            '[ScraperService] HTTP scraper succeeded.'
                        );

                        return {
                            ...httpResult,
                            scraperType: 'HTTP'
                        };
                    }

                    console.log(
                        `[ScraperService] HTTP Scraper indicated browser rendering needed: ${httpResult.error}`
                    );
                }

                // ------------------------------------------------
                // Browser scraper
                // ------------------------------------------------

                console.log(
                    `[ScraperService] Attempt ${attemptNumber}: Launching Playwright browser engine...`
                );

                const browserResult =
                    await BrowserScraper.scrapeProduct(
                        productUrl,
                        {
                            headed: isHeaded,
                            slowMo:
                                isHeaded
                                    ? 600
                                    : 0,
                            timeout: 25000
                        }
                    );

                return {
                    ...browserResult,
                    scraperType: 'BROWSER'
                };
            };


        // ========================================================
        // RETRY SYSTEM
        // ========================================================

        const finalResult =
            await RetryService.executeWithRetry(
                scrapeTask,
                {
                    maxRetries:
                        options.maxRetries || 3,

                    baseDelayMs: 2000,

                    onAttempt:
                        async ({
                            attempt,
                            status,
                            result,
                            error
                        }) => {

                            await HistoryService.recordScrapeLog({
                                productId,

                                status,

                                httpStatus:
                                    result?.httpStatus ||
                                    (
                                        status === 'SUCCESS'
                                            ? 200
                                            : 500
                                    ),

                                errorMessage:
                                    error ||
                                    (
                                        status === 'FAILED'
                                            ? result?.error
                                            : null
                                    ),

                                attemptNumber:
                                    attempt,

                                durationMs:
                                    result?.durationMs ||
                                    0,

                                scraperType:
                                    result?.scraperType ||
                                    'BROWSER'
                            });
                        }
                }
            );


        // ========================================================
        // SUCCESS
        // ========================================================

        if (
            finalResult &&
            finalResult.success &&
            finalResult.price > 0
        ) {

            console.log('');
            console.log(
                '======================================================'
            );

            console.log(
                `✅ [ScraperService] Successful scrape for "${product.name}"`
            );

            console.log(
                `💰 Price: ₹${finalResult.price}`
            );

            console.log(
                `📦 Stock: ${finalResult.stock}`
            );

            console.log(
                '======================================================'
            );

            // ----------------------------------------------------
            // Record price history
            //
            // IMPORTANT:
            // HistoryService.recordPriceHistory expects:
            //
            // recordPriceHistory(
            //     productId,
            //     price,
            //     stock,
            //     currency
            // )
            // ----------------------------------------------------

            await HistoryService.recordPriceHistory(
                productId,
                finalResult.price,
                finalResult.stock,
                finalResult.currency || 'INR'
            );

            // ----------------------------------------------------
            // Update product summary
            // ----------------------------------------------------

            await HistoryService.updateProductScrapeSummary(
                productId,
                {
                    price:
                        finalResult.price,

                    stock:
                        finalResult.stock,

                    stockStatus:
                        finalResult.stockStatus,

                    lastScrapedAt:
                        new Date().toISOString(),

                    lastScrapeStatus:
                        'SUCCESS'
                }
            );

            return {
                success: true,

                price:
                    finalResult.price,

                stock:
                    finalResult.stock,

                stockStatus:
                    finalResult.stockStatus,

                scraperType:
                    finalResult.scraperType,

                durationMs:
                    finalResult.durationMs
            };
        }


        // ========================================================
        // FAILURE
        // ========================================================

        console.log('');
        console.log(
            `[ScraperService] ❌ Scrape completely failed for "${product.name}". Never writing empty data to history.`
        );

        await HistoryService.updateProductScrapeSummary(
            productId,
            {
                price: null,

                stock: null,

                lastScrapedAt:
                    new Date().toISOString(),

                lastScrapeStatus:
                    'FAILED'
            }
        );

        return {
            success: false,

            error:
                finalResult?.error ||
                'Scraping failed.',

            scraperType:
                finalResult?.scraperType ||
                'BROWSER',

            durationMs:
                finalResult?.durationMs ||
                0
        };
    }


    // ============================================================
    // SCRAPE ALL TRACKED PRODUCTS
    // ============================================================

    static async scrapeAllTrackedProducts(
        products,
        options = {}
    ) {

        const results = [];

        for (
            const product
            of products
        ) {

            try {

                const result =
                    await this.scrapeProduct(
                        product,
                        options
                    );

                results.push({
                    productId:
                        product.id,

                    productName:
                        product.name,

                    ...result
                });

            } catch (error) {

                results.push({
                    productId:
                        product.id,

                    productName:
                        product.name,

                    success: false,

                    error:
                        error.message
                });
            }
        }

        return results;
    }
}

module.exports = ScraperService;