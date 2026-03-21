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
    .from('notifications')
    .select(`
      id,
      created_at,
      metadata,
      profiles!notifications_user_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq('related_id', coachId)
    .eq('type', 'call')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Calls error:', error.message)
    // return empty array instead of crashing — calls may not exist yet
    return NextResponse.json([])
  }

  const COLORS = [
    'bg-blue-100 text-blue-700', 'bg-indigo-100 text-indigo-700',
    'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700',
  ]

  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  const calls = (data ?? []).map((n: any, i: number) => {
    const profile = Array.isArray(n.profiles) ? n.profiles[0] : n.profiles
    const firstName = profile?.first_name ?? ''
    const lastName = profile?.last_name ?? ''
    const callDate = new Date(n.created_at)
    const dateStr = callDate.toDateString() === today
      ? 'Today'
      : callDate.toDateString() === yesterday
        ? 'Yesterday'
        : callDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

    return {
      id: n.id,
      initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '??',
      name: `${firstName} ${lastName}`.trim() || 'Unknown',
      color: COLORS[i % COLORS.length],
      type: n.metadata?.call_type ?? 'incoming',
      duration: n.metadata?.duration ?? '—',
      time: callDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      date: dateStr,
    }
  })

  return NextResponse.json(calls)
}