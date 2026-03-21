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
      athlete_id,
      provider_id,
      provider_type,
      sport_id,
      session_type,
      scheduled_at,
      duration_minutes,
      timezone,
      status,
      price,
      currency,
      payment_status,
      location_type,
      location_details,
      athlete_notes,
      provider_notes,
      cancellation_reason,
      created_at,
      updated_at,
      confirmed_at,
      completed_at,
      cancelled_at,
      cancelled_by,
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
    .neq('status', 'cancelled')                        // ✅ exclude cancelled
    .gte('scheduled_at', new Date().toISOString())     // ✅ only upcoming
    .order('scheduled_at', { ascending: true })
    .limit(5)                                          // ✅ dashboard only needs 5

  if (error) {
    console.error('Dashboard sessions error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const COLORS = [
    'bg-blue-100 text-blue-700', 'bg-indigo-100 text-indigo-700',
    'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700',
    'bg-pink-100 text-pink-700',   'bg-green-100 text-green-700',
  ]

  const SPORT_COLORS: Record<string, string> = {
    Running:  'bg-blue-50 text-blue-600',
    Swimming: 'bg-cyan-50 text-cyan-600',
    Cycling:  'bg-orange-50 text-orange-600',
    Strength: 'bg-red-50 text-red-600',
    Yoga:     'bg-pink-50 text-pink-600',
    Tennis:   'bg-yellow-50 text-yellow-600',
  }

  const sessions = (data ?? []).map((s: any, i: number) => {
    const athlete   = Array.isArray(s.athletes) ? s.athletes[0] : s.athletes
    const profile   = Array.isArray(athlete?.profiles) ? athlete.profiles[0] : athlete?.profiles
    const sport     = Array.isArray(s.sports) ? s.sports[0] : s.sports

    const firstName = profile?.first_name ?? ''
    const lastName  = profile?.last_name  ?? ''
    const fullName  = `${firstName} ${lastName}`.trim() || 'Unknown Athlete'
    const sportName = sport?.name ?? 'General'
    const date      = new Date(s.scheduled_at)
    const isOnline  = s.location_type === 'online' || s.session_type === 'online'

    return {
      id:         s.id,
      client:     fullName,
      initials:   `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '??',
      color:      COLORS[i % COLORS.length],
      sport:      sportName,
      sportColor: SPORT_COLORS[sportName] ?? 'bg-gray-100 text-gray-600',
      mode:       isOnline ? 'Online' : 'In-person',
      location:   s.location_details ?? (isOnline ? 'Online Session' : 'In-person'),
      date:       date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time:       date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      duration:   `${s.duration_minutes ?? 0} min`,
      status:     (s.status ?? 'pending') as 'confirmed' | 'pending' | 'cancelled',
      price:      s.price,
      currency:   s.currency,
    }
  })

  return NextResponse.json(sessions)
}