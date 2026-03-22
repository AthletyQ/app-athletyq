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


  const { data: convData, error: convError } = await supabase
    .from('conversations')
    .select('id, unread_count, athlete_id')
    .eq('contact_id', coachId)         
    .gt('unread_count', 0)             
    .order('last_message_at', { ascending: false })
    .limit(5)

  if (convError) {
    console.error('Conversations error:', convError.message)
    return NextResponse.json([])
  }

  if (!convData || convData.length === 0) return NextResponse.json([])

  
  const athleteIds = convData.map((c: any) => c.athlete_id).filter(Boolean)

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', athleteIds)

  const profileMap = Object.fromEntries(
    (profileData ?? []).map((p: any) => [p.id, p])
  )

  
  const conversationIds = convData.map((c: any) => c.id)

  const { data: msgData, error: msgError } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, is_read, created_at')
    .in('conversation_id', conversationIds)
    .neq('sender_id', coachId)          
    .eq('is_read', false)              
    .order('created_at', { ascending: false })

  if (msgError) {
    console.error('Messages error:', msgError.message)
    return NextResponse.json([])
  }

  
  const seenConvs = new Set<string>()
  const messages: any[] = []

  const COLORS = [
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-amber-100 text-amber-700',
    'bg-blue-100 text-blue-700',
  ]

  for (const m of (msgData ?? [])) {
    if (seenConvs.has(m.conversation_id)) continue
    seenConvs.add(m.conversation_id)

    const conv      = convData.find((c: any) => c.id === m.conversation_id)
    const profile   = profileMap[conv?.athlete_id]
    const firstName = profile?.first_name ?? ''
    const lastName  = profile?.last_name  ?? ''

    const diff    = Math.floor((Date.now() - new Date(m.created_at).getTime()) / 60000)
    const timeAgo = diff < 1    ? 'Just now'
                  : diff < 60   ? `${diff}m ago`
                  : diff < 1440 ? `${Math.floor(diff / 60)}h ago`
                  : 'Yesterday'

    messages.push({
      id:         m.id,
      name:       `${firstName} ${lastName}`.trim() || 'Unknown',
      time:       timeAgo,
      text:       m.content ?? '',
      color:      COLORS[messages.length % COLORS.length],
      unread:     true,
      unreadCount: conv?.unread_count ?? 1,
    })

    if (messages.length >= 5) break
  }

  return NextResponse.json(messages)
}