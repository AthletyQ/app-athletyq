"use client";

import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { Consultant, ConsultantFilters, ConsultantsResponse } from "@/types/consultant";
import ConsultantCard from "@/components/ConsultantCard";
import ConsultantFiltersBar from "@/components/ConsultantFiltersBar";

export default function ConsultantsPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filters, setFilters]         = useState<ConsultantFilters>({});

  const fetchConsultants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)                          params.set("search",    search);
      if (filters.specialty)               params.set("specialty", filters.specialty);
      if (filters.minPrice !== undefined)  params.set("minPrice",  String(filters.minPrice));
      if (filters.maxPrice !== undefined)  params.set("maxPrice",  String(filters.maxPrice));

      const res  = await fetch(`/api/consultant?${params.toString()}`);
      const data: ConsultantsResponse = await res.json();
      setConsultants(data.consultants ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch consultants:", err);
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    const t = setTimeout(fetchConsultants, 300);
    return () => clearTimeout(t);
  }, [fetchConsultants]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Consultants</h1>
        <p className="text-sm text-gray-500 mt-1">
          Find the best consultants to guide your performance.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search consultants by name or specialty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Filters */}
      <ConsultantFiltersBar filters={filters} onChange={setFilters} />

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
              </div>
              <div className="h-8 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : consultants.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm">No consultants found. Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400">
            Showing {consultants.length} of {total} consultant{total !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {consultants.map((consultant) => (
              <ConsultantCard key={consultant.id} consultant={consultant} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}