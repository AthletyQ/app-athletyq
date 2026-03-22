"use client";

import { useState, useEffect } from "react";
import type { AthleteProfile } from "@/types/database.types";
import { supabase } from "@/lib/supabase/client";

interface UseAthleteProfileReturn {
  profile: AthleteProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}


export function useAthleteProfile(): UseAthleteProfileReturn {
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Not authenticated");
        return;
      }

    
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        setError(profileError?.message ?? "Profile not found");
        return;
      }

   
      const { data: athleteData, error: athleteError } = await supabase
        .from("athletes")
        .select(
          `
          user_id,
          age,
          height_cm,
          weight_kg,
          preferred_sport_id,
          goals,
          injuries,
          created_at,
          sport:sports(id, name, description, icon_url, created_at)
          `
        )
        .eq("user_id", user.id)
        .single();

     
      const merged: AthleteProfile = {
        
        id: profileData.id,
        email: profileData.email,
        role: profileData.role,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone_number: profileData.phone_number,
        profile_image_url: profileData.profile_image_url,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
        
        age: athleteData?.age ?? null,
        height_cm: athleteData?.height_cm ?? null,
        weight_kg: athleteData?.weight_kg ?? null,
        preferred_sport_id: athleteData?.preferred_sport_id ?? null,
        goals: athleteData?.goals ?? null,
        injuries: athleteData?.injuries ?? null,
        
        sport: athleteData?.sport
          ? Array.isArray(athleteData.sport)
            ? athleteData.sport[0] ?? null
            : athleteData.sport
          : null,
      };

      setProfile(merged);
    } catch (err) {
      setError("Unexpected error loading profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return { profile, loading, error, refetch: fetchProfile };
}