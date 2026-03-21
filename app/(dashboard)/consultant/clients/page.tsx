'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, CheckCircle, XCircle, MessageSquare, Loader2 } from 'lucide-react';
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
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function ClientCard({ client, pending = false, consultantUserId, onAccept, onDecline }: {
  client:            any;
  pending?:          boolean;
  consultantUserId:  string;
  onAccept?:         (id: string) => void;
  onDecline?:        (id: string) => void;
}) {
  const router = useRouter();
  const [messaging, setMessaging] = useState(false);
  const [msgError,  setMsgError]  = useState<string | null>(null);

  const firstName         = client.profiles?.first_name || '';
  const lastName          = client.profiles?.last_name  || '';
  const sport             = client.sports?.name         || 'No sport';
  const role              = client.profiles?.role       || 'Athlete';
  const color             = getColor(firstName);
  const completedSessions = client.completedSessions    ?? 0;
  const totalSessions     = client.totalSessions        ?? 0;
  const progressPct       = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  async function handleMessage() {
    setMsgError(null);

    if (!consultantUserId) {
      setMsgError('Consultant session not loaded yet.');
      return;
    }
    if (!client.user_id) {
      setMsgError('Athlete ID missing.');
      return;
    }

    setMessaging(true);
    try {
      const res = await fetch('/api/messages/conversations/find-or-create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          coachUserId:   consultantUserId,
          athleteUserId: client.user_id,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        setMsgError(`Server error ${res.status}`);
        return;
      }

      let data: any;
      try { data = JSON.parse(text); } catch {
        setMsgError('Unexpected response from server');
        return;
      }

      if (!data.conversationId) {
        setMsgError('No conversation ID returned');
        return;
      }

      router.push(`/consultant/chats?conversationId=${data.conversationId}`);
    } catch (err: any) {
      setMsgError('Network error — check console');
    } finally {
      setMessaging(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">

      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${color}`}>
          {initials(firstName, lastName)}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{firstName} {lastName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600">
              {sport}
            </span>
            <span className="text-xs text-gray-400 capitalize">{role}</span>
          </div>
        </div>
      </div>

      {!pending && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Total</p>
              <p className="text-lg font-bold text-gray-900">{totalSessions}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Upcoming</p>
              <p className="text-lg font-bold text-blue-600">{client.upcomingSessions ?? 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Completed</p>
              <p className="text-lg font-bold text-green-600">{completedSessions}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-500">Session Progress</p>
              <p className="text-xs font-semibold text-blue-600">{progressPct}%</p>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {completedSessions} of {totalSessions} sessions completed
            </p>
          </div>
        </>
      )}

      {pending && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
          <p className="text-xs text-amber-700 font-medium">Awaiting your confirmation</p>
          <p className="text-xs text-amber-500 mt-0.5">
            {totalSessions} session{totalSessions !== 1 ? 's' : ''} requested
          </p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> Recently active
        </span>
        <span>Joined {formatDate(client.created_at)}</span>
      </div>

      {msgError && (
        <p className="text-xs text-red-500 text-center">{msgError}</p>
      )}

      <div className="flex gap-2">
        {pending ? (
          <>
            <button
              onClick={() => onAccept?.(client.user_id)}
              className="flex-1 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Accept
            </button>
            <button
              onClick={() => onDecline?.(client.user_id)}
              className="flex-1 py-2 border border-red-200 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-50 flex items-center justify-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" /> Decline
            </button>
          </>
        ) : (
          <>
            <button className="flex-1 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
              View Details
            </button>
            <button
              onClick={handleMessage}
              disabled={messaging}
              className="flex-1 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1 disabled:opacity-60"
            >
              {messaging
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <><MessageSquare className="w-3.5 h-3.5" /> Message</>
              }
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients,          setClients]          = useState<any[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [consultantId,     setConsultantId]     = useState<string | null>(null);
  const [consultantUserId, setConsultantUserId] = useState<string>('');
  const [search,           setSearch]           = useState('');
  const [activeTab,        setActiveTab]        = useState<'active' | 'pending'>('active');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setConsultantId(data.user.id);
        setConsultantUserId(data.user.id);
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

  const activeClients  = clients.filter((c) => c.completedSessions > 0 || c.upcomingSessions > 0);
  const pendingClients = clients.filter((c) => c.pendingSessions > 0 && c.completedSessions === 0 && c.upcomingSessions === 0);

  const displayClients = (activeTab === 'active' ? activeClients : pendingClients).filter((c) => {
    const name  = `${c.profiles?.first_name} ${c.profiles?.last_name}`.toLowerCase();
    const sport = c.sports?.name?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || sport.includes(search.toLowerCase());
  });

  function handleAccept(userId: string) {
    setClients((prev) => prev.map((c) =>
      c.user_id === userId ? { ...c, pendingSessions: 0, upcomingSessions: 1 } : c
    ));
  }

  function handleDecline(userId: string) {
    setClients((prev) => prev.filter((c) => c.user_id !== userId));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <main className="flex-1 p-6">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your athletes and view their progress.</p>
        </div>

        <div className="flex gap-6 border-b border-gray-200 mb-5">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'active' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            Active Clients ({activeClients.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'pending' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            Pending Clients ({pendingClients.length})
          </button>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients by name or sport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {displayClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-sm font-medium text-gray-400">No {activeTab} clients found</p>
            <p className="text-xs text-gray-300 mt-1">
              {activeTab === 'pending' ? 'New session requests will appear here' : 'Confirmed clients will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {displayClients.map((client) => (
              <ClientCard
                key={client.user_id}
                client={client}
                pending={activeTab === 'pending'}
                consultantUserId={consultantUserId}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))}
          </div>
        )}

      </main>
    </div>
  );
}