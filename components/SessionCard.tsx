'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, Check, Video, MapPin, Users, Calendar as CalendarIcon, ArrowRight, Loader2 } from 'lucide-react'
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
  const [sessionType, setSessionType] = useState<'online' | 'in_person' | null>(null)
  const [teamType, setTeamType] = useState<'individual' | 'group' | null>(null)
  const [date, setDate] = useState<Date | null>(null)
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const steps = ["Session Type", "Team", "Time & Date", "Confirmation"]

  // --- FETCH AVAILABILITY ---
  const fetchAvailability = useCallback(async (selectedDate: Date) => {
    setLoadingAvailability(true)
    const { data, error } = await coachService.getAvailability(coach.id, selectedDate, sessionType)
    if (error) {
      console.error("Failed to fetch availability:", error)
    } else if (data) {
      // Filter out booked slots entirely as requested
      const filteredAvailable = data.availableSlots.filter(slot => !data.bookedSlots.includes(slot))
      setAvailableSlots(filteredAvailable)
      setBookedSlots(data.bookedSlots)
    }
    setLoadingAvailability(false)
  }, [coach.id, sessionType])

  useEffect(() => {
    if (date) {
      fetchAvailability(date)
      setSelectedTimes([]) // Reset selected times when date or sessionType changes
    }
  }, [date, fetchAvailability])

  // Re-fetch availability if user switches between Online and In-person while date is already selected
  useEffect(() => {
    if (date && step === 2) {
       fetchAvailability(date)
    }
  }, [sessionType, date, step, fetchAvailability])

  // --- HANDLERS ---
  const handleNextStep = () => { if (step < steps.length - 1) setStep(step + 1) }
  const handlePrevStep = () => { if (step > 0) setStep(step - 1) }

  /**
   * Selection Logic: "Only from time and to time"
   * Only exactly the clicked times are selected. Max 2 slots.
   */
  const toggleTime = (time: string) => {
    setSelectedTimes(prev => {
      // If the clicked time is already selected, remove it.
      if (prev.includes(time)) {
        return prev.filter(t => t !== time)
      }
      // If we already have 2 times, we are replacing the second time (the to-time).
      // This allows the user to change the end time while keeping the start time.
      if (prev.length >= 2) {
        // We assume the first element is the "from" time and the second is the "to" time (since it's sorted).
        // If the new time is before the first time, it becomes the new from-time, and the old from-time becomes the to-time.
        // If the new time is after, it just replaces the second one.
        return [prev[0], time].sort()
      }
      // If we have 0 or 1 time, just add and sort.
      return [...prev, time].sort()
    })
  }

  const isStepValid = () => {
    if (step === 0) return !!sessionType
    if (step === 1) return !!teamType
    if (step === 2) return !!date && selectedTimes.length >= 1
    return true
  }

  const handleCompleteBooking = async () => {
    if (!date || selectedTimes.length === 0 || !sessionType) return

    setIsSubmitting(true)
    setBookingStatus('idle')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setBookingStatus('error')
        setErrorMessage('You must be logged in to book a session.')
        return
      }

      // --- ROLE-AGNOSTIC BOOKING LOGIC ---
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const initRes = await fetch('/api/athlete', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authSession?.access_token}`
        }
      });
      if (!initRes.ok) {
        const errorData = await initRes.json();
        throw new Error(errorData.error || 'Failed to initialize athlete profile');
      }

      // Calculate duration and start time
      const sortedTimes = [...selectedTimes].sort()
      const startStr = sortedTimes[0]
      const endStr = sortedTimes[sortedTimes.length - 1]
      
      const startHour = parseInt(startStr.split(':')[0])
      const endHour = parseInt(endStr.split(':')[0])
      
      // If only one slot is selected, duration is 60.
      // If two slots (e.g., 08:00 and 11:00) are selected, duration is (11-8+1)*60 = 240 mins?
      // Wait, if the user means "From 8 to 11", do they mean it ends at 11 or ends at 12?
      // Usually, if you click the "11:00" button, you mean the 11:00-12:00 slot.
      // So "08:00 to 11:00" inclusive of the 11:00 slot is 4 hours.
      const durationHours = endHour - startHour + 1
      const durationMinutes = durationHours * 60

      const scheduledAt = new Date(date)
      scheduledAt.setHours(startHour, 0, 0, 0)

      const session: Partial<Session> = {
        athlete_id: user.id,
        provider_id: coach.id,
        provider_type: 'coach',
        sport_id: coach.sportId,
        session_type: teamType === 'group' ? 'group' : 'one-on-one',
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: durationMinutes,
        status: 'pending',
        price: (Number(coach.hourlyRate) || 0) * durationHours,
        currency: 'USD',
        payment_status: 'unpaid',
        location_type: sessionType === 'online' ? 'online' : 'in_person',
      }

      // Check if scheduled time is in the past
      if (new Date(session.scheduled_at!) <= new Date()) {
        setBookingStatus('error')
        setErrorMessage('Cannot book a session in the past.')
        setIsSubmitting(false)
        return
      }

      const { error } = await coachService.bookSessions([session])
      if (error) throw new Error(error)

      setBookingStatus('success')
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to book session. Please try again.'
      setBookingStatus('error')
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-white w-full max-w-xl rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* HEADER */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <CalendarIcon size={16} />
               </div>
               <div>
                  <h2 className="text-lg font-bold text-gray-900">Session with {coach.firstName}</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Step {step + 1} of 4</p>
               </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400"><X size={18} /></button>
          </div>
          <Breadcrumb steps={steps} currentStep={step} className="px-1 scale-90 origin-left" />
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-4 min-h-[300px]">
          {bookingStatus === 'success' ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 animate-in zoom-in-95 duration-500">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Check size={32} strokeWidth={3} /></div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Booking Successful!</h3>
                <p className="text-xs text-gray-500 max-w-[240px] mx-auto">Your sessions have been requested. You can view them in your dashboard.</p>
              </div>
            </div>
          ) : (
            <>
              {step === 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-base font-bold text-gray-900">Where will you meet?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'online', label: 'Online', icon: Video, desc: 'Zoom / G-Meet' },
                      { id: 'in_person', label: 'In-person', icon: MapPin, desc: 'Local Facility' }
                    ].map((item) => (
                      <button key={item.id} onClick={() => setSessionType(item.id as 'online' | 'in_person')} className={cn("p-4 rounded-2xl border-2 text-left transition-all group", sessionType === item.id ? "border-blue-600 bg-blue-50/50" : "border-gray-50 hover:border-blue-100")}>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors", sessionType === item.id ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-400")}><item.icon size={20} /></div>
                        <p className="font-bold text-gray-900 text-sm mb-0.5">{item.label}</p>
                        <p className="text-[10px] text-gray-500">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-base font-bold text-gray-900">Choose your team size</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'individual', label: '1-on-1', icon: Users, desc: 'Personalized focus' },
                      { id: 'group', label: 'Group (max 5)', icon: Users, desc: 'Train with teammates' }
                    ].map((item) => (
                      <button key={item.id} onClick={() => setTeamType(item.id as 'individual' | 'group')} className={cn("p-4 rounded-2xl border-2 text-left transition-all group", teamType === item.id ? "border-blue-600 bg-blue-50/50" : "border-gray-50 hover:border-blue-100")}>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors", teamType === item.id ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-400")}><item.icon size={20} /></div>
                        <p className="font-bold text-gray-900 text-sm mb-0.5">{item.label}</p>
                        <p className="text-[10px] text-gray-500">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
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
                       <p className="text-xs text-amber-600 mt-1">This coach is fully booked or has no availability for {date.toLocaleDateString()}. Please try another date.</p>
                     </div>
                   )}
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-4 animate-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Check size={32} strokeWidth={3} /></div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Ready to Book!</h3>
                    <p className="text-xs text-gray-500 max-w-[200px] mx-auto">Review your session details for your training with {coach.firstName}.</p>
                  </div>
                  
                  <div className="w-full bg-gray-50 rounded-[16px] p-4 space-y-2 text-left">
                    <div className="flex justify-between text-xs"><span className="text-gray-400">Type:</span><span className="font-bold text-gray-900 capitalize">{sessionType?.replace('_', ' ')}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-400">Attendees:</span><span className="font-bold text-gray-900 capitalize">{teamType}</span></div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Time:</span>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{date?.toLocaleDateString()}</p>
                        <p className="text-[10px] text-blue-600 font-bold">{selectedTimes[0]} - {selectedTimes[selectedTimes.length - 1]}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs border-t border-gray-200 pt-2 mt-2">
                      <span className="text-gray-400 font-bold">Total:</span>
                      <span className="font-bold text-blue-600">${(coach.hourlyRate || 0) * selectedTimes.length}</span>
                    </div>
                  </div>

                  {bookingStatus === 'error' && (
                    <p className="text-red-500 text-xs font-medium">{errorMessage}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        {bookingStatus !== 'success' && (
          <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
            <button 
              onClick={handlePrevStep} 
              disabled={isSubmitting}
              className={cn("flex items-center gap-1 px-3 py-2 rounded-lg font-bold text-sm transition-colors", step === 0 ? "opacity-0 pointer-events-none" : "text-gray-600 hover:bg-gray-100 disabled:opacity-50")}
            >
              <ChevronLeft size={16} />Back
            </button>
            <button 
              onClick={step === 3 ? handleCompleteBooking : handleNextStep} 
              disabled={!isStepValid() || isSubmitting} 
              className={cn("flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-md", step === 3 ? "bg-green-600 hover:bg-green-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none")}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {step === 3 ? "Complete Booking" : "Continue"}
                  {step < 3 && <ArrowRight size={16} />}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
