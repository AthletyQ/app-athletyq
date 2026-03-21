import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const coachId    = searchParams.get('coachId')
  const athleteId  = searchParams.get('athleteId')
  const weekStartP = searchParams.get('weekStart')
  const weekEndP   = searchParams.get('weekEnd')

  if (!coachId && !athleteId)
    return NextResponse.json({ error: 'coachId or athleteId required' }, { status: 400 })

  // ── Week range ────────────────────────────────────────────────────────────
  let weekStart: Date
  let weekEnd: Date

  if (weekStartP && weekEndP) {
    weekStart = new Date(weekStartP)
    weekEnd   = new Date(weekEndP)
  } else {
    const now       = new Date()
    const dayOfWeek = now.getUTCDay()
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

    weekStart = new Date(now)
    weekStart.setUTCDate(now.getUTCDate() + diffToMon)
    weekStart.setUTCHours(0, 0, 0, 0)

    weekEnd = new Date(weekStart)
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6)
    weekEnd.setUTCHours(23, 59, 59, 999)
  }

  let query = supabase
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
    .in('status', ['pending', 'confirmed', 'completed', 'reschedule_requested'])
    .gte('scheduled_at', weekStart.toISOString())
    .lte('scheduled_at', weekEnd.toISOString())
    .order('scheduled_at', { ascending: true })

  if (coachId)   query = query.eq('provider_id', coachId)
  if (athleteId) query = query.eq('athlete_id',  athleteId)

  const { data, error } = await query

  if (error) {
    console.error('Sessions error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const AVATAR_COLORS = [
    'bg-blue-100 text-blue-600',
    'bg-purple-100 text-purple-600',
    'bg-green-100 text-green-600',
    'bg-amber-100 text-amber-600',
    'bg-pink-100 text-pink-600',
    'bg-indigo-100 text-indigo-600',
  ]
  const SPORT_COLORS = [
    'bg-blue-50 text-blue-600',
    'bg-purple-50 text-purple-600',
    'bg-green-50 text-green-600',
    'bg-amber-50 text-amber-600',
    'bg-pink-50 text-pink-600',
    'bg-teal-50 text-teal-600',
  ]

  const TZ = 'Asia/Colombo'   // ✅ UTC+5:30 — all display times in SL time

  const sessions = (data ?? []).map((s: any) => {
    const athlete   = Array.isArray(s.athletes) ? s.athletes[0] : s.athletes
    const profile   = Array.isArray(athlete?.profiles) ? athlete.profiles[0] : athlete?.profiles
    const sport     = Array.isArray(s.sports) ? s.sports[0] : s.sports

    const firstName = profile?.first_name ?? ''
    const lastName  = profile?.last_name  ?? ''
    const fullName  = `${firstName} ${lastName}`.trim() || 'Unknown Athlete'
    const inits     = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?'
    const colorIdx  = (athlete?.user_id ?? s.athlete_id ?? '').charCodeAt(0) % AVATAR_COLORS.length
    const sportIdx  = (sport?.name ?? '').charCodeAt(0) % SPORT_COLORS.length

    const date     = new Date(s.scheduled_at)
    const isOnline = s.location_type === 'online' || s.session_type === 'online'

    // ✅ dateKey: use SL local date (not UTC date) so day boundaries match SL midnight
    const slDateStr = date.toLocaleDateString('en-CA', { timeZone: TZ }) // "YYYY-MM-DD"
    const dateKey   = slDateStr

    // ✅ Display date + time both in SL timezone
    const formattedDate = date.toLocaleDateString('en-US', {
      timeZone: TZ,
      weekday: 'short', month: 'short', day: 'numeric',
    })
    const formattedTime = date.toLocaleTimeString('en-US', {
      timeZone: TZ,
      hour: 'numeric', minute: '2-digit',
    })

    return {
      id:         s.id,
      client:     fullName,
      initials:   inits,
      color:      AVATAR_COLORS[colorIdx],
      sport:      sport?.name ?? 'General',
      sportColor: SPORT_COLORS[sportIdx],
      mode:       isOnline ? 'Online' : 'In-person',
      location:   s.location_details ?? (isOnline ? 'Online Session' : 'In-person'),
      dateKey,            // ✅ SL-local date e.g. "2026-03-23"
      date:       formattedDate,
      time:       formattedTime,  // ✅ SL time e.g. "8:00 AM" not "2:30 AM"
      duration:   `${s.duration_minutes ?? 60} min`,
      status:     s.status ?? 'pending',
    }
  })

  return NextResponse.json(sessions)
}