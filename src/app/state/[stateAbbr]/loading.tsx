// ─────────────────────────────────────────────
// State Dashboard Loading Skeleton
// ─────────────────────────────────────────────

export default function StateDashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* ── Header skeleton ── */}
      <div className="bg-[#1B2A4A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb placeholder */}
          <div className="h-4 w-32 bg-white/10 rounded mb-6" />

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              {/* State abbreviation */}
              <div className="h-12 w-16 bg-white/10 rounded mb-2" />
              {/* Title */}
              <div className="h-9 w-72 bg-white/15 rounded mb-2" />
              {/* FIPS code */}
              <div className="h-4 w-20 bg-white/10 rounded" />
            </div>
            {/* CTA button */}
            <div className="h-10 w-40 bg-white/10 rounded-lg" />
          </div>
        </div>
      </div>

      {/* ── Dashboard grid skeleton ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Section label */}
        <div className="h-4 w-64 bg-gray-200 rounded mb-8" />

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 p-6 rounded-2xl border border-gray-100 bg-white"
            >
              {/* Top row: icon + badge */}
              <div className="flex items-start justify-between">
                <div className="h-11 w-11 rounded-xl bg-gray-100" />
                <div className="h-6 w-16 rounded-full bg-gray-100" />
              </div>
              {/* Title */}
              <div className="space-y-2">
                <div className="h-5 w-3/4 bg-gray-100 rounded" />
                <div className="h-3 w-full bg-gray-50 rounded" />
                <div className="h-3 w-2/3 bg-gray-50 rounded" />
              </div>
              {/* Link */}
              <div className="h-4 w-24 bg-gray-100 rounded mt-auto" />
            </div>
          ))}
        </div>

        {/* ── Stats bar skeleton ── */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="h-4 w-48 bg-gray-100 rounded mb-5" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="pl-6 first:pl-0">
                <div className="h-8 w-12 bg-gray-100 rounded mb-1" />
                <div className="h-3 w-24 bg-gray-50 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
