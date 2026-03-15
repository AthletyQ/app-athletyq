import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params
  const body              = await request.json()
  const { action, scheduledAt, previousStatus } = body

  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
  if (!action)    return NextResponse.json({ error: 'action required' },    { status: 400 })

  const { data: session, error: fetchError } = await supabase
    .from('sessions')
    .select('id, athlete_id, provider_id, scheduled_at, status, sports ( name )')
    .eq('id', sessionId)
    .single()

  if (fetchError || !session) {
    return NextResponse.json({ error: fetchError?.message ?? 'Session not found' }, { status: 404 })
  }

  const sport = Array.isArray(session.sports) ? session.sports[0] : session.sports

  // ─── APPROVE ──────────────────────────────────────────────────────────────
  if (action === 'approve') {
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status:       'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    const sessionDate = new Date(session.scheduled_at).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    })
    const sessionTime = new Date(session.scheduled_at).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
    })

    await supabase.from('notifications').insert({
      user_id:     session.athlete_id,
      type:        'session_confirmed',
      title:       'Session Confirmed! 🎉',
      message:     `Great news! Your ${sport?.name ?? 'coaching'} session on ${sessionDate} at ${sessionTime} has been confirmed by your coach. See you there!`,
      session_id:  session.id,
      action_url:  '/dashboard/athlete/sessions',
      action_text: 'View Session',
      is_read:     false,
      sent_email:  false,
      sent_push:   false,
    })

    return NextResponse.json({ success: true, action: 'approved' })
  }

  // ─── RESCHEDULE — notify only, no date change ──────────────────────────────
  if (action === 'reschedule') {
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status:     'confirmed',   // ✅ stays confirmed
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    const sessionDate = new Date(session.scheduled_at).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    })
    const sessionTime = new Date(session.scheduled_at).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
    })

    await supabase.from('notifications').insert({
      user_id:     session.athlete_id,
      type:        'session_reschedule_requested',
      title:       'Session Reschedule Requested',
      message:     `Your coach has requested to reschedule your ${sport?.name ?? 'coaching'} session originally on ${sessionDate} at ${sessionTime}. Please contact your coach to confirm a new time.`,
      session_id:  session.id,
      action_url:  '/dashboard/athlete/sessions',
      action_text: 'View Session',
      is_read:     false,
      sent_email:  false,
      sent_push:   false,
    })

    return NextResponse.json({ success: true, action: 'rescheduled' })
  }

  // ─── CANCEL ───────────────────────────────────────────────────────────────
  if (action === 'cancel') {
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status:       'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: session.provider_id,
        updated_at:   new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Cancel error:', updateError.message)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const sessionDate = new Date(session.scheduled_at).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    })
    const sessionTime = new Date(session.scheduled_at).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
    })

    await supabase.from('notifications').insert({
      user_id:     session.athlete_id,
      type:        'session_cancelled',
      title:       'Session Cancelled',
      message:     `Your ${sport?.name ?? 'coaching'} session on ${sessionDate} at ${sessionTime} has been cancelled by your coach.`,
      session_id:  session.id,
      action_url:  '/dashboard/athlete/sessions',
      action_text: 'View Sessions',
      is_read:     false,
      sent_email:  false,
      sent_push:   false,
    })

    return NextResponse.json({ success: true, action: 'cancelled' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}