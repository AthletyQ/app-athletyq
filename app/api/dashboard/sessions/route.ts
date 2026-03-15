import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const coachId = searchParams.get('coachId')
  if (!coachId) return NextResponse.json({ error: 'coachId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      scheduled_at,
      duration_minutes,
      session_type,
      location_type,
      location_details,
      status,
      athlete_id,
      sport_id,
      athletes!sessions_athlete_id_fkey (
        user_id,
        profiles!athletes_user_id_fkey (
          first_name,
          last_name
        )
      ),
      sports (
        name
      )
    `)
    .eq('provider_id', coachId)
    .eq('status', 'confirmed')                        // ✅ confirmed only
    .gte('scheduled_at', new Date().toISOString())    // ✅ upcoming only
    .order('scheduled_at', { ascending: true })
    .limit(5)

  if (error) {
    console.error('Dashboard sessions error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const sessions = (data ?? []).map((s: any) => {
    const athlete   = Array.isArray(s.athletes) ? s.athletes[0] : s.athletes
    const profile   = Array.isArray(athlete?.profiles) ? athlete.profiles[0] : athlete?.profiles
    const sport     = Array.isArray(s.sports) ? s.sports[0] : s.sports

    console.log('athlete join:', JSON.stringify(s.athletes, null, 2))

    const firstName = profile?.first_name ?? ''
    const lastName  = profile?.last_name  ?? ''
    const date      = new Date(s.scheduled_at)
    const isOnline  = s.location_type === 'online' || s.session_type === 'online'

    return {
      id:       s.id,
      client:   `${firstName} ${lastName}`.trim() || 'Unknown Athlete', // ✅ was 'name'
      sport:    sport?.name ?? 'General',                                // ✅ was 'type'
      mode:     isOnline ? 'Online' : 'In-person',
      time:     date.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }),
      duration: `${s.duration_minutes ?? 0} min`,
      location: s.location_details ?? (isOnline ? 'Online Session' : 'In-person'),
      status:   s.status ?? 'confirmed',
    }
  })

  return NextResponse.json(sessions)
}