'use client'

import React, { useState } from 'react'
import { X, ChevronLeft, Check, Video, MapPin, Users, Calendar as CalendarIcon, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from './ui/calendar'
import { Breadcrumb } from './ui/breadcrumb'

interface SessionCardProps {
  coachName: string
  coachId: string
  onClose: () => void
}

export function SessionCard({ coachName, coachId, onClose }: SessionCardProps) {
  const [step, setStep] = useState(0)
  const [sessionType, setSessionType] = useState<'online' | 'in-person' | null>(null)
  const [teamType, setTeamType] = useState<'individual' | 'group' | null>(null)
  const [date, setDate] = useState<Date | null>(null)
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]) // Multiple sessions

  const steps = ["Session Type", "Team", "Time & Date", "Confirmation"]

  // --- HANDLERS ---
  const handleNextStep = () => { if (step < steps.length - 1) setStep(step + 1) }
  const handlePrevStep = () => { if (step > 0) setStep(step - 1) }

  const toggleTime = (time: string) => {
    setSelectedTimes(prev => 
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    )
  }

  const isStepValid = () => {
    if (step === 0) return !!sessionType
    if (step === 1) return !!teamType
    if (step === 2) return !!date && selectedTimes.length > 0
    return true
  }

  // Example booked slots (you would fetch these from your DB based on coachId + date)
  const bookedSlots = ["10:00", "14:00"] 

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <CalendarIcon size={20} />
               </div>
               <div>
                  <h2 className="text-xl font-bold text-gray-900">Session with {coachName}</h2>
                  <p className="text-xs text-gray-500">Book one or more slots</p>
               </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400"><X size={20} /></button>
          </div>
          <Breadcrumb steps={steps} currentStep={step} className="px-1" />
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-6 min-h-[400px]">
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-lg font-bold text-gray-900">Where will you meet?</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'online', label: 'Online Session', icon: Video, desc: 'Via Zoom or Google Meet' },
                  { id: 'in-person', label: 'In-person', icon: MapPin, desc: 'At the local sports facility' }
                ].map((item) => (
                  <button key={item.id} onClick={() => setSessionType(item.id as any)} className={cn("p-6 rounded-3xl border-2 text-left transition-all group", sessionType === item.id ? "border-blue-600 bg-blue-50/50 shadow-md shadow-blue-50" : "border-gray-100 hover:border-blue-200")}>
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors", sessionType === item.id ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600")}><item.icon size={24} /></div>
                    <p className="font-bold text-gray-900 mb-1">{item.label}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-lg font-bold text-gray-900">Choose your team size</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'individual', label: '1-on-1 Session', icon: Users, desc: 'Personalized focus just for you' },
                  { id: 'group', label: 'Group Session', icon: Users, desc: 'Train with your teammates (max 5)' }
                ].map((item) => (
                  <button key={item.id} onClick={() => setTeamType(item.id as any)} className={cn("p-6 rounded-3xl border-2 text-left transition-all group", teamType === item.id ? "border-blue-600 bg-blue-50/50 shadow-md shadow-blue-50" : "border-gray-100 hover:border-blue-200")}>
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors", teamType === item.id ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600")}><item.icon size={24} /></div>
                    <p className="font-bold text-gray-900 mb-1">{item.label}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4">
               <Calendar 
                  selectedDate={date}
                  onDateChange={setDate}
                  selectedTimes={selectedTimes}
                  onToggleTime={toggleTime}
                  bookedSlots={bookedSlots}
                  className="border-0 p-0 shadow-none bg-transparent"
               />
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 py-10 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Check size={40} strokeWidth={3} /></div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Book!</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">Review your session details for your training with {coachName}.</p>
              </div>
              
              <div className="w-full bg-gray-50 rounded-[24px] p-6 space-y-3 text-left">
                <div className="flex justify-between text-sm"><span className="text-gray-400">Type:</span><span className="font-bold text-gray-900 capitalize">{sessionType}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Attendees:</span><span className="font-bold text-gray-900 capitalize">{teamType}</span></div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Scheduled:</span>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{date?.toDateString()}</p>
                    <p className="text-xs text-blue-600 font-bold">{selectedTimes.join(', ')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
          <button onClick={handlePrevStep} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors", step === 0 ? "opacity-0 pointer-events-none" : "text-gray-600 hover:bg-gray-100")}><ChevronLeft size={18} />Back</button>
          <button onClick={step === 3 ? onClose : handleNextStep} disabled={!isStepValid()} className={cn("flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg", step === 3 ? "bg-green-600 hover:bg-green-700 text-white shadow-green-100" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 disabled:shadow-none disabled:bg-gray-200 disabled:text-gray-400")}>
            {step === 3 ? "Complete Booking" : "Continue"}
            {step < 3 && <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
