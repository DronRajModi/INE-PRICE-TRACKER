import React, { useState } from 'react';

export default function PriceChart({ history = [], currency = 'INR' }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-black border border-neutral-800 text-neutral-500">
        <p className="text-sm font-medium text-neutral-300">
          No price history recorded yet.
        </p>

        <p className="text-xs text-neutral-600 mt-1">
          Price data points will appear here following automated scrapes.
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // Chart dimensions
  // --------------------------------------------------

  const width = 700;
  const height = 260;

  const padding = {
    top: 20,
    right: 30,
    bottom: 40,
    left: 60,
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // --------------------------------------------------
  // Extract prices
  // --------------------------------------------------

  const prices = history.map((h) => Number(h.price));

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const priceRange =
    maxPrice === minPrice
      ? 10
      : maxPrice - minPrice;

  // --------------------------------------------------
  // Map history data to SVG coordinates
  // --------------------------------------------------

  const points = history.map((item, index) => {
    const x =
      history.length === 1
        ? padding.left + chartWidth / 2
        : padding.left +
          (index / (history.length - 1)) * chartWidth;

    const y =
      padding.top +
      chartHeight -
      ((Number(item.price) - minPrice) / priceRange) *
        chartHeight;

    return {
      x,
      y,
      ...item,
    };
  });

  // --------------------------------------------------
  // SVG line path
  // --------------------------------------------------

  const linePath = points.reduce(
    (acc, pt, i) =>
      `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
    ''
  );

  // --------------------------------------------------
  // Area path
  // --------------------------------------------------

  const areaPath =
    points.length > 1
      ? `${linePath}
         L ${points[points.length - 1].x} ${padding.top + chartHeight}
         L ${points[0].x} ${padding.top + chartHeight}
         Z`
      : '';

  // --------------------------------------------------
  // Currency formatter
  // --------------------------------------------------

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="bg-black border border-neutral-800 p-5">
      
      {/* ---------------------------------------------
          Header
      --------------------------------------------- */}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Price Trend Over Time
          </h3>

          <p className="text-xs text-neutral-600 mt-1">
            Historical changes logged from mock store
          </p>
        </div>

        {/* Price range */}
        <div className="flex items-center gap-5 text-xs">
          
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-white" />

            <span className="text-neutral-500">
              Low:{' '}
              <strong className="text-neutral-300 font-medium">
                {formatCurrency(minPrice)}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-neutral-600" />

            <span className="text-neutral-500">
              High:{' '}
              <strong className="text-neutral-300 font-medium">
                {formatCurrency(maxPrice)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------
          Chart
      --------------------------------------------- */}

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px]"
        >

          {/* -----------------------------------------
              Grid lines
          ----------------------------------------- */}

          {[0, 0.25, 0.5, 0.75, 1].map(
            (ratio, i) => {
              const y =
                padding.top +
                chartHeight * ratio;

              const priceVal =
                maxPrice -
                priceRange * ratio;

              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#262626"
                    strokeDasharray="3 5"
                    strokeWidth="1"
                  />

                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-neutral-600 font-mono"
                  >
                    ₹
                    {Math.round(priceVal).toLocaleString(
                      'en-IN'
                    )}
                  </text>
                </g>
              );
            }
          )}

          {/* -----------------------------------------
              Area under line
          ----------------------------------------- */}

          {areaPath && (
            <path
              d={areaPath}
              fill="rgba(255,255,255,0.035)"
            />
          )}

          {/* -----------------------------------------
              Main price line
          ----------------------------------------- */}

          <path
            d={linePath}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="round"
          />

          {/* -----------------------------------------
              Data points
          ----------------------------------------- */}

          {points.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={hoveredPoint === pt ? 5 : 3}
              fill={
                hoveredPoint === pt
                  ? '#ffffff'
                  : '#000000'
              }
              stroke="#ffffff"
              strokeWidth={
                hoveredPoint === pt ? 2 : 1.5
              }
              className="cursor-pointer"
              onMouseEnter={() =>
                setHoveredPoint(pt)
              }
              onMouseLeave={() =>
                setHoveredPoint(null)
              }
            />
          ))}

          {/* -----------------------------------------
              X-axis date labels
          ----------------------------------------- */}

          {points.map((pt, i) => {
            const showLabel =
              i === 0 ||
              i === points.length - 1 ||
              i === Math.floor(points.length / 2);

            if (!showLabel) return null;

            const date = new Date(
              pt.recorded_at
            );

            const formatted = `${date.getDate()}/${
              date.getMonth() + 1
            } ${date.getHours()}:${String(
              date.getMinutes()
            ).padStart(2, '0')}`;

            return (
              <text
                key={`label-${i}`}
                x={pt.x}
                y={height - 12}
                textAnchor={
                  i === 0
                    ? 'start'
                    : i === points.length - 1
                    ? 'end'
                    : 'middle'
                }
                className="text-[10px] fill-neutral-600 font-mono"
              >
                {formatted}
              </text>
            );
          })}
        </svg>

        {/* ---------------------------------------------
            Hover tooltip
        --------------------------------------------- */}

        {hoveredPoint && (
          <div
            className="
              absolute
              top-2
              left-1/2
              -translate-x-1/2
              bg-black
              border
              border-neutral-700
              px-3
              py-2
              text-xs
              pointer-events-none
              flex
              items-center
              gap-4
            "
          >
            {/* Date + Price */}

            <div>
              <p className="text-neutral-600 text-[10px]">
                {new Date(
                  hoveredPoint.recorded_at
                ).toLocaleString()}
              </p>

              <p className="text-sm font-semibold text-white mt-0.5">
                {formatCurrency(
                  hoveredPoint.price
                )}
              </p>
            </div>

            {/* Stock */}

            {hoveredPoint.stock !== null &&
              hoveredPoint.stock !== undefined && (
                <div className="border-l border-neutral-800 pl-4">
                  <p className="text-neutral-600 text-[10px]">
                    Stock Level
                  </p>

                  <p className="font-medium text-neutral-300 mt-0.5">
                    {hoveredPoint.stock > 0
                      ? `${hoveredPoint.stock} units`
                      : 'Out of Stock'}
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}