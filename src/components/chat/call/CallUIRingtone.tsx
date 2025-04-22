
import { useEffect, useRef } from "react";

interface CallUIRingtoneProps {
  callStatus: string;
}

export function CallUIRingtone({ callStatus }: CallUIRingtoneProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopRingtone = () => {
    if (audioRef.current) {
      console.log("[Ringtone] Stopping ringtone immediately");
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  useEffect(() => {
    // Only play ringtone for active call states
    if (callStatus === "connecting" || callStatus === "ringing" || callStatus === "incoming") {
      if (!audioRef.current) {
        console.log("[Ringtone] Starting ringtone");
        audioRef.current = new Audio('/sounds/ringtone.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => {
        console.error('[Ringtone] Autoplay blocked:', e);
      });
    } else {
      // Immediately stop ringtone for any other status
      stopRingtone();
    }
    
    return stopRingtone;
  }, [callStatus]);

  return null;
}
