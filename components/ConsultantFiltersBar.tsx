"use client";

import { useEffect, useState } from "react";
import { ConsultantFilters } from "@/types/consultant";
import { SlidersHorizontal } from "lucide-react";

interface Specialization { id: number; name: string; }

interface Props {
  filters: ConsultantFilters;
  onChange: (filters: ConsultantFilters) => void;
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
      className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8"
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

export default function ConsultantFiltersBar({ filters, onChange }: Props) {
  const [specializations, setSpecializations] = useState<Specialization[]>([]);

  // Pull distinct specialty values from the consultants table
  useEffect(() => {
    fetch("/api/specializations")
      .then((r) => r.json())
      .then(({ specializations: data }) => setSpecializations(data ?? []));
  }, []);

  const update = (key: keyof ConsultantFilters, value: string) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  const hasActive = Object.values(filters).some((v) => v !== undefined && v !== "");

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Specialty filter – values come from the real DB */}
      <FilterSelect
        label="Specialty"
        value={filters.specialty}
        options={specializations.map((s) => ({
          label: s.name.replace(/_/g, " "),
          value: s.name,
        }))}
        onChange={(v) => update("specialty", v)}
      />

      {/* Price range */}
      {/* <FilterSelect
        label="Price Range"
        value={
          filters.minPrice !== undefined
            ? `${filters.minPrice}-${filters.maxPrice}`
            : undefined
        }
        options={[
          { label: "Under $50",   value: "0-50"       },
          { label: "$50 – $100",  value: "50-100"     },
          { label: "$100 – $150", value: "100-150"    },
          { label: "$150+",       value: "150-99999"  },
        ]}
        onChange={(v) => {
          if (!v) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { minPrice, maxPrice, ...rest } = filters;
            onChange(rest);
            return;
          }
          const [min, max] = v.split("-");
          onChange({ ...filters, minPrice: parseInt(min), maxPrice: parseInt(max) });
        }}
      /> */}

      {/* Clear filters */}
      <button
        onClick={() => onChange({})}
        className={`p-2 rounded-lg border transition-colors ${
          hasActive
            ? "border-indigo-500 text-indigo-600 bg-indigo-50"
            : "border-gray-200 text-gray-500 hover:bg-gray-50"
        }`}
        title={hasActive ? "Clear filters" : "Filters"}
      >
        <SlidersHorizontal size={16} />
      </button>
    </div>
  );
}