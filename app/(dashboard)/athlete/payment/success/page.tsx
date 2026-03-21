'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { CheckCircle, Calendar, ArrowRight, Loader2 } from 'lucide-react'
import { Suspense } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

interface BookedSession {
  id: string
  scheduled_at: string
  duration_minutes: number
  provider_type: string
  provider: { first_name: string; last_name: string } | null
}

function SuccessContent() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const sessionIdsRaw = searchParams.get('session_ids')
  const sessionIds    = sessionIdsRaw?.split(',').filter(Boolean) ?? []

  const [sessions, setSessions] = useState<BookedSession[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (sessionIds.length === 0) { setLoading(false); return }

    supabase
      .from('sessions')
      .select('id, scheduled_at, duration_minutes, provider_type, provider_id')
      .in('id', sessionIds)
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return }

        const providerIds = [...new Set(data.map((s) => s.provider_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', providerIds)

        const provMap = new Map((profiles ?? []).map((p) => [p.id, p]))

        setSessions(data.map((s) => ({
          ...s,
          provider: provMap.get(s.provider_id) ?? null,
        })))
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionIdsRaw])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center">

        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 text-sm mb-8">
          Your session{sessionIds.length > 1 ? 's have' : ' has'} been confirmed.
          You'll receive a confirmation shortly.
        </p>

        {/* Booked sessions */}
        {loading ? (
          <div className="flex justify-center mb-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : sessions.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-left space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {s.provider?.first_name} {s.provider?.last_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(s.scheduled_at).toLocaleString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })} · {s.duration_minutes} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/athlete/dashboard')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/athlete/chats')}
            className="w-full text-sm text-gray-500 font-medium py-2 hover:text-gray-700 transition-colors"
          >
            Message your provider
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}