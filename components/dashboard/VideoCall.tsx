'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Clock,
  Maximize2, Minimize2, Users, AlertCircle,
} from 'lucide-react'

type VideoCallProps = {
  sessionId:       string
  coachId:         string
  durationMinutes: number
  onEnd:           (durationSeconds: number) => void
  onClose:         () => void
}

export function VideoCall({
  sessionId, coachId, durationMinutes, onEnd, onClose,
}: VideoCallProps) {
  const localVideoRef  = useRef<HTMLVideoElement>(null)
  const streamRef      = useRef<MediaStream | null>(null)
  const timerRef       = useRef<NodeJS.Timeout | null>(null)

  const [muted,          setMuted]          = useState(false)
  const [videoOff,       setVideoOff]       = useState(false)
  const [elapsed,        setElapsed]        = useState(0)
  const [minimized,      setMinimized]      = useState(false)
  const [mediaError,     setMediaError]     = useState<string | null>(null)
  const [cameraReady,    setCameraReady]    = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const totalSeconds    = durationMinutes * 60
  const requiredSeconds = totalSeconds * 0.8
  const progressPct     = Math.min((elapsed / totalSeconds) * 100, 100)
  const canAutoComplete = elapsed >= requiredSeconds

  function formatTime(secs: number): string {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Start local camera/mic
  useEffect(() => {
    async function startMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        })
        streamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        setCameraReady(true)

        // Start timer
        timerRef.current = setInterval(() => {
          setElapsed(prev => prev + 1)
        }, 1000)
      } catch (err: any) {
        console.error('Media error:', err)
        setMediaError(
          err.name === 'NotAllowedError'
            ? 'Camera/microphone access denied. Please allow access and try again.'
            : 'Could not access camera or microphone.'
        )
      }
    }
    startMedia()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  function toggleMute() {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted })
    setMuted(!muted)
  }

  function toggleVideo() {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = videoOff })
    setVideoOff(!videoOff)
  }

  function handleEndClick() {
    setShowEndConfirm(true)
  }

  function handleConfirmEnd() {
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    setShowEndConfirm(false)
    onEnd(elapsed)
  }

  // ─── MEDIA ERROR STATE ───────────────────────────────────────────────────
  if (mediaError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Camera Access Required</h3>
          <p className="text-sm text-gray-500 mb-6">{mediaError}</p>
          <button onClick={onClose} className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
            Close
          </button>
        </div>
      </div>
    )
  }

  // ─── END CONFIRM MODAL ───────────────────────────────────────────────────
  const EndConfirmModal = showEndConfirm && (
    <div className="absolute inset-0 z-60 flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-2xl p-6 max-w-xs mx-4 text-center">
        <PhoneOff className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900 mb-1">End Call?</h3>
        {canAutoComplete ? (
          <p className="text-sm text-green-600 font-medium mb-4">
            ✓ 80%+ attendance reached. Session will be marked complete.
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-4">
            Only {Math.round(progressPct)}% completed. Need 80% ({formatTime(Math.round(requiredSeconds))}) to auto-complete.
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

  // ─── MINIMIZED VIEW ──────────────────────────────────────────────────────
  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-72 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
        <div className="relative bg-gray-900 h-40">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {videoOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-white text-xs font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {formatTime(elapsed)}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setMinimized(false)} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleEndClick} className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600">
                <PhoneOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        {EndConfirmModal}
      </div>
    )
  }

  // ─── FULL VIEW ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-sm font-semibold">Live Session</span>
          <span className="text-gray-400 text-sm">{durationMinutes} min scheduled</span>
        </div>
        <button
          onClick={() => setMinimized(true)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main video area */}
      <div className="flex-1 relative bg-gray-900">

        {/* Remote video placeholder */}
        <div className="w-full h-full flex flex-col items-center justify-center text-white">
          <div className="w-24 h-24 rounded-full bg-blue-600/30 border-2 border-blue-500/50 flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-blue-400" />
          </div>
          <p className="text-lg font-semibold text-white">Waiting for athlete</p>
          <p className="text-sm text-gray-400 mt-1">Share your session link with the athlete to join</p>
        </div>

        {/* Local video PiP */}
        <div className="absolute bottom-4 right-4 w-44 h-36 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {videoOff && (
            <div className="absolute inset-0 bg-gray-800 flex flex-col items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">Camera off</p>
            </div>
          )}
          {!cameraReady && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div className="absolute bottom-1 left-2 text-xs text-white/80 font-medium">You</div>
        </div>

        {/* Timer overlay */}
        <div className="absolute top-20 left-6 right-6">
          <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="font-mono font-bold text-lg">{formatTime(elapsed)}</span>
                <span className="text-gray-400 text-sm">/ {formatTime(totalSeconds)}</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Auto-complete at</p>
                <p className="text-xs font-semibold text-green-400">{formatTime(Math.round(requiredSeconds))} (80%)</p>
              </div>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  canAutoComplete ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {canAutoComplete && (
              <p className="text-xs text-green-400 mt-1.5 font-medium flex items-center gap-1">
                ✓ 80% attendance reached — session will auto-complete when you end the call
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-6 py-8 bg-gradient-to-t from-black to-transparent">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              muted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <span className="text-xs text-gray-400">{muted ? 'Unmute' : 'Mute'}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleEndClick}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
          <span className="text-xs text-gray-400">End Call</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              videoOff ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {videoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
          <span className="text-xs text-gray-400">{videoOff ? 'Show Video' : 'Hide Video'}</span>
        </div>
      </div>

      {/* End confirm modal */}
      {EndConfirmModal}
    </div>
  )
}
