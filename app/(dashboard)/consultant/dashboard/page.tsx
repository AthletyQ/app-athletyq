'use client';

import { useState, useEffect } from 'react';

interface AthleteData {
  user_id: string;
  age: number;
  sports?: {
    name: string;
  };
}

interface ConsultantDashboardData {
  athletes: AthleteData[];
}

export default function ConsultantDashboard() {
  const [dashboardData, setDashboardData] = useState<ConsultantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/consultant/dashboard');
      const result = await response.json();
      if (result.ok) setDashboardData(result.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Consultant Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your athletes and their performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Athletes List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Athletes</h2>
          <div className="space-y-3">
            {dashboardData?.athletes?.map((athlete: AthleteData) => (
              <div key={athlete.user_id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <p className="font-semibold text-gray-900">Athlete #{athlete.user_id.slice(0, 8)}</p>
                <p className="text-sm text-gray-600">{athlete.sports?.name || 'No sport'}</p>
                <p className="text-xs text-gray-500">Age: {athlete.age}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-2">100m Performance</h3>
              <p className="text-3xl font-bold text-blue-600">10.9s</p>
              <p className="text-sm text-green-600">↑ 2.6% vs last month</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-2">200m Performance</h3>
              <p className="text-3xl font-bold text-blue-600">22.1s</p>
              <p className="text-sm text-green-600">↑ 1.8% vs last month</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Speed', value: 85 },
              { label: 'Strength', value: 75 },
              { label: 'Agility', value: 80 },
              { label: 'Endurance', value: 70 },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-blue-600">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">Injury History</h3>
            <div className="space-y-2">
              {[
                { label: 'Knee', pct: '30%' },
                { label: 'Ankle', pct: '25%' },
                { label: 'Hamstring', pct: '20%' },
                { label: 'Other', pct: '25%' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-gray-700">{item.label}</span>
                  <span className="font-semibold">{item.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}