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

  // conversations where the coach is either athlete_id or contact_id
  const { data: convData, error: convError } = await supabase
    .from('conversations')
    .select(`
      id,
      athlete_id,
      contact_id,
      last_message,
      last_message_at,
      unread_count,
      contact_unread_count,
      is_archived
    `)
    .or(`athlete_id.eq.${coachId},contact_id.eq.${coachId}`)
    .eq('is_archived', false)
    .order('last_message_at', { ascending: false })
    .limit(20)

  if (convError) {
    console.error('Conversations error:', convError.message)
    return NextResponse.json([], { status: 200 })
  }

  if (!convData || convData.length === 0) {
    return NextResponse.json([])
  }

  // get the partner id for each conversation (the other person)
  const partnerIds = convData.map((c: any) =>
    c.athlete_id === coachId ? c.contact_id : c.athlete_id
  )

  // fetch all partner profiles in one query
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, profile_image_url')
    .in('id', partnerIds)

  if (profilesError) {
    console.error('Profiles error:', profilesError.message)
    return NextResponse.json([])
  }

  // map profiles by id for quick lookup
  const profileMap = new Map(
    (profilesData ?? []).map((p: any) => [p.id, p])
  )

  // fetch last message content for each conversation
  const convIds = convData.map((c: any) => c.id)
  const { data: messagesData } = await supabase
    .from('messages')
    .select('conversation_id, content, created_at, sender_id')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false })

  // get latest message per conversation
  const latestMessageMap = new Map<string, any>()
  ;(messagesData ?? []).forEach((m: any) => {
    if (!latestMessageMap.has(m.conversation_id)) {
      latestMessageMap.set(m.conversation_id, m)
    }
  })

  const COLORS = [
    'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-green-100 text-green-700',
  ]

  const conversations = convData.map((c: any, i: number) => {
    const partnerId = c.athlete_id === coachId ? c.contact_id : c.athlete_id
    const profile   = profileMap.get(partnerId)
    const firstName = profile?.first_name ?? ''
    const lastName  = profile?.last_name  ?? ''
    const lastMsg   = latestMessageMap.get(c.id)

    // time ago
    const msgTime   = lastMsg?.created_at ?? c.last_message_at
    const diff      = msgTime
      ? Math.floor((Date.now() - new Date(msgTime).getTime()) / 60000)
      : null
    const timeAgo   = diff === null     ? ''
                    : diff < 1          ? 'Just now'
                    : diff < 60         ? `${diff}m ago`
                    : diff < 1440       ? `${Math.floor(diff / 60)}h ago`
                    : 'Yesterday'

    const unread    = c.athlete_id === coachId
      ? c.unread_count
      : c.contact_unread_count

    return {
      id:       c.id,
      partnerId,
      initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '??',
      name:     `${firstName} ${lastName}`.trim() || 'Unknown',
      preview:  lastMsg?.content
        ? lastMsg.content.slice(0, 40) + (lastMsg.content.length > 40 ? '...' : '')
        : c.last_message ?? 'No messages yet',
      time:     timeAgo,
      role:     'Athlete',
      roleColor:'bg-blue-100 text-blue-600',
      online:   false,
      unread:   unread > 0 ? unread : undefined,
      color:    COLORS[i % COLORS.length],
      messages: [],
    }
  })

  return NextResponse.json(conversations)
}