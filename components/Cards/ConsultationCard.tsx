// 'use client'

// import React, { useState, useEffect, useCallback } from 'react'
// import {
//   X, ChevronLeft, Check, Video, MapPin, Users,
//   Calendar as CalendarIcon, ArrowRight, Loader2, Briefcase,
// } from 'lucide-react'
// import { createClient } from '@supabase/supabase-js'
// import { cn } from '@/lib/utils'
// import { Calendar } from '@/components/ui/calendar'
// import { Breadcrumb } from '@/components/ui/breadcrumb'
// import { Consultant } from '@/types/consultant'
// import {
//   getConsultantAvailability,
//   bookConsultantSessions,
// } from '@/services/consultant/consultant.services'

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
// )

// interface ConsultationCardProps {
//   consultant: Consultant
//   onClose: () => void
// }

// export function ConsultationCard({ consultant, onClose }: ConsultationCardProps) {
//   const [step, setStep]                 = useState(0)
//   const [sessionType, setSessionType]   = useState<'online' | 'in_person' | null>(null)
//   const [consultationType, setConsultationType] = useState<'individual' | 'group' | null>(null)
//   const [date, setDate]                 = useState<Date | null>(null)
//   const [selectedTimes, setSelectedTimes] = useState<string[]>([])

//   const [bookedSlots,    setBookedSlots]    = useState<string[]>([])
//   const [availableSlots, setAvailableSlots] = useState<string[]>([])
//   const [loadingAvailability, setLoadingAvailability] = useState(false)
//   const [isSubmitting,  setIsSubmitting]  = useState(false)
//   const [bookingStatus, setBookingStatus] = useState<'idle' | 'success' | 'error'>('idle')
//   const [errorMessage,  setErrorMessage]  = useState('')

//   const steps = ['Session Format', 'Attendees', 'Date & Time', 'Confirmation']

//   // ── Fetch availability ──────────────────────────────────────────────────────
//   const fetchAvailability = useCallback(
//     async (selectedDate: Date) => {
//       setLoadingAvailability(true)
//       try {
//         const result = await getConsultantAvailability(consultant.id, selectedDate, sessionType)
//         setAvailableSlots(result.availableSlots)
//         setBookedSlots(result.bookedSlots)
//       } catch (err) {
//         console.error('Failed to fetch availability:', err)
//       } finally {
//         setLoadingAvailability(false)
//       }
//     },
//     [consultant.id, sessionType],
//   )

//   useEffect(() => {
//     if (date) {
//       fetchAvailability(date)
//       setSelectedTimes([])
//     }
//   }, [date, fetchAvailability])

//   useEffect(() => {
//     if (date && step === 2) fetchAvailability(date)
//   }, [sessionType, date, step, fetchAvailability])

//   // ── Helpers ─────────────────────────────────────────────────────────────────
//   const handleNextStep = () => { if (step < steps.length - 1) setStep(step + 1) }
//   const handlePrevStep = () => { if (step > 0) setStep(step - 1) }

//   const toggleTime = (time: string) => {
//     setSelectedTimes(prev =>
//       prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time],
//     )
//   }

//   const isStepValid = () => {
//     if (step === 0) return !!sessionType
//     if (step === 1) return !!consultationType
//     if (step === 2) return !!date && selectedTimes.length > 0
//     return true
//   }

//   // ── Submit ──────────────────────────────────────────────────────────────────
//   const handleCompleteBooking = async () => {
//     if (!date || selectedTimes.length === 0 || !sessionType) return

//     setIsSubmitting(true)
//     setBookingStatus('idle')

//     try {
//       const { data: { user } } = await supabase.auth.getUser()
//       if (!user) {
//         setBookingStatus('error')
//         setErrorMessage('You must be logged in to book a consultation.')
//         setIsSubmitting(false)
//         return
//       }

//       // Ensure athlete profile row exists (same guard as SessionCard)
//       const { data: athleteData, error: athleteError } = await supabase
//         .from('athletes')
//         .select('user_id')
//         .eq('user_id', user.id)
//         .single()

//       if (athleteError && athleteError.code !== 'PGRST116') {
//         throw new Error('Error verifying athlete profile: ' + athleteError.message)
//       }
//       if (!athleteData) {
//         const { error: createError } = await supabase
//           .from('athletes')
//           .insert({ user_id: user.id })
//         if (createError) throw new Error('Could not create athlete profile: ' + createError.message)
//       }

//       // Build session rows – one per selected time slot
//       const sessions = selectedTimes.map(time => {
//         const [hours] = time.split(':')
//         const scheduledAt = new Date(date)
//         scheduledAt.setHours(parseInt(hours), 0, 0, 0)

//         return {
//           athlete_id:       user.id,
//           provider_id:      consultant.id,         // consultant.user_id
//           provider_type:    'consultant',
//           session_type:     consultationType === 'group' ? 'group' : 'one-on-one',
//           scheduled_at:     scheduledAt.toISOString(),
//           duration_minutes: 60,
//           status:           'pending',
//           price:            Number(consultant.hourlyRate) || 0,
//           currency:         'USD',
//           payment_status:   'unpaid',
//           location_type:    sessionType,           // 'online' | 'in_person'
//         }
//       })

//       // Guard: no past sessions
//       if (sessions.some(s => new Date(s.scheduled_at) <= new Date())) {
//         setBookingStatus('error')
//         setErrorMessage('Cannot book a past time slot. Please select a future time.')
//         setIsSubmitting(false)
//         return
//       }

//       await bookConsultantSessions(sessions)
//       setBookingStatus('success')
//       setTimeout(() => onClose(), 2000)
//     } catch (err: unknown) {
//       setBookingStatus('error')
//       setErrorMessage((err as Error).message || 'Failed to book. Please try again.')
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   // ── Render ──────────────────────────────────────────────────────────────────
//   return (
//     <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
//       <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

//       <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">

//         {/* ── HEADER ── */}
//         <div className="p-6 border-b border-gray-100">
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
//                 <Briefcase size={20} />
//               </div>
//               <div>
//                 <h2 className="text-xl font-bold text-gray-900">
//                   Consultation with {consultant.firstName} {consultant.lastName}
//                 </h2>
//                 <p className="text-xs text-gray-500 capitalize">
//                   {consultant.specialty.replace(/_/g, ' ')} · Book one or more slots
//                 </p>
//               </div>
//             </div>
//             <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
//               <X size={20} />
//             </button>
//           </div>
//           <Breadcrumb steps={steps} currentStep={step} className="px-1" />
//         </div>

//         {/* ── CONTENT ── */}
//         <div className="flex-1 p-6 min-h-[400px]">

//           {bookingStatus === 'success' ? (
//             <div className="flex flex-col items-center justify-center text-center space-y-6 py-10 animate-in zoom-in-95 duration-500">
//               <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600">
//                 <Check size={40} strokeWidth={3} />
//               </div>
//               <div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-2">Consultation Booked!</h3>
//                 <p className="text-sm text-gray-500 max-w-xs mx-auto">
//                   Your request has been sent. You can track it in your dashboard.
//                 </p>
//               </div>
//             </div>
//           ) : (
//             <>
//               {/* STEP 0 – Format */}
//               {step === 0 && (
//                 <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
//                   <h3 className="text-lg font-bold text-gray-900">How would you like to meet?</h3>
//                   <div className="grid grid-cols-2 gap-4">
//                     {[
//                       { id: 'online',    label: 'Online',    icon: Video,  desc: 'Via Zoom or Google Meet' },
//                       { id: 'in_person', label: 'In-person', icon: MapPin, desc: 'At the facility or agreed location' },
//                     ].map(item => (
//                       <button
//                         key={item.id}
//                         onClick={() => setSessionType(item.id as 'online' | 'in_person')}
//                         className={cn(
//                           'p-6 rounded-3xl border-2 text-left transition-all group',
//                           sessionType === item.id
//                             ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-50'
//                             : 'border-gray-100 hover:border-indigo-200',
//                         )}
//                       >
//                         <div className={cn(
//                           'w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors',
//                           sessionType === item.id
//                             ? 'bg-indigo-600 text-white'
//                             : 'bg-gray-50 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600',
//                         )}>
//                           <item.icon size={24} />
//                         </div>
//                         <p className="font-bold text-gray-900 mb-1">{item.label}</p>
//                         <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* STEP 1 – Attendees */}
//               {step === 1 && (
//                 <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
//                   <h3 className="text-lg font-bold text-gray-900">Who is attending?</h3>
//                   <div className="grid grid-cols-2 gap-4">
//                     {[
//                       { id: 'individual', label: '1-on-1 Consultation', icon: Users, desc: 'Private session focused on your goals' },
//                       { id: 'group',      label: 'Group Consultation',   icon: Users, desc: 'Share insights with your team (max 5)' },
//                     ].map(item => (
//                       <button
//                         key={item.id}
//                         onClick={() => setConsultationType(item.id as 'individual' | 'group')}
//                         className={cn(
//                           'p-6 rounded-3xl border-2 text-left transition-all group',
//                           consultationType === item.id
//                             ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-50'
//                             : 'border-gray-100 hover:border-indigo-200',
//                         )}
//                       >
//                         <div className={cn(
//                           'w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors',
//                           consultationType === item.id
//                             ? 'bg-indigo-600 text-white'
//                             : 'bg-gray-50 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600',
//                         )}>
//                           <item.icon size={24} />
//                         </div>
//                         <p className="font-bold text-gray-900 mb-1">{item.label}</p>
//                         <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* STEP 2 – Date & Time */}
//               {step === 2 && (
//                 <div className="animate-in fade-in slide-in-from-right-4 relative">
//                   {loadingAvailability && (
//                     <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
//                       <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
//                     </div>
//                   )}
//                   <Calendar
//                     selectedDate={date}
//                     onDateChange={setDate}
//                     selectedTimes={selectedTimes}
//                     onToggleTime={toggleTime}
//                     bookedSlots={bookedSlots}
//                     availableSlots={availableSlots}
//                     className="border-0 p-0 shadow-none bg-transparent"
//                   />
//                   {!loadingAvailability && date && availableSlots.length === 0 && (
//                     <p className="text-center text-sm text-gray-500 mt-4 italic">
//                       No availability for this date. Try another day.
//                     </p>
//                   )}
//                 </div>
//               )}

//               {/* STEP 3 – Confirmation */}
//               {step === 3 && (
//                 <div className="flex flex-col items-center justify-center text-center space-y-6 py-10 animate-in zoom-in-95 duration-500">
//                   <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
//                     <CalendarIcon size={36} />
//                   </div>
//                   <div>
//                     <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Book!</h3>
//                     <p className="text-sm text-gray-500 max-w-xs mx-auto">
//                       Review your details before confirming.
//                     </p>
//                   </div>

//                   <div className="w-full bg-gray-50 rounded-[24px] p-6 space-y-3 text-left">
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-400">Consultant:</span>
//                       <span className="font-bold text-gray-900">
//                         {consultant.firstName} {consultant.lastName}
//                       </span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-400">Specialty:</span>
//                       <span className="font-bold text-gray-900 capitalize">
//                         {consultant.specialty.replace(/_/g, ' ')}
//                       </span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-400">Format:</span>
//                       <span className="font-bold text-gray-900 capitalize">
//                         {sessionType?.replace('_', ' ')}
//                       </span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-400">Attendees:</span>
//                       <span className="font-bold text-gray-900 capitalize">{consultationType}</span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-400">Date:</span>
//                       <div className="text-right">
//                         <p className="font-bold text-gray-900">{date?.toDateString()}</p>
//                         <p className="text-xs text-indigo-600 font-bold">{selectedTimes.join(', ')}</p>
//                       </div>
//                     </div>
//                     <div className="flex justify-between text-sm border-t border-gray-200 pt-3 mt-3">
//                       <span className="text-gray-400">Total:</span>
//                       <span className="font-bold text-gray-900">
//                         ${(consultant.hourlyRate || 0) * selectedTimes.length}
//                       </span>
//                     </div>
//                   </div>

//                   {bookingStatus === 'error' && (
//                     <p className="text-red-500 text-sm font-medium">{errorMessage}</p>
//                   )}
//                 </div>
//               )}
//             </>
//           )}
//         </div>

//         {/* ── FOOTER ── */}
//         {bookingStatus !== 'success' && (
//           <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
//             <button
//               onClick={handlePrevStep}
//               disabled={isSubmitting}
//               className={cn(
//                 'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors',
//                 step === 0
//                   ? 'opacity-0 pointer-events-none'
//                   : 'text-gray-600 hover:bg-gray-100 disabled:opacity-50',
//               )}
//             >
//               <ChevronLeft size={18} />Back
//             </button>

//             <button
//               onClick={step === 3 ? handleCompleteBooking : handleNextStep}
//               disabled={!isStepValid() || isSubmitting}
//               className={cn(
//                 'flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg',
//                 step === 3
//                   ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-100'
//                   : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 disabled:shadow-none disabled:bg-gray-200 disabled:text-gray-400',
//               )}
//             >
//               {isSubmitting ? (
//                 <>
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                   Processing...
//                 </>
//               ) : (
//                 <>
//                   {step === 3 ? 'Complete Booking' : 'Continue'}
//                   {step < 3 && <ArrowRight size={18} />}
//                 </>
//               )}
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, Check, Calendar as CalendarIcon, ArrowRight, Loader2, Briefcase } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Consultant } from '@/types/consultant'
import {
  getConsultantAvailability,
  bookConsultantSessions,
} from '@/services/consultant/consultant.services'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

interface ConsultationCardProps {
  consultant: Consultant
  onClose: () => void
}

export function ConsultationCard({ consultant, onClose }: ConsultationCardProps) {
  const [step, setStep] = useState(0)
  const [date, setDate] = useState<Date | null>(null)
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const steps = ["Time & Date", "Confirmation"]

  // --- FETCH AVAILABILITY ---
  const fetchAvailability = useCallback(async (selectedDate: Date) => {
    setLoadingAvailability(true)
    try {
      const result = await getConsultantAvailability(consultant.id, selectedDate, null)
      setAvailableSlots(result.availableSlots)
      setBookedSlots(result.bookedSlots)
    } catch (err) {
      console.error("Failed to fetch availability:", err)
    } finally {
      setLoadingAvailability(false)
    }
  }, [consultant.id])

  useEffect(() => {
    if (date) {
      fetchAvailability(date)
      setSelectedTimes([]) // Reset selected times when date changes
    }
  }, [date, fetchAvailability])

  // --- HANDLERS ---
  const handleNextStep = () => { if (step < steps.length - 1) setStep(step + 1) }
  const handlePrevStep = () => { if (step > 0) setStep(step - 1) }

  /**
   * Selection Logic: Only one slot can be selected.
   */
  const toggleTime = (time: string) => {
    setSelectedTimes(prev => {
      if (prev.includes(time)) return []
      return [time]
    })
  }

  const isStepValid = () => {
    if (step === 0) return !!date && selectedTimes.length === 1
    return true
  }

  const handleCompleteBooking = async () => {
    if (!date || selectedTimes.length === 0) return

    setIsSubmitting(true)
    setBookingStatus('idle')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setBookingStatus('error')
        setErrorMessage('You must be logged in to book a session.')
        return
      }

      // Ensure athlete profile row exists
      const { data: athleteData, error: athleteError } = await supabase
        .from('athletes')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      if (athleteError && athleteError.code !== 'PGRST116') {
        throw new Error('Error verifying athlete profile: ' + athleteError.message)
      }
      if (!athleteData) {
        const { error: createError } = await supabase
          .from('athletes')
          .insert({ user_id: user.id })
        if (createError) throw new Error('Could not create athlete profile: ' + createError.message)
      }

      // 30 minute session logic
      const startStr = selectedTimes[0]
      const [startHour, startMinute] = startStr.split(':').map(Number)
      
      const durationMinutes = 30

      const scheduledAt = new Date(date)
      scheduledAt.setHours(startHour, startMinute, 0, 0)

      const session = {
        athlete_id: user.id,
        provider_id: consultant.id,
        provider_type: 'consultant',
        session_type: 'one-on-one',
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: durationMinutes,
        status: 'pending',
        price: (Number(consultant.hourlyRate) || 0) / 2, // 30 min is half price of hourly rate
        currency: 'USD',
        payment_status: 'unpaid',
        location_type: 'online',
      }

      // Check if scheduled time is in the past
      if (new Date(session.scheduled_at!) <= new Date()) {
        setBookingStatus('error')
        setErrorMessage('Cannot book a session in the past.')
        setIsSubmitting(false)
        return
      }

      await bookConsultantSessions([session])
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300 pointer-events-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[90vh] pointer-events-auto">
        
        {/* HEADER - Compacted */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Briefcase size={16} />
               </div>
               <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">{consultant.firstName} {consultant.lastName}</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Book Consultation</p>
               </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"><X size={18} /></button>
          </div>
          <Breadcrumb steps={steps} currentStep={step} className="px-0" />
        </div>

        {/* CONTENT - Optimized for 'Small' feel */}
        <div className="flex-1 p-5 overflow-y-auto">
          {bookingStatus === 'success' ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 animate-in zoom-in-95 duration-500">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Check size={32} strokeWidth={3} /></div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Successful!</h3>
                <p className="text-xs text-gray-500 max-w-[200px] mx-auto">Your consultation has been requested successfully.</p>
              </div>
            </div>
          ) : (
            <>
              {step === 0 && (
                <div className="animate-in fade-in slide-in-from-right-4 relative scale-95 origin-top">
                   {loadingAvailability && (
                     <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                       <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
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
                       <p className="text-xs text-amber-600 mt-1">This consultant is fully booked or has no availability for {date.toLocaleDateString()}. Please try another date.</p>
                     </div>
                   )}
                </div>
              )}

              {step === 1 && (
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-4 animate-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Check size={32} strokeWidth={3} /></div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Confirm Booking</h3>
                    <p className="text-[11px] text-gray-500">Review your consultation details</p>
                  </div>
                  
                  <div className="w-full bg-gray-50/80 rounded-3xl p-5 space-y-3 text-left border border-gray-100">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Scheduled</span>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{date?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-[11px] text-indigo-600 font-bold">{selectedTimes.join(', ')}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-200/60 pt-3 mt-3">
                      <span className="text-gray-500 font-medium">Total Price</span>
                      <span className="font-extrabold text-indigo-600 text-lg">
                        LKR {(Number(consultant.hourlyRate) || 0) / 2}
                      </span>
                    </div>
                  </div>

                  {bookingStatus === 'error' && (
                    <p className="text-red-500 text-[11px] font-semibold bg-red-50 px-3 py-1.5 rounded-full">{errorMessage}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER - Compact */}
        {bookingStatus !== 'success' && (
          <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-3">
            <button 
              onClick={handlePrevStep} 
              disabled={isSubmitting}
              className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors", step === 0 ? "opacity-0 pointer-events-none" : "text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-50")}
            >
              <ChevronLeft size={16} />Back
            </button>
            <button 
              onClick={step === 1 ? handleCompleteBooking : handleNextStep} 
              disabled={!isStepValid() || isSubmitting} 
              className={cn("flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md", step === 1 ? "bg-green-600 hover:bg-green-700 text-white shadow-green-100" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 disabled:shadow-none disabled:bg-gray-200 disabled:text-gray-400")}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {step === 1 ? "Complete Booking" : "Continue"}
                  {step < 1 && <ArrowRight size={16} />}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
