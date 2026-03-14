import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export async function getAthletes() {
  const { data, error } = await supabase
    .from('athletes')
    .select(`
      user_id, age, height_cm, weight_kg,
      preferred_sport_id, goals, injuries, created_at,
      sports ( id, name )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getTotalAthletes(consultantId: string) {
  const { count, error } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', consultantId)
    .eq('provider_type', 'consultant');

  if (error) throw new Error(error.message);
  return count || 0;
}

export async function getConsultantSessions(consultantId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      scheduled_at,
      duration_minutes,
      status,
      price,
      location_type,
      location_details,
      athletes (
        user_id,
        profiles ( first_name, last_name )
      )
    `)
    .eq('provider_id', consultantId)
    .eq('provider_type', 'consultant')
    .order('scheduled_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getSessionStats(consultantId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, status, scheduled_at')
    .eq('provider_id', consultantId)
    .eq('provider_type', 'consultant');

  if (error) throw new Error(error.message);

  const sessions = data || [];

  return {
    total: sessions.length,
    confirmed: sessions.filter(s => s.status === 'confirmed').length,
    pending: sessions.filter(s => s.status === 'pending').length,
    sessionDates: sessions.map(s => s.scheduled_at), // ← for calendar dots
  };
}