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
            await this.safeWait(page, 1500);

            // ====================================================
            // 7. COOKIE CONSENT
            // ====================================================

            const cookieHandled =
                await this.handleCookieConsent(page);

            if (!cookieHandled && this.isPageClosed(page)) {

                return {
                    success: false,
                    requiresBrowser: true,
                    durationMs: Date.now() - startTime,
                    httpStatus: 500,
                    error:
                        'Browser page closed during cookie handling.'
                };
            }

            // ====================================================
            // 8. FINAL PAGE SETTLE AFTER COOKIES
            // ====================================================

            console.log('');
            console.log(
                '⏳ Waiting for page state after cookie consent...'
            );

            await this.waitForPageToSettle(page);

            if (this.isPageClosed(page)) {

                return {
                    success: false,
                    requiresBrowser: true,
                    durationMs: Date.now() - startTime,
                    httpStatus: 500,
                    error:
                        'Browser page closed while settling page state.'
                };
            }

            // ====================================================
            // 9. SECOND COOKIE CHECK
            // ====================================================

            console.log('');
            console.log(
                '🍪 Performing final cookie consent verification...'
            );

            const secondCookieCheck =
                await this.handleCookieConsent(page);

            if (
                !secondCookieCheck &&
                this.isPageClosed(page)
            ) {

                return {
                    success: false,
                    requiresBrowser: true,
                    durationMs: Date.now() - startTime,
                    httpStatus: 500,
                    error:
                        'Browser page closed during final cookie verification.'
                };
            }

            await this.safeWait(page, 500);

            if (this.isPageClosed(page)) {

                return {
                    success: false,
                    requiresBrowser: true,
                    durationMs: Date.now() - startTime,
                    httpStatus: 500,
                    error:
                        'Browser page closed before price extraction.'
                };
            }

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

                if (!this.isPageClosed(page)) {

                    await page.screenshot({
                        path: 'scraper-debug.png',
                        fullPage: true
                    });

                    console.log(
                        '📸 Debug screenshot saved: scraper-debug.png'
                    );
                }

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
    // SAFE PAGE CHECK
    // ============================================================

    static isPageClosed(page) {

        try {

            return !page || page.isClosed();

        } catch (error) {

            return true;
        }
    }


    // ============================================================
    // SAFE WAIT
    // ============================================================

    static async safeWait(page, milliseconds) {

        try {

            if (this.isPageClosed(page)) {

                console.log(
                    '⏳ Page already closed. Skipping wait.'
                );

                return false;
            }

            await page.waitForTimeout(milliseconds);

            return true;

        } catch (error) {

            if (
                error.message.includes(
                    'Target page, context or browser has been closed'
                )
            ) {

                console.log(
                    '⏳ Page/context closed during wait. Skipping.'
                );

                return false;
            }

            console.log(
                `⚠️ Safe wait warning: ${error.message}`
            );

            return false;
        }
    }


    // ============================================================
    // WAIT FOR PAGE TO SETTLE
    // ============================================================

    static async waitForPageToSettle(page) {

        try {

            if (this.isPageClosed(page)) {
                return;
            }

            // Wait until DOM is completely loaded.
            await page.waitForFunction(
                () => document.readyState === 'complete',
                null,
                {
                    timeout: 5000
                }
            ).catch(() => {});

            await this.safeWait(page, 1000);

            if (this.isPageClosed(page)) {
                return;
            }

            // Wait for network requests to calm down.
            await page.waitForLoadState(
                'networkidle',
                {
                    timeout: 5000
                }
            ).catch(() => {});

            await this.safeWait(page, 1000);

            if (this.isPageClosed(page)) {
                return;
            }

            // Trigger resize in case the storefront uses
            // responsive state to initialize hover interactions.
            await page.evaluate(() => {

                window.dispatchEvent(
                    new Event('resize')
                );

            }).catch(() => {});

            await this.safeWait(page, 500);

            if (!this.isPageClosed(page)) {

                console.log(
                    '✅ Page state settled.'
                );
            }

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
            // 3. VERIFY COOKIE OVERLAY BEFORE HOVER
            // ====================================================

            const blockingOverlay =
                page
                    .locator('.cookie-overlay')
                    .first();

            const overlayExists =
                await blockingOverlay.count();

            if (overlayExists > 0) {

                const overlayVisible =
                    await blockingOverlay
                        .isVisible()
                        .catch(() => false);

                if (overlayVisible) {

                    console.log(
                        '⚠️ Cookie overlay still detected before price hover.'
                    );

                    await blockingOverlay
                        .evaluate(element => {

                            element.style.pointerEvents =
                                'none';

                            element.style.display =
                                'none';

                            element.style.visibility =
                                'hidden';

                        })
                        .catch(() => {});

                    console.log(
                        '🍪 Cookie overlay disabled before price hover.'
                    );
                }
            }

            // ====================================================
            // 4. SCROLL PRICE AREA INTO VIEW
            // ====================================================

            console.log(
                '📜 Scrolling price area into view...'
            );

            await priceArea.scrollIntoViewIfNeeded();

            await this.safeWait(page, 500);

            // ====================================================
            // 5. GET BOX
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
            // 6. GET REVEAL BUTTON
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
            // 7. MOVE MOUSE OUTSIDE
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

            await this.safeWait(page, 500);

            // ====================================================
            // 8. MOVE INTO PRICE BLOCK
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

            await this.safeWait(page, 500);

            // ====================================================
            // 9. PLAYWRIGHT HOVER
            // ====================================================

            console.log(
                '🖱️ Calling Playwright hover()...'
            );

            await priceArea.hover({
                timeout: 10000
            });

            console.log(
                '✅ hover() completed.'
            );

            // ====================================================
            // 10. HOVER IDLE AREA
            // ====================================================

            if (idleCount > 0) {

                console.log(
                    '🖱️ Hovering .price-idle specifically...'
                );

                await idleArea.hover({
                    timeout: 10000
                });

                await this.safeWait(page, 700);
            }

            // ====================================================
            // 11. REALISTIC MOUSE MOVEMENT
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

                await this.safeWait(page, 300);

                console.log(
                    `   Mouse movement ${i + 1}/${points.length}`
                );
            }

            // ====================================================
            // 12. WAIT FOR BUTTON
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

                if (this.isPageClosed(page)) {

                    return {
                        success: false,
                        reason:
                            'Page closed while waiting for Reveal button.'
                    };
                }

                // Keep cursor inside the price area.
                await page.mouse.move(
                    centerX,
                    centerY,
                    {
                        steps: 10
                    }
                );

                await priceArea.hover({
                    timeout: 10000
                });

                await this.safeWait(page, 500);

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
            // 13. FINAL BUTTON STATE
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
            // 14. BUTTON STILL DISABLED
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
            // 15. CLICK ENABLED BUTTON
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
            // 16. WAIT FOR PRICE
            // ====================================================

            await this.safeWait(page, 1500);

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

            if (this.isPageClosed(page)) {

                console.log(
                    '🍪 Page already closed before cookie handling.'
                );

                return false;
            }

            const cookieSelectors = [

                'button:has-text("Accept All")',

                'button:has-text("Accept")',

                'button:has-text("I Agree")',

                'button:has-text("Allow")',

                '[aria-label="Accept cookies"]'
            ];

            const overlaySelectors = [

                '.cookie-overlay',

                '.cookie-banner',

                '.cookie-consent',

                '[role="dialog"][aria-label*="cookie" i]'
            ];

            let foundCookieButton = false;

            // ====================================================
            // 1. FIND AND CLICK COOKIE BUTTON
            // ====================================================

            for (
                const selector
                of cookieSelectors
            ) {

                if (this.isPageClosed(page)) {
                    return false;
                }

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

                await button
                    .scrollIntoViewIfNeeded()
                    .catch(() => {});

                await this.safeWait(page, 300);

                if (this.isPageClosed(page)) {
                    return false;
                }

                await button.click({
                    timeout: 5000
                });

                console.log(
                    '🍪 Cookie consent click completed.'
                );

                break;
            }

            if (!foundCookieButton) {

                console.log(
                    '🍪 No active cookie consent button detected.'
                );
            }

            // ====================================================
            // 2. WAIT FOR COOKIE REACT STATE
            // ====================================================

            if (this.isPageClosed(page)) {
                return false;
            }

            console.log(
                '🍪 Waiting for cookie state to settle...'
            );

            await this.safeWait(page, 1000);

            if (this.isPageClosed(page)) {
                return false;
            }

            await page
                .waitForLoadState(
                    'networkidle',
                    {
                        timeout: 5000
                    }
                )
                .catch(() => {});

            if (this.isPageClosed(page)) {
                return false;
            }

            await this.safeWait(page, 1000);

            if (this.isPageClosed(page)) {
                return false;
            }

            // ====================================================
            // 3. VERIFY / DISABLE COOKIE OVERLAY
            // ====================================================

            for (
                const selector
                of overlaySelectors
            ) {

                if (this.isPageClosed(page)) {
                    return false;
                }

                const overlay =
                    page
                        .locator(selector)
                        .first();

                const count =
                    await overlay.count();

                if (count === 0) {
                    continue;
                }

                const visible =
                    await overlay
                        .isVisible()
                        .catch(() => false);

                if (!visible) {
                    continue;
                }

                console.log(
                    `⚠️ Cookie overlay still visible: ${selector}`
                );

                // Give React one more chance.
                await this.safeWait(page, 1500);

                if (this.isPageClosed(page)) {
                    return false;
                }

                const stillVisible =
                    await overlay
                        .isVisible()
                        .catch(() => false);

                if (stillVisible) {

                    console.log(
                        `⚠️ Cookie overlay still blocking page. Disabling: ${selector}`
                    );

                    await overlay
                        .evaluate(element => {

                            element.style.pointerEvents =
                                'none';

                            element.style.display =
                                'none';

                            element.style.visibility =
                                'hidden';

                        })
                        .catch(() => {});

                    console.log(
                        '🍪 Cookie overlay disabled successfully.'
                    );
                }

                break;
            }

            // ====================================================
            // 4. FINAL OVERLAY VERIFICATION
            // ====================================================

            if (this.isPageClosed(page)) {
                return false;
            }

            await this.safeWait(page, 500);

            if (this.isPageClosed(page)) {
                return false;
            }

            let blockingOverlay = false;

            for (
                const selector
                of overlaySelectors
            ) {

                const overlay =
                    page
                        .locator(selector)
                        .first();

                const visible =
                    await overlay
                        .isVisible()
                        .catch(() => false);

                if (visible) {

                    blockingOverlay = true;

                    console.log(
                        `❌ Cookie overlay is STILL visible: ${selector}`
                    );

                    break;
                }
            }

            if (!blockingOverlay) {

                console.log(
                    '✅ Cookie overlay is no longer blocking the page.'
                );

            } else {

                console.log(
                    '⚠️ Cookie overlay verification failed.'
                );
            }

            // ====================================================
            // 5. VERIFY COOKIE BUTTON
            // ====================================================

            if (this.isPageClosed(page)) {
                return false;
            }

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

                    console.log(
                        `⚠️ Cookie button still visible: ${selector}`
                    );
                }
            }

            // ====================================================
            // 6. FINAL REACT SETTLE
            // ====================================================

            if (this.isPageClosed(page)) {
                return false;
            }

            await this.safeWait(page, 700);

            if (this.isPageClosed(page)) {
                return false;
            }

            console.log(
                '🍪 Cookie consent handling completed.'
            );

            return true;

        } catch (error) {

            console.log(
                `⚠️ Cookie handling warning: ${error.message}`
            );

            // IMPORTANT:
            // Do not call page.waitForTimeout() here if the page
            // may already be closed.

            if (
                error.message.includes(
                    'Target page, context or browser has been closed'
                )
            ) {

                console.log(
                    '🍪 Page/context already closed. Skipping further cookie handling.'
                );

                return false;
            }

            try {

                if (!this.isPageClosed(page)) {

                    await page.waitForTimeout(500);
                }

            } catch (recoveryError) {

                console.log(
                    `🍪 Cookie recovery wait skipped: ${recoveryError.message}`
                );
            }

            return false;
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