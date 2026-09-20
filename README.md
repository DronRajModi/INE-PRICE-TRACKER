# INE Product Price Tracker

An automated, resilient full-stack web application designed to track product price and stock fluctuations over time from INE's mock storefront (`https://demo.inelabteamdev.com`).

Built to tackle real-world scraping obstacles—including client-side SPA rendering, delayed asynchronous loading, anti-bot honeypots, random cookie consent overlays, and free-tier backend sleep cycles—with a dual-engine architecture, exponential backoff retries, and honest per-product audit logging.

---

## Overview

Modern e-commerce scraping requires navigating complex single-page applications (SPAs), dynamic DOM mutations, and defensive obstacles. This project provides:
1. **Catalog Search & Discovery**: Search INE's 1,000-item mock storefront by full or partial product name, brand, or SKU.
2. **Scheduled Tracking**: Track prices and stock availability on a fixed 2-hour schedule.
3. **Price & Stock History**: Interactive visual time-series charts displaying price trends, historical lows/highs, and stock progression.
4. **Honest Audit Logging**: Full transparency with a per-product log tracking every single scrape attempt, timestamp, execution duration, and outcome (`SUCCESS`, `RETRIED`, `FAILED`).
5. **Observable Headed Mode**: Dedicated runner to visually inspect browser execution, dwell actions, and honeypot avoidance in real-time.

---

## Features

- **Dual-Strategy Scraping Engine**: Lightweight HTTP parsing (Axios + Cheerio) with automated fallback to headless Chromium (Playwright).
- **Anti-Honeypot Decoy Filtering**: Dynamically detects and rejects decoy price nodes (`display: none`, `aria-hidden="true"`, `.price-value`, `.amount`).
- **Interactive Trigger Handling**: Emulates user dwell and cursor movement over the price box before activating the store's "Reveal price" action.
- **Overlay Dismissal**: Automatically detects and dismisses randomized Cookie Consent banners (`.cookie-overlay`) that obstruct interaction.
- **Resilient Retry Engine**: Exponential backoff with random jitter (up to 3 attempts per scrape cycle).
- **Zero Silent Failures**: Failures and retries are recorded honestly in PostgreSQL; previous verified prices are never overwritten with null or empty data on failed attempts.
- **Sleep-Resistant Scheduling**: External cron webhook endpoint secured by Bearer token authentication, tailored for free-tier Render sleeping dynos.
- **Modern Responsive UI**: Built with React, Tailwind CSS, and lightweight responsive SVG charts.

---

## Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │             cron-job.org / Webhook           │
                               │           (Triggers every 2 hours)           │
                               └──────────────────────┬───────────────────────┘
                                                      │ POST /api/jobs/scrape-all
                                                      │ (with Bearer CRON_SECRET)
                                                      ▼
┌─────────────────────────┐               ┌───────────────────────────────────┐
│     React Frontend      │  HTTP / JSON  │        Node.js / Express API      │
│     (Vite + Tailwind)   ├──────────────►│              Backend              │
│    [Deployed on Vercel] │               │        [Deployed on Render]       │
└─────────────────────────┘               └───────────┬───────────────────┬───┘
                                                      │                   │
                                          Reads/Writes│                   │ Triggers
                                                      ▼                   ▼
                                          ┌──────────────────────┐  ┌────────────────────────┐
                                          │ Supabase PostgreSQL  │  │ Dual Scraping Engine   │
                                          │ - tracked_products   │  │ 1. Axios/Cheerio (HTTP)│
                                          │ - price_history      │  │ 2. Playwright Browser  │
                                          │ - scrape_logs        │  │    (Headless / Headed) │
                                          └──────────────────────┘  └───────────┬────────────┘
                                                                                │
                                                                                │ Scrapes
                                                                                ▼
                                                                    ┌────────────────────────┐
                                                                    │   INE Mock Storefront  │
                                                                    │ demo.inelabteamdev.com │
                                                                    └────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons | Responsive dashboard, search modal, and SVG charts |
| **Backend** | Node.js, Express.js | REST API, cron authorization, scraper orchestration |
| **Database** | Supabase (PostgreSQL) | Relational storage for products, history, and audit logs |
| **Scraping** | Playwright (Chromium) & Cheerio | Headless SPA automation & fast HTTP fallback |
| **Scheduling** | cron-job.org | External webhook scheduler ensuring reliable runs |
| **Deployment** | Vercel (Frontend), Render (Backend) | Free-tier cloud hosting |

---

## Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Git**
- **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/ine-price-tracker.git
cd ine-price-tracker
```

### 2. Backend Setup
```bash
cd backend
npm install

# Install Playwright browser binaries
npx playwright install chromium

# Create environment configuration
cp .env.example .env
```

Edit `backend/.env` with your Supabase credentials:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
CRON_SECRET=supersecret_cron_token_change_me
MOCK_STORE_URL=https://demo.inelabteamdev.com
```

Start the backend server:
```bash
npm run dev
# Backend starts on http://localhost:5000
```

### 3. Frontend Setup
In a separate terminal:
```bash
cd ../frontend
npm install
npm run dev
# Frontend starts on http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Local server port | `5000` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `SUPABASE_URL` | Supabase project REST URL | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role secret key | Required |
| `CRON_SECRET` | Secret token to authenticate cron webhooks | `supersecret_cron_token_change_me` |
| `MOCK_STORE_URL` | Target mock storefront URL | `https://demo.inelabteamdev.com` |

---

## Database Schema

The database schema is located at [`backend/src/db/schema.sql`](backend/src/db/schema.sql). Copy and paste its contents into your Supabase SQL Editor to initialize the tables:

### 1. `tracked_products`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID (PK)` | Unique product identifier |
| `store_product_id` | `VARCHAR UNIQUE` | Product ID in mock store catalog |
| `name` | `VARCHAR(255)` | Product name |
| `brand` | `VARCHAR(150)` | Brand name |
| `category` | `VARCHAR(150)` | Category classification |
| `sku` | `VARCHAR(100)` | SKU number |
| `url` | `TEXT` | Direct link to product listing |
| `current_price` | `NUMERIC(12, 2)` | Latest verified price |
| `current_stock` | `INTEGER` | Latest verified stock count |
| `stock_status` | `VARCHAR(50)` | `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK` |
| `last_scraped_at` | `TIMESTAMPTZ` | Timestamp of most recent attempt |
| `last_scrape_status`| `VARCHAR(50)` | `SUCCESS`, `FAILED`, `PENDING` |

### 2. `price_history`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID (PK)` | Unique history record ID |
| `product_id` | `UUID (FK)` | Cascades on product deletion |
| `price` | `NUMERIC(12, 2)` | Price captured at timestamp |
| `stock` | `INTEGER` | Stock captured at timestamp |
| `recorded_at` | `TIMESTAMPTZ` | Timestamp of record |

### 3. `scrape_logs`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID (PK)` | Unique log entry ID |
| `product_id` | `UUID (FK)` | Target product |
| `status` | `VARCHAR(50)` | `SUCCESS`, `RETRIED`, `FAILED` |
| `http_status` | `INTEGER` | HTTP status code |
| `error_message` | `TEXT` | Diagnostic error message if failed |
| `attempt_number` | `INTEGER` | Attempt sequence number (1, 2, or 3) |
| `duration_ms` | `INTEGER` | Roundtrip latency in milliseconds |
| `scraper_type` | `VARCHAR(50)` | `HTTP` or `BROWSER` |
| `created_at` | `TIMESTAMPTZ` | Timestamp of attempt |

---

## API Endpoints

### Products & Search
- `GET /api/products/search?q=:query` — Searches mock catalog by partial or full keyword.

### Tracking Management
- `GET /api/tracked-products` — Returns all tracked products with current metrics.
- `POST /api/tracked-products` — Begins tracking a product and triggers baseline scrape.
- `DELETE /api/tracked-products/:id` — Removes product and associated logs/history.
- `GET /api/tracked-products/:id/history` — Chronological price and stock history.
- `GET /api/tracked-products/:id/logs` — Per-product scrape attempt audit logs.
- `POST /api/tracked-products/:id/scrape` — Immediate on-demand scrape for a single product.

### Scheduled Jobs
- `POST /api/jobs/scrape-all` — Batch scrape for all tracked products.
  - **Headers**: `Authorization: Bearer <CRON_SECRET>` or query parameter `?secret=<CRON_SECRET>`

---

## Scraping Strategy

The target storefront (`demo.inelabteamdev.com`) features intentional hurdles:
1. **Dynamic Single-Page Application**: Product pages return an initial `<div id="root"></div>` shell; prices are rendered after client-side JavaScript execution.
2. **Dwell & Hover Requirement**: Prices are initially masked under a "Reveal price" state requiring simulated mouse interaction and dwell time.
3. **Decoy / Honeypot Traps**: Naive scrapers targeting `.price-value` or `[data-price="true"]` get injected with random decoy numbers (`d.d1` / `d.d2`). Our scraper checks DOM visibility styles (`window.getComputedStyle`), excludes `aria-hidden="true"`, and extracts only the rendered, visible node.
4. **Cookie Popups**: Random `.cookie-overlay` dialogs are identified and auto-dismissed before interaction.

---

## Retry Strategy

When transient errors, simulated latency, or network flakiness occur:
- **Exponential Backoff**: Base delay of 1,500ms scaled exponentially:
  $$\text{Delay} = \min(\text{baseDelay} \times 2^{\text{attempt} - 1} + \text{jitter}, \text{maxDelay})$$
- **Jitter**: Random 0–500ms delay added to prevent thundering herd spikes.
- **Max Attempts**: Capped at 3 attempts per cycle.
- **Audit Logging**: Each attempt is immediately written to `scrape_logs` as `RETRIED` or `FAILED`.

---

## Scheduling

Because free-tier hostings (like Render) sleep after 15 minutes of inactivity:
1. **External Webhook (cron-job.org)**:
   - Create a free account at [cron-job.org](https://cron-job.org).
   - Create a new cron job configured to run **every 2 hours**.
   - URL: `https://your-backend-url.onrender.com/api/jobs/scrape-all`
   - Method: `POST`
   - Header: `Authorization: Bearer <your_CRON_SECRET>`
2. **Cold Start Resilience**:
   - `cron-job.org` automatically wakes up sleeping Render instances upon request dispatch.
   - Endpoint `/health` is also available for keep-alive pings if desired.

---

## Deployment

### Frontend (Vercel)
1. Push repository to GitHub.
2. Connect your repository on [Vercel](https://vercel.com).
3. Set **Root Directory** to `frontend`.
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend-url.onrender.com/api`
5. Deploy.

### Backend (Render)
1. On [Render](https://render.com), create a new **Web Service**.
2. Connect your GitHub repository.
3. Set **Root Directory** to `backend`.
4. Environment: `Node`.
5. Build Command:
   ```bash
   npm install && npx playwright install chromium
   ```
6. Start Command:
   ```bash
   npm start
   ```
7. Add Environment Variables from `backend/.env`.

---

## Failure Handling

- **Honest Auditing**: The scraper never masks failures. Every timeout, selector miss, or 500 error is logged in `scrape_logs`.
- **Preservation of Truth**: If a scheduled scrape fails, the existing valid price and stock remain untouched. The status flags `last_scrape_status = 'FAILED'`, alerting the user without polluting analytics with empty zeroes.

---

## Headed Mode

To satisfy the **Observable Headed Run** assignment requirement and produce your 2–4 minute video recording:

```bash
cd backend
npm run scrape:headed
```
Or specify a specific product ID:
```bash
npm run scrape:headed 25
```

### What this demonstrates in the recording:
1. Opens a full visible Chromium window.
2. Navigates to `https://demo.inelabteamdev.com/product/25`.
3. Handles and dismisses cookie consent dialog if displayed.
4. Moves the cursor over the price area and pauses to meet the dwell threshold.
5. Clicks the "Reveal price" button.
6. Waits for the spinner and extracts authentic price and stock.
7. Prints verified diagnostics to the terminal and keeps the window open for camera inspection.

---

## Testing

### Run Backend Unit & Integration Tests:
```bash
cd backend
node -e "const p = require('./src/services/productService'); p.searchProducts('Monitor').then(console.log);"
```

### Build Frontend Production Bundle:
```bash
cd frontend
npm run build
```

---

## Known Limitations

1. **Memory on Free-Tier Render**: Running Chromium inside a 512MB RAM free instance requires careful concurrency management. The batch job (`/api/jobs/scrape-all`) processes products sequentially with a 1-second pause to prevent OOM errors.
2. **Store Layout Shift**: The scraper relies on robust, multi-tier fallback selectors (`.price-block`, `.price-main`, `.stock-badge`). If the mock storefront undergoes major DOM restructuring, selectors may require updates.
