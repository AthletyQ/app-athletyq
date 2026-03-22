'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, Check, Calendar as CalendarIcon, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from './ui/calendar'
import { Breadcrumb } from './ui/breadcrumb'
import { Coach } from '@/types/coach'
import { coachService } from '@/services/coach/coach.service'
import { supabase } from '@/lib/supabase/client'
import { Session } from '@/types/database.types'

interface SessionCardProps {
  coach: Coach
  onClose: () => void
}

export function SessionCard({ coach, onClose }: SessionCardProps) {
  const [step, setStep] = useState(0)
  const [date, setDate] = useState<Date | null>(null)
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])

  const [bookedSlots,         setBookedSlots]         = useState<string[]>([])
  const [availableSlots,      setAvailableSlots]      = useState<string[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [isSubmitting,        setIsSubmitting]        = useState(false)
  const [bookingStatus,       setBookingStatus]       = useState<'idle' | 'error'>('idle')
  const [errorMessage,        setErrorMessage]        = useState('')

  const steps = ['Time & Date', 'Confirmation']

  // ── Fetch availability ──────────────────────────────────────────────────────
  const fetchAvailability = useCallback(async (selectedDate: Date) => {
    setLoadingAvailability(true)
    const { data, error } = await coachService.getAvailability(coach.id, selectedDate)
    if (error) {
      console.error('Failed to fetch availability:', error)
    } else if (data) {
      setAvailableSlots(data.availableSlots)
      setBookedSlots(data.bookedSlots)
    }
    setLoadingAvailability(false)
  }, [coach.id])

  useEffect(() => {
    if (date) {
      fetchAvailability(date)
      setSelectedTimes([])
    }
  }, [date, fetchAvailability])

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleNextStep = () => { if (step < steps.length - 1) setStep(step + 1) }
  const handlePrevStep = () => { if (step > 0) setStep(step - 1) }

  const toggleTime = (time: string) => {
    setSelectedTimes(prev => {
      if (prev.includes(time)) return prev.filter(t => t !== time)
      if (prev.length >= 2) return [prev[0], time].sort()
      return [...prev, time].sort()
    })
  }

  const isStepValid = () => {
    if (step === 0) return !!date && selectedTimes.length === 1
    return true
  }

  // ── Complete booking → Stripe Checkout ──────────────────────────────────────
  const handleCompleteBooking = async () => {
    if (!date || selectedTimes.length === 0) return

    setIsSubmitting(true)
    setBookingStatus('idle')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setBookingStatus('error')
        setErrorMessage('You must be logged in to book a session.')
        setIsSubmitting(false)
        return
      }

      // Initialise athlete profile if needed
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const initRes = await fetch('/api/athlete', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authSession?.access_token}` },
      })
      if (!initRes.ok) {
        const errorData = await initRes.json()
        throw new Error(errorData.error || 'Failed to initialize athlete profile')
      }

      // Calculate duration from selected slots
      const sortedTimes    = [...selectedTimes].sort()
      const startStr = selectedTimes[0]
      const [startHour, startMinute] = startStr.split(':').map(Number)
      const endHour        = parseInt(sortedTimes[sortedTimes.length - 1].split(':')[0])
      const durationHours  = endHour - startHour + 1
      const durationMinutes = durationHours * 60

      const scheduledAt = new Date(date)
      scheduledAt.setHours(startHour, startMinute, 0, 0)

      if (scheduledAt <= new Date()) {
        setBookingStatus('error')
        setErrorMessage('Cannot book a session in the past.')
        setIsSubmitting(false)
        return
      }

      const session: Partial<Session> = {
        athlete_id:       user.id,
        provider_id:      coach.id,
        provider_type:    'coach',
        sport_id:         coach.sportId,
        session_type:     'one-on-one',
        scheduled_at:     scheduledAt.toISOString(),
        duration_minutes: durationMinutes,
        status:           'pending',
        price:            (Number(coach.hourlyRate) || 0) * durationHours,
        currency:         'USD',
        payment_status:   'unpaid',
        location_type:    'online',
      }

      // 1. Insert pending session into DB
      const { error: bookError } = await coachService.bookSessions([session])
      if (bookError) throw new Error(bookError)

      // 2. Retrieve the inserted session ID
      const { data: inserted } = await supabase
        .from('sessions')
        .select('id')
        .eq('athlete_id',      user.id)
        .eq('provider_id',     coach.id)
        .eq('payment_status',  'unpaid')
        .eq('status',          'pending')
        .eq('scheduled_at',    scheduledAt.toISOString())
        .order('created_at',   { ascending: false })
        .limit(1)

      const sessionIds = (inserted ?? []).map((s: { id: string }) => s.id)

      if (sessionIds.length === 0) {
        throw new Error('Could not retrieve session ID for payment')
      }

      // 3. Create Stripe Checkout session
      const res = await fetch('/api/payments/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionIds }),
      })
      const { url, error: checkoutError } = await res.json()
      if (checkoutError || !url) throw new Error(checkoutError ?? 'Failed to create checkout session')

      // 4. Redirect to Stripe Checkout
      window.location.href = url

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to book session. Please try again.'
      setBookingStatus('error')
      setErrorMessage(message)
      setIsSubmitting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300 pointer-events-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[90vh] pointer-events-auto">

        {/* HEADER */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <CalendarIcon size={16} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">
                  {coach.firstName} {coach.lastName}
                </h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Book Session</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <Breadcrumb steps={steps} currentStep={step} className="px-0" />
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-5 overflow-y-auto">
          <>
            {/* STEP 0 — Date & Time */}
            {step === 0 && (
              <div className="animate-in fade-in slide-in-from-right-4 relative scale-95 origin-top">
                {loadingAvailability && (
                  <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  </div>
                )}
                <Calendar
                  selectedDate={date}
                  onDateChange={setDate}
                  selectedTimes={selectedTimes}
                  onToggleTime={toggleTime}
                  bookedSlots={bookedSlots}
                  availableSlots={availableSlots}
                  className="border-0 p-0 shadow-none bg-transparent"
                />
                {!loadingAvailability && date && availableSlots.length === 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100 flex flex-col items-center text-center">
                    <CalendarIcon className="w-8 h-8 text-amber-400 mb-2" />
                    <p className="text-sm font-semibold text-amber-900">No Slots Available</p>
                    <p className="text-xs text-amber-600 mt-1">
                      This coach is fully booked for {date.toLocaleDateString()}. Please try another date.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 1 — Confirmation */}
            {step === 1 && (
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-4 animate-in zoom-in-95 duration-500">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Check size={32} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Confirm Booking</h3>
                  <p className="text-[11px] text-gray-500">Review your details then pay securely via Stripe</p>
                </div>

                <div className="w-full bg-gray-50/80 rounded-3xl p-5 space-y-3 text-left border border-gray-100">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-400">Coach</span>
                    <span className="font-bold text-gray-900">{coach.firstName} {coach.lastName}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-400">Type</span>
                    <span className="font-bold text-gray-900 capitalize">Online · 1-on-1</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-400">Scheduled</span>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {date?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-[11px] text-blue-600 font-bold">{selectedTimes.join(' – ')}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-200/60 pt-3 mt-3">
                    <span className="text-gray-500 font-medium">Total</span>
                    <span className="font-extrabold text-blue-600 text-lg">
                      ${(coach.hourlyRate || 0) * selectedTimes.length}
                    </span>
                  </div>
                </div>

                {/* Stripe badge */}
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <svg viewBox="0 0 40 16" className="h-4 w-auto" fill="none">
                    <path d="M12.956 4.228c0-.787.648-1.09 1.72-1.09 1.535 0 3.474.463 5.01 1.29V.72C18.038.273 16.42 0 14.676 0 10.73 0 8.1 2.055 8.1 5.53c0 5.388 7.427 4.525 7.427 6.847 0 .929-.808 1.23-1.933 1.23-1.672 0-3.808-.69-5.5-1.62v3.753c1.874.808 3.763 1.147 5.5 1.147 4.052 0 6.835-2.002 6.835-5.52-.015-5.82-7.473-4.78-7.473-7.139z" fill="#635BFF"/>
                  </svg>
                  Payments secured by Stripe
                </div>

                {bookingStatus === 'error' && (
                  <p className="text-red-500 text-[11px] font-semibold bg-red-50 px-3 py-1.5 rounded-full">
                    {errorMessage}
                  </p>
                )}
              </div>
            )}
          </>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={handlePrevStep}
            disabled={isSubmitting}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors',
              step === 0
                ? 'opacity-0 pointer-events-none'
                : 'text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-50',
            )}
          >
            <ChevronLeft size={16} />Back
          </button>

          <button
            onClick={step === 1 ? handleCompleteBooking : handleNextStep}
            disabled={!isStepValid() || isSubmitting}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md',
              step === 1
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-100'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 disabled:shadow-none disabled:bg-gray-100 disabled:text-gray-300',
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Redirecting to payment...
              </>
            ) : (
              <>
                {step === 1 ? 'Pay & Confirm' : 'Continue'}
                {step < 1 && <ArrowRight size={16} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}