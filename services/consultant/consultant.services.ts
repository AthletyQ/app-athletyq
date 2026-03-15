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

export async function getUpcomingSessions(consultantId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      scheduled_at,
      duration_minutes,
      location_type,
      status,
      athletes (
        user_id,
        sports ( name ),
        profiles ( first_name, last_name )
      )
    `)
    .eq('provider_id', consultantId)
    .eq('provider_type', 'consultant')
    .eq('status', 'confirmed')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(3);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getNewMessages(consultantId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      last_message,
      last_message_at,
      unread_count,
      athlete:profiles!conversations_athlete_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq('contact_id', consultantId)
    .gt('unread_count', 0)
    .order('last_message_at', { ascending: false })
    .limit(3);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getConsultantProfile(consultantId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      email,
      role,
      consultants (
        specialty,
        hourly_rate,
        bio
      )
    `)
    .eq('id', consultantId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getEarningsSummary(consultantId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('payments')
    .select('amount')
    .eq('provider_id', consultantId)
    .eq('status', 'succeeded')
    .gte('created_at', startOfMonth.toISOString());

  if (error) throw new Error(error.message);

  const total = (data || []).reduce((sum, p) => sum + Number(p.amount), 0);
  return total;
}

export async function getAthleteActivity(consultantId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      completed_at,
      athletes (
        profiles ( first_name, last_name )
      )
    `)
    .eq('provider_id', consultantId)
    .eq('provider_type', 'consultant')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(3);

  if (error) throw new Error(error.message);
  return data || [];
}