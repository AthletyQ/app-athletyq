"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  User, Mail, Phone, Ruler, Weight, Target, Heart,
  Trophy, Calendar, Hash, ArrowLeft,
} from "lucide-react";

interface AthleteProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  profile_image_url: string | null;
  role: string;
  created_at: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  goals: string | null;
  injuries: string | null;
  sport_name: string | null;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function AthleteProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AthleteProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { router.push("/login"); return; }

      const [{ data: prof, error: profErr }, { data: ath }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("athletes")
          .select("age, height_cm, weight_kg, goals, injuries, sports(name)")
          .eq("user_id", user.id)
          .single(),
      ]);

      if (profErr || !prof) { setError("Failed to load profile."); setLoading(false); return; }

      setProfile({
        id: prof.id,
        first_name: prof.first_name,
        last_name: prof.last_name,
        email: prof.email,
        phone_number: prof.phone_number,
        profile_image_url: prof.profile_image_url,
        role: prof.role,
        created_at: prof.created_at,
        age: ath?.age ?? null,
        height_cm: ath?.height_cm ?? null,
        weight_kg: ath?.weight_kg ?? null,
        goals: ath?.goals ?? null,
        injuries: ath?.injuries ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sport_name: (ath as any)?.sports?.name ?? null,
      });
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!profile) return null;

  const fullName = `${profile.first_name} ${profile.last_name}`;
  const initials = `${profile.first_name[0] ?? ""}${profile.last_name[0] ?? ""}`.toUpperCase();
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
            {profile.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profile_image_url} alt={fullName} className="w-full h-full rounded-full object-cover" />
            ) : initials}
          </div>
          <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 capitalize">{fullName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 uppercase tracking-wide">
              Athlete
            </span>
            {profile.sport_name && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 uppercase tracking-wide">
                <Trophy className="w-3 h-3" /> {profile.sport_name}
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 bg-gray-900 text-white rounded-xl px-4 py-3 text-right hidden sm:block">
          <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Athlete ID</p>
          <p className="text-sm font-bold tracking-wider">{profile.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Personal Information</h2>
          <InfoRow icon={User} label="Full Name" value={fullName} />
          <InfoRow icon={Mail} label="Email" value={profile.email} />
          <InfoRow icon={Phone} label="Phone" value={profile.phone_number} />
          <InfoRow icon={Calendar} label="Member Since" value={memberSince} />
          <InfoRow icon={Hash} label="User ID" value={profile.id.slice(0, 8).toUpperCase()} />
        </div>

        {/* Athletic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Athletic Details</h2>
          <InfoRow icon={Trophy} label="Preferred Sport" value={profile.sport_name} />
          <InfoRow icon={Calendar} label="Age" value={profile.age ? `${profile.age} years` : null} />
          <InfoRow icon={Ruler} label="Height" value={profile.height_cm ? `${profile.height_cm} cm` : null} />
          <InfoRow icon={Weight} label="Weight" value={profile.weight_kg ? `${profile.weight_kg} kg` : null} />
          {!profile.sport_name && !profile.age && !profile.height_cm && !profile.weight_kg && (
            <p className="text-sm text-gray-400 text-center py-4">No athletic details added yet.</p>
          )}
        </div>

        {/* Goals */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" /> Goals
          </h2>
          {profile.goals ? (
            <p className="text-sm text-gray-700 leading-relaxed">{profile.goals}</p>
          ) : (
            <p className="text-sm text-gray-400">No goals added yet.</p>
          )}
        </div>

        {/* Injuries */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400" /> Injury History
          </h2>
          {profile.injuries ? (
            <p className="text-sm text-gray-700 leading-relaxed">{profile.injuries}</p>
          ) : (
            <p className="text-sm text-gray-400">No injury history recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
