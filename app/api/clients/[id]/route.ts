import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { action } = await request.json()
  const newStatus = action === 'accept' ? 'confirmed' : 'cancelled'

  const { error } = await supabase
    .from('sessions')
    .update({ status: newStatus })
    .eq('athlete_id', params.id)
    .eq('status', 'pending')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}