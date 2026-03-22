import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { coachUserId, athleteUserId } = body

    console.log('find-or-create called:', { coachUserId, athleteUserId })

    if (!coachUserId || !athleteUserId) {
      return NextResponse.json(
        { error: 'Missing coachUserId or athleteUserId' },
        { status: 400 }
      )
    }


    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', coachUserId)
      .eq('athlete_id', athleteUserId)
      .maybeSingle()

    if (findError) {
      console.error('find-or-create find error:', findError)
      return NextResponse.json({ error: findError.message }, { status: 500 })
    }

    if (existing) {
      console.log('Found existing conversation:', existing.id)
      return NextResponse.json({ conversationId: existing.id })
    }


    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({
        contact_id:           coachUserId,
        athlete_id:           athleteUserId,
        last_message:         null,
        last_message_at:      null,
        unread_count:         0,
        contact_unread_count: 0,
      })
      .select('id')
      .single()

    if (createError) {
      console.error('find-or-create insert error:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    console.log('Created new conversation:', created.id)
    return NextResponse.json({ conversationId: created.id })

  } catch (err: any) {
    console.error('find-or-create unexpected error:', err)
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}