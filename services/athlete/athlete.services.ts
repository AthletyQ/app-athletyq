import { supabaseAdmin } from "@/lib/supabase/admin";
import { AthleteProfile, ServiceResponse } from "@/types/database.types";
import { createClient } from "@supabase/supabase-js";

export async function getAthleteProfile(): Promise<ServiceResponse<AthleteProfile>> {
    try {
        const {
           data: { user },
           error: authError,
       } = await supabaseAdmin.auth.getUser();

        if (authError || !user) {
          return { data: null, error: "Not authenticated" };
        }

        // Step 2: Fetch profile row
       const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

       if (profileError || !profile) {
           return { data: null, error: profileError?.message ?? "Profile not found" };
        }

        const { data: athlete, error: athleteError } = await supabaseAdmin
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

      if (athleteError) {
      // athlete row might not exist yet (onboarding incomplete) — return profile only
      return {
        data: {
          ...profile,
          age: null,
          height_cm: null,
          weight_kg: null,
          preferred_sport_id: null,
          goals: null,
          injuries: null,
          sport: null,
        } as AthleteProfile,
        error: null,
        };
      }

      // Step 4: Merge into AthleteProfile
    const athleteProfile: AthleteProfile = {
      // profile fields
      id: profile.id,
      email: profile.email,
      role: profile.role,
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone_number: profile.phone_number,
      profile_image_url: profile.profile_image_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      // athlete fields
      age: athlete.age,
      height_cm: athlete.height_cm,
      weight_kg: athlete.weight_kg,
      preferred_sport_id: athlete.preferred_sport_id,
      goals: athlete.goals,
      injuries: athlete.injuries,
      // sport (joined — can be null if no preferred sport set)
      sport: Array.isArray(athlete.sport) ? athlete.sport[0] ?? null : athlete.sport ?? null,
    };

    return { data: athleteProfile, error: null };

    }
    catch (err) {
        return { data: null, error: "Unexpected error fetching athlete profile" };
    }
    
}