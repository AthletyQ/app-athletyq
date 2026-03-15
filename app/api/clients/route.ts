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

  const sessionStatus = status === 'pending' ? 'pending' : 'confirmed'

  // ✅ fetch all sessions for this coach with the right status
  const { data, error } = await supabase
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
      sports (
        name
      )
    `)
    .eq('provider_id', coachId)
    .eq('status', sessionStatus)
    .order('scheduled_at', { ascending: false })

  if (error) {
    console.error('Clients error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ✅ deduplicate by athlete_id, count sessions per athlete
  const athleteMap = new Map<string, any>()

  ;(data ?? []).forEach((row: any, i: number) => {
    const athleteId = row.athlete_id
    const athlete   = Array.isArray(row.athletes) ? row.athletes[0] : row.athletes
    const profile   = Array.isArray(athlete?.profiles) ? athlete.profiles[0] : athlete?.profiles
    const sport     = Array.isArray(row.sports) ? row.sports[0] : row.sports

    if (!athleteMap.has(athleteId)) {
      const firstName = profile?.first_name ?? ''
      const lastName  = profile?.last_name  ?? ''

      athleteMap.set(athleteId, {
        id:              athleteId,
        initials:        `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '??',
        name:            `${firstName} ${lastName}`.trim() || 'Unknown Athlete',
        sport:           sport?.name ?? 'General',
        level:           'Athlete',
        profileImageUrl: profile?.profile_image_url ?? null,
        totalSessions:   1,
        upcoming:        new Date(row.scheduled_at) > new Date() ? 1 : 0,
        progress:        0,
        lastActive:      status === 'pending' ? 'Requested recently' : 'Recently active',
        joined:          profile?.created_at
          ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : '—',
        color: COLORS[athleteMap.size % COLORS.length],
      })
    } else {
      // ✅ accumulate session counts per athlete
      const existing = athleteMap.get(athleteId)
      existing.totalSessions += 1
      if (new Date(row.scheduled_at) > new Date()) {
        existing.upcoming += 1
      }
      // progress = upcoming / total * 100 capped at 100
      existing.progress = Math.min(
        Math.round((existing.upcoming / existing.totalSessions) * 100),
        100
      )
    }
  })

  return NextResponse.json(Array.from(athleteMap.values()))
}