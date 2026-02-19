"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

const data = [
  { day: "Mon", value: 75 },
  { day: "Tue", value: 90 },
  { day: "Wed", value: 60 },
  { day: "Thu", value: 85 },
  { day: "Fri", value: 95 },
  { day: "Sat", value: 70 },
  { day: "Sun", value: 45 },
];

export default function WeeklyActivityChart() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-4 h-4 text-blue-500" />
        <h2 className="font-semibold text-gray-800 text-sm">Weekly Activity</h2>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          barSize={32}
          margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="#f0f0f0"
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#9ca3af" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip
            cursor={{ fill: "rgba(20,184,166,0.05)" }}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
