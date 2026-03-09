import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest, { params }: { params: { conversationId: string } }) {
  const { searchParams } = new URL(request.url)
  const coachId = searchParams.get('coachId')
  const partnerId = params.conversationId

  const { data, error } = await supabase
    .from('messages')
    .select('id, content, created_at, sender_id')
    .or(`and(sender_id.eq.${coachId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${coachId})`)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const messages = (data ?? []).map((m: any) => ({
    id:     m.id,
    text:   m.content,
    time:   new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    fromMe: m.sender_id === coachId,
  }))

  return NextResponse.json(messages)
}

export async function POST(request: NextRequest, { params }: { params: { conversationId: string } }) {
  const { text, senderId } = await request.json()
  const receiverId = params.conversationId

  const { data, error } = await supabase
    .from('messages')
    .insert({ content: text, sender_id: senderId, receiver_id: receiverId, is_read: false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    id:     data.id,
    text:   data.content,
    time:   new Date(data.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    fromMe: true,
  })
}