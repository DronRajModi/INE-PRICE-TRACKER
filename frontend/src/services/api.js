// API Service Client for INE Price Tracker
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Search products in store
  searchProducts: (query = '') =>
    request(`/products/search?q=${encodeURIComponent(query)}`),

  // Tracked products management
  getTrackedProducts: () =>
    request('/tracked-products'),

  trackProduct: (productData) =>
    request('/tracked-products', {
      method: 'POST',
      body: JSON.stringify(productData)
    }),

  untrackProduct: (productId) =>
    request(`/tracked-products/${productId}`, {
      method: 'DELETE'
    }),

  // Product metrics & logs
  getProductHistory: (productId) =>
    request(`/tracked-products/${productId}/history`),

  getProductLogs: (productId) =>
    request(`/tracked-products/${productId}/logs`),

  triggerScrape: (productId) =>
    request(`/tracked-products/${productId}/scrape`, {
      method: 'POST'
    }),

  // Batch scrape job
  triggerScrapeAll: (cronSecret = '') =>
    request('/jobs/scrape-all', {
      method: 'POST',
      headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}
    })
};

export default api;
