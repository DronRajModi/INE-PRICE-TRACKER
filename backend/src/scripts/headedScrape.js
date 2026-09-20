// const { chromium } = require('playwright');
// const env = require('../config/env');
// const HistoryService = require('../services/historyService');
// const BrowserScraper = require('../services/browserScraper');

// async function runHeadedScrape() {
//   console.log('\n======================================================');
//   console.log('   INE STORE OBSERVABLE (HEADED) SCRAPER RUNNER       ');
//   console.log('   Use this script to create your 2-4 min recording   ');
//   console.log('======================================================\n');

//   // Determine target product
//   const arg = process.argv[2];
//   let targetUrl = '';
//   let productName = 'INE Store Product';
//   let targetId = '25';

//   if (arg) {
//     if (arg.startsWith('http')) {
//       targetUrl = arg;
//       const match = arg.match(/\/product\/(\d+)/);
//       if (match) targetId = match[1];
//     } else {
//       targetId = arg;
//       targetUrl = `${env.mockStoreUrl}/product/${targetId}`;
//     }
//   } else {
//     // Check if there is any tracked product in db
//     try {
//       const tracked = await HistoryService.getTrackedProducts();
//       if (tracked && tracked.length > 0) {
//         targetUrl = tracked[0].url;
//         productName = tracked[0].name;
//         targetId = tracked[0].store_product_id;
//       }
//     } catch {
//       // Fallback to default mock item
//     }

//     if (!targetUrl) {
//       targetId = '25';
//       targetUrl = `${env.mockStoreUrl}/product/${targetId}`;
//     }
//   }

//   console.log(`🎯 Target Product: "${productName}" (ID: ${targetId})`);
//   console.log(`🌐 Target URL: ${targetUrl}`);
//   console.log(`🖥️  Launching Chromium browser in HEADED visual mode (slowMo: 600ms)...\n`);

//   const browser = await chromium.launch({
//     headless: false,
//     slowMo: 600, // Visual delay to clearly demonstrate scraper actions
//     args: ['--start-maximized']
//   });

//   const context = await browser.newContext({
//     viewport: null, // maximized window
//     userAgent: env.userAgent
//   });

//   const page = await context.newPage();

//   try {
//     console.log(`[Step 1/5] 🧭 Navigating to product page...`);
//     await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
//     console.log(`[Step 1/5] ✅ Page loaded.`);
//     await page.waitForTimeout(1500);

//     console.log(`[Step 2/5] 🍪 Checking for Cookie Consent overlay...`);
//     const cookieBtn = await page.$('.cookie-banner button.btn-primary, button[aria-label="Accept cookies"]');
//     if (cookieBtn) {
//       console.log(`[Step 2/5] 👆 Cookie banner detected! Clicking "Accept cookies"...`);
//       await cookieBtn.click();
//       await page.waitForTimeout(1000);
//     } else {
//       console.log(`[Step 2/5] ℹ️  No blocking cookie overlay found.`);
//     }

//     console.log(`[Step 3/5] 🖱️  Simulating user hover & dwell over price section...`);
//     const priceArea = await page.$('.price-block, .price-idle, .price-main');
//     if (priceArea) {
//       const box = await priceArea.boundingBox();
//       if (box) {
//         await page.mouse.move(box.x + 20, box.y + 20);
//         await page.waitForTimeout(800);
//         await page.mouse.move(box.x + 60, box.y + 40);
//         await page.waitForTimeout(800);
//       }
//     }

//     console.log(`[Step 4/5] 🔍 Looking for "Reveal price" button...`);
//     const revealBtn = await page.$('button[aria-label="Reveal price"], .price-block button.btn-primary');
//     if (revealBtn && await revealBtn.isVisible()) {
//       console.log(`[Step 4/5] 👆 Clicking "Reveal price"...`);
//       await revealBtn.click();
//       console.log(`[Step 4/5] ⏳ Waiting for price spinner and asynchronous resolution...`);
//     }

//     // Wait for the price success block
//     await page.waitForSelector('.price-block.price-success, .price-main', {
//       state: 'visible',
//       timeout: 15000
//     });
//     await page.waitForTimeout(1500);

//     console.log(`[Step 5/5] 🏷️  Extracting authentic price (filtering out honeypots/decoys)...`);
//     const extracted = await page.evaluate(() => {
//       const priceBlock = document.querySelector('.price-block.price-success') || document.querySelector('.price-block');
//       if (!priceBlock) return null;

//       const priceMain = priceBlock.querySelector('.price-main');
//       const allSpans = Array.from(priceMain.querySelectorAll('*'));

//       // Filter out decoys and hidden honeypot elements
//       const visible = allSpans.filter(el => {
//         const style = window.getComputedStyle(el);
//         const isHidden = style.display === 'none' || style.visibility === 'hidden' || el.getAttribute('aria-hidden') === 'true';
//         const isDecoy = el.classList.contains('amount') || el.classList.contains('price-value');
//         return !isHidden && !isDecoy;
//       });

//       let priceText = '';
//       for (const el of visible) {
//         const t = (el.textContent || '').trim();
//         if (t && (t.includes('₹') || t.includes('Rs') || /\d+/.test(t))) {
//           priceText = t;
//           break;
//         }
//       }

//       const stockEl = priceBlock.querySelector('.stock-badge');
//       const stockText = stockEl ? stockEl.textContent.trim() : 'Unknown';

//       return { priceText, stockText };
//     });

//     console.log(`\n======================================================`);
//     console.log(`🎉 SCRAPE COMPLETED SUCCESSFULLY!`);
//     console.log(`💵 Raw Price Text Extracted: "${extracted?.priceText}"`);
//     console.log(`📦 Stock Badge Text: "${extracted?.stockText}"`);
//     console.log(`======================================================\n`);

//     console.log('Keeping browser open for 5 seconds for visual verification...');
//     await page.waitForTimeout(5000);

//   } catch (err) {
//     console.error(`\n❌ Headed Scrape Encountered an Error: ${err.message}`);
//     console.log('Keeping browser open for 5 seconds to observe error state...');
//     await page.waitForTimeout(5000);
//   } finally {
//     await browser.close();
//     console.log('Browser closed. Done.');
//     process.exit(0);
//   }
// }

// runHeadedScrape();



const HistoryService = require('../services/historyService');
const ScraperService = require('../services/scraperService');

async function runHeadedScrape() {
    console.log('');
    console.log('======================================================');
    console.log('   INE STORE OBSERVABLE (HEADED) SCRAPER RUNNER');
    console.log('   Use this script to create your 2-4 min recording');
    console.log('======================================================');
    console.log('');

    try {
        const products = await HistoryService.getTrackedProducts();

        if (!products || products.length === 0) {
            console.log('❌ No tracked products found.');
            process.exitCode = 1;
            return;
        }

        // Use the first tracked product for the visual demonstration.
        const product = products[0];

        console.log(
            `🎯 Target Product: "${product.name}" (ID: ${product.store_product_id})`
        );

        console.log(
            `🌐 Target URL: ${product.url || product.product_url || 'Using configured product URL'}`
        );

        console.log(
            '🖥️  Launching Chromium browser in HEADED visual mode (slowMo: 600ms)...'
        );

        console.log('');
        console.log('======================================================');
        console.log('                 HEADED SCRAPE START');
        console.log('======================================================');
        console.log('');

        const result = await ScraperService.scrapeProduct(
            product,
            {
                headed: true,
                forceBrowser: true,
                maxRetries: 3
            }
        );

        console.log('');
        console.log('======================================================');
        console.log('                 HEADED SCRAPE RESULT');
        console.log('======================================================');

        if (result.success) {
            console.log('✅ Scrape successful');
            console.log(`💰 Price: ₹${result.price}`);
            console.log(`📦 Stock: ${result.stock}`);
            console.log(`🔧 Scraper: ${result.scraperType || 'BROWSER'}`);
        } else {
            console.log('❌ Scrape failed');
            console.log(`Error: ${result.error || 'Unknown error'}`);
            process.exitCode = 1;
        }

        console.log('======================================================');
        console.log('');

    } catch (error) {
        console.error('');
        console.error('======================================================');
        console.error('❌ HEADED SCRAPE FAILED');
        console.error('======================================================');
        console.error(error);
        console.error('');

        process.exitCode = 1;
    }
}

runHeadedScrape();