
import { useEffect, useRef } from "react";

interface CallUIRingtoneProps {
  callStatus: string;
}

export function CallUIRingtone({ callStatus }: CallUIRingtoneProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopRingtone = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  useEffect(() => {
    // Play ringtone when connecting, ringing or incoming
    if (callStatus === 'connecting' || callStatus === 'ringing' || callStatus === 'incoming') {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/ringtone.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => {
        console.log('Ringtone autoplay blocked:', e);
      });
    } else {
      // Immediately stop ringtone for any other status
      stopRingtone();
    }
    
    // Clean up on unmount
    return () => {
      stopRingtone();
    };
  }, [callStatus]);

  return null;
}
