"use client";

import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { Coach, CoachFilters, CoachesResponse } from "@/types/coach";
import CoachCard from "@/components/CoachCard";
import CoachFiltersBar from "@/components/CoachFiltersBar";

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<CoachFilters>({});

  const fetchCoaches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filters.sport) params.set("sport", filters.sport);
      if (filters.coachingType) params.set("coachingType", filters.coachingType);
      if (filters.availability) params.set("availability", filters.availability);

      const res = await fetch(`/api/coach?${params.toString()}`);
      const data: CoachesResponse = await res.json();
      setCoaches(data.coaches);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch coaches:", err);
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    const debounce = setTimeout(fetchCoaches, 300);
    return () => clearTimeout(debounce);
  }, [fetchCoaches]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Coaches</h1>
          <p className="text-sm text-gray-500">
            Find the best coaches to guide your performance.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search coaches by name, sport, or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <CoachFiltersBar
            filters={filters}
            onChange={setFilters}
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
              >
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
                <div className="h-8 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : coaches.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">
              No coaches found. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">
              Showing {coaches.length} of {total} coaches
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coaches.map((coach) => (
                <CoachCard key={coach.id} coach={coach} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}