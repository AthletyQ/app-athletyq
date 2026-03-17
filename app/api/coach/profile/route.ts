import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('coaches')
    .select(`
      user_id,
      coaching_sport_id,
      specialization,
      bio,
      years_of_experience,
      hourly_rate,
      certifications,
      is_available,
      rating,
      total_sessions,
      sports ( id, name ),
      profiles!coaches_user_id_fkey (
        id, first_name, last_name, email, phone_number, profile_image_url
      )
    `)
    .eq('user_id', userId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ✅ safely handle array or object from join
  const profile   = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
  const sport     = Array.isArray(data.sports)   ? data.sports[0]   : data.sports
  const firstName = profile?.first_name ?? ''
  const lastName  = profile?.last_name  ?? ''

  return NextResponse.json({
    id:                data.user_id,
    firstName,
    lastName,
    fullName:          `${firstName} ${lastName}`.trim(),
    initials:          `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
    email:             profile?.email             ?? '',
    phoneNumber:       profile?.phone_number      ?? '',
    profileImageUrl:   profile?.profile_image_url ?? null,
    sport:             sport?.name                ?? 'General',
    specialization:    data.specialization,
    yearsOfExperience: data.years_of_experience,
    hourlyRate:        data.hourly_rate,
    isAvailable:       data.is_available,
    rating:            data.rating,
    totalSessions:     data.total_sessions,
  })
}