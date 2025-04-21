
import { useEffect, useRef } from "react";

interface CallUIRingtoneProps {
  callStatus: string;
}

// Make sure ringtone persists and is restarted if needed.
export function CallUIRingtone({ callStatus }: CallUIRingtoneProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Only play ringtone when connecting or ringing
    if (callStatus === 'connecting' || callStatus === 'ringing') {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/ringtone.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => {
        // In browsers where autoplay is not allowed, it's fine to be silent.
        // Optionally: show a notification? (not required)
      });
    } else {
      // Pause and reset ringtone if status is not calling/ringing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [callStatus]);

  return null; // Only handles sound
}
