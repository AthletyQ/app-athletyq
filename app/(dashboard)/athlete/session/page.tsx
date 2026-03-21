// app/(dashboard)/athlete/sessions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getCoachProfile } from "@/services/api"; // reuse profile fetch shape
import AthleteVideoCall from "@/components/athlete/AthleteVideoCall";
import { joinSessionAsAthlete } from "@/services/api";
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

interface Session {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  sport_id: string;
  session_type: string;
  provider_id: string;
  location_details: string | null;
  coachName?: string;
  coachImage?: string;
}

export default function AthleteSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState<{
    roomUrl: string;
    session: Session;
  } | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [athleteId, setAthleteId] = useState<string>("");
  const [athleteName, setAthleteName] = useState<string>("");

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get athlete profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", user.id)
        .single();

      if (profile) {
        setAthleteId(profile.id);
        setAthleteName(`${profile.first_name} ${profile.last_name}`);
      }

      // Get athlete record
      const { data: athlete } = await supabase
        .from("athletes")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!athlete) return;

      // Fetch sessions
      const { data: sessionData } = await supabase
        .from("sessions")
        .select(
          `id, scheduled_at, duration_minutes, status, sport_id, session_type, provider_id, location_details,
           coaches!sessions_provider_id_fkey(
             profiles!coaches_user_id_fkey(first_name, last_name, profile_image_url)
           )`
        )
        .eq("athlete_id", athlete.id)
        .in("status", ["confirmed", "pending", "completed", "reschedule_requested"])
        .order("scheduled_at", { ascending: true });

      if (sessionData) {
        const mapped = sessionData.map((s: any) => ({
          ...s,
          coachName:
            s.coaches?.profiles
              ? `${s.coaches.profiles.first_name} ${s.coaches.profiles.last_name}`
              : "Coach",
          coachImage: s.coaches?.profiles?.profile_image_url ?? null,
        }));
        setSessions(mapped);
      }

      setLoading(false);
    }

    init();
  }, []);

  async function handleJoin(session: Session) {
    setJoiningId(session.id);
    try {
      const { roomUrl } = await joinSessionAsAthlete(session.id);
      setActiveCall({ roomUrl, session });
    } catch (err: any) {
      toast.error(err.message ?? "Could not join call. Try again shortly.");
    } finally {
      setJoiningId(null);
    }
  }

  function handleCallEnd() {
    setActiveCall(null);
    // Refresh sessions list
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeCall?.session.id ? { ...s, status: "completed" } : s
      )
    );
  }

  if (activeCall) {
    return (
      <AthleteVideoCall
        roomUrl={activeCall.roomUrl}
        session={activeCall.session}
        athleteId={athleteId}
        athleteName={athleteName}
        onEnd={handleCallEnd}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const now = new Date();
  const upcoming = sessions.filter(
    (s) =>
      s.status === "confirmed" && new Date(s.scheduled_at) > now
  );
  const joinable = sessions.filter((s) => {
    if (s.status !== "confirmed") return false;
    const start = new Date(s.scheduled_at);
    const diff = (start.getTime() - now.getTime()) / 60000; // minutes
    return diff <= 15 && diff >= -(s.duration_minutes + 5); // 15min early, 5min grace
  });
  const past = sessions.filter(
    (s) => s.status === "completed" || new Date(s.scheduled_at) < now
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>

      {/* Joinable now */}
      {joinable.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-3">
            Ready to Join
          </h2>
          <div className="space-y-3">
            {joinable.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onJoin={() => handleJoin(s)}
                joining={joiningId === s.id}
                highlight
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.filter((s) => !joinable.find((j) => j.id === s.id)).length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Upcoming
          </h2>
          <div className="space-y-3">
            {upcoming
              .filter((s) => !joinable.find((j) => j.id === s.id))
              .map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
          </div>
        </section>
      )}

      {/* Pending */}
      {sessions.filter((s) => s.status === "pending").length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider mb-3">
            Pending Confirmation
          </h2>
          <div className="space-y-3">
            {sessions
              .filter((s) => s.status === "pending")
              .map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Sub-component ────────────────────────────────────────────────────────────

function SessionCard({
  session,
  onJoin,
  joining,
  highlight,
}: {
  session: Session;
  onJoin?: () => void;
  joining?: boolean;
  highlight?: boolean;
}) {
  const date = new Date(session.scheduled_at);
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const statusColor: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    completed: "bg-gray-100 text-gray-600",
    reschedule_requested: "bg-orange-100 text-orange-700",
    cancelled: "bg-red-100 text-red-600",
  };

  return (
    <div
      className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${highlight
          ? "border-green-300 bg-green-50 shadow-sm"
          : "border-gray-200 bg-white"
        }`}
    >
      {/* Coach avatar */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0 overflow-hidden">
          {session.coachImage ? (
            <img src={session.coachImage} alt="" className="w-full h-full object-cover" />
          ) : (
            session.coachName?.[0] ?? "C"
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {session.coachName ?? "Coach"}
          </p>
          <p className="text-sm text-gray-500">
            {dateStr} · {timeStr} · {session.duration_minutes} min
          </p>
          <p className="text-xs text-gray-400 capitalize mt-0.5">
            {session.session_type?.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusColor[session.status] ?? "bg-gray-100 text-gray-600"
            }`}
        >
          {session.status.replace(/_/g, " ")}
        </span>

        {onJoin && (
          <button
            onClick={onJoin}
            disabled={joining}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {joining ? (
              <>
                <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                Joining…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M13 10a1 1 0 00-1-1H9V7l-3 3 3 3v-2h3a1 1 0 001-1z"
                  />
                </svg>
                Join Call
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
