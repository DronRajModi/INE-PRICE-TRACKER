// const { chromium } = require('playwright');
// const env = require('../config/env');

// class BrowserScraper {

//     // ============================================================
//     // MAIN SCRAPER
//     // ============================================================

//     static async scrapeProduct(productUrl, options = {}) {

//         const startTime = Date.now();

//         const timeout = options.timeout || 25000;

//         // Normal behavior:
//         // headed is controlled by options.headed
//         //
//         // Debug behavior:
//         // pass debugHeaded: true to visibly open Chromium.
//         const headed =
//             options.debugHeaded === true
//                 ? true
//                 : options.headed === true;

//         const slowMo =
//             options.slowMo || 0;

//         let browser = null;

//         try {

//             console.log('');
//             console.log('==============================================');
//             console.log('🌐 BROWSER SCRAPER STARTING');
//             console.log('==============================================');

//             console.log(`🔗 URL: ${productUrl}`);
//             console.log(`🖥️ Headed: ${headed}`);
//             console.log(`⏱️ Timeout: ${timeout}ms`);

//             // ====================================================
//             // 1. LAUNCH CHROMIUM
//             // ====================================================

//             browser = await chromium.launch({
//                 headless: !headed,
//                 slowMo: slowMo
//             });

//             console.log('✅ Chromium launched.');

//             // ====================================================
//             // 2. CREATE CONTEXT
//             // ====================================================

//             const context = await browser.newContext({

//                 userAgent: env.userAgent,

//                 viewport: {
//                     width: 1280,
//                     height: 800
//                 },

//                 // Normal desktop browser settings
//                 deviceScaleFactor: 1,

//                 locale: 'en-IN',

//                 timezoneId: 'Asia/Kolkata'
//             });

//             const page = await context.newPage();

//             console.log('✅ Browser context created.');

//             // ====================================================
//             // 3. BROWSER CONSOLE LOGGING
//             // ====================================================

//             page.on('console', msg => {

//                 const type = msg.type();

//                 // Only show our diagnostic logs
//                 // and errors from the page.

//                 if (
//                     type === 'error' ||
//                     msg.text().startsWith('[SCRAPER]')
//                 ) {

//                     console.log(
//                         `[PAGE ${type.toUpperCase()}] ${msg.text()}`
//                     );
//                 }
//             });

//             // ====================================================
//             // 4. PAGE ERRORS
//             // ====================================================

//             page.on('pageerror', error => {

//                 console.log(
//                     `[PAGE ERROR] ${error.message}`
//                 );
//             });

//             // ====================================================
//             // 5. NAVIGATE
//             // ====================================================

//             console.log('');
//             console.log('➡️ Navigating to product page...');

//             await page.goto(productUrl, {
//                 waitUntil: 'domcontentloaded',
//                 timeout: timeout
//             });

//             console.log(
//                 `📍 Current URL: ${page.url()}`
//             );

//             console.log(
//                 `📄 Title: ${await page.title()}`
//             );

//             // ====================================================
//             // 6. WAIT FOR REACT
//             // ====================================================

//             console.log('');
//             console.log(
//                 '⏳ Waiting for product container...'
//             );

//             await page.waitForSelector(
//                 '.detail, .detail-card, #root',
//                 {
//                     state: 'visible',
//                     timeout: 10000
//                 }
//             );

//             console.log(
//                 '✅ Product container detected.'
//             );

//             // Allow React to finish initial rendering
//             await page.waitForTimeout(1500);

//             // ====================================================
//             // 7. COOKIE CONSENT
//             // ====================================================

//             await this.handleCookieConsent(page);

//             // ====================================================
//             // 8. INSTALL PRICE DEBUG MONITOR
//             // ====================================================

//             await this.installPriceDebugMonitor(page);

//             // ====================================================
//             // 9. INITIAL DEBUG
//             // ====================================================

//             await this.debugPage(page);

//             // ====================================================
//             // 10. REVEAL PRICE
//             // ====================================================

//             console.log('');
//             console.log('==============================================');
//             console.log('💰 PRICE REVEAL PROCESS');
//             console.log('==============================================');

//             const revealResult =
//                 await this.triggerPriceReveal(page);

//             console.log(
//                 `💰 Reveal result: ${revealResult.success}`
//             );

//             console.log(
//                 `💬 Reveal message: ${revealResult.reason}`
//             );

//             // ====================================================
//             // 11. WAIT FOR PRICE
//             // ====================================================

//             console.log('');
//             console.log(
//                 '⏳ Waiting for price to appear...'
//             );

//             let priceFound = false;

//             try {

//                 await page.waitForFunction(
//                     () => {

//                         const price =
//                             document.querySelector(
//                                 '.price-main'
//                             );

//                         if (!price) {
//                             return false;
//                         }

//                         const style =
//                             window.getComputedStyle(price);

//                         const text =
//                             price.textContent?.trim() || '';

//                         return (
//                             style.display !== 'none' &&
//                             style.visibility !== 'hidden' &&
//                             text.length > 0
//                         );
//                     },
//                     null,
//                     {
//                         timeout: 12000
//                     }
//                 );

//                 priceFound = true;

//                 console.log(
//                     '✅ Price element appeared!'
//                 );

//             } catch (error) {

//                 console.log(
//                     '⚠️ Price did not appear within 12 seconds.'
//                 );
//             }

//             // ====================================================
//             // 12. FINAL DEBUG
//             // ====================================================

//             await this.debugPage(page);

//             // ====================================================
//             // 13. SCREENSHOT
//             // ====================================================

//             try {

//                 await page.screenshot({
//                     path: 'scraper-debug.png',
//                     fullPage: true
//                 });

//                 console.log(
//                     '📸 Debug screenshot saved: scraper-debug.png'
//                 );

//             } catch (error) {

//                 console.log(
//                     `⚠️ Screenshot failed: ${error.message}`
//                 );
//             }

//             // ====================================================
//             // 14. EXTRACT PRICE
//             // ====================================================

//             const priceText =
//                 await page
//                     .locator('.price-main')
//                     .first()
//                     .textContent()
//                     .catch(() => '');

//             console.log(
//                 `💵 Raw price text: "${priceText}"`
//             );

//             const price =
//                 this.cleanPrice(priceText);

//             console.log(
//                 `💵 Parsed price: ${price}`
//             );

//             // ====================================================
//             // 15. EXTRACT STOCK
//             // ====================================================

//             const stockText =
//                 await page
//                     .locator('.stock-badge')
//                     .first()
//                     .textContent()
//                     .catch(() => '');

//             console.log(
//                 `📦 Raw stock text: "${stockText}"`
//             );

//             const stock =
//                 this.cleanStock(stockText);

//             console.log(
//                 `📦 Parsed stock: ${stock}`
//             );

//             // ====================================================
//             // 16. DURATION
//             // ====================================================

//             const durationMs =
//                 Date.now() - startTime;

//             // ====================================================
//             // 17. SUCCESS
//             // ====================================================

//             if (
//                 price !== null &&
//                 price > 0
//             ) {

//                 console.log('');
//                 console.log(
//                     '=============================================='
//                 );

//                 console.log(
//                     '✅ SCRAPE SUCCESSFUL'
//                 );

//                 console.log(
//                     '=============================================='
//                 );

//                 console.log(
//                     `💰 Price: ₹${price}`
//                 );

//                 console.log(
//                     `📦 Stock: ${stock}`
//                 );

//                 console.log(
//                     `⏱️ Duration: ${durationMs}ms`
//                 );

//                 return {

//                     success: true,

//                     price: price,

//                     stock: stock,

//                     stockStatus:
//                         stock > 0
//                             ? 'IN_STOCK'
//                             : 'OUT_OF_STOCK',

//                     durationMs: durationMs,

//                     httpStatus: 200
//                 };
//             }

//             // ====================================================
//             // 18. FAILURE
//             // ====================================================

//             console.log('');
//             console.log(
//                 '=============================================='
//             );

//             console.log(
//                 '❌ SCRAPE FAILED'
//             );

//             console.log(
//                 '=============================================='
//             );

//             return {

//                 success: false,

//                 requiresBrowser: true,

//                 durationMs: durationMs,

//                 httpStatus: 200,

//                 error:
//                     priceFound
//                         ? 'Price element found but could not be parsed.'
//                         : 'Price was not revealed on the page.'
//             };

//         } catch (error) {

//             const durationMs =
//                 Date.now() - startTime;

//             console.error('');
//             console.error(
//                 '=============================================='
//             );

//             console.error(
//                 '❌ BROWSER SCRAPER ERROR'
//             );

//             console.error(
//                 '=============================================='
//             );

//             console.error(
//                 error.message
//             );

//             return {

//                 success: false,

//                 requiresBrowser: true,

//                 durationMs: durationMs,

//                 httpStatus: 500,

//                 error:
//                     `Browser Scraper Error: ${error.message}`
//             };

//         } finally {

//             // ====================================================
//             // CLOSE BROWSER
//             // ====================================================

//             if (browser) {

//                 try {

//                     await browser.close();

//                     console.log(
//                         '🔒 Browser closed.'
//                     );

//                 } catch (error) {

//                     console.log(
//                         `⚠️ Browser close error: ${error.message}`
//                     );
//                 }
//             }
//         }
//     }


//     // ============================================================
//     // PRICE REVEAL
//     // ============================================================

//     static async triggerPriceReveal(page) {

//         try {

//             console.log('');
//             console.log(
//                 '💰 Starting advanced price reveal...'
//             );

//             console.log(
//                 '────────────────────────────────────────'
//             );

//             // ====================================================
//             // 1. LOCATE PRICE BLOCK
//             // ====================================================

//             const priceArea =
//                 page
//                     .locator('.price-block')
//                     .first();

//             const priceAreaCount =
//                 await page
//                     .locator('.price-block')
//                     .count();

//             console.log(
//                 `🔎 Price block count: ${priceAreaCount}`
//             );

//             if (priceAreaCount === 0) {

//                 return {

//                     success: false,

//                     reason:
//                         'Price block not found.'
//                 };
//             }

//             // ====================================================
//             // 2. LOCATE IDLE AREA
//             // ====================================================

//             const idleArea =
//                 page
//                     .locator('.price-idle')
//                     .first();

//             const idleCount =
//                 await page
//                     .locator('.price-idle')
//                     .count();

//             console.log(
//                 `🔎 Price idle count: ${idleCount}`
//             );

//             // ====================================================
//             // 3. SCROLL PRICE AREA INTO VIEW
//             // ====================================================

//             console.log(
//                 '📜 Scrolling price area into view...'
//             );

//             await priceArea.scrollIntoViewIfNeeded();

//             await page.waitForTimeout(500);

//             // ====================================================
//             // 4. GET BOX
//             // ====================================================

//             const box =
//                 await priceArea.boundingBox();

//             if (!box) {

//                 return {

//                     success: false,

//                     reason:
//                         'Could not determine price block position.'
//                 };
//             }

//             console.log(
//                 `📍 Position: x=${Math.round(box.x)}, y=${Math.round(box.y)}`
//             );

//             console.log(
//                 `📐 Size: ${Math.round(box.width)} x ${Math.round(box.height)}`
//             );

//             // ====================================================
//             // 5. GET INITIAL BUTTON
//             // ====================================================

//             const revealButton =
//                 page
//                     .locator(
//                         'button[aria-label="Reveal price"]'
//                     )
//                     .first();

//             const initialEnabled =
//                 await revealButton
//                     .isEnabled()
//                     .catch(() => false);

//             const initialDisabled =
//                 await revealButton
//                     .getAttribute('disabled')
//                     .catch(() => null);

//             console.log('');
//             console.log(
//                 '🔘 INITIAL BUTTON STATE'
//             );

//             console.log(
//                 `Enabled: ${initialEnabled}`
//             );

//             console.log(
//                 `Disabled: ${initialDisabled}`
//             );

//             // ====================================================
//             // 6. MOVE MOUSE FAR AWAY
//             // ====================================================

//             console.log('');
//             console.log(
//                 '🖱️ Moving mouse outside price area...'
//             );

//             await page.mouse.move(
//                 20,
//                 20,
//                 {
//                     steps: 30
//                 }
//             );

//             await page.waitForTimeout(500);

//             // ====================================================
//             // 7. REAL MOUSE MOVEMENT INTO PRICE BLOCK
//             // ====================================================

//             const centerX =
//                 box.x + box.width / 2;

//             const centerY =
//                 box.y + box.height / 2;

//             console.log('');
//             console.log(
//                 '🖱️ Moving mouse INTO price area...'
//             );

//             console.log(
//                 `🎯 Target: ${Math.round(centerX)}, ${Math.round(centerY)}`
//             );

//             await page.mouse.move(
//                 centerX,
//                 centerY,
//                 {
//                     steps: 60
//                 }
//             );

//             await page.waitForTimeout(500);

//             // ====================================================
//             // 8. PLAYWRIGHT HOVER
//             // ====================================================

//             console.log(
//                 '🖱️ Calling Playwright hover()...'
//             );

//             await priceArea.hover({
//                 force: true
//             });

//             console.log(
//                 '✅ hover() completed.'
//             );

//             // ====================================================
//             // 9. ALSO HOVER INNER IDLE AREA
//             // ====================================================

//             if (idleCount > 0) {

//                 console.log(
//                     '🖱️ Hovering .price-idle specifically...'
//                 );

//                 await idleArea.hover({
//                     force: true
//                 });

//                 await page.waitForTimeout(500);
//             }

//             // ====================================================
//             // 10. MOVE AROUND INSIDE PRICE BLOCK
//             // ====================================================

//             console.log('');
//             console.log(
//                 '🖱️ Performing realistic mouse movement...'
//             );

//             const points = [

//                 {
//                     x: box.x + box.width * 0.15,
//                     y: box.y + box.height * 0.50
//                 },

//                 {
//                     x: box.x + box.width * 0.30,
//                     y: box.y + box.height * 0.35
//                 },

//                 {
//                     x: box.x + box.width * 0.45,
//                     y: box.y + box.height * 0.55
//                 },

//                 {
//                     x: box.x + box.width * 0.60,
//                     y: box.y + box.height * 0.40
//                 },

//                 {
//                     x: box.x + box.width * 0.75,
//                     y: box.y + box.height * 0.55
//                 },

//                 {
//                     x: box.x + box.width * 0.50,
//                     y: box.y + box.height * 0.50
//                 }
//             ];

//             for (
//                 let i = 0;
//                 i < points.length;
//                 i++
//             ) {

//                 await page.mouse.move(
//                     points[i].x,
//                     points[i].y,
//                     {
//                         steps: 20
//                     }
//                 );

//                 await page.waitForTimeout(300);

//                 console.log(
//                     `   Mouse movement ${i + 1}/${points.length}`
//                 );
//             }

//             // ====================================================
//             // 11. STAY IN PRICE AREA
//             // ====================================================

//             console.log('');
//             console.log(
//                 '⏳ Staying inside price area...'
//             );

//             let enabled = false;

//             for (
//                 let i = 1;
//                 i <= 15;
//                 i++
//             ) {

//                 // Keep the mouse inside the price area.
//                 await page.mouse.move(
//                     centerX,
//                     centerY,
//                     {
//                         steps: 10
//                     }
//                 );

//                 // Also trigger Playwright hover.
//                 await priceArea.hover({
//                     force: true
//                 });

//                 await page.waitForTimeout(500);

//                 // Check actual DOM state.
//                 enabled =
//                     await revealButton
//                         .isEnabled()
//                         .catch(() => false);

//                 const disabled =
//                     await revealButton
//                         .getAttribute('disabled')
//                         .catch(() => null);

//                 console.log(
//                     `   Check ${i}/15 → enabled: ${enabled} | disabled: ${disabled}`
//                 );

//                 if (enabled) {

//                     console.log('');
//                     console.log(
//                         '🎉 BUTTON BECAME ENABLED!'
//                     );

//                     break;
//                 }
//             }

//             // ====================================================
//             // 12. FINAL BUTTON STATE
//             // ====================================================

//             const finalVisible =
//                 await revealButton
//                     .isVisible()
//                     .catch(() => false);

//             const finalEnabled =
//                 await revealButton
//                     .isEnabled()
//                     .catch(() => false);

//             const finalDisabled =
//                 await revealButton
//                     .getAttribute('disabled')
//                     .catch(() => null);

//             const finalAriaDisabled =
//                 await revealButton
//                     .getAttribute('aria-disabled')
//                     .catch(() => null);

//             const finalClass =
//                 await revealButton
//                     .getAttribute('class')
//                     .catch(() => null);

//             const finalText =
//                 await revealButton
//                     .textContent()
//                     .catch(() => '');

//             console.log('');
//             console.log(
//                 '=============================================='
//             );

//             console.log(
//                 '🔘 FINAL BUTTON STATE'
//             );

//             console.log(
//                 '=============================================='
//             );

//             console.log(
//                 `Visible: ${finalVisible}`
//             );

//             console.log(
//                 `Enabled: ${finalEnabled}`
//             );

//             console.log(
//                 `Disabled: ${finalDisabled}`
//             );

//             console.log(
//                 `Aria-disabled: ${finalAriaDisabled}`
//             );

//             console.log(
//                 `Class: ${finalClass}`
//             );

//             console.log(
//                 `Text: "${finalText}"`
//             );

//             // ====================================================
//             // 13. IF STILL DISABLED
//             // ====================================================

//             if (!finalVisible || !finalEnabled) {

//                 const html =
//                     await revealButton
//                         .evaluate(
//                             element =>
//                                 element.outerHTML
//                         )
//                         .catch(() => '');

//                 console.log('');
//                 console.log(
//                     '🔍 FINAL BUTTON HTML:'
//                 );

//                 console.log(html);

//                 console.log('');

//                 return {

//                     success: false,

//                     reason:
//                         'Reveal button remained disabled after advanced hover.'
//                 };
//             }

//             // ====================================================
//             // 14. CLICK ENABLED BUTTON
//             // ====================================================

//             console.log('');
//             console.log(
//                 '🖱️ Clicking enabled Reveal price button...'
//             );

//             await revealButton.click({
//                 delay: 150
//             });

//             console.log(
//                 '✅ Reveal button clicked.'
//             );

//             // ====================================================
//             // 15. WAIT FOR PRICE
//             // ====================================================

//             await page.waitForTimeout(1500);

//             const priceCount =
//                 await page
//                     .locator('.price-main')
//                     .count();

//             console.log(
//                 `💵 .price-main count after click: ${priceCount}`
//             );

//             if (priceCount > 0) {

//                 const priceText =
//                     await page
//                         .locator('.price-main')
//                         .first()
//                         .textContent()
//                         .catch(() => '');

//                 console.log(
//                     `💵 Price after reveal: "${priceText}"`
//                 );

//                 return {

//                     success: true,

//                     reason:
//                         'Price successfully revealed.'
//                 };
//             }

//             console.log(
//                 '⚠️ Button clicked but price has not appeared yet.'
//             );

//             return {

//                 success: true,

//                 reason:
//                     'Reveal button clicked; waiting for price.'
//             };

//         } catch (error) {

//             console.error('');
//             console.error(
//                 `❌ Price reveal error: ${error.message}`
//             );

//             return {

//                 success: false,

//                 reason:
//                     error.message
//             };
//         }
//     }


//     // ============================================================
//     // INSTALL PAGE-SIDE DEBUG MONITOR
//     // ============================================================

//     static async installPriceDebugMonitor(page) {

//         try {

//             await page.evaluate(() => {

//                 const findButton = () => {

//                     return document.querySelector(
//                         'button[aria-label="Reveal price"]'
//                     );
//                 };

//                 const findPriceBlock = () => {

//                     return document.querySelector(
//                         '.price-block'
//                     );
//                 };

//                 const logState = (source) => {

//                     const button =
//                         findButton();

//                     const priceBlock =
//                         findPriceBlock();

//                     if (!button) {

//                         console.log(
//                             `[SCRAPER] ${source} | button not found`
//                         );

//                         return;
//                     }

//                     console.log(
//                         `[SCRAPER] ${source} | ` +
//                         `disabled=${button.disabled} | ` +
//                         `aria-disabled=${button.getAttribute('aria-disabled')} | ` +
//                         `class=${button.className} | ` +
//                         `priceBlockClass=${priceBlock?.className || 'none'}`
//                     );
//                 };

//                 const priceBlock =
//                     findPriceBlock();

//                 if (priceBlock) {

//                     // ------------------------------------------------
//                     // Pointer events
//                     // ------------------------------------------------

//                     [
//                         'pointerenter',
//                         'pointerover',
//                         'pointermove',
//                         'mouseenter',
//                         'mouseover',
//                         'mousemove'
//                     ].forEach(eventName => {

//                         priceBlock.addEventListener(
//                             eventName,
//                             () => {

//                                 console.log(
//                                     `[SCRAPER] EVENT ${eventName}`
//                                 );

//                                 logState(
//                                     `after ${eventName}`
//                                 );
//                             }
//                         );
//                     });

//                     // ------------------------------------------------
//                     // Mutation observer
//                     // ------------------------------------------------

//                     const observer =
//                         new MutationObserver(
//                             mutations => {

//                                 for (
//                                     const mutation
//                                     of mutations
//                                 ) {

//                                     if (
//                                         mutation.type ===
//                                         'attributes'
//                                     ) {

//                                         if (
//                                             mutation.attributeName ===
//                                             'disabled'
//                                         ) {

//                                             console.log(
//                                                 '[SCRAPER] BUTTON DISABLED ATTRIBUTE CHANGED'
//                                             );

//                                             logState(
//                                                 'mutation'
//                                             );
//                                         }

//                                         if (
//                                             mutation.attributeName ===
//                                             'class'
//                                         ) {

//                                             console.log(
//                                                 '[SCRAPER] PRICE BLOCK CLASS CHANGED'
//                                             );

//                                             logState(
//                                                 'class mutation'
//                                             );
//                                         }
//                                     }

//                                     if (
//                                         mutation.type ===
//                                         'childList'
//                                     ) {

//                                         console.log(
//                                             '[SCRAPER] PRICE BLOCK CHILDREN CHANGED'
//                                         );

//                                         logState(
//                                             'childList mutation'
//                                         );
//                                     }
//                                 }
//                             }
//                         );

//                     observer.observe(
//                         priceBlock,
//                         {
//                             attributes: true,
//                             childList: true,
//                             subtree: true
//                         }
//                     );

//                     console.log(
//                         '[SCRAPER] Price debug monitor installed.'
//                     );
//                 }

//                 logState(
//                     'initial'
//                 );
//             });

//         } catch (error) {

//             console.log(
//                 `⚠️ Could not install price debug monitor: ${error.message}`
//             );
//         }
//     }


//     // ============================================================
//     // COOKIE CONSENT
//     // ============================================================

//     static async handleCookieConsent(page) {

//         try {

//             const cookieSelectors = [

//                 'button:has-text("Accept")',

//                 'button:has-text("Accept All")',

//                 'button:has-text("I Agree")',

//                 'button:has-text("Allow")',

//                 '[aria-label="Accept cookies"]'
//             ];

//             for (
//                 const selector
//                 of cookieSelectors
//             ) {

//                 const button =
//                     page
//                         .locator(selector)
//                         .first();

//                 const count =
//                     await button.count();

//                 if (count === 0) {
//                     continue;
//                 }

//                 const visible =
//                     await button
//                         .isVisible()
//                         .catch(() => false);

//                 if (!visible) {
//                     continue;
//                 }

//                 console.log(
//                     `🍪 Cookie button found: ${selector}`
//                 );

//                 await button.click({
//                     timeout: 3000
//                 });

//                 console.log(
//                     '🍪 Cookie consent accepted.'
//                 );

//                 await page.waitForTimeout(500);

//                 break;
//             }

//         } catch (error) {

//             console.log(
//                 `⚠️ Cookie handling skipped: ${error.message}`
//             );
//         }
//     }


//     // ============================================================
//     // DEBUG PAGE
//     // ============================================================

//     static async debugPage(page) {

//         try {

//             console.log('');
//             console.log(
//                 '════════════════════════════════════════'
//             );

//             console.log(
//                 '🔍 SCRAPER DEBUG'
//             );

//             console.log(
//                 '════════════════════════════════════════'
//             );

//             console.log(
//                 `URL: ${page.url()}`
//             );

//             console.log(
//                 `Title: ${await page.title()}`
//             );

//             // ====================================================
//             // SELECTOR COUNTS
//             // ====================================================

//             const selectors = [

//                 '.detail',

//                 '.detail-card',

//                 '#root',

//                 '.price-block',

//                 '.price-idle',

//                 '.price-main',

//                 '.price-success',

//                 '.stock-badge',

//                 'button[aria-label="Reveal price"]'
//             ];

//             for (
//                 const selector
//                 of selectors
//             ) {

//                 const count =
//                     await page
//                         .locator(selector)
//                         .count();

//                 console.log(
//                     `${selector}: ${count}`
//                 );
//             }

//             // ====================================================
//             // PRICE BLOCK HTML
//             // ====================================================

//             const priceBlock =
//                 page
//                     .locator('.price-block')
//                     .first();

//             if (
//                 await priceBlock.count() > 0
//             ) {

//                 const html =
//                     await priceBlock
//                         .evaluate(
//                             element =>
//                                 element.outerHTML
//                         )
//                         .catch(() => '');

//                 console.log('');
//                 console.log(
//                     '💰 PRICE BLOCK HTML:'
//                 );

//                 console.log(html);
//             }

//             // ====================================================
//             // REVEAL BUTTON HTML
//             // ====================================================

//             const revealButton =
//                 page
//                     .locator(
//                         'button[aria-label="Reveal price"]'
//                     )
//                     .first();

//             if (
//                 await revealButton.count() > 0
//             ) {

//                 const html =
//                     await revealButton
//                         .evaluate(
//                             element =>
//                                 element.outerHTML
//                         )
//                         .catch(() => '');

//                 console.log('');
//                 console.log(
//                     '🔘 REVEAL BUTTON HTML:'
//                 );

//                 console.log(html);

//                 // Button properties
//                 const properties =
//                     await revealButton.evaluate(
//                         button => ({

//                             disabled:
//                                 button.disabled,

//                             ariaDisabled:
//                                 button.getAttribute(
//                                     'aria-disabled'
//                                 ),

//                             className:
//                                 button.className,

//                             text:
//                                 button.textContent
//                                     ?.trim(),

//                             type:
//                                 button.type
//                         })
//                     );

//                 console.log('');
//                 console.log(
//                     '🔘 BUTTON PROPERTIES:'
//                 );

//                 console.log(
//                     JSON.stringify(
//                         properties,
//                         null,
//                         2
//                     )
//                 );
//             }

//             console.log(
//                 '════════════════════════════════════════'
//             );

//         } catch (error) {

//             console.log(
//                 `⚠️ Debug failed: ${error.message}`
//             );
//         }
//     }


//     // ============================================================
//     // PRICE PARSER
//     // ============================================================

//     static cleanPrice(text) {

//         if (!text) {
//             return null;
//         }

//         const match =
//             text.match(
//                 /(?:₹|Rs\.?|INR)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)/i
//             );

//         if (!match) {
//             return null;
//         }

//         const numberString =
//             match[1]
//                 .replace(/,/g, '');

//         const price =
//             parseFloat(numberString);

//         if (
//             !Number.isFinite(price)
//         ) {

//             return null;
//         }

//         return price;
//     }


//     // ============================================================
//     // STOCK PARSER
//     // ============================================================

//     static cleanStock(text) {

//         if (!text) {
//             return 0;
//         }

//         const clean =
//             text.toLowerCase();

//         if (
//             clean.includes(
//                 'out of stock'
//             )
//         ) {

//             return 0;
//         }

//         const match =
//             clean.match(
//                 /(\d+)\s*(?:left|in stock)/
//             );

//         if (!match) {
//             return 0;
//         }

//         return parseInt(
//             match[1],
//             10
//         );
//     }
// }


// module.exports = BrowserScraper;





const { chromium } = require('playwright');
const env = require('../config/env');

class BrowserScraper {

    // ============================================================
    // MAIN SCRAPER
    // ============================================================

    static async scrapeProduct(productUrl, options = {}) {

        const startTime = Date.now();

        const timeout = options.timeout || 25000;

        const headed =
            options.debugHeaded === true
                ? true
                : options.headed === true;

        const slowMo = options.slowMo || 0;

        let browser = null;

        try {

            console.log('');
            console.log('==============================================');
            console.log('🌐 BROWSER SCRAPER STARTING');
            console.log('==============================================');

            console.log(`🔗 URL: ${productUrl}`);
            console.log(`🖥️ Headed: ${headed}`);
            console.log(`⏱️ Timeout: ${timeout}ms`);

            // ====================================================
            // 1. LAUNCH CHROMIUM
            // ====================================================

            browser = await chromium.launch({
                headless: !headed,
                slowMo
            });

            console.log('✅ Chromium launched.');

            // ====================================================
            // 2. CREATE BROWSER CONTEXT
            // ====================================================

            const context = await browser.newContext({

                userAgent: env.userAgent,

                viewport: {
                    width: 1280,
                    height: 800
                },

                deviceScaleFactor: 1,

                locale: 'en-IN',

                timezoneId: 'Asia/Kolkata'
            });

            const page = await context.newPage();

            console.log('✅ Browser context created.');

            // ====================================================
            // 3. PAGE CONSOLE LOGGING
            // ====================================================

            page.on('console', msg => {

                const type = msg.type();

                if (
                    type === 'error' ||
                    msg.text().startsWith('[SCRAPER]')
                ) {

                    console.log(
                        `[PAGE ${type.toUpperCase()}] ${msg.text()}`
                    );
                }
            });

            // ====================================================
            // 4. PAGE ERRORS
            // ====================================================

            page.on('pageerror', error => {

                console.log(
                    `[PAGE ERROR] ${error.message}`
                );
            });

            // ====================================================
            // 5. NAVIGATE
            // ====================================================

            console.log('');
            console.log('➡️ Navigating to product page...');

            await page.goto(productUrl, {
                waitUntil: 'domcontentloaded',
                timeout
            });

            console.log(
                `📍 Current URL: ${page.url()}`
            );

            console.log(
                `📄 Title: ${await page.title()}`
            );

            // ====================================================
            // 6. WAIT FOR REACT PRODUCT PAGE
            // ====================================================

            console.log('');
            console.log('⏳ Waiting for product container...');

            await page.waitForSelector(
                '.detail, .detail-card, #root',
                {
                    state: 'visible',
                    timeout: 10000
                }
            );

            console.log(
                '✅ Product container detected.'
            );

            // Give React time to finish initial rendering.
            await page.waitForTimeout(1500);

            // ====================================================
            // 7. COOKIE CONSENT
            // ====================================================

            await this.handleCookieConsent(page);

            // ====================================================
            // 8. FINAL PAGE SETTLE AFTER COOKIES
            // ====================================================

            console.log('');
            console.log(
                '⏳ Waiting for page state after cookie consent...'
            );

            await this.waitForPageToSettle(page);

            // ====================================================
            // 9. SECOND COOKIE CHECK
            // ====================================================

            console.log('');
            console.log(
                '🍪 Performing final cookie consent verification...'
            );

            await this.handleCookieConsent(page);

            await page.waitForTimeout(1000);

            console.log(
                '✅ Cookie/React state settled. Continuing to price.'
            );

            // ====================================================
            // 10. INSTALL PRICE DEBUG MONITOR
            // ====================================================

            await this.installPriceDebugMonitor(page);

            // ====================================================
            // 11. INITIAL DEBUG
            // ====================================================

            await this.debugPage(page);

            // ====================================================
            // 12. PRICE REVEAL
            // ====================================================

            console.log('');
            console.log('==============================================');
            console.log('💰 PRICE REVEAL PROCESS');
            console.log('==============================================');

            const revealResult =
                await this.triggerPriceReveal(page);

            console.log(
                `💰 Reveal result: ${revealResult.success}`
            );

            console.log(
                `💬 Reveal message: ${revealResult.reason}`
            );

            // ====================================================
            // 13. WAIT FOR PRICE
            // ====================================================

            console.log('');
            console.log('⏳ Waiting for price to appear...');

            let priceFound = false;

            try {

                await page.waitForFunction(
                    () => {

                        const price =
                            document.querySelector('.price-main');

                        if (!price) {
                            return false;
                        }

                        const style =
                            window.getComputedStyle(price);

                        const text =
                            price.textContent?.trim() || '';

                        return (
                            style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            text.length > 0
                        );
                    },
                    null,
                    {
                        timeout: 12000
                    }
                );

                priceFound = true;

                console.log(
                    '✅ Price element appeared!'
                );

            } catch (error) {

                console.log(
                    '⚠️ Price did not appear within 12 seconds.'
                );
            }

            // ====================================================
            // 14. FINAL DEBUG
            // ====================================================

            await this.debugPage(page);

            // ====================================================
            // 15. SCREENSHOT
            // ====================================================

            try {

                await page.screenshot({
                    path: 'scraper-debug.png',
                    fullPage: true
                });

                console.log(
                    '📸 Debug screenshot saved: scraper-debug.png'
                );

            } catch (error) {

                console.log(
                    `⚠️ Screenshot failed: ${error.message}`
                );
            }

            // ====================================================
            // 16. EXTRACT PRICE
            // ====================================================

            const priceText =
                await page
                    .locator('.price-main')
                    .first()
                    .textContent()
                    .catch(() => '');

            console.log(
                `💵 Raw price text: "${priceText}"`
            );

            const price =
                this.cleanPrice(priceText);

            console.log(
                `💵 Parsed price: ${price}`
            );

            // ====================================================
            // 17. EXTRACT STOCK
            // ====================================================

            const stockText =
                await page
                    .locator('.stock-badge')
                    .first()
                    .textContent()
                    .catch(() => '');

            console.log(
                `📦 Raw stock text: "${stockText}"`
            );

            const stock =
                this.cleanStock(stockText);

            console.log(
                `📦 Parsed stock: ${stock}`
            );

            // ====================================================
            // 18. DURATION
            // ====================================================

            const durationMs =
                Date.now() - startTime;

            // ====================================================
            // 19. SUCCESS
            // ====================================================

            if (
                price !== null &&
                price > 0
            ) {

                console.log('');
                console.log(
                    '=============================================='
                );

                console.log(
                    '✅ SCRAPE SUCCESSFUL'
                );

                console.log(
                    '=============================================='
                );

                console.log(
                    `💰 Price: ₹${price}`
                );

                console.log(
                    `📦 Stock: ${stock}`
                );

                console.log(
                    `⏱️ Duration: ${durationMs}ms`
                );

                return {

                    success: true,

                    price,

                    stock,

                    stockStatus:
                        stock > 0
                            ? 'IN_STOCK'
                            : 'OUT_OF_STOCK',

                    currency: 'INR',

                    durationMs,

                    httpStatus: 200
                };
            }

            // ====================================================
            // 20. FAILURE
            // ====================================================

            console.log('');
            console.log(
                '=============================================='
            );

            console.log(
                '❌ SCRAPE FAILED'
            );

            console.log(
                '=============================================='
            );

            return {

                success: false,

                requiresBrowser: true,

                durationMs,

                httpStatus: 200,

                error:
                    priceFound
                        ? 'Price element found but could not be parsed.'
                        : 'Price was not revealed on the page.'
            };

        } catch (error) {

            const durationMs =
                Date.now() - startTime;

            console.error('');
            console.error(
                '=============================================='
            );

            console.error(
                '❌ BROWSER SCRAPER ERROR'
            );

            console.error(
                '=============================================='
            );

            console.error(
                error.message
            );

            return {

                success: false,

                requiresBrowser: true,

                durationMs,

                httpStatus: 500,

                error:
                    `Browser Scraper Error: ${error.message}`
            };

        } finally {

            // ====================================================
            // CLOSE BROWSER
            // ====================================================

            if (browser) {

                try {

                    await browser.close();

                    console.log(
                        '🔒 Browser closed.'
                    );

                } catch (error) {

                    console.log(
                        `⚠️ Browser close error: ${error.message}`
                    );
                }
            }
        }
    }


    // ============================================================
    // WAIT FOR PAGE TO SETTLE
    // ============================================================

    static async waitForPageToSettle(page) {

        try {

            // Wait until DOM is completely loaded.
            await page.waitForFunction(
                () => document.readyState === 'complete',
                null,
                {
                    timeout: 5000
                }
            ).catch(() => {});

            // Give React time to process cookie state.
            await page.waitForTimeout(1000);

            // Wait for network requests to calm down.
            await page.waitForLoadState(
                'networkidle',
                {
                    timeout: 5000
                }
            ).catch(() => {});

            // Extra time for React state updates.
            await page.waitForTimeout(1000);

            // Trigger resize in case the storefront uses
            // responsive state to initialize hover interactions.
            await page.evaluate(() => {

                window.dispatchEvent(
                    new Event('resize')
                );

            }).catch(() => {});

            await page.waitForTimeout(500);

            console.log(
                '✅ Page state settled.'
            );

        } catch (error) {

            console.log(
                `⚠️ Page settle warning: ${error.message}`
            );
        }
    }


    // ============================================================
    // PRICE REVEAL
    // ============================================================

    static async triggerPriceReveal(page) {

        try {

            console.log('');
            console.log(
                '💰 Starting advanced price reveal...'
            );

            console.log(
                '────────────────────────────────────────'
            );

            // ====================================================
            // 1. LOCATE PRICE BLOCK
            // ====================================================

            const priceArea =
                page
                    .locator('.price-block')
                    .first();

            const priceAreaCount =
                await page
                    .locator('.price-block')
                    .count();

            console.log(
                `🔎 Price block count: ${priceAreaCount}`
            );

            if (priceAreaCount === 0) {

                return {

                    success: false,

                    reason:
                        'Price block not found.'
                };
            }

            // ====================================================
            // 2. LOCATE IDLE AREA
            // ====================================================

            const idleArea =
                page
                    .locator('.price-idle')
                    .first();

            const idleCount =
                await page
                    .locator('.price-idle')
                    .count();

            console.log(
                `🔎 Price idle count: ${idleCount}`
            );

            // ====================================================
            // 3. SCROLL PRICE AREA INTO VIEW
            // ====================================================

            console.log(
                '📜 Scrolling price area into view...'
            );

            await priceArea.scrollIntoViewIfNeeded();

            await page.waitForTimeout(500);

            // ====================================================
            // 4. GET BOX
            // ====================================================

            const box =
                await priceArea.boundingBox();

            if (!box) {

                return {

                    success: false,

                    reason:
                        'Could not determine price block position.'
                };
            }

            console.log(
                `📍 Position: x=${Math.round(box.x)}, y=${Math.round(box.y)}`
            );

            console.log(
                `📐 Size: ${Math.round(box.width)} x ${Math.round(box.height)}`
            );

            // ====================================================
            // 5. GET REVEAL BUTTON
            // ====================================================

            const revealButton =
                page
                    .locator(
                        'button[aria-label="Reveal price"]'
                    )
                    .first();

            const initialEnabled =
                await revealButton
                    .isEnabled()
                    .catch(() => false);

            const initialDisabled =
                await revealButton
                    .getAttribute('disabled')
                    .catch(() => null);

            console.log('');
            console.log(
                '🔘 INITIAL BUTTON STATE'
            );

            console.log(
                `Enabled: ${initialEnabled}`
            );

            console.log(
                `Disabled: ${initialDisabled}`
            );

            // ====================================================
            // 6. MOVE MOUSE OUTSIDE
            // ====================================================

            console.log('');
            console.log(
                '🖱️ Moving mouse outside price area...'
            );

            await page.mouse.move(
                20,
                20,
                {
                    steps: 30
                }
            );

            await page.waitForTimeout(500);

            // ====================================================
            // 7. MOVE INTO PRICE BLOCK
            // ====================================================

            const centerX =
                box.x + box.width / 2;

            const centerY =
                box.y + box.height / 2;

            console.log('');
            console.log(
                '🖱️ Moving mouse INTO price area...'
            );

            console.log(
                `🎯 Target: ${Math.round(centerX)}, ${Math.round(centerY)}`
            );

            await page.mouse.move(
                centerX,
                centerY,
                {
                    steps: 60
                }
            );

            await page.waitForTimeout(500);

            // ====================================================
            // 8. PLAYWRIGHT HOVER
            // ====================================================

            console.log(
                '🖱️ Calling Playwright hover()...'
            );

            await priceArea.hover();

            console.log(
                '✅ hover() completed.'
            );

            // ====================================================
            // 9. HOVER IDLE AREA
            // ====================================================

            if (idleCount > 0) {

                console.log(
                    '🖱️ Hovering .price-idle specifically...'
                );

                await idleArea.hover();

                await page.waitForTimeout(700);
            }

            // ====================================================
            // 10. REALISTIC MOUSE MOVEMENT
            // ====================================================

            console.log('');
            console.log(
                '🖱️ Performing realistic mouse movement...'
            );

            const points = [

                {
                    x: box.x + box.width * 0.15,
                    y: box.y + box.height * 0.50
                },

                {
                    x: box.x + box.width * 0.30,
                    y: box.y + box.height * 0.35
                },

                {
                    x: box.x + box.width * 0.45,
                    y: box.y + box.height * 0.55
                },

                {
                    x: box.x + box.width * 0.60,
                    y: box.y + box.height * 0.40
                },

                {
                    x: box.x + box.width * 0.75,
                    y: box.y + box.height * 0.55
                },

                {
                    x: box.x + box.width * 0.50,
                    y: box.y + box.height * 0.50
                }
            ];

            for (
                let i = 0;
                i < points.length;
                i++
            ) {

                await page.mouse.move(
                    points[i].x,
                    points[i].y,
                    {
                        steps: 20
                    }
                );

                await page.waitForTimeout(300);

                console.log(
                    `   Mouse movement ${i + 1}/${points.length}`
                );
            }

            // ====================================================
            // 11. WAIT FOR BUTTON
            // ====================================================

            console.log('');
            console.log(
                '⏳ Waiting for Reveal button to become enabled...'
            );

            let enabled = false;

            for (
                let i = 1;
                i <= 20;
                i++
            ) {

                // Keep cursor inside the price area.
                await page.mouse.move(
                    centerX,
                    centerY,
                    {
                        steps: 10
                    }
                );

                await priceArea.hover();

                await page.waitForTimeout(500);

                enabled =
                    await revealButton
                        .isEnabled()
                        .catch(() => false);

                const disabled =
                    await revealButton
                        .getAttribute('disabled')
                        .catch(() => null);

                console.log(
                    `   Check ${i}/20 → enabled: ${enabled} | disabled: ${disabled}`
                );

                if (enabled) {

                    console.log('');
                    console.log(
                        '🎉 BUTTON BECAME ENABLED!'
                    );

                    break;
                }
            }

            // ====================================================
            // 12. FINAL BUTTON STATE
            // ====================================================

            const finalVisible =
                await revealButton
                    .isVisible()
                    .catch(() => false);

            const finalEnabled =
                await revealButton
                    .isEnabled()
                    .catch(() => false);

            const finalDisabled =
                await revealButton
                    .getAttribute('disabled')
                    .catch(() => null);

            const finalAriaDisabled =
                await revealButton
                    .getAttribute('aria-disabled')
                    .catch(() => null);

            const finalClass =
                await revealButton
                    .getAttribute('class')
                    .catch(() => null);

            const finalText =
                await revealButton
                    .textContent()
                    .catch(() => '');

            console.log('');
            console.log(
                '=============================================='
            );

            console.log(
                '🔘 FINAL BUTTON STATE'
            );

            console.log(
                '=============================================='
            );

            console.log(
                `Visible: ${finalVisible}`
            );

            console.log(
                `Enabled: ${finalEnabled}`
            );

            console.log(
                `Disabled: ${finalDisabled}`
            );

            console.log(
                `Aria-disabled: ${finalAriaDisabled}`
            );

            console.log(
                `Class: ${finalClass}`
            );

            console.log(
                `Text: "${finalText}"`
            );

            // ====================================================
            // 13. BUTTON STILL DISABLED
            // ====================================================

            if (
                !finalVisible ||
                !finalEnabled
            ) {

                const html =
                    await revealButton
                        .evaluate(
                            element =>
                                element.outerHTML
                        )
                        .catch(() => '');

                console.log('');
                console.log(
                    '🔍 FINAL BUTTON HTML:'
                );

                console.log(html);

                console.log('');

                return {

                    success: false,

                    reason:
                        'Reveal button remained disabled after cookie-aware hover.'
                };
            }

            // ====================================================
            // 14. CLICK ENABLED BUTTON
            // ====================================================

            console.log('');
            console.log(
                '🖱️ Clicking enabled Reveal price button...'
            );

            await revealButton.click({
                delay: 150
            });

            console.log(
                '✅ Reveal button clicked.'
            );

            // ====================================================
            // 15. WAIT FOR PRICE
            // ====================================================

            await page.waitForTimeout(1500);

            const priceCount =
                await page
                    .locator('.price-main')
                    .count();

            console.log(
                `💵 .price-main count after click: ${priceCount}`
            );

            if (priceCount > 0) {

                const priceText =
                    await page
                        .locator('.price-main')
                        .first()
                        .textContent()
                        .catch(() => '');

                console.log(
                    `💵 Price after reveal: "${priceText}"`
                );

                return {

                    success: true,

                    reason:
                        'Price successfully revealed.'
                };
            }

            console.log(
                '⚠️ Button clicked but price has not appeared yet.'
            );

            return {

                success: true,

                reason:
                    'Reveal button clicked; waiting for price.'
            };

        } catch (error) {

            console.error('');
            console.error(
                `❌ Price reveal error: ${error.message}`
            );

            return {

                success: false,

                reason:
                    error.message
            };
        }
    }


    // ============================================================
    // COOKIE CONSENT
    // ============================================================

    static async handleCookieConsent(page) {

        try {

            const cookieSelectors = [

                'button:has-text("Accept All")',

                'button:has-text("Accept")',

                'button:has-text("I Agree")',

                'button:has-text("Allow")',

                '[aria-label="Accept cookies"]'
            ];

            let foundCookieButton = false;

            for (
                const selector
                of cookieSelectors
            ) {

                const button =
                    page
                        .locator(selector)
                        .first();

                const count =
                    await button.count();

                if (count === 0) {
                    continue;
                }

                const visible =
                    await button
                        .isVisible()
                        .catch(() => false);

                if (!visible) {
                    continue;
                }

                const enabled =
                    await button
                        .isEnabled()
                        .catch(() => false);

                if (!enabled) {
                    continue;
                }

                foundCookieButton = true;

                console.log(
                    `🍪 Cookie button found: ${selector}`
                );

                // Scroll the cookie button into view.
                await button
                    .scrollIntoViewIfNeeded()
                    .catch(() => {});

                await page.waitForTimeout(300);

                // Click normally.
                await button.click({
                    timeout: 5000
                });

                console.log(
                    '🍪 Cookie consent click completed.'
                );

                // ====================================================
                // WAIT FOR COOKIE UI TO DISAPPEAR
                // ====================================================

                console.log(
                    '🍪 Waiting for cookie consent UI to disappear...'
                );

                await button
                    .waitFor({
                        state: 'hidden',
                        timeout: 5000
                    })
                    .catch(() => {});

                // ====================================================
                // WAIT FOR REACT STATE
                // ====================================================

                await page.waitForTimeout(1000);

                // ====================================================
                // WAIT FOR NETWORK TO SETTLE
                // ====================================================

                await page
                    .waitForLoadState(
                        'networkidle',
                        {
                            timeout: 5000
                        }
                    )
                    .catch(() => {});

                // Additional React rendering time.
                await page.waitForTimeout(1000);

                console.log(
                    '🍪 Cookie consent UI disappeared.'
                );

                break;
            }

            if (!foundCookieButton) {

                console.log(
                    '🍪 No active cookie consent button detected.'
                );
            }

            // ====================================================
            // VERIFY NO VISIBLE COOKIE BUTTON REMAINS
            // ====================================================

            let cookieStillVisible = false;

            for (
                const selector
                of cookieSelectors
            ) {

                const button =
                    page
                        .locator(selector)
                        .first();

                const visible =
                    await button
                        .isVisible()
                        .catch(() => false);

                if (visible) {

                    cookieStillVisible = true;

                    console.log(
                        `⚠️ Cookie button still visible: ${selector}`
                    );

                    break;
                }
            }

            if (cookieStillVisible) {

                console.log(
                    '⚠️ Cookie UI is still visible. Waiting once more...'
                );

                await page.waitForTimeout(1500);
            }

            // ====================================================
            // FINAL REACT SETTLE
            // ====================================================

            await page.waitForTimeout(700);

            console.log(
                '🍪 Cookie consent handling completed.'
            );

        } catch (error) {

            console.log(
                `⚠️ Cookie handling warning: ${error.message}`
            );

            // Don't immediately fail the scraper.
            // The storefront may not have a cookie banner.
            await page.waitForTimeout(1000);
        }
    }


    // ============================================================
    // INSTALL PAGE-SIDE DEBUG MONITOR
    // ============================================================

    static async installPriceDebugMonitor(page) {

        try {

            await page.evaluate(() => {

                const findButton = () => {

                    return document.querySelector(
                        'button[aria-label="Reveal price"]'
                    );
                };

                const findPriceBlock = () => {

                    return document.querySelector(
                        '.price-block'
                    );
                };

                const logState = source => {

                    const button =
                        findButton();

                    const priceBlock =
                        findPriceBlock();

                    if (!button) {

                        console.log(
                            `[SCRAPER] ${source} | button not found`
                        );

                        return;
                    }

                    console.log(
                        `[SCRAPER] ${source} | ` +
                        `disabled=${button.disabled} | ` +
                        `aria-disabled=${button.getAttribute('aria-disabled')} | ` +
                        `class=${button.className} | ` +
                        `priceBlockClass=${priceBlock?.className || 'none'}`
                    );
                };

                const priceBlock =
                    findPriceBlock();

                if (priceBlock) {

                    [
                        'pointerenter',
                        'pointerover',
                        'pointermove',
                        'mouseenter',
                        'mouseover',
                        'mousemove'
                    ].forEach(eventName => {

                        priceBlock.addEventListener(
                            eventName,
                            () => {

                                console.log(
                                    `[SCRAPER] EVENT ${eventName}`
                                );

                                logState(
                                    `after ${eventName}`
                                );
                            }
                        );
                    });

                    const observer =
                        new MutationObserver(
                            mutations => {

                                for (
                                    const mutation
                                    of mutations
                                ) {

                                    if (
                                        mutation.type ===
                                        'attributes'
                                    ) {

                                        if (
                                            mutation.attributeName ===
                                            'disabled'
                                        ) {

                                            console.log(
                                                '[SCRAPER] BUTTON DISABLED ATTRIBUTE CHANGED'
                                            );

                                            logState(
                                                'mutation'
                                            );
                                        }

                                        if (
                                            mutation.attributeName ===
                                            'class'
                                        ) {

                                            console.log(
                                                '[SCRAPER] PRICE BLOCK CLASS CHANGED'
                                            );

                                            logState(
                                                'class mutation'
                                            );
                                        }
                                    }

                                    if (
                                        mutation.type ===
                                        'childList'
                                    ) {

                                        console.log(
                                            '[SCRAPER] PRICE BLOCK CHILDREN CHANGED'
                                        );

                                        logState(
                                            'childList mutation'
                                        );
                                    }
                                }
                            }
                        );

                    observer.observe(
                        priceBlock,
                        {
                            attributes: true,
                            childList: true,
                            subtree: true
                        }
                    );

                    console.log(
                        '[SCRAPER] Price debug monitor installed.'
                    );
                }

                logState(
                    'initial'
                );
            });

        } catch (error) {

            console.log(
                `⚠️ Could not install price debug monitor: ${error.message}`
            );
        }
    }


    // ============================================================
    // DEBUG PAGE
    // ============================================================

    static async debugPage(page) {

        try {

            console.log('');
            console.log(
                '════════════════════════════════════════'
            );

            console.log(
                '🔍 SCRAPER DEBUG'
            );

            console.log(
                '════════════════════════════════════════'
            );

            console.log(
                `URL: ${page.url()}`
            );

            console.log(
                `Title: ${await page.title()}`
            );

            // ====================================================
            // SELECTOR COUNTS
            // ====================================================

            const selectors = [

                '.detail',

                '.detail-card',

                '#root',

                '.price-block',

                '.price-idle',

                '.price-main',

                '.price-success',

                '.stock-badge',

                'button[aria-label="Reveal price"]'
            ];

            for (
                const selector
                of selectors
            ) {

                const count =
                    await page
                        .locator(selector)
                        .count();

                console.log(
                    `${selector}: ${count}`
                );
            }

            // ====================================================
            // PRICE BLOCK HTML
            // ====================================================

            const priceBlock =
                page
                    .locator('.price-block')
                    .first();

            if (
                await priceBlock.count() > 0
            ) {

                const html =
                    await priceBlock
                        .evaluate(
                            element =>
                                element.outerHTML
                        )
                        .catch(() => '');

                console.log('');
                console.log(
                    '💰 PRICE BLOCK HTML:'
                );

                console.log(html);
            }

            // ====================================================
            // REVEAL BUTTON HTML
            // ====================================================

            const revealButton =
                page
                    .locator(
                        'button[aria-label="Reveal price"]'
                    )
                    .first();

            if (
                await revealButton.count() > 0
            ) {

                const html =
                    await revealButton
                        .evaluate(
                            element =>
                                element.outerHTML
                        )
                        .catch(() => '');

                console.log('');
                console.log(
                    '🔘 REVEAL BUTTON HTML:'
                );

                console.log(html);

                const properties =
                    await revealButton.evaluate(
                        button => ({

                            disabled:
                                button.disabled,

                            ariaDisabled:
                                button.getAttribute(
                                    'aria-disabled'
                                ),

                            className:
                                button.className,

                            text:
                                button.textContent
                                    ?.trim(),

                            type:
                                button.type
                        })
                    );

                console.log('');
                console.log(
                    '🔘 BUTTON PROPERTIES:'
                );

                console.log(
                    JSON.stringify(
                        properties,
                        null,
                        2
                    )
                );
            }

            console.log(
                '════════════════════════════════════════'
            );

        } catch (error) {

            console.log(
                `⚠️ Debug failed: ${error.message}`
            );
        }
    }


    // ============================================================
    // PRICE PARSER
    // ============================================================

    static cleanPrice(text) {

        if (!text) {
            return null;
        }

        const match =
            text.match(
                /(?:₹|Rs\.?|INR)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)/i
            );

        if (!match) {
            return null;
        }

        const numberString =
            match[1]
                .replace(/,/g, '');

        const price =
            parseFloat(numberString);

        if (
            !Number.isFinite(price)
        ) {

            return null;
        }

        return price;
    }


    // ============================================================
    // STOCK PARSER
    // ============================================================

    static cleanStock(text) {

        if (!text) {
            return 0;
        }

        const clean =
            text.toLowerCase();

        if (
            clean.includes(
                'out of stock'
            )
        ) {

            return 0;
        }

        const match =
            clean.match(
                /(\d+)\s*(?:left|in stock)/
            );

        if (!match) {
            return 0;
        }

        return parseInt(
            match[1],
            10
        );
    }
}

module.exports = BrowserScraper;