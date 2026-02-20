"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, Star } from "lucide-react";
import type { Coach } from "@/lib/types/dashboard";

interface Props {
  coaches: Coach[];
}

type Filter = "All" | "Doctors" | "Coaches";

export default function CoachesClient({ coaches }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = useMemo(() => {
    return coaches.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.specialty.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" ||
        (filter === "Doctors" && c.type === "doctor") ||
        (filter === "Coaches" && c.type === "coach");

      return matchesSearch && matchesFilter;
    });
  }, [coaches, search, filter]);

  return (
    <>
      {/* Search + Filter Bar */}
      <div className="flex items-center gap-3 mb-8">
        {/* Search Input */}
        <div className="flex-1 flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {(["All", "Doctors", "Coaches"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          No coaches or doctors found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>
      )}
    </>
  );
}

function CoachCard({ coach }: { coach: Coach }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      {/* Top: Avatar + Info */}
      <div className="flex items-start gap-4">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          <Image
            src={coach.avatarUrl}
            alt={coach.name}
            fill
            className="object-cover"
          />
          {/* Online indicator */}
          {coach.isOnline && (
            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-gray-900 text-sm">{coach.name}</p>
            {coach.isOnline && (
              <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{coach.specialty}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-gray-700">
              {coach.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
          Book Consultation
        </button>
        <button className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          Profile
        </button>
      </div>
    </div>
  );
}