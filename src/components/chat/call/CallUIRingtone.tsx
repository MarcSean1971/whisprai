
import { useEffect, useRef } from "react";

interface CallUIRingtoneProps {
  callStatus: string;
}

export function CallUIRingtone({ callStatus }: CallUIRingtoneProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Play ringtone when connecting, ringing or incoming
    if (callStatus === 'connecting' || callStatus === 'ringing' || callStatus === 'incoming') {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/ringtone.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => {
        // In browsers where autoplay is not allowed, it's fine to be silent
        console.log('Ringtone autoplay blocked:', e);
      });
    } else {
      // Pause and reset ringtone if status is not calling/ringing/incoming
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
