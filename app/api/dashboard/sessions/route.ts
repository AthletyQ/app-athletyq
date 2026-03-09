import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const coachId = searchParams.get('coachId')
  if (!coachId) return NextResponse.json({ error: 'coachId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id, scheduled_at, duration_minutes, session_type, location, meeting_url,
      athletes (
        profiles!athletes_user_id_fkey ( first_name, last_name ),
        sports ( name )
      )
    `)
    .eq('coach_id', coachId)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(5)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sessions = (data ?? []).map((s: any) => {
    const profile   = s.athletes?.profiles
    const firstName = profile?.first_name ?? ''
    const lastName  = profile?.last_name  ?? ''
    const date      = new Date(s.scheduled_at)
    return {
      id:       s.id,
      name:     `${firstName} ${lastName}`.trim(),
      type:     s.athletes?.sports?.name ?? 'General',
      mode:     s.session_type === 'online' ? 'Online' : 'In-person',
      time:     date.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }),
      duration: `${s.duration_minutes} min`,
      location: s.location ?? s.meeting_url ?? '',
    }
  })

  return NextResponse.json(sessions)
}