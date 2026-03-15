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

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const [
    { data: clientSessions },
    { count: sessionsThisWeek },
    { data: payments },
  ] = await Promise.all([
    // ✅ total unique confirmed clients only
    supabase
      .from('sessions')
      .select('athlete_id')
      .eq('provider_id', coachId)
      .eq('status', 'confirmed'),             // ← only confirmed

    // ✅ sessions this week — confirmed only, exclude cancelled
    supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', coachId)
      .eq('status', 'confirmed')              // ← only confirmed
      .gte('scheduled_at', weekStart.toISOString())
      .lt('scheduled_at',  weekEnd.toISOString()),

    supabase
      .from('payments')
      .select('amount')
      .eq('provider_id', coachId)
      .gte('created_at', monthStart.toISOString()),
  ])

  // deduplicate athletes
  const uniqueAthletes = new Set(
    (clientSessions ?? []).map((s: any) => s.athlete_id)
  )

  const monthlyEarnings = (payments ?? []).reduce(
    (sum: number, p: any) => sum + (p.amount ?? 0), 0
  )

  return NextResponse.json({
    totalClients:       uniqueAthletes.size,
    sessionsThisWeek:   sessionsThisWeek  ?? 0,
    monthlyEarnings:    `$${monthlyEarnings.toLocaleString()}`,
    clientSatisfaction: '4.9',
  })
}