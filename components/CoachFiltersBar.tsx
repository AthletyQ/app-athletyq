"use client";

import { CoachFilters } from "@/types/coach";
import { SlidersHorizontal } from "lucide-react";

interface CoachFiltersBarProps {
  filters: CoachFilters;
  onChange: (filters: CoachFilters) => void;
}

const SPORTS = ["Running", "Swimming", "Cycling", "Strength Training", "Yoga", "CrossFit", "HIIT", "Triathlon"];
const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Elite"];
const COACHING_TYPES = ["Online", "In-person", "Hybrid", "Online & In-person"];
const LOCATIONS = ["Remote", "New York", "Los Angeles", "Chicago", "Houston"];
const PRICE_RANGES = ["$0-$50", "$50-$100", "$100-$150", "$150+"];
const AVAILABILITY = ["Weekdays", "Weekends", "Mornings", "Evenings"];

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: string[];
  onChange: (val: string) => void;
}) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer appearance-none pr-8 relative"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
      }}
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export default function CoachFiltersBar({ filters, onChange }: CoachFiltersBarProps) {
  const update = (key: keyof CoachFilters, value: string) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== ""
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <FilterSelect
        label="Sport"
        value={filters.sport}
        options={SPORTS}
        onChange={(v) => update("sport", v)}
      />
      <FilterSelect
        label="Experience Level"
        value={filters.experienceLevel}
        options={EXPERIENCE_LEVELS}
        onChange={(v) => update("experienceLevel", v)}
      />
      <FilterSelect
        label="Coaching Type"
        value={filters.coachingType}
        options={COACHING_TYPES}
        onChange={(v) => update("coachingType", v as any)}
      />
      <FilterSelect
        label="Location"
        value={filters.location}
        options={LOCATIONS}
        onChange={(v) => update("location", v)}
      />
      <FilterSelect
        label="Price Range"
        value={
          filters.minPrice !== undefined
            ? `$${filters.minPrice}-$${filters.maxPrice}`
            : undefined
        }
        options={PRICE_RANGES}
        onChange={(v) => {
          if (!v) {
            const { minPrice, maxPrice, ...rest } = filters;
            onChange(rest);
          }
        }}
      />
      <FilterSelect
        label="Availability"
        value={filters.availability}
        options={AVAILABILITY}
        onChange={(v) => update("availability", v)}
      />

      <button
        className={`p-2 rounded-lg border transition-colors ${
          hasActiveFilters
            ? "border-blue-500 text-blue-600 bg-blue-50"
            : "border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
        onClick={() => onChange({})}
        title={hasActiveFilters ? "Clear filters" : "Advanced filters"}
      >
        <SlidersHorizontal size={16} />
      </button>
    </div>
  );
}