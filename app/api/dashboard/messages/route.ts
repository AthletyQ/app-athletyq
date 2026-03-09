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

  // Step 1 — find conversations this coach is part of
  const { data: convData, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .or(`participant_one_id.eq.${coachId},participant_two_id.eq.${coachId}`)
    .order('last_message_at', { ascending: false })
    .limit(10)

  if (convError) {
    console.error('Conversations error:', convError.message)
    return NextResponse.json([], { status: 200 }) // return empty rather than crash
  }

  if (!convData || convData.length === 0) {
    return NextResponse.json([])
  }

  const conversationIds = convData.map((c: any) => c.id)

  // Step 2 — get latest message per conversation
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      is_read,
      created_at,
      profiles!messages_sender_id_fkey (
        first_name,
        last_name
      )
    `)
    .in('conversation_id', conversationIds)
    .neq('sender_id', coachId)           // only messages FROM others TO coach
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Messages error:', error.message)
    return NextResponse.json([])
  }

  const COLORS = [
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-amber-100 text-amber-700',
    'bg-blue-100 text-blue-700',
  ]

  const messages = (data ?? []).map((m: any, i: number) => {
    const profile   = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    const firstName = profile?.first_name ?? ''
    const lastName  = profile?.last_name  ?? ''
    const diff      = Math.floor((Date.now() - new Date(m.created_at).getTime()) / 60000)
    const timeAgo   = diff < 1    ? 'Just now'
                    : diff < 60   ? `${diff} min ago`
                    : diff < 1440 ? `${Math.floor(diff / 60)} hour ago`
                    : 'Yesterday'

    return {
      id:    m.id,
      name:  `${firstName} ${lastName}`.trim() || 'Unknown',
      time:  timeAgo,
      text:  m.content ?? '',
      color: COLORS[i % COLORS.length],
      unread: m.is_read === false,
    }
  })

  return NextResponse.json(messages)
}