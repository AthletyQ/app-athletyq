'use client';

import { useState, useEffect } from 'react';
import { Users, Video, TrendingUp, DollarSign, Calendar, CheckCircle, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

function initials(firstName: string, lastName: string) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

const AVATAR_COLORS = [
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-amber-100 text-amber-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
];

function getColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function ConsultantDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [consultantId, setConsultantId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setConsultantId(data.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!consultantId) return;
    fetch(`/api/consultant/dashboard?consultant_id=${consultantId}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.ok) setDashboardData(result.data);
      })
      .finally(() => setLoading(false));
  }, [consultantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!consultantId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Not logged in. Please login first.</p>
      </div>
    );
  }

  const profile = dashboardData?.profile;
  const firstName = profile?.first_name || '';
  const lastName = profile?.last_name || '';
  const specialty = profile?.consultants?.specialty || 'Consultant';

  const stats = [
    { label: 'Total Clients',       value: dashboardData?.totalAthletes || 0,           sub: '+3 this month',        subColor: 'text-blue-500',  icon: Users      },
    { label: 'Sessions This Week', value: dashboardData?.sessionsThisWeek || 0, sub: dashboardData?.upcomingSessions?.length > 0 ? `${dashboardData.upcomingSessions.length} upcoming` : 'None upcoming', subColor: dashboardData?.upcomingSessions?.length > 0 ? 'text-blue-500' : 'text-gray-400', icon: Calendar },
    { label: 'This Month',          value: `$${dashboardData?.earnings || 0}`,            sub: '+12% vs last month',   subColor: 'text-green-500', icon: DollarSign },
    { label: 'Client Satisfaction', value: '4.9',                                         sub: 'Based on 155 reviews', subColor: 'text-gray-400',  icon: TrendingUp },
  ];

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <main className="flex-1 p-6">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, <span className="font-semibold text-gray-700">{firstName} {lastName}</span>! Here's what's happening with your consultations today.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 flex items-center gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              {profile?.profile_image_url ? (
                <img src={profile.profile_image_url} alt={`${firstName} ${lastName}`} className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-gray-400">{initials(firstName, lastName)}</span>
              )}
            </div>
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{firstName} {lastName}</h2>
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                <TrendingUp className="w-3 h-3" />
                {specialty.toUpperCase()}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" /> Sri Lanka
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Role</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">{profile?.role?.replace('_', ' ') || 'Consultant'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Email</p>
                <p className="text-sm font-semibold text-gray-900">{profile?.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Experience</p>
                <p className="text-sm font-semibold text-gray-900">
                  {profile?.consultants?.years_of_experience ?? '—'} yrs
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Rating</p>
                <p className="text-sm font-semibold text-gray-900">
                  ⭐ {profile?.consultants?.rating ?? '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 bg-gray-900 text-white rounded-xl px-4 py-3 text-right">
            <p className="text-xs text-gray-400 font-medium mb-0.5">CONSULTANT ID:</p>
            <p className="text-sm font-bold tracking-widest">{consultantId?.slice(0, 8).toUpperCase()}</p>
            <p className="text-xs text-gray-400 mt-2">{dashboardData?.totalAthletes ?? 0} sessions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map(({ label, value, sub, subColor, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <Icon className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
              <p className={`text-xs font-medium ${subColor}`}>{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-5">

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-base">Upcoming Sessions</h2>
                <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
              </div>
              <div className="space-y-3">
                {(!dashboardData?.upcomingSessions || dashboardData.upcomingSessions.length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-6">No upcoming sessions</p>
                )}
                {dashboardData?.upcomingSessions?.map((session: any) => {
                  const fName = session.athletes?.profiles?.first_name || '';
                  const lName = session.athletes?.profiles?.last_name || '';
                  const sport = session.athletes?.sports?.name || '';
                  const isOnline = session.location_type === 'online';
                  const date = new Date(session.scheduled_at);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = isToday ? `Today, ${timeStr}` : `Tomorrow, ${timeStr}`;
                  return (
                    <div key={session.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Video className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{fName} {lName}</p>
                        <p className="text-xs text-gray-400">{sport} • {isOnline ? 'Online' : 'In-person'}</p>
                      </div>
                      <div className="text-right mr-3">
                        <p className="text-sm text-gray-700 font-medium">{dateStr}</p>
                        <p className="text-xs text-gray-400">{session.duration_minutes} min</p>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex-shrink-0">
                        Join
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-base">Earnings Summary</h2>
                <button className="text-sm text-blue-600 font-medium hover:text-blue-700">Details</button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Earnings (This Month)</p>
                  <p className="text-2xl font-bold text-gray-900">${dashboardData?.earnings || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>

          </div>

          <div className="col-span-1 space-y-4">

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-base">New Messages</h2>
                {dashboardData?.newMessages?.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                    {dashboardData.newMessages.length}
                  </span>
                )}
              </div>
              <div className="space-y-3 mb-4">
                {(!dashboardData?.newMessages || dashboardData.newMessages.length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-4">No new messages</p>
                )}
                {dashboardData?.newMessages?.map((msg: any) => {
                  const fName = msg.athlete?.first_name || '';
                  const lName = msg.athlete?.last_name || '';
                  const color = getColor(fName);
                  const timeStr = new Date(msg.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={msg.id} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${color}`}>
                        {initials(fName, lName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-semibold text-gray-900">{fName} {lName}</p>
                          <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{timeStr}</p>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{msg.last_message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium hover:bg-gray-50">
                View All Messages
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 text-base mb-4">Athlete Activity</h2>
              <div className="space-y-3">
                {(!dashboardData?.activity || dashboardData.activity.length === 0) && (
                  <div className="flex flex-col items-center justify-center h-20">
                    <CheckCircle className="w-6 h-6 text-gray-200 mb-2" />
                    <p className="text-xs text-gray-300">No recent activity</p>
                  </div>
                )}
                {dashboardData?.activity?.map((item: any) => {
                  const fName = item.athletes?.profiles?.first_name || '';
                  const lName = item.athletes?.profiles?.last_name || '';
                  const time = new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={item.id} className="flex gap-3 items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{fName} {lName}</p>
                        <p className="text-xs text-gray-500">Completed session</p>
                        <p className="text-xs text-gray-400 mt-0.5">{time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}