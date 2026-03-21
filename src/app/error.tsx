"use client";

import Link from "next/link";

// ─────────────────────────────────────────────
// Root Error Boundary
// ─────────────────────────────────────────────

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1B2A4A]/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-[#1B2A4A]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#1B2A4A] mb-3">
          Something went wrong
        </h1>

        <p className="text-gray-500 mb-8 leading-relaxed">
          An unexpected error occurred. You can try again or head back to the
          home page.
        </p>

        {error.digest && (
          <p className="text-xs text-gray-400 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-[#1B2A4A] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#2D4066] transition-colors w-full sm:w-auto cursor-pointer"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white text-[#1B2A4A] font-semibold px-6 py-3 rounded-lg ring-1 ring-gray-200 hover:bg-gray-50 transition-colors w-full sm:w-auto no-underline"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
