import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // ✅ was PUBLISHABLE_KEY which doesn't exist
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversationId')

  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Messages error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const messages = (data ?? []).map((m: any) => ({
    id:     m.id,
    text:   m.content,
    time:   new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    fromMe: false, // will be set on frontend based on current user id
    senderId: m.sender_id,
  }))

  return NextResponse.json({ messages })
}

export async function POST(request: NextRequest) {
  const { conversationId, senderId, content } = await request.json()

  if (!conversationId || !senderId || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
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
      last_message:    content,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  return NextResponse.json({
    message: {
      id:       data.id,
      text:     data.content,
      time:     new Date(data.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      fromMe:   true,
      senderId: data.sender_id,
    }
  })
}