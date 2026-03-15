'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";

export default function ConsultantDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
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
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Consultant Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your athletes and their performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">Total Clients</p>
          <Users className="w-5 h-5 text-blue-500" />
        </div>
        <p className="text-3xl font-bold text-gray-900">{dashboardData?.totalAthletes || 0}</p>
        <p className="text-sm text-blue-500 mt-1">+3 this month</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">Sessions This Week</p>
          <Calendar className="w-5 h-5 text-blue-500" />
        </div>
        <p className="text-3xl font-bold text-gray-900">{dashboardData?.sessionsThisWeek || 0}</p>
        <p className="text-sm text-gray-400 mt-1">{dashboardData?.sessionsToday || 0} today</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">This Month</p>
          <DollarSign className="w-5 h-5 text-blue-500" />
        </div>
        <p className="text-3xl font-bold text-gray-900">${dashboardData?.revenue || 0}</p>
        <p className="text-sm text-green-500 mt-1">+12% vs last month</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">Client Satisfaction</p>
          <TrendingUp className="w-5 h-5 text-blue-500" />
        </div>
        <p className="text-3xl font-bold text-gray-900">{dashboardData?.rating || 0}</p>
        <p className="text-sm text-gray-400 mt-1">Based on {dashboardData?.totalReviews || 0} reviews</p>
      </div>

    </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-lg font-bold text-gray-900">Upcoming Sessions</h2>
      <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
    </div>
    <div className="space-y-4">
      {dashboardData?.upcomingSessions?.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">No upcoming sessions</p>
      )}
      {dashboardData?.upcomingSessions?.map((session: any) => {
        const firstName = session.athletes?.profiles?.first_name || '';
        const lastName = session.athletes?.profiles?.last_name || '';
        const sport = session.athletes?.sports?.name || '';
        const isOnline = session.location_type === 'online';
        const date = new Date(session.scheduled_at);
        const isToday = date.toDateString() === new Date().toDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = isToday ? `Today, ${timeStr}` : `Tomorrow, ${timeStr}`;

        return (
          <div key={session.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{firstName} {lastName}</p>
              <p className="text-xs text-gray-400">{sport} • {isOnline ? 'Online' : 'In-person'}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-medium text-gray-700">{dateStr}</p>
              <p className="text-xs text-gray-400">{session.duration_minutes} min</p>
            </div>
            <button className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
              Join
            </button>
          </div>
        );
      })}
    </div>
  </div>

  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-lg font-bold text-gray-900">New Messages</h2>
      {dashboardData?.newMessages?.length > 0 && (
        <span className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {dashboardData?.newMessages?.length}
        </span>
      )}
    </div>
    <div className="space-y-4">
      {dashboardData?.newMessages?.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">No new messages</p>
      )}
      {dashboardData?.newMessages?.map((msg: any) => {
        const firstName = msg.athlete?.first_name || '';
        const lastName = msg.athlete?.last_name || '';
        const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
        const timeAgo = new Date(msg.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
          <div key={msg.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-900">{firstName} {lastName}</p>
                <p className="text-xs text-gray-400">{timeAgo}</p>
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">{msg.last_message}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>

</div>
    </>
  );
}