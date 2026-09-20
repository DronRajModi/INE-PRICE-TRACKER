# Engineering Design Note: INE Product Price Tracker

This design document outlines the technical rationale, resilience mechanisms, key trade-offs, and iterative problem-solving involved in developing the web scraping and tracking system for INE's mock storefront (`demo.inelabteamdev.com`).

---

## 1. How Scraping Was Made Reliable

The mock storefront was deliberately constructed to simulate real-world e-commerce scraping friction. To achieve rock-solid reliability across unattended, recurring runs, the following engineering decisions were implemented:

### A. Dual-Strategy Architecture
Rather than relying solely on heavy browser automation or brittle HTTP GET requests, we implemented a **Tiered Scraper Engine**:
1. **Lightweight HTTP Layer (`httpScraper.js`)**: Executes fast HTTP requests via Axios and parses with Cheerio. If the storefront returns a server-rendered page with accessible pricing, data is parsed in under 150ms with minimal CPU overhead.
2. **Dynamic Browser Fallback (`browserScraper.js`)**: When the HTTP layer detects that the target is an unrendered Single Page Application (SPA) skeleton (`<div id="root"></div>`), execution automatically pivots to Playwright (Chromium).

### B. Anti-Honeypot Decoy Filtering
Inspection of the client bundle revealed that the mock storefront intentionally embeds decoy pricing nodes inside `.price-main`:
- `<span class="price-value" aria-hidden="true" style="display:none">...</span>`
- `<span class="amount" data-price="true" aria-hidden="true" style="display:none">...</span>`

These nodes contain randomized, mathematically shifted decoy prices designed to trap naive scrapers using generic selectors like `[data-price]`. Our browser scraper queries computed styles (`window.getComputedStyle`), verifies visibility, rejects any nodes with `display: none` or `aria-hidden="true"`, and extracts only the authentic, visible price node.

### C. Human Interaction Emulation (Dwell & Reveal)
Prices are initially hidden behind an interactive barrier requiring cursor dwell time (at least 600ms) and mouse movement across the price bounding box before the "Reveal price" button (`button[aria-label="Reveal price"]`) activates. The scraper:
1. Calculates bounding box coordinates of the price container.
2. Simulates realistic cursor micro-movements.
3. Pauses to satisfy the minimum dwell requirement.
4. Triggers the click event on the reveal button and waits for the `.price-block.price-success` state.

### D. Overlay & Pop-up Handling
The storefront randomly triggers a Cookie Consent modal (`.cookie-overlay`) that intercepts pointer events. The scraper dynamically checks for the presence of this dialog and dismisses it prior to interacting with the price container.

### E. Exponential Backoff with Jitter
Network requests and simulated delays can trigger transient errors or rate limits (HTTP 429). The `retryService` implements exponential backoff:
$$\text{Delay} = \min(\text{baseDelay} \times 2^{\text{attempt} - 1} + \text{jitter}, \text{maxDelay})$$
Each cycle permits up to 3 attempts with random jitter to prevent server synchronization spikes.

### F. Honest Audit Logging & Data Integrity
Every attempt (whether `SUCCESS`, `RETRIED`, or `FAILED`) is logged to the PostgreSQL `scrape_logs` table with exact timestamps, attempt numbers, latency (ms), and error messages. On catastrophic failure, existing verified prices in `tracked_products` are never overwritten with null or bogus values.

---

## 2. Architectural Trade-offs

| Decision | Chosen Approach | Trade-off / Alternative | Justification |
| :--- | :--- | :--- | :--- |
| **Scraper Execution Mode** | Playwright fallback for SPA, HTTP for catalog | Pure HTTP vs. Pure Headless Browser | Pure HTTP fails on the dynamic reveal challenge; pure browser for all endpoints wastes server memory on free-tier Render. |
| **Scheduling Mechanism** | External webhook (`cron-job.org`) calling authenticated endpoint | In-memory `node-cron` or `setInterval` | Free-tier hostings (Render) sleep after 15 minutes of inactivity, terminating in-memory timers. External webhooks wake the server and trigger the job reliably. |
| **Concurrency Control** | Sequential batch scraping with 1s cooldown | Concurrent `Promise.all` | Free-tier instances have 512MB RAM. Concurrently launching multiple Chromium tabs causes Out-Of-Memory (OOM) crashes. Sequential runs guarantee stability. |
| **Database Technology** | Supabase (PostgreSQL) | SQLite or local JSON | Provides managed cloud persistence, automatic relational cascading, timestamps, and indexes, accessible by both local dev and cloud deployments. |

---

## 3. What AI Tools Got Wrong Initially

During initial exploration and code generation with AI assistance, two significant flaws emerged:

1. **Assumption of Static HTML & Naive DOM Selectors**:
   - The initial AI-generated scraper assumed product pages could be scraped purely with Axios and Cheerio using simple selectors like `span.price`, `[data-price]`, or `.amount`.
   - When tested against `https://demo.inelabteamdev.com/product/25`, the HTTP scraper failed completely, returning an empty `<div id="root"></div>` React mount point.
   - Furthermore, even when inspecting the client HTML, querying `[data-price="true"]` returned deceptive honeypot values (fake decoy prices) that differed from the actual price rendered on screen.

2. **Neglecting Interactive Barriers & Overlay Collisions**:
   - The initial AI script assumed that opening the browser would immediately display the price.
   - In reality, the price remained hidden under a "Price hidden" state with a disabled "Reveal price" button until cursor hover/dwell requirements were satisfied.
   - The initial script also did not anticipate the asynchronous `.cookie-overlay` dialog, which occasionally intercepted clicks and caused Playwright timeout exceptions.

---

## 4. How These Flaws Were Corrected

1. **Decoupling Scraper Strategy & Anti-Honeypot Validation**:
   - We structured the scraper into a two-tier pipeline: lightweight HTTP fetching for catalog discovery and metadata, coupled with an automated fallback to Playwright for full page rendering.
   - We updated the DOM extractor inside `page.evaluate()` to filter out elements that have `display: none`, `visibility: hidden`, or `aria-hidden="true"`, and specifically excluded classes like `.price-value` and `.amount` that were identified as honeypots.

2. **Implementing Emulated Interaction & Overlay Dismissal**:
   - Added `handleCookieConsent(page)` to dismiss cookie overlays if present before initiating product interactions.
   - Added `triggerPriceReveal(page)` to emulate mouse hover across the price container, wait out the dwell timer, and reliably click the "Reveal price" trigger.
   - Added observable headed mode (`npm run scrape:headed`) to visually verify each step in a real Chromium browser, confirming that the scraper handles slow responses, dismisses popups, and extracts the correct visible price.
