import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId }      = await params
  const { coachId, athleteId, durationSeconds, requiredSeconds } = await request.json()

  const { data: session, error: fetchError } = await supabase
    .from('sessions')
    .select('id, athlete_id, provider_id, scheduled_at, duration_minutes, sports(name)')
    .eq('id', sessionId)
    .single()

  if (fetchError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // ✅ auto-complete only if attended 80%+ of scheduled duration
  const attendedPct = (durationSeconds / requiredSeconds) * 100
  if (attendedPct < 80) {
    return NextResponse.json({ completed: false, reason: 'insufficient_attendance', attendedPct })
  }

  const { error: updateError } = await supabase
    .from('sessions')
    .update({
      status:       'completed',
      completed_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const sport = Array.isArray(session.sports) ? session.sports[0] : session.sports

  // Notify athlete
  await supabase.from('notifications').insert({
    user_id:     session.athlete_id,
    type:        'session_completed',
    title:       'Session Completed! 🎉',
    message:     `Your ${sport?.name ?? 'coaching'} session has been completed. Great work!`,
    session_id:  session.id,
    action_url:  '/dashboard/athlete/sessions',
    action_text: 'View Sessions',
    is_read:     false,
    sent_email:  false,
    sent_push:   false,
  })

  // Save call record to notifications table as call history
  await supabase.from('notifications').insert({
    user_id:     coachId,
    type:        'call_completed',
    title:       'Call Completed',
    message:     `Session call with athlete completed. Duration: ${Math.round(durationSeconds / 60)} minutes.`,
    session_id:  session.id,
    is_read:     true,
    sent_email:  false,
    sent_push:   false,
  })

  return NextResponse.json({ completed: true, attendedPct })
}