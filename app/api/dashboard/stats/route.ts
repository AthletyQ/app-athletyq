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

  // ── Current week: Monday 00:00:00 → Sunday 23:59:59 (local-midnight in UTC) ──
  const dayOfWeek  = now.getUTCDay()                          // 0 = Sun
  const diffToMon  = dayOfWeek === 0 ? -6 : 1 - dayOfWeek    // days back to Monday

  const weekStart = new Date(now)
  weekStart.setUTCDate(now.getUTCDate() + diffToMon)
  weekStart.setUTCHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6)   // Sunday of same week
  weekEnd.setUTCHours(23, 59, 59, 999)

  // ── Today ──────────────────────────────────────────────────────────────────
  const todayStart = new Date(now)
  todayStart.setUTCHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setUTCHours(23, 59, 59, 999)

  // ── Month boundaries ───────────────────────────────────────────────────────
  const monthStart     = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const lastMonthEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999))

  const [
    { data: confirmedSessions },
    { count: sessionsThisWeek },
    { count: sessionsToday },
    { data: pendingSessions },
    { data: thisMonthPayments },
    { data: lastMonthPayments },
  ] = await Promise.all([

    // unique confirmed clients (all time — for Total Clients card)
    supabase
      .from('sessions')
      .select('athlete_id')
      .eq('provider_id', coachId)
      .eq('status', 'confirmed'),

    // ✅ confirmed sessions strictly within this Mon–Sun week only
    supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', coachId)
      .eq('status', 'confirmed')
      .gte('scheduled_at', weekStart.toISOString())
      .lte('scheduled_at', weekEnd.toISOString()),

    // confirmed sessions today only
    supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', coachId)
      .eq('status', 'confirmed')
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString()),

    // pending sessions (deduplicated by athlete)
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

  const uniqueConfirmed = new Set((confirmedSessions ?? []).map((s: any) => s.athlete_id))
  const uniquePending   = new Set((pendingSessions   ?? []).map((s: any) => s.athlete_id))

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
    sessionsThisWeek:   sessionsThisWeek ?? 0,
    monthlyEarnings:    `$${thisMonthTotal.toLocaleString()}`,
    clientSatisfaction: '4.9',
    pendingClients:     uniquePending.size,
    sessionsToday:      sessionsToday    ?? 0,
    earningsChange,
    // debug info (remove in production)
    _debug: {
      weekStart: weekStart.toISOString(),
      weekEnd:   weekEnd.toISOString(),
    },
  })
}
