'use client'

import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Props for the Calendar component
 * @param selectedDate - Currently viewed/selected Date
 * @param onDateChange - Callback for date selection
 * @param selectedTimes - ARRAY of strings for multiple session booking
 * @param onToggleTime - Callback to add/remove a time slot from selection
 * @param sessions - ISO strings of existing sessions (to show dots on calendar)
 * @param bookedSlots - Array of time strings (e.g. ["09:00"]) that are ALREADY booked for the selectedDate
 * @param availableSlots - 1-hour interval slots by default
 */
interface CalendarProps {
  selectedDate?: Date | null
  onDateChange?: (date: Date) => void
  selectedTimes?: string[] 
  onToggleTime?: (time: string) => void
  sessions?: string[] 
  bookedSlots?: string[] 
  availableSlots?: string[]
  className?: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Default slots with 1-hour difference as requested
const DEFAULT_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
]

export function Calendar({
  selectedDate,
  onDateChange,
  selectedTimes = [],
  onToggleTime,
  sessions = [],
  bookedSlots = [], // Times that are grayed out/unclickable
  availableSlots = DEFAULT_SLOTS,
  className
}: CalendarProps) {
  const [viewDate, setViewDate] = useState(new Date())

  // Calendar logic: Generate days for current month view
  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i))
    return days
  }, [viewDate])

  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))

  const isSelected = (date: Date | null) => date && selectedDate?.toDateString() === date.toDateString()
  const isToday = (date: Date | null) => date && date.toDateString() === new Date().toDateString()
  const hasSessionIndicator = (date: Date | null) => {
    if (!date) return false
    return sessions.some(s => new Date(s).toDateString() === date.toDateString())
  }
  const isPast = (date: Date | null) => {
    if (!date) return false
    const today = new Date(); today.setHours(0,0,0,0)
    return date < today
  }

  return (
    <div className={cn("flex flex-col gap-6 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm", className)}>
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* DATE SELECTION (Left) */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors"><ChevronLeft size={20} /></button>
              <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors"><ChevronRight size={20} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(day => <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">{day[0]}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="aspect-square" />
              const selected = isSelected(date), today = isToday(date), hasSess = hasSessionIndicator(date), past = isPast(date)
              return (
                <button
                  key={date.toISOString()}
                  disabled={past}
                  onClick={() => onDateChange?.(date)}
                  className={cn(
                    "relative aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-semibold transition-all",
                    selected ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105" : 
                    past ? "text-gray-200 cursor-not-allowed" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600",
                    today && !selected && "text-blue-600 border border-blue-100"
                  )}
                >
                  {date.getDate()}
                  {hasSess && !selected && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-blue-400" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* TIME SELECTION (Right) */}
        <div className="w-full md:w-64 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-bold text-gray-900">Available Times</h3>
          </div>

          {!selectedDate ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl p-6 text-center">
              <CalendarIcon className="w-8 h-8 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Select a date first</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[320px] pr-2 scrollbar-thin scrollbar-thumb-gray-200">
              {availableSlots.map(time => {
                const isSelectedTime = selectedTimes.includes(time)
                const isBooked = bookedSlots.includes(time) // Check if already booked
                
                return (
                  <button
                    key={time}
                    disabled={isBooked} // Unclickable if booked
                    onClick={() => onToggleTime?.(time)}
                    className={cn(
                      "py-3 px-4 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2",
                      isBooked ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed" : // Gray and unclickable
                      isSelectedTime 
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" 
                        : "bg-white border-gray-100 text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    )}
                  >
                    {isSelectedTime && <Check size={14} strokeWidth={3} />}
                    {time}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER: SELECTED SLOTS SUMMARY */}
      {selectedDate && selectedTimes.length > 0 && (
        <div className="mt-2 p-4 bg-blue-50 rounded-2xl flex items-center justify-between border border-blue-100 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                {selectedTimes.length} {selectedTimes.length === 1 ? 'Slot' : 'Slots'} Selected
              </p>
              <p className="text-sm font-bold text-gray-900 truncate max-w-[300px]">
                {selectedDate.toDateString()} at {selectedTimes.join(', ')}
              </p>
            </div>
          </div>
          <button 
            className="text-xs font-bold text-blue-600 hover:underline"
            onClick={() => selectedTimes.forEach(t => onToggleTime?.(t))}
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  )
}
