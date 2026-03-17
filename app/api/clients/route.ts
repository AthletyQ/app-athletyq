import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const coachId = searchParams.get('coachId')
  const status  = searchParams.get('status') ?? 'active'
  if (!coachId) return NextResponse.json({ error: 'coachId required' }, { status: 400 })

  const COLORS = [
    'bg-blue-100 text-blue-700', 'bg-indigo-100 text-indigo-700',
    'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',    'bg-green-100 text-green-700',
  ]

  // ✅ fetch ALL sessions for this coach (all statuses)
  const { data: allSessions, error } = await supabase
    .from('sessions')
    .select(`
      id,
      athlete_id,
      status,
      scheduled_at,
      athletes!sessions_athlete_id_fkey (
        user_id,
        profiles!athletes_user_id_fkey (
          first_name,
          last_name,
          profile_image_url,
          created_at
        )
      ),
      sports ( name )
    `)
    .eq('provider_id', coachId)
    .order('scheduled_at', { ascending: false })

  if (error) {
    console.error('Clients error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ✅ group all sessions by athlete
  const athleteMap = new Map<string, {
    sessions: any[]
    profile:  any
    sport:    any
    joined:   string
  }>()

  ;(allSessions ?? []).forEach((row: any) => {
    const athleteId = row.athlete_id
    const athlete   = Array.isArray(row.athletes) ? row.athletes[0] : row.athletes
    const profile   = Array.isArray(athlete?.profiles) ? athlete.profiles[0] : athlete?.profiles
    const sport     = Array.isArray(row.sports) ? row.sports[0] : row.sports

    if (!athleteMap.has(athleteId)) {
      athleteMap.set(athleteId, {
        sessions: [],
        profile,
        sport,
        joined: profile?.created_at
          ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : '—',
      })
    }
    athleteMap.get(athleteId)!.sessions.push(row)
  })

  // ✅ classify athletes:
  // active  = has at least one confirmed session
  // pending = has NO confirmed sessions (only pending/reschedule_requested)
  const clients: any[] = []
  let colorIndex = 0

  athleteMap.forEach((data, athleteId) => {
    const { sessions, profile, sport, joined } = data

    const hasConfirmed = sessions.some(s =>
      s.status === 'confirmed' || s.status === 'reschedule_requested' || s.status === 'completed'
    )
    const onlyPending  = sessions.every(s =>
      s.status === 'pending' || s.status === 'cancelled'
    )

    const isActive  = hasConfirmed
    const isPending = !hasConfirmed && sessions.some(s => s.status === 'pending')

    // filter based on requested tab
    if (status === 'active'  && !isActive)  return
    if (status === 'pending' && !isPending) return

    const firstName = profile?.first_name ?? ''
    const lastName  = profile?.last_name  ?? ''

    const totalSessions = sessions.filter(s =>
      s.status === 'confirmed' || s.status === 'completed' || s.status === 'reschedule_requested'
    ).length

    const upcoming = sessions.filter(s =>
      (s.status === 'confirmed' || s.status === 'reschedule_requested') &&
      new Date(s.scheduled_at) > new Date()
    ).length

    const pendingCount = sessions.filter(s => s.status === 'pending').length

    clients.push({
      id:              athleteId,
      initials:        `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '??',
      name:            `${firstName} ${lastName}`.trim() || 'Unknown Athlete',
      sport:           sport?.name ?? 'General',
      level:           'Athlete',
      profileImageUrl: profile?.profile_image_url ?? null,
      totalSessions,
      upcoming,
      pendingCount,
      progress:        totalSessions > 0
        ? Math.min(Math.round((upcoming / totalSessions) * 100), 100)
        : 0,
      lastActive:      status === 'pending' ? 'Requested recently' : 'Recently active',
      joined,
      color: COLORS[colorIndex++ % COLORS.length],
    })
    const completedSessions = sessions.filter(s => s.status === 'completed').length

    clients.push({
          
        totalSessions,
        upcoming,
        completedSessions,
        progress: totalSessions > 0
          ? Math.min(Math.round((completedSessions / totalSessions) * 100), 100)
          : 0,
          
})
  })

  return NextResponse.json(clients)
}