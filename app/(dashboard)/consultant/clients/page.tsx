'use client';

import { useState, useEffect } from 'react';
import { Search, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
];

function getColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function initials(firstName: string, lastName: string) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [consultantId, setConsultantId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');

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

    fetch(`/api/consultant/clients?consultant_id=${consultantId}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.ok) setClients(result.data.clients || []);
      })
      .finally(() => setLoading(false));
  }, [consultantId]);

  const activeClients = clients.filter((c) => c.totalSessions > 0);
  const pendingClients = clients.filter((c) => c.upcomingSessions > 0 && c.completedSessions === 0);

  const displayClients = (activeTab === 'active' ? activeClients : pendingClients).filter((c) => {
    const name = `${c.profiles?.first_name} ${c.profiles?.last_name}`.toLowerCase();
    const sport = c.sports?.name?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || sport.includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your athletes and view their progress.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === 'active'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Active Clients ({activeClients.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Pending Clients ({pendingClients.length})
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-6 w-80">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search clients by name or sport..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm text-gray-700 outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {/* Client Cards Grid */}
      {displayClients.length === 0 ? (
        <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-gray-100">
          <p className="text-sm text-gray-400">No clients found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayClients.map((client) => {
            const firstName = client.profiles?.first_name || '';
            const lastName = client.profiles?.last_name || '';
            const sport = client.sports?.name || 'No sport';
            const role = client.profiles?.role || 'Athlete';
            const color = getColor(firstName);
            const progress = client.totalSessions > 0
              ? Math.round((client.completedSessions / client.totalSessions) * 100)
              : 0;

            return (
              <div key={client.user_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

                {/* Avatar + Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${color}`}>
                    {initials(firstName, lastName)}
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900">{firstName} {lastName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 font-medium">
                        {sport}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">{role}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Total Sessions</p>
                    <p className="text-xl font-bold text-gray-900">{client.totalSessions}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Upcoming</p>
                    <p className="text-xl font-bold text-gray-900">{client.upcomingSessions}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-gray-500">Sessions Progress</p>
                    <p className={`text-xs font-bold ${progress === 100 ? 'text-blue-600' : 'text-gray-400'}`}>
                      {progress}%
                    </p>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Recently active</span>
                  </div>
                  <p className="text-xs text-gray-400">Joined {formatDate(client.created_at)}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                    View Details
                  </button>
                  <button className="flex-1 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                    Message
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}