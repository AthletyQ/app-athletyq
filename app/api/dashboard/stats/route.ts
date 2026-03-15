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

  const now = new Date()

  // ✅ Monday-based week
  const dayOfWeek = now.getDay()
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + diffToMon)
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  weekEnd.setHours(0, 0, 0, 0)

  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const monthStart     = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const [
    { data: confirmedSessions },
    { count: sessionsThisWeek },
    { count: sessionsToday },
    { data: pendingSessions },       // ✅ fetch all pending to deduplicate
    { data: thisMonthPayments },
    { data: lastMonthPayments },
  ] = await Promise.all([

    // unique confirmed clients
    supabase
      .from('sessions')
      .select('athlete_id')
      .eq('provider_id', coachId)
      .eq('status', 'confirmed'),

    // confirmed sessions this week
    supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', coachId)
      .eq('status', 'confirmed')
      .gte('scheduled_at', weekStart.toISOString())
      .lt('scheduled_at',  weekEnd.toISOString()),

    // confirmed sessions today
    supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', coachId)
      .eq('status', 'confirmed')
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString()),

    // ✅ fetch pending sessions with athlete_id to deduplicate
    supabase
      .from('sessions')
      .select('athlete_id')
      .eq('provider_id', coachId)
      .eq('status', 'pending'),

    supabase
      .from('payments')
      .select('amount')
      .eq('provider_id', coachId)
      .gte('created_at', monthStart.toISOString()),

    supabase
      .from('payments')
      .select('amount')
      .eq('provider_id', coachId)
      .gte('created_at', lastMonthStart.toISOString())
      .lte('created_at', lastMonthEnd.toISOString()),
  ])

  // ✅ deduplicate confirmed athletes
  const uniqueConfirmed = new Set(
    (confirmedSessions ?? []).map((s: any) => s.athlete_id)
  )

  // ✅ deduplicate pending athletes
  const uniquePending = new Set(
    (pendingSessions ?? []).map((s: any) => s.athlete_id)
  )

  const thisMonthTotal = (thisMonthPayments ?? []).reduce(
    (sum: number, p: any) => sum + (p.amount ?? 0), 0
  )
  const lastMonthTotal = (lastMonthPayments ?? []).reduce(
    (sum: number, p: any) => sum + (p.amount ?? 0), 0
  )

  let earningsChange = ''
  if (lastMonthTotal === 0 && thisMonthTotal > 0) {
    earningsChange = 'New earnings this month'
  } else if (lastMonthTotal === 0 && thisMonthTotal === 0) {
    earningsChange = 'No earnings yet'
  } else {
    const pct     = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
    const rounded = Math.abs(Math.round(pct))
    earningsChange = pct >= 0
      ? `+${rounded}% vs last month`
      : `-${rounded}% vs last month`
  }

  return NextResponse.json({
    totalClients:       uniqueConfirmed.size,
    sessionsThisWeek:   sessionsThisWeek  ?? 0,
    monthlyEarnings:    `$${thisMonthTotal.toLocaleString()}`,
    clientSatisfaction: '4.9',
    pendingClients:     uniquePending.size,   // ✅ unique athletes not session count
    sessionsToday:      sessionsToday     ?? 0,
    earningsChange,
  })
}