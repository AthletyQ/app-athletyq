import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const DAILY_API_KEY = process.env.DAILY_API_KEY
  if (!DAILY_API_KEY) {
    return NextResponse.json({ error: 'DAILY_API_KEY not configured' }, { status: 500 })
  }

  const { sessionId, isCoach } = await req.json()

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  const roomName = `athletyq-${sessionId}`

  try {
    // ── 1. Get or create the Daily room ───────────────────────────────────────
    let room

    // Try to get existing room first
    const getRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
    })

    if (getRes.ok) {
      room = await getRes.json()
    } else {
      // Create new room
      const createRes = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName,
          properties: {
            enable_screenshare:   true,
            enable_chat:          true,
            start_video_off:      false,
            start_audio_off:      false,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 3, // expires in 3 hours
          },
        }),
      })

      if (!createRes.ok) {
        const err = await createRes.json()
        throw new Error(err.error ?? 'Failed to create Daily room')
      }

      room = await createRes.json()
    }

    // ── 2. Create a meeting token for this participant ─────────────────────────
    const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          room_name:  roomName,
          is_owner:   isCoach ?? false, // coach is room owner
          exp:        Math.floor(Date.now() / 1000) + 60 * 60 * 3,
        },
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.json()
      throw new Error(err.error ?? 'Failed to create meeting token')
    }

    const { token } = await tokenRes.json()

    return NextResponse.json({
      url:   room.url,
      token,
      roomName,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    console.error('[create-room]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}