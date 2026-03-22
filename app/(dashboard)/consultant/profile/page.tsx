"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  User, Mail, Phone, BookOpen, DollarSign,
  Calendar, Hash, Award, CheckCircle, Stethoscope, ArrowLeft,
} from "lucide-react";

interface ConsultantProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  profile_image_url: string | null;
  role: string;
  created_at: string;
  bio: string | null;
  specialty: string | null;
  hourly_rate: number | null;
  certifications: string[] | null;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-purple-600" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function ConsultantProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ConsultantProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { router.push("/login"); return; }

      const [{ data: prof, error: profErr }, { data: wp }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("wellness_professionals")
          .select("bio, specialty, hourly_rate, certifications")
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
        bio: wp?.bio ?? null,
        specialty: wp?.specialty ?? null,
        hourly_rate: wp?.hourly_rate ?? null,
        certifications: wp?.certifications ?? null,
      });
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
      
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center text-2xl font-bold text-purple-600">
            {profile.profile_image_url ? (
              
              <img src={profile.profile_image_url} alt={fullName} className="w-full h-full rounded-full object-cover" />
            ) : initials}
          </div>
          <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 capitalize">{fullName}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 uppercase tracking-wide">
              Wellness Professional
            </span>
            {profile.specialty && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 uppercase tracking-wide">
                <Stethoscope className="w-3 h-3" /> {profile.specialty}
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 bg-gray-900 text-white rounded-xl px-4 py-3 text-right hidden sm:block">
          <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Consultant ID</p>
          <p className="text-sm font-bold tracking-wider">{profile.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Personal Information</h2>
          <InfoRow icon={User} label="Full Name" value={fullName} />
          <InfoRow icon={Mail} label="Email" value={profile.email} />
          <InfoRow icon={Phone} label="Phone" value={profile.phone_number} />
          <InfoRow icon={Calendar} label="Member Since" value={memberSince} />
          <InfoRow icon={Hash} label="Consultant ID" value={profile.id.slice(0, 8).toUpperCase()} />
        </div>

        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Professional Details</h2>
          <InfoRow icon={Stethoscope} label="Specialty" value={profile.specialty} />
          <InfoRow icon={BookOpen} label="Focus Area" value={profile.specialty} />
          <InfoRow icon={DollarSign} label="Hourly Rate" value={profile.hourly_rate ? `$${profile.hourly_rate} / hr` : null} />
          {!profile.specialty && !profile.hourly_rate && (
            <p className="text-sm text-gray-400 text-center py-4">No professional details added yet.</p>
          )}
        </div>

      
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-purple-500" /> Bio
          </h2>
          {profile.bio ? (
            <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
          ) : (
            <p className="text-sm text-gray-400">No bio added yet.</p>
          )}
        </div>

        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" /> Certifications
          </h2>
          {profile.certifications && profile.certifications.length > 0 ? (
            <ul className="space-y-2">
              {profile.certifications.map((cert, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {cert}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No certifications listed.</p>
          )}
        </div>
      </div>
    </div>
  );
}
