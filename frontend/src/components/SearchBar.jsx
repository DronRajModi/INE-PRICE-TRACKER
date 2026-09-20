// import React, { useState, useEffect } from 'react';
// import { Search, X, Loader2 } from 'lucide-react';

// export default function SearchBar({ onSearch, isLoading = false, placeholder = "Search products by name, brand, SKU (e.g., 'Monitor', 'Nordkraft')..." }) {
//   const [query, setQuery] = useState('');

//   // Debounced search
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       onSearch(query);
//     }, 400);

//     return () => clearTimeout(handler);
//   }, [query, onSearch]);

//   const handleClear = () => {
//     setQuery('');
//     onSearch('');
//   };

//   return (
//     <div className="relative w-full max-w-2xl">
//       <div className="relative flex items-center">
//         <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
//           {isLoading ? (
//             <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
//           ) : (
//             <Search className="w-5 h-5" />
//           )}
//         </div>
//         <input
//           type="text"
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           placeholder={placeholder}
//           className="w-full pl-10 pr-10 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
//         />
//         {query && (
//           <button
//             type="button"
//             onClick={handleClear}
//             className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
//           >
//             <X className="w-4 h-4" />
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export default function SearchBar({
  onSearch,
  isLoading = false,
  placeholder = "Search products by name, brand, SKU (e.g., 'Monitor', 'Nordkraft')...",
}) {
  const [query, setQuery] = useState('');

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(query);
    }, 400);

    return () => clearTimeout(handler);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">

        {/* Search / Loading icon */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Search className="w-4 h-4" strokeWidth={1.7} />
          )}
        </div>

        {/* Search input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="
            w-full
            h-11
            pl-11
            pr-11
            bg-neutral-950
            border
            border-neutral-800
            text-sm
            text-white
            placeholder:text-neutral-600
            outline-none
            transition-colors
            hover:border-neutral-700
            focus:border-neutral-500
            focus:ring-0
            focus:outline-none
          "
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="
              absolute
              inset-y-0
              right-0
              px-4
              flex
              items-center
              justify-center
              text-neutral-600
              hover:text-white
              transition-colors
            "
          >
            <X className="w-4 h-4" strokeWidth={1.7} />
          </button>
        )}
      </div>
    </div>
  );
}