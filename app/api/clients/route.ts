import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const coachId = searchParams.get('coachId')
  const status  = searchParams.get('status') ?? 'active'
  if (!coachId) return NextResponse.json({ error: 'coachId required' }, { status: 400 })

  const COLORS = [
    'bg-blue-100 text-blue-700', 'bg-indigo-100 text-indigo-700',
    'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700', 'bg-green-100 text-green-700',
  ]

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      athlete_id, status, scheduled_at,
      athletes (
        user_id, skill_level,
        profiles!athletes_user_id_fkey ( first_name, last_name, created_at ),
        sports ( name )
      )
    `)
    .eq('coach_id', coachId)
    .eq('status', status === 'pending' ? 'pending' : 'confirmed')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // deduplicate by athlete_id
  const seen  = new Set()
  const clients = (data ?? [])
    .filter((row: any) => {
      if (seen.has(row.athlete_id)) return false
      seen.add(row.athlete_id)
      return true
    })
    .map((row: any, i: number) => {
      const athlete   = row.athletes
      const profile   = athlete?.profiles
      const firstName = profile?.first_name ?? ''
      const lastName  = profile?.last_name  ?? ''
      return {
        id:            row.athlete_id,
        initials:      `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
        name:          `${firstName} ${lastName}`.trim(),
        sport:         athlete?.sports?.name ?? 'General',
        level:         athlete?.skill_level  ?? 'Beginner',
        totalSessions: 0,
        upcoming:      0,
        progress:      0,
        lastActive:    status === 'pending' ? 'Requested recently' : 'Recently',
        joined:        profile?.created_at
          ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : '—',
        color: COLORS[i % COLORS.length],
      }
    })

  return NextResponse.json(clients)
}