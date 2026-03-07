"use client";

import { useEffect, useState } from "react";
import { CoachFilters } from "@/types/coach";
import { SlidersHorizontal } from "lucide-react";

interface Sport { id: number; name: string; }

interface Props {
  filters: CoachFilters;
  onChange: (filters: CoachFilters) => void;
}

function FilterSelect({
  label, value, options, onChange,
}: {
  label: string;
  value: string | undefined;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
}) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pr-8"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
      }}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export default function CoachFiltersBar({ filters, onChange }: Props) {
  const [sports, setSports] = useState<Sport[]>([]);

  useEffect(() => {
    fetch("/api/sports")
      .then((r) => r.json())
      .then(({ sports: data }) => setSports(data ?? []));
  }, []);

  const update = (key: keyof CoachFilters, value: string) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  const hasActive = Object.values(filters).some((v) => v !== undefined && v !== "");

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <FilterSelect
        label="Sport"
        value={filters.sport}
        options={sports.map((s) => ({ label: s.name, value: String(s.id) }))}
        onChange={(v) => update("sport", v)}
      />
      {/* <FilterSelect
        label="Price Range"
        value={filters.minPrice ? `${filters.minPrice}-${filters.maxPrice}` : undefined}
        options={[
          { label: "Under $50",    value: "0-50"      },
          { label: "$50 - $100",   value: "50-100"    },
          { label: "$100 - $150",  value: "100-150"   },
          { label: "$150+",        value: "150-99999" },
        ]}
        onChange={(v) => {
          if (!v) { const { minPrice, maxPrice, ...rest } = filters; onChange(rest); return; }
          const [min, max] = v.split("-");
          onChange({ ...filters, minPrice: parseInt(min), maxPrice: parseInt(max) });
        }}
      /> */}
      <button
        onClick={() => onChange({})}
        className={`p-2 rounded-lg border transition-colors ${
          hasActive
            ? "border-blue-500 text-blue-600 bg-blue-50"
            : "border-gray-200 text-gray-500 hover:bg-gray-50"
        }`}
        title={hasActive ? "Clear filters" : "Filters"}
      >
        <SlidersHorizontal size={16} />
      </button>
    </div>
  );
}