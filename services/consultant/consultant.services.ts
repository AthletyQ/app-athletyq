import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

export async function getTotalAthletes() {
  const { count, error } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true });

  if (error) throw new Error(error.message);
  return count || 0;
}