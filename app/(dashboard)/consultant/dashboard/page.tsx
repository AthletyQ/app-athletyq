"use client";

import { useEffect, useState } from 'react';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  MapPin, 
  User,
  Video,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ConsultantDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch basic profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, consultants(*)')
          .eq('id', user.id)
          .single();
        
        setProfile(profileData);

        // Fetch dashboard summary from our API
        const response = await fetch('/api/consultant/dashboard');
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const getColor = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-purple-100 text-purple-600',
      'bg-amber-100 text-amber-600',
      'bg-emerald-100 text-emerald-600',
      'bg-pink-100 text-pink-600',
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  const initials = (f: string, l: string) => (f[0] || '') + (l[0] || '');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const firstName = profile?.first_name || 'Consultant';
  const lastName = profile?.last_name || '';
  const consultantId = profile?.id || '';
  const specialty = profile?.consultants?.specialty || 'Consultant';

  const stats = [
    { label: 'Total Clients',       value: dashboardData?.totalAthletes || 0,            sub: '+3 this month',        subColor: 'text-blue-500',  icon: Users      },
    { label: 'Sessions This Week',  value: dashboardData?.upcomingSessions?.length || 0,  sub: '3 today',              subColor: 'text-gray-400',  icon: Calendar   },
    { label: 'This Month',          value: `$${dashboardData?.earnings || 0}`,             sub: '+12% vs last month',   subColor: 'text-green-500', icon: DollarSign },
    { label: 'Client Satisfaction', value: '4.9',                                          sub: 'Based on 155 reviews', subColor: 'text-gray-400',  icon: TrendingUp },
  ];

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <main className="flex-1 p-6">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, <span className="font-semibold text-gray-700">{firstName} {lastName}</span>! Here's what's happening today.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 flex items-center gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-9 h-9 text-gray-400" />
            </div>
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{firstName} {lastName}</h2>
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                <TrendingUp className="w-3 h-3" /> {specialty.toUpperCase()}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" /> Sri Lanka
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Role</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">{profile?.role || 'Consultant'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">Email</p>
                <p className="text-sm font-semibold text-gray-900">{profile?.email || ''}</p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 bg-gray-900 text-white rounded-xl px-4 py-3 text-right">
            <p className="text-xs text-gray-400 font-medium mb-0.5">CONSULTANT ID:</p>
            <p className="text-sm font-bold tracking-widest">{consultantId?.slice(0, 8).toUpperCase()}</p>
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
                {dashboardData?.upcomingSessions?.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No upcoming sessions</p>
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
                      <button className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0">
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
                    {dashboardData?.newMessages?.length}
                  </span>
                )}
              </div>
              <div className="space-y-3 mb-4">
                {dashboardData?.newMessages?.length === 0 && (
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
                {dashboardData?.activity?.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
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
