import Link from "next/link";

export default function CityNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <span className="text-7xl sm:text-8xl font-black text-[#1B2A4A]/10 select-none">
            404
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1B2A4A] mb-3">
          City not found
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          We don&apos;t have information on file for this city yet. Try searching
          on the Local page.
        </p>
        <Link
          href="/local"
          className="inline-flex items-center justify-center gap-2 bg-[#1B2A4A] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#2D4066] transition-colors no-underline"
        >
          Search for a city
        </Link>
      </div>
    </div>
  );
}
