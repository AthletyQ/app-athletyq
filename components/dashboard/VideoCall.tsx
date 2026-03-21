'use client'

import { useState, useEffect, useRef } from 'react'
import {
  PhoneOff, Clock, Maximize2, Minimize2,
  AlertCircle, Loader2,
} from 'lucide-react'

type VideoCallProps = {
  sessionId:       string
  coachId:         string
  durationMinutes: number
  isCoach?:        boolean
  onEnd:           (durationSeconds: number) => void
  onClose:         () => void
}

export function VideoCall({
  sessionId, durationMinutes, isCoach = false, onEnd, onClose,
}: VideoCallProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const [roomUrl,        setRoomUrl]        = useState<string | null>(null)
  const [token,          setToken]          = useState<string | null>(null)
  const [error,          setError]          = useState<string | null>(null)
  const [loading,        setLoading]        = useState(true)
  const [elapsed,        setElapsed]        = useState(0)
  const [minimized,      setMinimized]      = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [hasVideo,       setHasVideo]       = useState(true)
  const [hasAudio,       setHasAudio]       = useState(true)

  const totalSeconds    = durationMinutes * 60
  const requiredSeconds = totalSeconds * 0.8
  const progressPct     = Math.min((elapsed / totalSeconds) * 100, 100)
  const canAutoComplete = elapsed >= requiredSeconds

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // ── Get room from API ─────────────────────────────────────────────────────
  useEffect(() => {
    async function getRoom() {
      try {
        const res = await fetch('/api/video/create-room', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ sessionId, isCoach }),
        })

        if (!res.ok) {
          const { error: err } = await res.json()
          throw new Error(err ?? 'Failed to get room')
        }

        const data = await res.json()
        setRoomUrl(data.url)
        setToken(data.token)
        setLoading(false)

        // Start timer once room is ready
        timerRef.current = setInterval(() => {
          setElapsed(prev => prev + 1)
        }, 1000)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not join call')
        setLoading(false)
      }
    }

    getRoom()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [sessionId, isCoach])

  function handleEndClick() { setShowEndConfirm(true) }

  function handleConfirmEnd() {
    if (timerRef.current) clearInterval(timerRef.current)
    setShowEndConfirm(false)
    onEnd(elapsed)
  }

  // Build the Daily Prebuilt iframe URL with token
  const iframeSrc = roomUrl && token
    ? `${roomUrl}?t=${token}`
    : roomUrl ?? ''

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Connection Error</h3>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold text-lg">Joining call...</p>
          <p className="text-gray-400 text-sm mt-1">Setting up your room</p>
        </div>
      </div>
    )
  }

  // ── End confirm ───────────────────────────────────────────────────────────
  const EndConfirmModal = showEndConfirm && (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-2xl p-6 max-w-xs mx-4 text-center">
        <PhoneOff className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900 mb-1">End Call?</h3>
        {canAutoComplete ? (
          <p className="text-sm text-green-600 font-medium mb-4">
            ✓ 80%+ attendance reached. Session will be marked complete.
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-4">
            Only {Math.round(progressPct)}% completed. Need 80%
            ({formatTime(Math.round(requiredSeconds))}) to auto-complete.
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => setShowEndConfirm(false)}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50"
          >
            Continue
          </button>
          <button
            onClick={handleConfirmEnd}
            className="flex-1 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600"
          >
            End Call
          </button>
        </div>
      </div>
    </div>
  )

  // ── Minimized ─────────────────────────────────────────────────────────────
  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-72 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
        <div className="relative bg-gray-900 h-40">
          <iframe
            src={iframeSrc}
            allow="camera; microphone; fullscreen; speaker; display-capture"
            className="w-full h-full border-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5 text-white text-xs font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {formatTime(elapsed)}
            </div>
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                onClick={() => setMinimized(false)}
                className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleEndClick}
                className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600"
              >
                <PhoneOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        {EndConfirmModal}
      </div>
    )
  }

  // ── Full view ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-sm font-semibold">Live Session</span>
          <span className="text-gray-400 text-sm">{durationMinutes} min scheduled</span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 rounded-xl px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-sm font-bold text-white">{formatTime(elapsed)}</span>
            <span className="text-gray-500 text-xs">/ {formatTime(totalSeconds)}</span>
          </div>

          {/* Progress bar */}
          <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${canAutoComplete ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {canAutoComplete && (
            <span className="text-xs text-green-400 font-medium">✓ 80%</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMinimized(true)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleEndClick}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            End Call
          </button>
        </div>
      </div>

      {/* Daily Prebuilt iframe — full screen */}
      <div className="flex-1 relative">
        <iframe
          src={iframeSrc}
          allow="camera; microphone; fullscreen; speaker; display-capture"
          className="w-full h-full border-0"
        />
      </div>

      {EndConfirmModal}
    </div>
  )
}