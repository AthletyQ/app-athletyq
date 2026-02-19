"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";

const data = [
  { day: "Mon", calories: 480 },
  { day: "Tue", calories: 590 },
  { day: "Wed", calories: 400 },
  { day: "Thu", calories: 520 },
  { day: "Fri", calories: 630 },
  { day: "Sat", calories: 480 },
  { day: "Sun", calories: 310 },
];

export default function CaloriesBurnedChart() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-5">
        <Activity className="w-4 h-4 text-blue-500" />
        <h2 className="font-semibold text-gray-800 text-sm">Calories Burned</h2>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            domain={[0, 800]}
            ticks={[0, 200, 400, 600, 800]}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="calories"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#calorieGradient)"
            dot={false}
            activeDot={{ r: 5, fill: "#3b82f6" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
