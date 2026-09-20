import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Calendar,
  ShieldCheck,
  Tag
} from 'lucide-react';

import api from '../services/api';
import PriceChart from '../components/PriceChart';
import ScrapeLog from '../components/ScrapeLog';
import StockBadge from '../components/StockBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProductDetails({
  product,
  onBack,
  onUpdateProduct
}) {
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState(null);

  // =========================================================
  // LOAD PRODUCT DATA
  // =========================================================

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [historyRes, logsRes] = await Promise.all([
        api.getProductHistory(product.id),
        api.getProductLogs(product.id)
      ]);

      setHistory(historyRes.data || []);
      setLogs(logsRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [product.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // =========================================================
  // IMMEDIATE SCRAPE
  // =========================================================

  const handleImmediateScrape = async () => {
    setIsScraping(true);

    try {
      const result = await api.triggerScrape(product.id);

      if (result.success && result.data) {
        onUpdateProduct({
          ...product,
          current_price: result.data.price,
          current_stock: result.data.stock,
          stock_status: result.data.stockStatus,
          last_scraped_at: new Date().toISOString(),
          last_scrape_status: 'SUCCESS'
        });
      }

      await loadData();

    } catch (err) {
      alert(`Scrape attempt failed: ${err.message}`);
      await loadData();

    } finally {
      setIsScraping(false);
    }
  };

  // =========================================================
  // PRICE FORMATTER
  // =========================================================

  const formatPrice = (val) => {
    if (
      val === null ||
      val === undefined ||
      isNaN(val)
    ) {
      return '—';
    }

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: product.currency || 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // =========================================================
  // PRICE STATISTICS
  // =========================================================

  const prices = history.map((h) => Number(h.price));

  const minPrice = prices.length
    ? Math.min(...prices)
    : null;

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="flex flex-col justify-between gap-4 border-b border-neutral-800 pb-5 sm:flex-row sm:items-center">

        {/* LEFT */}

        <div className="flex items-center gap-4">

          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center border border-neutral-800 bg-black text-neutral-500 transition-colors hover:border-neutral-600 hover:text-white"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div>

            <div className="flex items-center gap-2">

              <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                {product.brand}
              </span>

              <span className="text-neutral-700">
                /
              </span>

              <span className="text-[11px] text-neutral-600">
                {product.category}
              </span>

            </div>

            <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">
              {product.name}
            </h1>

          </div>

        </div>

        {/* RIGHT */}

        <div className="flex items-center gap-2">

          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center border border-neutral-800 bg-black px-3 py-2 text-xs font-medium text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
          >
            Store Listing

            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </a>

          <button
            onClick={handleImmediateScrape}
            disabled={isScraping}
            className="inline-flex items-center bg-white px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
          >

            <RefreshCw
              className={`mr-2 h-3.5 w-3.5 ${
                isScraping ? 'animate-spin' : ''
              }`}
            />

            {isScraping
              ? 'Scraping...'
              : 'Scrape Now'}

          </button>

        </div>

      </div>

      {/* =====================================================
          PRODUCT SUMMARY
          ===================================================== */}

      <div className="grid grid-cols-2 gap-px border border-neutral-800 bg-neutral-800 lg:grid-cols-4">

        {/* CURRENT PRICE */}

        <div className="bg-black p-5">

          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-neutral-600">

            <Tag className="h-3.5 w-3.5" />

            Current Price

          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {formatPrice(product.current_price)}
          </p>

        </div>

        {/* STOCK */}

        <div className="bg-black p-5">

          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-neutral-600">

            <ShieldCheck className="h-3.5 w-3.5" />

            Stock

          </div>

          <div className="mt-3">

            <StockBadge
              stock={product.current_stock}
              status={product.stock_status}
            />

          </div>

        </div>

        {/* LOWEST PRICE */}

        <div className="bg-black p-5">

          <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-600">
            Lowest Price
          </span>

          <p className="mt-3 text-xl font-semibold tracking-tight text-white">

            {minPrice !== null
              ? formatPrice(minPrice)
              : '—'}

          </p>

        </div>

        {/* LAST VERIFIED */}

        <div className="bg-black p-5">

          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-neutral-600">

            <Calendar className="h-3.5 w-3.5" />

            Last Verified

          </div>

          <p className="mt-3 text-xs text-neutral-400">

            {product.last_scraped_at
              ? new Date(
                  product.last_scraped_at
                ).toLocaleString()
              : 'Pending first run'}

          </p>

        </div>

      </div>

      {/* =====================================================
          CONTENT
          ===================================================== */}

      {isLoading ? (

        <div className="border border-neutral-800 py-16">

          <LoadingSpinner
            text="Fetching price history and audit logs..."
          />

        </div>

      ) : error ? (

        <div className="border border-neutral-800 bg-black p-5">

          <p className="text-sm text-neutral-400">
            Failed to load product details.
          </p>

          <p className="mt-1 text-xs text-neutral-600">
            {error}
          </p>

        </div>

      ) : (

        <div className="space-y-6">

          {/* =================================================
              PRICE HISTORY
              ================================================= */}

          <section>

            <PriceChart
              history={history}
              currency={product.currency || 'INR'}
            />

          </section>

          {/* =================================================
              SCRAPE LOG
              ================================================= */}

          <section>

            <ScrapeLog logs={logs} />

          </section>

        </div>

      )}

    </div>
  );
}