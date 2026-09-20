
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  RefreshCw,
  ShoppingBag,
  CheckCircle,
  AlertTriangle,
  Search,
  Activity,
  X,
} from 'lucide-react';

import api from '../services/api';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import TrackedProductCard from '../components/TrackedProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard({ onSelectProduct }) {
  const [trackedProducts, setTrackedProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingTracked, setIsLoadingTracked] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [trackingLoadingId, setTrackingLoadingId] = useState(null);
  const [scrapingIds, setScrapingIds] = useState(new Set());
  const [isScrapingAll, setIsScrapingAll] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // --------------------------------------------------
  // Load tracked products
  // --------------------------------------------------

  const fetchTracked = useCallback(async () => {
    try {
      const res = await api.getTrackedProducts();
      setTrackedProducts(res.data || []);
    } catch (err) {
      console.error('Error loading tracked products:', err);
    } finally {
      setIsLoadingTracked(false);
    }
  }, []);

  useEffect(() => {
    fetchTracked();
  }, [fetchTracked]);

  // --------------------------------------------------
  // Search mock storefront
  // --------------------------------------------------
  // useCallback keeps the same function reference between
  // Dashboard re-renders. This prevents SearchBar's debounce
  // effect from restarting whenever isSearching changes.
  // --------------------------------------------------

  const handleSearch = useCallback(async (query) => {
    const trimmedQuery = query.trim();

    // Empty search: clear results and stop loading.
    if (!trimmedQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const res = await api.searchProducts(trimmedQuery);
      setSearchResults(res.products || []);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // --------------------------------------------------
  // Add product to tracking
  // --------------------------------------------------

  const handleTrackProduct = async (product) => {
    setTrackingLoadingId(product.store_product_id);

    try {
      await api.trackProduct({
        store_product_id: product.store_product_id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        sku: product.sku,
        url: product.url,
      });

      setStatusMessage({
        type: 'success',
        text: `Added "${product.name}" to price tracking!`,
      });

      await fetchTracked();

      setShowSearchModal(false);

      setTimeout(() => {
        setStatusMessage(null);
      }, 4000);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: `Failed to track product: ${err.message}`,
      });
    } finally {
      setTrackingLoadingId(null);
    }
  };

  // --------------------------------------------------
  // Untrack product
  // --------------------------------------------------

  const handleUntrack = async (id) => {
    if (
      !window.confirm(
        'Are you sure you want to stop tracking this product? Historical price logs will be removed.'
      )
    ) {
      return;
    }

    try {
      await api.untrackProduct(id);

      setTrackedProducts((prev) =>
        prev.filter((p) => p.id !== id)
      );

      setStatusMessage({
        type: 'success',
        text: 'Product removed from tracking.',
      });

      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: `Failed to untrack: ${err.message}`,
      });
    }
  };

  // --------------------------------------------------
  // Scrape single product
  // --------------------------------------------------

  const handleSingleScrape = async (id) => {
    setScrapingIds((prev) => new Set(prev).add(id));

    try {
      const result = await api.triggerScrape(id);

      await fetchTracked();

      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: `Successfully scraped price: ₹${result.data?.price}`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `Scrape error: ${
            result.error || 'Failed to extract'
          }`,
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: `Scrape error: ${err.message}`,
      });
    } finally {
      setScrapingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      setTimeout(() => {
        setStatusMessage(null);
      }, 4000);
    }
  };

  // --------------------------------------------------
  // Scrape all products
  // --------------------------------------------------

  const handleScrapeAll = async () => {
    setIsScrapingAll(true);

    setStatusMessage({
      type: 'info',
      text: 'Initiating scheduled batch scrape across all tracked products...',
    });

    try {
      const res = await api.triggerScrapeAll();

      await fetchTracked();

      const summary = res.summary || {};

      setStatusMessage({
        type: 'success',
        text: `Batch scrape completed! ${
          summary.successful || 0
        } succeeded, ${summary.failed || 0} failed.`,
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: `Batch scrape failed: ${err.message}`,
      });
    } finally {
      setIsScrapingAll(false);

      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    }
  };

  // --------------------------------------------------
  // Statistics
  // --------------------------------------------------

  const totalTracked = trackedProducts.length;

  const inStockCount = trackedProducts.filter(
    (p) =>
      p.current_stock > 0 ||
      p.stock_status === 'IN_STOCK'
  ).length;

  const outOfStockCount = trackedProducts.filter(
    (p) =>
      p.current_stock === 0 ||
      p.stock_status === 'OUT_OF_STOCK'
  ).length;

  const syncedCount = trackedProducts.filter(
    (p) => p.last_scrape_status === 'SUCCESS'
  ).length;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="space-y-8">

      {/* ==================================================
          STATUS MESSAGE
      ================================================== */}

      {statusMessage && (
        <div className="border border-neutral-800 bg-neutral-950 px-4 py-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span
              className={`w-1.5 h-1.5 ${
                statusMessage.type === 'success'
                  ? 'bg-white'
                  : statusMessage.type === 'error'
                  ? 'bg-neutral-500'
                  : 'bg-neutral-700'
              }`}
            />

            <span className="text-neutral-300">
              {statusMessage.text}
            </span>
          </div>

          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs text-neutral-600 hover:text-white transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ==================================================
          STATS
      ================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Tracked Products */}

        <div className="bg-black border border-neutral-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Tracked Products
            </span>

            <ShoppingBag
              className="w-5 h-5 text-neutral-400"
              strokeWidth={1.5}
            />
          </div>

          <p className="text-3xl font-semibold text-white mt-3">
            {totalTracked}
          </p>

          <p className="text-xs text-neutral-600 mt-1">
            Monitored on 2-hour schedule
          </p>
        </div>

        {/* In Stock */}

        <div className="bg-black border border-neutral-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              In Stock
            </span>

            <CheckCircle
              className="w-5 h-5 text-neutral-400"
              strokeWidth={1.5}
            />
          </div>

          <p className="text-3xl font-semibold text-white mt-3">
            {inStockCount}
          </p>

          <p className="text-xs text-neutral-600 mt-1">
            Available in mock store
          </p>
        </div>

        {/* Out of Stock */}

        <div className="bg-black border border-neutral-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Out of Stock
            </span>

            <AlertTriangle
              className="w-5 h-5 text-neutral-400"
              strokeWidth={1.5}
            />
          </div>

          <p className="text-3xl font-semibold text-white mt-3">
            {outOfStockCount}
          </p>

          <p className="text-xs text-neutral-600 mt-1">
            Inventory depleted
          </p>
        </div>

        {/* Scraper Health */}

        <div className="bg-black border border-neutral-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Scraper Health
            </span>

            <Activity
              className="w-5 h-5 text-neutral-400"
              strokeWidth={1.5}
            />
          </div>

          <p className="text-3xl font-semibold text-white mt-3">
            {totalTracked
              ? `${Math.round(
                  (syncedCount / totalTracked) * 100
                )}%`
              : '100%'}
          </p>

          <p className="text-xs text-neutral-600 mt-1">
            Latest scrape success rate
          </p>
        </div>
      </div>

      {/* ==================================================
          ACTION TOOLBAR
      ================================================== */}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black p-4 border border-neutral-800">

        <div>
          <h2 className="text-lg font-semibold text-white">
            Monitored Store Items
          </h2>

          <p className="text-xs text-neutral-600 mt-1">
            Target storefront:{' '}
            <code className="text-neutral-400">
              https://demo.inelabteamdev.com
            </code>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">

          {/* Scrape All */}

          <button
            onClick={handleScrapeAll}
            disabled={
              isScrapingAll || totalTracked === 0
            }
            className="
              flex-1
              sm:flex-none
              inline-flex
              items-center
              justify-center
              px-4
              py-2.5
              border
              border-neutral-700
              bg-black
              text-neutral-300
              text-xs
              font-medium
              hover:bg-neutral-950
              hover:border-neutral-500
              transition-colors
              disabled:opacity-40
              disabled:cursor-not-allowed
            "
            title="Trigger batch scrape for all products"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-2 ${
                isScrapingAll ? 'animate-spin' : ''
              }`}
              strokeWidth={1.7}
            />

            {isScrapingAll
              ? 'Batch Running...'
              : 'Scrape All'}
          </button>

          {/* Track New Product */}

          <button
            onClick={() => {
              setSearchResults([]);
              setIsSearching(false);
              setShowSearchModal(true);
            }}
            className="
              flex-1
              sm:flex-none
              inline-flex
              items-center
              justify-center
              px-4
              py-2.5
              bg-white
              text-black
              text-xs
              font-medium
              border
              border-white
              hover:bg-neutral-200
              transition-colors
            "
          >
            <Plus
              className="w-4 h-4 mr-1.5"
              strokeWidth={1.7}
            />

            Track New Product
          </button>
        </div>
      </div>

      {/* ==================================================
          TRACKED PRODUCTS
      ================================================== */}

      {isLoadingTracked ? (
        <LoadingSpinner text="Loading tracked products..." />
      ) : totalTracked === 0 ? (
        <div className="text-center py-16 px-4 bg-black border border-dashed border-neutral-800">

          <ShoppingBag
            className="w-10 h-10 text-neutral-700 mx-auto mb-4"
            strokeWidth={1.3}
          />

          <h3 className="text-base font-medium text-neutral-300">
            No Products Tracked Yet
          </h3>

          <p className="text-xs text-neutral-600 max-w-md mx-auto mt-2 mb-5">
            Search INE's mock storefront catalog and select a product to begin automated price tracking and stock monitoring.
          </p>

          <button
            onClick={() => {
              setSearchResults([]);
              setIsSearching(false);
              setShowSearchModal(true);
            }}
            className="
              inline-flex
              items-center
              px-4
              py-2.5
              bg-white
              text-black
              text-xs
              font-medium
              border
              border-white
              hover:bg-neutral-200
              transition-colors
            "
          >
            <Search
              className="w-3.5 h-3.5 mr-1.5"
              strokeWidth={1.7}
            />

            Browse Store Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {trackedProducts.map((product) => (
            <TrackedProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onScrape={handleSingleScrape}
              onUntrack={handleUntrack}
              isScraping={scrapingIds.has(product.id)}
            />
          ))}

        </div>
      )}

      {/* ==================================================
          ADD PRODUCT MODAL
      ================================================== */}

      {showSearchModal && (
        <div
          className="
            fixed
            inset-0
            bg-black/80
            z-50
            flex
            items-center
            justify-center
            p-4
          "
        >
          <div
            className="
              bg-black
              border
              border-neutral-800
              w-full
              max-w-3xl
              max-h-[85vh]
              flex
              flex-col
              overflow-hidden
            "
          >

            {/* Modal Header */}

            <div className="p-5 border-b border-neutral-800 flex items-center justify-between">

              <div>
                <h3 className="text-base font-semibold text-white">
                  Add Product to Tracking
                </h3>

                <p className="text-xs text-neutral-600 mt-1">
                  Search INE's mock catalog by name, brand, or SKU
                </p>
              </div>

              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchResults([]);
                  setIsSearching(false);
                }}
                className="
                  p-1
                  text-neutral-600
                  hover:text-white
                  transition-colors
                "
                aria-label="Close modal"
              >
                <X
                  className="w-5 h-5"
                  strokeWidth={1.5}
                />
              </button>
            </div>

            {/* Search */}

            <div className="p-5 border-b border-neutral-800 bg-black">
              <SearchBar
                onSearch={handleSearch}
                isLoading={isSearching}
              />
            </div>

            {/* Search Results */}

            <div className="p-5 overflow-y-auto space-y-3 flex-1">

              {isSearching ? (
                <LoadingSpinner text="Searching mock store catalog..." />
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {searchResults.map((item) => {
                    const isTracked =
                      trackedProducts.some(
                        (t) =>
                          String(
                            t.store_product_id
                          ) ===
                          String(
                            item.store_product_id
                          )
                      );

                    return (
                      <ProductCard
                        key={item.store_product_id}
                        product={item}
                        isTracked={isTracked}
                        onTrack={handleTrackProduct}
                        isTrackingLoading={
                          trackingLoadingId ===
                          item.store_product_id
                        }
                      />
                    );
                  })}

                </div>
              ) : (
                <div className="text-center py-10 text-neutral-600 text-xs">
                  Type in the search bar above to query products from the mock store.
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}