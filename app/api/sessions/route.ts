import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const coachId = searchParams.get('coachId')
  if (!coachId) return NextResponse.json({ error: 'coachId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id, scheduled_at, duration_minutes, session_type,
      location, meeting_url, status,
      athletes (
        user_id, skill_level,
        profiles!athletes_user_id_fkey ( first_name, last_name ),
        sports ( name )
      )
    `)
    .eq('coach_id', coachId)
    .order('scheduled_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const COLORS = [
    'bg-blue-100 text-blue-700', 'bg-indigo-100 text-indigo-700',
    'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700',
    'bg-pink-100 text-pink-700', 'bg-green-100 text-green-700',
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
    const profile   = s.athletes?.profiles
    const firstName = profile?.first_name ?? ''
    const lastName  = profile?.last_name  ?? ''
    const fullName  = `${firstName} ${lastName}`.trim()
    const sport     = s.athletes?.sports?.name ?? 'General'
    const date      = new Date(s.scheduled_at)

    return {
      id:        s.id,
      client:    fullName,
      initials:  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
      color:     COLORS[i % COLORS.length],
      sport,
      sportColor: SPORT_COLORS[sport] ?? 'bg-gray-100 text-gray-600',
      mode:      s.session_type === 'online' ? 'Online' : 'In-person',
      location:  s.location ?? s.meeting_url ?? '',
      date:      date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time:      date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      duration:  `${s.duration_minutes} min`,
      status:    s.status as 'confirmed' | 'pending' | 'cancelled',
    }
  })

  return NextResponse.json(sessions)
}