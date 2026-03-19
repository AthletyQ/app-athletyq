// components/athlete/AthleteVideoCall.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Session {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  coachName?: string;
  coachImage?: string;
}

interface Props {
  roomUrl: string;
  session: Session;
  athleteId: string;
  athleteName: string;
  onEnd: () => void;
}

declare global {
  interface Window {
    DailyIframe: any;
  }
}

export default function AthleteVideoCall({
  roomUrl,
  session,
  athleteId,
  athleteName,
  onEnd,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [callState, setCallState] = useState<"loading" | "joined" | "ended">("loading");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [coachJoined, setCoachJoined] = useState(false);

  const totalSeconds = session.duration_minutes * 60;
  const progress = Math.min((elapsedSeconds / totalSeconds) * 100, 100);
  const requiredSeconds = totalSeconds * 0.8;

  // Format elapsed time
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const handleLeave = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (callRef.current) {
      await callRef.current.leave();
      callRef.current.destroy();
      callRef.current = null;
    }
    setCallState("ended");
    onEnd();
  }, [onEnd]);

  useEffect(() => {
    // Load Daily.co script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@daily-co/daily-js";
    script.async = true;
    script.onload = () => initCall();
    document.head.appendChild(script);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callRef.current) {
        callRef.current.destroy();
        callRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initCall() {
    if (!containerRef.current || !window.DailyIframe) return;

    const call = window.DailyIframe.createFrame(containerRef.current, {
      iframeStyle: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        border: "none",
        borderRadius: "12px",
      },
      showLeaveButton: false,
      showFullscreenButton: false,
    });

    callRef.current = call;

    call
      .on("joined-meeting", () => {
        setCallState("joined");
        startTimer();
      })
      .on("participant-joined", (e: any) => {
        setParticipantCount((c) => c + 1);
        // If another participant joins, assume it's the coach
        if (e.participant && !e.participant.local) {
          setCoachJoined(true);
        }
      })
      .on("participant-left", (e: any) => {
        setParticipantCount((c) => Math.max(1, c - 1));
        if (e.participant && !e.participant.local) {
          setCoachJoined(false);
        }
      })
      .on("left-meeting", () => {
        handleLeave();
      })
      .on("error", (e: any) => {
        console.error("Daily.co error:", e);
      });

    call.join({
      url: roomUrl,
      userName: athleteName,
    });
  }

  function toggleMute() {
    if (!callRef.current) return;
    const newMuted = !isMuted;
    callRef.current.setLocalAudio(!newMuted);
    setIsMuted(newMuted);
  }

  function toggleCam() {
    if (!callRef.current) return;
    const newOff = !isCamOff;
    callRef.current.setLocalVideo(!newOff);
    setIsCamOff(newOff);
  }

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 font-semibold text-sm overflow-hidden">
            {session.coachImage ? (
              <img src={session.coachImage} alt="" className="w-full h-full object-cover" />
            ) : (
              session.coachName?.[0] ?? "C"
            )}
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              Session with {session.coachName ?? "Coach"}
            </p>
            <p className="text-gray-400 text-xs">
              {coachJoined ? "Coach is in the call" : "Waiting for coach…"}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <p className="text-white font-mono text-xl font-bold tracking-wider">
            {formatTime(elapsedSeconds)}
          </p>
          <p className="text-gray-400 text-xs">
            / {session.duration_minutes} min
          </p>
        </div>

        {/* Participant count */}
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          {participantCount}
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative">
        {callState === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400" />
            <p className="text-gray-400 text-sm">Connecting to call…</p>
          </div>
        )}
        <div ref={containerRef} className="absolute inset-0" />
      </div>

      {/* Progress bar */}
      <div className="px-6 py-2 bg-gray-900">
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs w-8">
            {Math.round(progress)}%
          </span>
          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-gray-500 text-xs text-right w-20">
            {elapsedSeconds >= requiredSeconds ? "✓ Attended" : `${Math.round(requiredSeconds / 60)}m req.`}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 px-6 py-5 bg-gray-900 border-t border-gray-800">
        {/* Mute */}
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? "bg-red-600 text-white" : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9 2a2 2 0 00-2 2v4a2 2 0 002 2 2 2 0 002-2V4a2 2 0 00-2-2zm0 10a6 6 0 006-6H3a6 6 0 006 6zm0 2v2m-3 0h6"
              />
              <line x1="3" y1="3" x2="17" y2="17" stroke="currentColor" strokeWidth="2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              />
            </svg>
          )}
        </button>

        {/* Cam */}
        <button
          onClick={toggleCam}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isCamOff ? "bg-red-600 text-white" : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
          title={isCamOff ? "Turn on camera" : "Turn off camera"}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            {isCamOff ? (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4 5a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2H4zm10 2l4-2v10l-4-2V7z"
              />
            ) : (
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14.553 1.106A1 1 0 0016 8v4a1 1 0 00.553.894l2 1A1 1 0 0020 13V7a1 1 0 00-1.447-.894l-2 1z" />
            )}
          </svg>
        </button>

        {/* Leave */}
        <button
          onClick={handleLeave}
          className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
          title="Leave call"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
