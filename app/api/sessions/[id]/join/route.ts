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
  const { id: sessionId } = await params

  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, scheduled_at, duration_minutes, provider_id, athlete_id, status')
    .eq('id', sessionId)
    .single()

  if (error || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.status !== 'confirmed') {
    return NextResponse.json({ error: 'Session not confirmed' }, { status: 400 })
  }

  // Create a Daily.co room via their API
  // Room name is deterministic based on session ID so both parties join same room
  const roomName = `athletyq-session-${sessionId}`

  try {
    const dailyRes = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name:       roomName,
        privacy:    'private',
        properties: {
          exp:              Math.floor(Date.now() / 1000) + 7200, // 2hr expiry
          max_participants: 2,
          enable_chat:      false,
          enable_screenshare: false,
        },
      }),
    })

    let roomUrl = ''

    if (dailyRes.ok) {
      const room = await dailyRes.json()
      roomUrl = room.url
    } else {
      // Room might already exist — try to get it
      const getRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        headers: { 'Authorization': `Bearer ${process.env.DAILY_API_KEY}` },
      })
      if (getRes.ok) {
        const room = await getRes.json()
        roomUrl = room.url
      }
    }

    if (!roomUrl) {
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
    }

    // Save room URL to session
    await supabase
      .from('sessions')
      .update({ location_details: roomUrl, updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    return NextResponse.json({
      roomUrl,
      roomName,
      sessionId,
      durationMinutes: session.duration_minutes,
    })
  } catch (err) {
    console.error('Daily.co error:', err)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}