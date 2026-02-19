import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  subLabel: string;
  icon: ReactNode;
  iconBg: string;
  progress?: number;
}

export default function StatCard({
  label,
  value,
  subLabel,
  icon,
  iconBg,
  progress,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-3">{subLabel}</p>
      {typeof progress === "number" && (
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}