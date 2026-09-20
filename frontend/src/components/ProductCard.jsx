import React from 'react';
import { Plus, Check, ExternalLink } from 'lucide-react';

export default function ProductCard({
  product,
  isTracked,
  onTrack,
  isTrackingLoading
}) {
  return (
    <div className="group flex h-full flex-col justify-between border border-neutral-800 bg-black">

      {/* =====================================================
          PRODUCT INFORMATION
          ===================================================== */}

      <div className="p-4">

        {/* Brand + Category */}

        <div className="mb-2 flex items-center justify-between gap-3">

          <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            {product.brand}
          </span>

          <span className="text-[10px] uppercase tracking-wide text-neutral-600">
            {product.category}
          </span>

        </div>

        {/* Product Name */}

        <h4 className="truncate text-sm font-semibold tracking-tight text-white">
          {product.name}
        </h4>

        {/* Description */}

        <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-600">
          {product.description || 'No description available.'}
        </p>

        {/* SKU */}

        <div className="mt-3 font-mono text-[10px] text-neutral-600">
          SKU: {product.sku}
        </div>

      </div>

      {/* =====================================================
          ACTION BAR
          ===================================================== */}

      <div className="flex items-center justify-between border-t border-neutral-800 px-4 py-3">

        {/* STORE LINK */}

        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-[11px] font-medium text-neutral-500 transition-colors hover:text-white"
        >
          View in Store

          <ExternalLink className="ml-1.5 h-3 w-3" />
        </a>

        {/* TRACK STATE */}

        {isTracked ? (

          <span className="inline-flex items-center text-[11px] font-medium text-neutral-400">

            <Check className="mr-1.5 h-3.5 w-3.5" />

            Tracked

          </span>

        ) : (

          <button
            onClick={() => onTrack(product)}
            disabled={isTrackingLoading}
            className="inline-flex items-center bg-white px-3 py-1.5 text-[11px] font-medium text-black transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
          >

            <Plus className="mr-1.5 h-3.5 w-3.5" />

            {isTrackingLoading ? 'Adding...' : 'Track Price'}

          </button>

        )}

      </div>

    </div>
  );
}