import Navbar from "@/components/dashboard/Navbar";
import StatCard from "@/components/dashboard/StatCard";
import WeeklyActivityChart from "@/components/dashboard/WeeklyActivityChart";
import CaloriesBurnedChart from "@/components/dashboard/CaloriesBurnedChart";
import UpcomingConsultations from "@/components/dashboard/UpcomingConsultations";
import { Target, Heart, CalendarDays, Flame } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, Alex 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Here&apos;s your health &amp; performance overview
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <StatCard
            label="Training Progress"
            value="72%"
            subLabel="Weekly target"
            icon={<Target className="w-5 h-5 text-blue-500" />}
            iconBg="bg-blue-50"
            progress={72}
          />
          <StatCard
            label="Injury Recovery"
            value="85%"
            subLabel="Left knee rehab"
            icon={<Heart className="w-5 h-5 text-rose-400" />}
            iconBg="bg-rose-50"
            progress={85}
          />
          <StatCard
            label="Upcoming Consults"
            value="3"
            subLabel="This week"
            icon={<CalendarDays className="w-5 h-5 text-blue-400" />}
            iconBg="bg-blue-50"
          />
          <StatCard
            label="Active Days"
            value="5/7"
            subLabel="This week"
            icon={<Flame className="w-5 h-5 text-orange-400" />}
            iconBg="bg-orange-50"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <WeeklyActivityChart />
          <CaloriesBurnedChart />
        </div>

        {/* Upcoming Consultations */}
        <UpcomingConsultations />
      </main>
    </div>
  );
}