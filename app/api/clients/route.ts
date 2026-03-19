import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-indigo-100 text-indigo-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-green-100 text-green-700',
]

// ─── GET /api/clients?coachId=...&status=active|pending ───────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const coachId = searchParams.get('coachId')
  const status  = searchParams.get('status') ?? 'active'

  if (!coachId) return NextResponse.json({ error: 'coachId required' }, { status: 400 })

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

  // ─── Group all sessions by athlete ────────────────────────────────────────

  const athleteMap = new Map<string, {
    sessions: any[]
    profile:  any
    sport:    any
    joined:   string
  }>()

  ;(allSessions ?? []).forEach((row: any) => {
    const athleteId = row.athlete_id
    const athlete   = Array.isArray(row.athletes)          ? row.athletes[0]         : row.athletes
    const profile   = Array.isArray(athlete?.profiles)     ? athlete.profiles[0]     : athlete?.profiles
    const sport     = Array.isArray(row.sports)            ? row.sports[0]           : row.sports

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

  // ─── Build client list ────────────────────────────────────────────────────

  const clients: any[] = []
  let colorIndex = 0

  athleteMap.forEach((data, athleteId) => {
    const { sessions, profile, sport, joined } = data

    // Determine whether this athlete belongs in active or pending tab
    const hasConfirmed = sessions.some(s =>
      s.status === 'confirmed' ||
      s.status === 'reschedule_requested' ||
      s.status === 'completed'
    )
    const isPending = !hasConfirmed && sessions.some(s => s.status === 'pending')

    if (status === 'active'  && !hasConfirmed) return
    if (status === 'pending' && !isPending)    return

    const firstName = profile?.first_name ?? ''
    const lastName  = profile?.last_name  ?? ''
    const now       = new Date()

    // ✅ total = confirmed + completed + reschedule_requested (excludes pending/cancelled)
    const totalSessions = sessions.filter(s =>
      s.status === 'confirmed' ||
      s.status === 'completed' ||
      s.status === 'reschedule_requested'
    ).length

    // ✅ upcoming = confirmed future sessions ONLY (not reschedule_requested, not past)
    const upcoming = sessions.filter(s =>
      s.status === 'confirmed' &&
      new Date(s.scheduled_at) > now
    ).length

    // ✅ completed = ONLY sessions explicitly marked 'completed' in the DB
    //    confirmed sessions (past or future) are NOT counted as completed
    const completedSessions = sessions.filter(s =>
      s.status === 'completed'
    ).length

    // ✅ progress = completed / total — confirmed sessions do NOT contribute
    const progress = totalSessions > 0
      ? Math.min(Math.round((completedSessions / totalSessions) * 100), 100)
      : 0

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
      completedSessions,
      pendingCount,
      progress,
      lastActive:      status === 'pending' ? 'Requested recently' : 'Recently active',
      joined,
      color:           COLORS[colorIndex++ % COLORS.length],
    })
  })

  return NextResponse.json(clients)
}

// ─── PATCH /api/clients/[id] — accept or decline a pending client ─────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }    = await params
  const { action } = await request.json()
  const newStatus  = action === 'accept' ? 'confirmed' : 'cancelled'

  const { error } = await supabase
    .from('sessions')
    .update({ status: newStatus })
    .eq('athlete_id', id)
    .eq('status', 'pending')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
