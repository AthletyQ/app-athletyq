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

export async function getTotalAthletes(consultantId: string) {
  const { count, error } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', consultantId)
    .eq('provider_type', 'consultant');

  if (error) throw new Error(error.message);
  return count || 0;
}