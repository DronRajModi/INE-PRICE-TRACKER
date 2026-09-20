
import React, { useState } from 'react';
import { ShoppingCart, ExternalLink, ArrowLeft } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import ProductDetails from './pages/ProductDetails';

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-black">

        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* BRAND */}

          <button
            onClick={() => setSelectedProduct(null)}
            className="group flex items-center gap-3 border-0 bg-transparent p-0"
          >

            {/* Minimal logo */}

            <div className="flex h-8 w-8 items-center justify-center border border-neutral-700 bg-white text-black">
              <ShoppingCart className="h-4 w-4" />
            </div>

            {/* Title */}

            <div className="flex items-center gap-3">

              <span className="text-base font-semibold tracking-tight text-white">
                INE Price Tracker
              </span>

              <span className="hidden border-l border-neutral-800 pl-3 text-[10px] font-medium uppercase tracking-widest text-neutral-600 sm:inline">
                DASHBOARD
              </span>

            </div>

          </button>

          {/* RIGHT SIDE */}

          <div className="flex items-center">

            <a
              href="https://demo.inelabteamdev.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
            >
              Mock Storefront

              <ExternalLink className="h-3 w-3" />
            </a>

          </div>

        </div>

      </header>

      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">

        {selectedProduct ? (

          <ProductDetails
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onUpdateProduct={(updated) =>
              setSelectedProduct(updated)
            }
          />

        ) : (

          <Dashboard
            onSelectProduct={(product) =>
              setSelectedProduct(product)
            }
          />

        )}

      </main>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="mt-12 border-t border-neutral-800">

        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-[11px] text-neutral-600 sm:flex-row sm:px-6 lg:px-8">

          <span>
            INE Price Tracker
          </span>

          <span>
            Software Engineer Intern Assignment
          </span>

        </div>

      </footer>

    </div>
  );
}