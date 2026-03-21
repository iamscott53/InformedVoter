import Link from "next/link";

// ─────────────────────────────────────────────
// Custom 404 Page
// ─────────────────────────────────────────────

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Large 404 badge */}
        <div className="mb-6">
          <span className="text-7xl sm:text-8xl font-black text-[#1B2A4A]/10 select-none">
            404
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#1B2A4A] mb-3">
          Page not found
        </h1>

        <p className="text-gray-500 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-[#1B2A4A] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#2D4066] transition-colors no-underline"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"
            />
          </svg>
          Go home
        </Link>
      </div>
    </div>
  );
}
