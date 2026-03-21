// ─────────────────────────────────────────────
// Root Loading Skeleton
// ─────────────────────────────────────────────

export default function RootLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="h-10 w-10 rounded-full border-4 border-[#1B2A4A]/20 border-t-[#1B2A4A] animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading&hellip;</p>
      </div>
    </div>
  );
}
