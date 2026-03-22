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

    if (inProgressRef.current || !hasErrors) return;

    inProgressRef.current = true;
    setIsFetchingFeedback(true);
    setAiFeedback(null);

    try {
 
      const textRes = await fetch('/api/athlete/pose/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arm, repNumber, errors }),
      });
      const { feedback } = await textRes.json() as { feedback: string };
      console.log('[PoseFeedback] Text:', feedback);
      setAiFeedback(feedback);
      setIsFetchingFeedback(false);

   
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
