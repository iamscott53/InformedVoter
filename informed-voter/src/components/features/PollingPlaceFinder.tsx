"use client";

import { useState } from "react";
import { Search, MapPin, Loader2, Navigation, Clock, Accessibility, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MOCK_POLLING_PLACES = [
  {
    id: "pp1",
    name: "Precinct 42 — Westside Community Center",
    address: "1225 West Ave, Sacramento, CA 95814",
    distance: "0.4 mi",
    hours: "7:00 AM – 8:00 PM",
    type: "Regular Polling Place",
    typeColor: "bg-blue-100 text-blue-800",
    accessible: true,
    dropBox: true,
    earlyVoting: false,
  },
  {
    id: "pp2",
    name: "Downtown Vote Center",
    address: "500 Capital Mall, Sacramento, CA 95814",
    distance: "1.2 mi",
    hours: "8:00 AM – 8:00 PM (Oct 29 – Nov 3)",
    type: "Vote Center",
    typeColor: "bg-emerald-100 text-emerald-800",
    accessible: true,
    dropBox: true,
    earlyVoting: true,
  },
  {
    id: "pp3",
    name: "North Sacramento Library",
    address: "4750 McKinley Blvd, Sacramento, CA 95819",
    distance: "2.1 mi",
    hours: "7:00 AM – 8:00 PM",
    type: "Regular Polling Place",
    typeColor: "bg-blue-100 text-blue-800",
    accessible: true,
    dropBox: false,
    earlyVoting: false,
  },
  {
    id: "pp4",
    name: "Arden Arcade Recreation Center",
    address: "3330 Mitchell Ave, Sacramento, CA 95821",
    distance: "3.8 mi",
    hours: "7:00 AM – 8:00 PM",
    type: "Drop Box Location",
    typeColor: "bg-purple-100 text-purple-800",
    accessible: false,
    dropBox: true,
    earlyVoting: false,
  },
];

export default function PollingPlaceFinder() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<typeof MOCK_POLLING_PLACES | null>(null);
  const [useLocation, setUseLocation] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResults(MOCK_POLLING_PLACES);
      setLoading(false);
    }, 1100);
  }

  function handleUseLocation() {
    setUseLocation(true);
    setLoading(true);
    setTimeout(() => {
      setAddress("Current Location — Sacramento, CA");
      setResults(MOCK_POLLING_PLACES);
      setLoading(false);
    }, 1500);
  }

  return (
    <div className="space-y-6">
      {/* Search form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-[#1B2A4A] mb-4">Find Polling Places Near You</h2>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your home address…"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/30 focus:border-[#1B2A4A]/50"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={loading}
              className="inline-flex items-center gap-2 border border-gray-200 text-[#1B2A4A] text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shrink-0"
            >
              <Navigation size={14} />
              Use My Location
            </button>
            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="inline-flex items-center gap-2 bg-[#1B2A4A] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#2D4066] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Searching…</>
              ) : (
                <><Search size={14} /> Search</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Found <strong className="text-[#1B2A4A]">{results.length} polling locations</strong> near you
              </p>
              <p className="text-xs text-gray-400">
                Sorted by distance
              </p>
            </div>

            {results.map((place) => (
              <div
                key={place.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-[#1B2A4A]/5 flex items-center justify-center shrink-0">
                      <MapPin size={22} className="text-[#1B2A4A]" />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-start gap-2 mb-1">
                        <h3 className="font-bold text-[#1B2A4A] text-base leading-snug">{place.name}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${place.typeColor}`}>
                          {place.type}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 mb-3">{place.address}</p>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Navigation size={13} className="text-[#1B2A4A]" />
                          <span className="font-semibold text-[#1B2A4A]">{place.distance}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Clock size={13} className="text-gray-400" />
                          {place.hours}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {place.accessible && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            <Accessibility size={10} /> Accessible
                          </span>
                        )}
                        {place.dropBox && (
                          <span className="text-[11px] font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                            Ballot Drop Box
                          </span>
                        )}
                        {place.earlyVoting && (
                          <span className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            Early Voting
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Get directions */}
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(place.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#1B2A4A] text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-[#2D4066] transition-colors shrink-0"
                    >
                      Get Directions <ChevronRight size={12} />
                    </a>
                  </div>
                </div>
              </div>
            ))}

            <p className="text-xs text-gray-400 text-center pt-2">
              Polling place data is provided for informational purposes. Verify with your county elections office.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
