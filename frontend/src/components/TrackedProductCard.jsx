import React from 'react';
import {
  RefreshCw,
  Trash2,
  LineChart,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import StockBadge from './StockBadge';

export default function TrackedProductCard({
  product,
  onSelect,
  onScrape,
  onUntrack,
  isScraping = false
}) {
  const formatPrice = (val) => {
    if (val === null || val === undefined || isNaN(val)) {
      return null;
    }

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: product.currency || 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formattedPrice = formatPrice(product.current_price);

  const getScrapeStatus = () => {
    if (product.last_scrape_status === 'SUCCESS') {
      return 'Synced';
    }

    if (product.last_scrape_status === 'FAILED') {
      return 'Scrape Error';
    }

    return 'In Queue';
  };

  return (
    <div className="group flex h-full flex-col justify-between border border-neutral-800 bg-black">

      {/* =====================================================
          PRODUCT INFORMATION
          ===================================================== */}

      <div className="p-5">

        {/* Brand + Stock */}

        <div className="flex items-start justify-between gap-4">

          <div className="min-w-0">

            <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              {product.brand}
            </span>

            <h3 className="mt-1 truncate text-base font-semibold tracking-tight text-white">
              {product.name}
            </h3>

          </div>

          <div className="shrink-0">
            <StockBadge
              stock={product.current_stock}
              status={product.stock_status}
            />
          </div>

        </div>

        {/* SKU / CATEGORY */}

        <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-600">

          <span className="font-mono">
            SKU: {product.sku}
          </span>

          <span>·</span>

          <span>
            {product.category}
          </span>

        </div>

        {/* =================================================
            PRICE
            ================================================= */}

        <div className="mt-6 border-y border-neutral-800 py-4">

          <div className="flex items-end justify-between gap-4">

            <div>

              <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-600">
                Current Price
              </p>

              <div className="mt-1">

                {formattedPrice ? (

                  <span className="text-2xl font-semibold tracking-tight text-white">
                    {formattedPrice}
                  </span>

                ) : (

                  <span className="flex items-center text-xs text-neutral-500">

                    <AlertCircle className="mr-1.5 h-3.5 w-3.5" />

                    Scrape Pending

                  </span>

                )}

              </div>

            </div>

            {/* SCRAPE STATUS */}

            <div className="text-right">

              <p className="text-[10px] uppercase tracking-wide text-neutral-600">
                Status
              </p>

              <p className="mt-1 text-xs font-medium text-neutral-400">
                {getScrapeStatus()}
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            LAST CHECKED
            ================================================= */}

        <p className="mt-3 text-[11px] text-neutral-600">

          Last checked:{' '}

          <span className="text-neutral-500">

            {product.last_scraped_at
              ? new Date(product.last_scraped_at).toLocaleString()
              : 'Never'}

          </span>

        </p>

      </div>

      {/* =====================================================
          ACTION BAR
          ===================================================== */}

      <div className="flex items-center justify-between border-t border-neutral-800 px-5 py-3">

        {/* LEFT ACTIONS */}

        <div className="flex items-center gap-4">

          <button
            onClick={() => onSelect(product)}
            className="inline-flex items-center border-0 bg-transparent p-0 text-xs font-medium text-neutral-400 transition-colors hover:text-white"
            title="View Price Trend & Audit Logs"
          >

            <LineChart className="mr-1.5 h-3.5 w-3.5" />

            History & Logs

          </button>

          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-600 transition-colors hover:text-white"
            title="Open Store Page"
          >

            <ExternalLink className="h-3.5 w-3.5" />

          </a>

        </div>

        {/* RIGHT ACTIONS */}

        <div className="flex items-center gap-3">

          <button
            onClick={() => onScrape(product.id)}
            disabled={isScraping}
            className="border-0 bg-transparent p-0 text-neutral-500 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            title="Trigger Immediate Scrape"
          >

            <RefreshCw
              className={`h-4 w-4 ${
                isScraping ? 'animate-spin' : ''
              }`}
            />

          </button>

          <button
            onClick={() => onUntrack(product.id)}
            className="border-0 bg-transparent p-0 text-neutral-500 transition-colors hover:text-white"
            title="Stop Tracking"
          >

            <Trash2 className="h-4 w-4" />

          </button>

        </div>

      </div>

    </div>
  );
}