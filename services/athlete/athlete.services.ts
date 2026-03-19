
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { AthleteProfile, ServiceResponse } from "@/types/database.types";
import { createClient } from "@supabase/supabase-js";

/**
 * Ensures an entry exists in the 'athletes' table for the specified user ID.
 * Uses the admin client to bypass RLS, allowing Coaches and Consultants to also have 
 * an athlete record required for booking sessions.
 */
export async function ensureAthleteProfile(userId: string): Promise<ServiceResponse<void>> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // 0. Ensure profile exists first (Foreign Key requirement)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, first_name, last_name, email")
      .eq("id", userId)
      .single();

    if (profileError) {
      // If profile doesn't exist, we must create it from auth metadata
      const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authError || !user) return { data: null, error: "User not found in auth" };

      const meta = user.user_metadata || {};
      const { error: insertProfileError } = await supabaseAdmin.from("profiles").insert({
        id: userId,
        email: user.email,
        role: meta.role || 'athlete',
        first_name: meta.firstName || 'User',
        last_name: meta.lastName || '',
      });

      if (insertProfileError) return { data: null, error: insertProfileError.message };
    }

    // 1. Check if athlete record already exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("athletes")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    if (checkError && checkError.code === "PGRST116") { // PGRST116 = no rows returned
      // Create a basic athlete entry
      const { error: insertError } = await supabaseAdmin
        .from("athletes")
        .insert({ user_id: userId });

      if (insertError) {
        console.error("Failed to auto-initialize athlete profile:", insertError);
        return { data: null, error: insertError.message };
      }
    } else if (checkError) {
      return { data: null, error: checkError.message };
    }

    return { data: null, error: null };
  } catch (err) {
    console.error("Unexpected error in ensureAthleteProfile:", err);
    return { data: null, error: "Unexpected error" };
  }
}

export async function getAthleteProfile(): Promise<ServiceResponse<AthleteProfile>> {
    try {

        const supabaseAdmin = getSupabaseAdmin();

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