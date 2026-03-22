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
        bio,
        years_of_experience,
        rating
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

export async function getConsultants(params?: {
  search?:    string;
  specialty?: string;
  minPrice?:  number;
  maxPrice?:  number;
}) {

  let query = supabase
    .from("consultants")
    .select("user_id, specialty, bio, hourly_rate, certifications, rating, years_of_experience", { count: "exact" });
 
  if (params?.specialty)              query = query.ilike("specialty",  `%${params.specialty}%`);
  if (params?.minPrice !== undefined) query = query.gte("hourly_rate", params.minPrice);
  if (params?.maxPrice !== undefined) query = query.lte("hourly_rate", params.maxPrice);
 
  const { data: consultantRows, error: consultantError, count } = await query
    .order("created_at", { ascending: false });
 
  if (consultantError) throw new Error(consultantError.message);
  if (!consultantRows || consultantRows.length === 0) {
    return { consultants: [], total: 0 };
  }

  const userIds = consultantRows.map((r) => r.user_id);
 
  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, profile_image_url")
    .in("id", userIds);
 
  if (profileError) throw new Error(profileError.message);
 

  const { data: sessionCounts, error: sessionCountsError } = await supabase
    .from("sessions")
    .select("provider_id")
    .eq("provider_type", "consultant")
    .in("provider_id", userIds);

  if (sessionCountsError) throw new Error(sessionCountsError.message);

  const sessionCountMap = new Map();
  sessionCounts?.forEach(s => {
    sessionCountMap.set(s.provider_id, (sessionCountMap.get(s.provider_id) || 0) + 1);
  });
 
  const profileMap = new Map(
    (profileRows || []).map((p) => [p.id, p])
  );
 
  let consultants = consultantRows.map((row: any) => {
    const profile   = profileMap.get(row.user_id);
    const firstName = profile?.first_name ?? "";
    const lastName  = profile?.last_name  ?? "";
 
    return {
      id:             row.user_id,
      firstName,
      lastName,
      initials:       `${firstName[0] ?? "?"}${lastName[0] ?? ""}`.toUpperCase(),
      avatarUrl:      profile?.profile_image_url ?? null,
      specialty:      row.specialty    ?? "",
      bio:            row.bio          ?? null,
      hourlyRate:     row.hourly_rate  !== null ? Number(row.hourly_rate) : null,
      certifications: row.certifications ?? [],
      rating:         row.rating !== null ? Number(row.rating) : 0,
      yearsOfExperience: row.years_of_experience,
      totalSessions:  sessionCountMap.get(row.user_id) || 0,
    };
  });
 
  if (params?.search) {
    const q = params.search.toLowerCase();
    consultants = consultants.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q)  ||
        c.specialty.toLowerCase().includes(q),
    );
  }
 
  return { consultants, total: count ?? consultants.length };
}
 
export async function getConsultantAvailability(
  consultantId: string,
  date: Date,
  sessionType: "online" | "in_person" | null,
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
 
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
 
  let query = supabase
    .from("sessions")
    .select("scheduled_at, status, duration_minutes")
    .eq("provider_id",   consultantId)
    .eq("provider_type", "consultant")
    .gte("scheduled_at", startOfDay.toISOString())
    .lte("scheduled_at", endOfDay.toISOString())
    .in("status", ["pending", "confirmed", "completed"]);
 
  if (sessionType) query = query.eq("location_type", sessionType);
 
  const { data, error } = await query;
  if (error) throw new Error(error.message);
 
  const bookedSlotsSet = new Set<string>();
  (data || []).forEach((s) => {
    const startTime = new Date(s.scheduled_at);
    const duration = s.duration_minutes || 30;
    
    let current = new Date(startTime);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    while (current < endTime) {
      const slotStr = `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`;
      bookedSlotsSet.add(slotStr);
      current.setMinutes(current.getMinutes() + 30);
    }
  });
 
  const allPossibleSlots: string[] = [];
  let currentHour = 8;
  let currentMinute = 0;

  while (currentHour < 20 || (currentHour === 20 && currentMinute <= 30)) {
    allPossibleSlots.push(
      `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
    );
    currentMinute += 30;
    if (currentMinute >= 60) {
      currentHour++;
      currentMinute = 0;
    }
  }


  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    allPossibleSlots.forEach(slot => {
      const [h, m] = slot.split(':').map(Number);
      const slotTime = new Date(date);
      slotTime.setHours(h, m, 0, 0);
      if (slotTime < now) {
        bookedSlotsSet.add(slot);
      }
    });
  }
 
  return { 
    availableSlots: allPossibleSlots.sort(), 
    bookedSlots: Array.from(bookedSlotsSet) 
  };
}
 
export async function bookConsultantSessions(
  sessions: Record<string, unknown>[],
) {
  const { error } = await supabase.from("sessions").insert(sessions);
  if (error) throw new Error(error.message);
}

export async function getConsultantClients(consultantId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      status,
      scheduled_at,
      athletes (
        user_id,
        age,
        created_at,
        sports ( name ),
        profiles ( first_name, last_name, role )
      )
    `)
    .eq('provider_id', consultantId)
    .eq('provider_type', 'consultant');

  if (error) throw new Error(error.message);

  const clientMap = new Map();

  (data || []).forEach((s: any) => {
    const athlete = s.athletes;
    if (!athlete) return;

    const id = athlete.user_id;
    if (!clientMap.has(id)) {
      clientMap.set(id, {
        ...athlete,
        totalSessions: 0,
        upcomingSessions: 0,
        completedSessions: 0,
        pendingSessions: 0,
      });
    }

    const client = clientMap.get(id);
    client.totalSessions += 1;
    if (s.status === 'pending') {
      client.pendingSessions += 1;
    }
    if (new Date(s.scheduled_at) > new Date() && s.status === 'confirmed') {
      client.upcomingSessions += 1;
    }
    if (s.status === 'completed') {
      client.completedSessions += 1;
    }
  });

  return Array.from(clientMap.values());
}

export async function updateConsultantSession(sessionId: string, action: 'approve' | 'cancel' | 'reschedule') {
  if (action === 'approve') {
    const { data, error } = await supabase
      .from('sessions')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  if (action === 'cancel') {
    const { data, error } = await supabase
      .from('sessions')
      .update({ 
        status: 'cancelled', 
        cancelled_at: new Date().toISOString() 
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  if (action === 'reschedule') {
    return { id: sessionId, action: 'reschedule' };
  }
}

export async function getSessionsThisWeek(consultantId: string) {
  const monday = new Date();
  monday.setDate(monday.getDate() - (monday.getDay() === 0 ? 6 : monday.getDay() - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const { count, error } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', consultantId)
    .eq('provider_type', 'consultant')
    .gte('scheduled_at', monday.toISOString())
    .lte('scheduled_at', sunday.toISOString());

  if (error) throw new Error(error.message);
  return count || 0;
}