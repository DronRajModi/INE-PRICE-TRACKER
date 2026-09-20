import React from 'react';

export default function ScrapeLog({ logs = [] }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="p-8 text-center bg-black border border-neutral-800">
        <p className="text-sm font-medium text-neutral-300">
          No scrape attempts logged yet.
        </p>

        <p className="text-xs text-neutral-600 mt-1">
          Audit logs will record automatically whenever the scraper executes.
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // Status badge
  // --------------------------------------------------

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center text-xs font-medium text-white">
            <span className="w-1.5 h-1.5 bg-white mr-2" />
            SUCCESS
          </span>
        );

      case 'RETRIED':
        return (
          <span className="inline-flex items-center text-xs font-medium text-neutral-400">
            <span className="w-1.5 h-1.5 bg-neutral-500 mr-2" />
            RETRIED
          </span>
        );

      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center text-xs font-medium text-neutral-500">
            <span className="w-1.5 h-1.5 bg-neutral-600 mr-2" />
            FAILED
          </span>
        );
    }
  };

  return (
    <div className="bg-black border border-neutral-800 overflow-hidden">

      {/* ------------------------------------------------
          Header
      ------------------------------------------------ */}

      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">

        <div>
          <h3 className="text-sm font-semibold text-white">
            Scrape Attempt Audit Logs
          </h3>

          <p className="text-xs text-neutral-600 mt-1">
            Honest record of all execution attempts and outcomes
          </p>
        </div>

        <span className="text-xs font-mono text-neutral-500 px-2.5 py-1 border border-neutral-800">
          {logs.length} Total Logs
        </span>
      </div>

      {/* ------------------------------------------------
          Table
      ------------------------------------------------ */}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">

          {/* Table header */}

          <thead className="bg-neutral-950 text-neutral-600 border-b border-neutral-800 font-medium uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">
                Timestamp
              </th>

              <th className="py-3 px-4">
                Outcome
              </th>

              <th className="py-3 px-4">
                Attempt
              </th>

              <th className="py-3 px-4">
                Engine
              </th>

              <th className="py-3 px-4">
                Duration
              </th>

              <th className="py-3 px-4">
                Diagnostic Details
              </th>
            </tr>
          </thead>

          {/* Table body */}

          <tbody className="divide-y divide-neutral-900">

            {logs.map((log, idx) => (
              <tr
                key={log.id || idx}
                className="hover:bg-neutral-950 transition-colors"
              >

                {/* Timestamp */}

                <td className="py-3 px-4 whitespace-nowrap font-mono text-neutral-400">
                  {new Date(
                    log.created_at
                  ).toLocaleString()}
                </td>

                {/* Outcome */}

                <td className="py-3 px-4 whitespace-nowrap">
                  {getStatusBadge(log.status)}
                </td>

                {/* Attempt */}

                <td className="py-3 px-4 whitespace-nowrap font-mono text-neutral-400">
                  #{log.attempt_number || 1}
                </td>

                {/* Engine */}

                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="text-[11px] font-mono text-neutral-400">
                    {log.scraper_type || 'BROWSER'}
                  </span>
                </td>

                {/* Duration */}

                <td className="py-3 px-4 whitespace-nowrap font-mono text-neutral-500">
                  {log.duration_ms
                    ? `${log.duration_ms} ms`
                    : '—'}
                </td>

                {/* Diagnostic details */}

                <td
                  className="py-3 px-4 text-neutral-500 max-w-xs truncate"
                  title={
                    log.error_message || 'OK'
                  }
                >
                  {log.error_message ? (
                    <span className="text-neutral-400 font-mono text-[11px]">
                      {log.error_message}
                    </span>
                  ) : (
                    <span className="text-neutral-500 font-mono text-[11px]">
                      OK (HTTP {log.http_status || 200})
                    </span>
                  )}
                </td>

              </tr>
            ))}

          </tbody>
        </table>
      </div>
    </div>
  );
}