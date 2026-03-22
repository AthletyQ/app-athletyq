import { useRef, useState } from 'react';

export interface RepFormErrors {
  incompleteFlexion: boolean;
  incompleteExtension: boolean;
  elbowDrift: boolean;
}

export function usePoseFeedback() {
  const inProgressRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const requestFeedback = async (
    arm: 'left' | 'right',
    repNumber: number,
    errors: RepFormErrors,
  ) => {
    const hasErrors = Object.values(errors).some(Boolean);
    // Don't pile up requests; skip if one is already in-flight
    if (inProgressRef.current || !hasErrors) return;

    inProgressRef.current = true;
    setIsFetchingFeedback(true);
    setAiFeedback(null);

    try {
      // Step 1: generate coaching text via Groq
      const textRes = await fetch('/api/athlete/pose/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arm, repNumber, errors }),
      });
      const { feedback } = await textRes.json() as { feedback: string };
      console.log('[PoseFeedback] Text:', feedback);
      setAiFeedback(feedback);
      setIsFetchingFeedback(false);

      // Step 2: convert to speech via AWS Polly
      const ttsRes = await fetch('/api/athlete/pose/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: feedback }),
      });

      if (!ttsRes.ok) {
        console.error('[PoseFeedback] TTS request failed:', ttsRes.status);
        return;
      }

      const audioBlob = await ttsRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Stop any audio that's still playing from a previous rep
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      setIsSpeaking(true);
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        setIsSpeaking(false);
        // Release the lock only after speaking finishes so the next rep isn't
        // processed while audio is still playing
        inProgressRef.current = false;
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        setIsSpeaking(false);
        inProgressRef.current = false;
      };

      await audio.play();
      console.log('[PoseFeedback] Playing audio');
    } catch (err) {
      console.error('[PoseFeedback] Error:', err);
      inProgressRef.current = false;
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  const clearFeedback = () => {
    // Stop playback immediately if detection is stopped
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    inProgressRef.current = false;
    setAiFeedback(null);
    setIsSpeaking(false);
    setIsFetchingFeedback(false);
  };

  return { requestFeedback, aiFeedback, isFetchingFeedback, isSpeaking, clearFeedback };
}
