import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const coachId = searchParams.get('coachId')
  if (!coachId) return NextResponse.json({ error: 'coachId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('messages')
    .select(`
      id, content, created_at, sender_id,
      profiles!messages_sender_id_fkey ( first_name, last_name )
    `)
    .eq('receiver_id', coachId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const COLORS = [
    'bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700',
    'bg-amber-100 text-amber-700',   'bg-blue-100 text-blue-700',
  ]

  const messages = (data ?? []).map((m: any, i: number) => {
    const profile   = m.profiles
    const firstName = profile?.first_name ?? ''
    const lastName  = profile?.last_name  ?? ''
    const diff      = Math.floor((Date.now() - new Date(m.created_at).getTime()) / 60000)
    const timeAgo   = diff < 60 ? `${diff} min ago` : diff < 1440 ? `${Math.floor(diff / 60)} hour ago` : 'Yesterday'
    return {
      id:    m.id,
      name:  `${firstName} ${lastName}`.trim(),
      time:  timeAgo,
      text:  m.content,
      color: COLORS[i % COLORS.length],
    }
  })

  return NextResponse.json(messages)
}