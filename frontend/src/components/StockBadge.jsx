import React from 'react';

export default function StockBadge({ stock, status }) {

  // OUT OF STOCK
  if (stock === 0 || status === 'OUT_OF_STOCK') {
    return (
      <span className="inline-flex items-center text-[11px] font-medium text-neutral-500">
        <span className="mr-1.5 h-1.5 w-1.5 bg-neutral-500" />
        Out of Stock
      </span>
    );
  }

  // LOW STOCK
  if (
    (stock !== null &&
      stock !== undefined &&
      stock <= 5) ||
    status === 'LOW_STOCK'
  ) {
    return (
      <span className="inline-flex items-center text-[11px] font-medium text-neutral-500">
        <span className="mr-1.5 h-1.5 w-1.5 bg-neutral-400" />
        {stock ? `${stock} left` : 'Low Stock'}
      </span>
    );
  }

  // IN STOCK
  if (stock > 5 || status === 'IN_STOCK') {
    return (
      <span className="inline-flex items-center text-[11px] font-medium text-neutral-400">
        <span className="mr-1.5 h-1.5 w-1.5 bg-neutral-400" />
        {stock ? `${stock} in stock` : 'In Stock'}
      </span>
    );
  }

  // UNKNOWN
  return (
    <span className="text-[11px] font-medium text-neutral-600">
      Checking stock...
    </span>
  );
}