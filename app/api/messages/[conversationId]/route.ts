import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const { searchParams } = new URL(request.url)
  const coachId        = searchParams.get('coachId')
  const conversationId = params.conversationId

  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, created_at, is_read')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Messages fetch error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // mark unread messages as read
  if (coachId) {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', coachId)
      .eq('is_read', false)

    // reset unread count in conversations
    await supabase
      .from('conversations')
      .update({ unread_count: 0 })
      .eq('id', conversationId)
  }

  const messages = (data ?? []).map((m: any) => ({
    id:       m.id,
    text:     m.content,
    time:     new Date(m.created_at).toLocaleTimeString('en-US', {
      hour:   'numeric',
      minute: '2-digit',
    }),
    fromMe:   m.sender_id === coachId,
    senderId: m.sender_id,
  }))

  return NextResponse.json({ messages })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const { senderId, content } = await request.json()
  const conversationId = params.conversationId

  if (!conversationId || !senderId || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // insert message
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id:       senderId,
      content,
      is_read:         false,
    })
    .select()
    .single()

  if (error) {
    console.error('Send message error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // update conversation last message
  await supabase
    .from('conversations')
    .update({
      last_message:        content,
      last_message_at:     new Date().toISOString(),
      contact_unread_count: supabase.rpc('increment', { row_id: conversationId }),
    })
    .eq('id', conversationId)

  return NextResponse.json({
    message: {
      id:       data.id,
      text:     data.content,
      time:     new Date(data.created_at).toLocaleTimeString('en-US', {
        hour:   'numeric',
        minute: '2-digit',
      }),
      fromMe:   true,
      senderId: data.sender_id,
    }
  })
}